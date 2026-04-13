'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { Info, Loader2, Download, Filter, Eye, EyeOff } from 'lucide-react';
import { client } from '@/lib/orpc';
import { PageHeader, SectionSeparator } from '@/components/header';

// Dynamic theme-aware color scheme - optimized for both light and dark modes
const categoryColorsLight: Record<string, string> = {
  'Core': '#059669',       // Dark Emerald
  'ERC': '#1D4ED8',        // Dark Blue
  'Networking': '#7C3AED', // Dark Violet
  'Interface': '#D97706',  // Dark Amber
  'Meta': '#9333EA',       // Dark Purple
  'Informational': '#64748B', // Slate
  'RIP': '#EA580C',        // Dark Orange
};

const categoryColorsDark: Record<string, string> = {
  'Core': '#34D399',       // Emerald
  'ERC': '#60A5FA',        // Blue
  'Networking': '#A78BFA', // Violet
  'Interface': '#FBBF24',  // Amber
  'Meta': '#C084FC',       // Purple
  'Informational': '#94A3B8', // Slate
  'RIP': '#FB923C',        // Orange
};

const statusColorsLight: Record<string, string> = {
  'Draft': '#0891B2',      // Dark Cyan
  'Review': '#1D4ED8',     // Dark Blue
  'Last Call': '#D97706',  // Dark Amber
  'Final': '#059669',      // Dark Emerald
  'Withdrawn': '#64748B',  // Slate
  'Stagnant': '#475569',   // Dark Slate
};

const statusColorsDark: Record<string, string> = {
  'Draft': '#22D3EE',      // Cyan
  'Review': '#60A5FA',     // Blue
  'Last Call': '#FBBF24',  // Amber
  'Final': '#34D399',      // Emerald
  'Withdrawn': '#94A3B8',  // Slate
  'Stagnant': '#64748B',   // Slate dim
};

type TimelinePoint = {
  year: number;
  total: number;
  breakdown: Array<{ key: string; count: number }>;
};

type ChartDataPoint = {
  year: number;
  [key: string]: number;
};

type DetailedData = {
  eipNumber: number;
  title: string;
  author: string;
  createdAt: string;
  type: string;
  status: string;
  category: string;
  repository: string;
  url: string;
};

export default function GovernanceOverTime() {
  const [viewMode, setViewMode] = useState<'category' | 'status'>('category');
  const [includeRIPs, setIncludeRIPs] = useState(true);
  const [categoryData, setCategoryData] = useState<TimelinePoint[]>([]);
  const [statusData, setStatusData] = useState<TimelinePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [detailedData, setDetailedData] = useState<DetailedData[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const [isDarkMode, setIsDarkMode] = useState(true);
  const chartRef = useRef<ReactECharts>(null);

  // Detect theme on mount and watch for changes
  useEffect(() => {
    const detectTheme = () => {
      if (typeof window === 'undefined') return;
      const isDark = document.documentElement.classList.contains('dark') ||
                     window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };

    detectTheme();

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      detectTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Get available years
  const availableYears = useMemo(() => {
    const sourceData = viewMode === 'category' ? categoryData : statusData;
    return sourceData.map(d => d.year).sort((a, b) => b - a);
  }, [categoryData, statusData, viewMode]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await client.dashboard.getGovernanceTimelineData({ includeRIPs });
        setCategoryData(data.timelineByCategory || []);
        setStatusData(data.timelineByStatus || []);
      } catch (error) {
        console.error('Failed to fetch timeline data:', error);
        setCategoryData([]);
        setStatusData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [includeRIPs]);

  // Fetch detailed data when year is selected
  useEffect(() => {
    if (selectedYear === null) {
      setDetailedData([]);
      return;
    }

    async function fetchDetailedData() {
      setLoadingDetails(true);
      try {
        const data = await client.governanceTimeline.getDetailedDataByYear({
          year: selectedYear as number,
          includeRIPs
        });
        setDetailedData(data || []);
      } catch (error) {
        console.error('Failed to fetch detailed data:', error);
        setDetailedData([]);
      } finally {
        setLoadingDetails(false);
      }
    }

    fetchDetailedData();
  }, [selectedYear, includeRIPs]);

  // Transform data for ECharts
  const chartData: ChartDataPoint[] = useMemo(() => {
    const sourceData = viewMode === 'category' ? categoryData : statusData;
    
    const allKeys = new Set<string>();
    sourceData.forEach(point => {
      point.breakdown.forEach(item => {
        allKeys.add(item.key);
      });
    });
    
    return sourceData.map(point => {
      const dataPoint: ChartDataPoint = { year: point.year };
      allKeys.forEach(key => {
        dataPoint[key] = 0;
      });
      point.breakdown.forEach(item => {
        dataPoint[item.key] = item.count;
      });
      return dataPoint;
    });
  }, [viewMode, categoryData, statusData]);

  // Get all possible keys
  const allKeys = useMemo(() => {
    const keys = new Set<string>();
    chartData.forEach(point => {
      Object.keys(point).forEach(key => {
        if (key !== 'year') keys.add(key);
      });
    });
    return Array.from(keys);
  }, [chartData]);

  // Get visible keys (excluding hidden ones)
  const visibleKeys = useMemo(() => {
    return allKeys.filter(key => !hiddenKeys.has(key));
  }, [allKeys, hiddenKeys]);

  const colors = useMemo(() => {
    if (viewMode === 'category') {
      return isDarkMode ? categoryColorsDark : categoryColorsLight;
    } else {
      return isDarkMode ? statusColorsDark : statusColorsLight;
    }
  }, [viewMode, isDarkMode]);

  // Compute compact insight
  const insight = useMemo(() => {
    if (chartData.length === 0) return null;
    
    if (viewMode === 'category') {
      // Find peak year
      const peakYear = chartData.reduce((max, d) => {
        const total = Object.keys(d).filter(k => k !== 'year').reduce((sum, k) => sum + (d[k] || 0), 0);
        const maxTotal = Object.keys(max).filter(k => k !== 'year').reduce((sum, k) => sum + (max[k] || 0), 0);
        return total > maxTotal ? d : max;
      });
      
      const peakTotal = Object.keys(peakYear).filter(k => k !== 'year').reduce((sum, k) => sum + (peakYear[k] || 0), 0);
      const ercCount = peakYear.ERC || 0;
      const ercPercentage = peakTotal > 0 ? Math.round((ercCount / peakTotal) * 100) : 0;
      
      if (ercPercentage > 30) {
        return `Peak activity: ${peakYear.year} · ERC-dominated (${ercPercentage}%)`;
      } else {
        return `Peak activity: ${peakYear.year} · ${peakTotal} proposals`;
      }
    } else {
      // Status mode insight
      const finalizedYears = chartData.filter(d => (d.Final || 0) > 0);
      if (finalizedYears.length > 0) {
        const recentFinalized = finalizedYears.slice(-3);
        const avgFinalized = recentFinalized.reduce((sum, d) => sum + (d.Final || 0), 0) / recentFinalized.length;
        return `Recent throughput: ${Math.round(avgFinalized)}/year avg`;
      }
    }
    return null;
  }, [chartData, viewMode]);

  // Get total counts per key for legend
  const keyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    chartData.forEach(point => {
      Object.keys(point).forEach(key => {
        if (key !== 'year') {
          totals[key] = (totals[key] || 0) + (point[key] || 0);
        }
      });
    });
    return totals;
  }, [chartData]);

  // Toggle key visibility
  const toggleKey = (key: string) => {
    setHiddenKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Download CSV
  const downloadCSV = () => {
    if (detailedData.length === 0) return;

    const headers = ['EIP Number', 'Title', 'Author', 'Created At', 'Type', 'Status', 'Category', 'Repository', 'URL'];
    const rows = detailedData.map(item => [
      item.eipNumber,
      `"${item.title.replace(/"/g, '""')}"`,
      item.author,
      item.createdAt,
      item.type,
      item.status,
      item.category,
      item.repository,
      item.url
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `governance-data-${selectedYear || 'all'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ECharts option configuration - Protocol Telemetry Aesthetic
  const chartOption = useMemo(() => {
    if (chartData.length === 0) return null;

    // Light mode vs dark mode styles
    const isLight = !isDarkMode;
    const bgColor = isLight ? '#F8FAFC' : 'transparent';
    const tooltipBg = isLight ? 'rgba(226, 232, 240, 0.9)' : 'rgba(15, 23, 42, 0.85)';
    const tooltipBorder = isLight ? 'rgba(71, 85, 105, 0.3)' : 'rgba(148, 163, 184, 0.2)';
    const tooltipText = isLight ? '#1E293B' : '#E2E8F0';
    const tooltipSecondary = isLight ? '#64748B' : '#CBD5E1';
    const axisLabelColor = isLight ? '#475569' : '#94A3B8';
    const gridLineColor = isLight ? 'rgba(100, 116, 139, 0.12)' : 'rgba(148, 163, 184, 0.08)';
    const gridGlow = isLight ? 'rgba(100, 116, 139, 0.08)' : 'rgba(148, 163, 184, 0.15)';

    const barSeries = visibleKeys.map(key => {
      const baseColor = colors[key] || '#64748B';
      return {
        name: key,
        type: 'bar' as const,
        stack: 'total',
        data: chartData.map(d => d[key] || 0),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: `${baseColor}${isLight ? 'CC' : '99'}` }, // More opaque in light mode
            { offset: 1, color: `${baseColor}${isLight ? '80' : '4D'}` }  // More opaque in light mode
          ]),
          borderRadius: [0, 0, 0, 0],
          shadowBlur: isLight ? 8 : 12,
          shadowOffsetY: -1,
          shadowColor: `${baseColor}${isLight ? '30' : '50'}`,
          borderWidth: 0,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: isLight ? 12 : 20,
            shadowColor: `${baseColor}${isLight ? '50' : '80'}`,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: `${baseColor}FF` },
              { offset: 1, color: `${baseColor}99` }
            ])
          }
        }
      };
    });

    // Add total overlay line
    const totalLineData = chartData.map(d => 
      Object.keys(d).filter(k => k !== 'year').reduce((sum, k) => sum + (d[k] || 0), 0)
    );
    
    const lineSeries = {
      name: 'Total',
      type: 'line' as const,
      data: totalLineData,
      symbol: 'circle',
      symbolSize: 4,
      lineStyle: { opacity: 0 },
      itemStyle: {
        color: isLight ? 'rgba(71, 85, 105, 0.5)' : 'rgba(203, 213, 225, 0.6)',
        shadowBlur: 6,
        shadowColor: isLight ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.4)'
      },
      z: 10
    };

    const series = [...barSeries, lineSeries] as any;

    return {
      backgroundColor: bgColor,
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: {
          type: 'shadow' as const,
          shadowStyle: {
            color: isLight ? 'rgba(100, 116, 139, 0.08)' : 'rgba(96, 165, 250, 0.1)'
          }
        },
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: [12, 16],
        textStyle: {
          color: tooltipText,
          fontSize: 12
        },
        extraCssText: 'min-width: 220px;',
        formatter: (params: any) => {
          const barParams = params.filter((p: any) => p.seriesName !== 'Total');
          const total = barParams.reduce((sum: number, p: any) => sum + (p.value || 0), 0);
          let result = `<div style="font-weight: 500; margin-bottom: 10px; color: ${isLight ? '#1E293B' : '#F1F5F9'};">Year ${params[0].axisValue}</div>`;
          barParams.forEach((param: any) => {
            if (param.value > 0) {
              result += `<div style="margin: 6px 0; display: flex; align-items: center;">
                <span style="display: inline-block; width: 8px; height: 8px; background: ${param.color}; border-radius: 2px; margin-right: 10px; box-shadow: 0 0 6px ${param.color}40;"></span>
                <span style="color: ${tooltipSecondary};">${param.seriesName}</span>
                <span style="margin-left: auto; font-weight: 600; color: ${isLight ? '#0F172A' : '#F1F5F9'};">${param.value}</span>
              </div>`;
            }
          });
          result += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid ${isLight ? 'rgba(100, 116, 139, 0.15)' : 'rgba(148, 163, 184, 0.15)'}; display: flex; justify-content: space-between;">
            <span style="color: ${tooltipSecondary};">Total</span>
            <span style="font-weight: 600; color: ${isLight ? '#0F172A' : '#E5E7EB'};">${total}</span>
          </div>`;
          return result;
        }
      },
      legend: {
        show: false,
        data: visibleKeys,
        top: 0,
        textStyle: {
          color: isLight ? 'rgba(71, 85, 105, 0.6)' : 'rgba(203, 213, 225, 0.45)',
          fontSize: 10
        },
        itemGap: 20,
        itemWidth: 12,
        itemHeight: 8,
        selected: Object.fromEntries(
          allKeys.map(key => [key, !hiddenKeys.has(key)])
        )
      },
      grid: {
        left: '4%',
        right: '4%',
        bottom: '12%',
        top: '12%',
        containLabel: true
      },
      xAxis: {
        type: 'category' as const,
        data: chartData.map(d => d.year),
        axisLabel: {
          color: axisLabelColor,
          fontSize: 11,
          rotate: 0,
          interval: 'auto'
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: isLight ? 'rgba(100, 116, 139, 0.15)' : 'rgba(148, 163, 184, 0.15)',
            width: 1
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: {
          color: axisLabelColor,
          fontSize: 11
        },
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: gridLineColor,
            type: 'dashed',
            width: 1,
            shadowBlur: 6,
            shadowColor: gridGlow
          }
        }
      },
      dataZoom: [
        {
          type: 'slider' as const,
          show: true,
          xAxisIndex: [0],
          start: 0,
          end: 100,
          bottom: 0,
          height: 25,
          handleSize: 8,
          handleStyle: {
            color: isLight ? 'rgba(45, 85, 184, 0.6)' : 'rgba(96, 165, 250, 0.6)',
            borderColor: isLight ? 'rgba(45, 85, 184, 0.3)' : 'rgba(96, 165, 250, 0.3)',
            borderWidth: 1
          },
          dataBackground: {
            areaStyle: {
              color: isLight ? 'rgba(45, 85, 184, 0.05)' : 'rgba(96, 165, 250, 0.05)'
            },
            lineStyle: {
              color: isLight ? 'rgba(45, 85, 184, 0.2)' : 'rgba(96, 165, 250, 0.2)',
              width: 1
            }
          },
          selectedDataBackground: {
            areaStyle: {
              color: isLight ? 'rgba(45, 85, 184, 0.1)' : 'rgba(96, 165, 250, 0.1)'
            },
            lineStyle: {
              color: isLight ? 'rgba(45, 85, 184, 0.4)' : 'rgba(96, 165, 250, 0.4)',
              width: 1
            }
          },
          textStyle: {
            color: axisLabelColor,
            fontSize: 10
          },
          borderColor: isLight ? 'rgba(100, 116, 139, 0.1)' : 'rgba(148, 163, 184, 0.1)'
        },
        {
          type: 'inside' as const,
          xAxisIndex: [0],
          start: 0,
          end: 100
        }
      ],
      series
    };
  }, [chartData, visibleKeys, colors, hiddenKeys, allKeys, isDarkMode]);

  // Handle legend select change
  const onLegendSelectChanged = (params: any) => {
    setHiddenKeys(prev => {
      const next = new Set(prev);
      if (params.selected[params.name] === false) {
        next.add(params.name);
      } else {
        next.delete(params.name);
      }
      return next;
    });
  };

  return (
    <>
      <PageHeader
        indicator={{ icon: "chart", label: "Analytics" }}
        title="Governance Over Time"
        description="How Ethereum proposals have evolved across categories and lifecycle stages since inception."
        sectionId="governance-over-time"
        className="bg-slate-100/40 dark:bg-slate-950/30"
      />
      <section className="relative w-full bg-slate-100/40 dark:bg-slate-950/30 pb-8 sm:pb-12 lg:pb-16">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        
          {/* Compact Insight Chip */}
          {insight && (
            <div className="mb-6 max-w-7xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-4 py-1.5 text-xs text-cyan-700 dark:text-cyan-300">
                <span>📈</span>
                <span>{insight}</span>
              </div>
            </div>
          )}

          {/* Two-Column Layout: Chart + Controls/Legend */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 max-w-7xl mx-auto">
            {/* Left: Chart */}
            <div>
              {/* Chart Container - Primary Signal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="rounded-2xl border border-slate-200 dark:border-slate-700/20 bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-900/40 dark:via-slate-950/60 dark:to-slate-900/40 p-6 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                style={{
                  boxShadow: 'inset 0 1px 0 0 rgba(148, 163, 184, 0.05), 0 8px 32px rgba(0, 0, 0, 0.4)'
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-96 text-slate-400">
                    No data available
                  </div>
                ) : chartOption ? (
                  <div className="relative" key={`${viewMode}-${includeRIPs}`}>
                    <ReactECharts
                      ref={chartRef}
                      option={chartOption}
                      style={{ height: '480px', width: '100%' }}
                      opts={{ renderer: 'svg' }}
                      onEvents={{
                        legendselectchanged: onLegendSelectChanged
                      }}
                    />
                  </div>
                ) : null}
              </motion.div>

              {/* Year Chips - Below Chart */}
              {availableYears.length > 0 && (
                <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">
                  {availableYears.slice(0, 4).map(year => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year === selectedYear ? null : year)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        selectedYear === year
                          ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 shadow-[0_0_8px_rgba(34,211,238,0.15)]'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800/40 border border-slate-300 dark:border-slate-700/30 hover:border-slate-400 dark:hover:border-slate-600/50'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                  {availableYears.length > 4 && (
                    <select
                      value={selectedYear && availableYears.slice(0, 4).includes(selectedYear) ? '' : (selectedYear || '')}
                      onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500/30 border border-slate-300 dark:border-slate-700/30 hover:border-slate-400 dark:hover:border-slate-600/50 transition-colors"
                    >
                      <option value="">More...</option>
                      {availableYears.slice(4).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* Right: Controls + Legend */}
            <div className="space-y-4">
              {/* Compact Controls */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700/30 bg-slate-50/90 dark:bg-slate-900/40 p-3 backdrop-blur-md space-y-3">
              {/* Category/Status Toggle */}
                <div className="flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800/30">
                <button
                  onClick={() => setViewMode('category')}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'category'
                        ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Category
                </button>
                <button
                  onClick={() => setViewMode('status')}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'status'
                        ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Status
                </button>
              </div>

              {/* RIP Filter */}
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeRIPs}
                  onChange={(e) => setIncludeRIPs(e.target.checked)}
                    className="rounded border-slate-400 dark:border-slate-600/50 bg-white dark:bg-slate-800/30 text-cyan-500 focus:ring-cyan-500"
                />
                Include RIPs
              </label>
            </div>

              {/* Analytical Legend with Counts */}
              {!loading && chartData.length > 0 && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700/30 bg-slate-50/90 dark:bg-slate-900/40 p-3 backdrop-blur-md space-y-2">
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Legend</div>
                  <div className="space-y-1.5">
                    {Object.keys(colors).map(key => {
                      const isHidden = hiddenKeys.has(key);
                      const color = colors[key] || '#64748B';
                      const total = keyTotals[key] || 0;
                      return (
                        <button
                          key={key}
                          onClick={() => toggleKey(key)}
                          className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md transition-all ${
                            isHidden
                              ? isDarkMode ? 'bg-slate-200/70 dark:bg-slate-800/20 text-slate-500/80 dark:text-slate-500/60' : 'bg-slate-300/60 text-slate-600/70'
                              : isDarkMode ? 'bg-slate-100 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/40' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-sm"
                              style={{
                                backgroundColor: color,
                                opacity: isHidden ? 0.2 : isDarkMode ? 0.8 : 1,
                                boxShadow: isHidden ? 'none' : isDarkMode ? `0 0 4px ${color}50` : `0 0 6px ${color}40`
                              }}
                            />
                            <span className="text-xs font-medium">{key}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 tabular-nums">{total}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            </div>

        {/* Compact Table - Only show when year selected */}
        {selectedYear && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-8 max-w-7xl mx-auto rounded-xl border border-slate-200 dark:border-slate-700/20 bg-slate-50/90 dark:bg-slate-900/30 p-4 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {selectedYear} · {detailedData.length} {detailedData.length === 1 ? 'proposal' : 'proposals'}
              </h3>
              {detailedData.length > 0 && (
                <button
                  onClick={downloadCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-0 bg-cyan-400/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-400/15 transition-all text-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  CSV
                </button>
              )}
            </div>
            
            {loadingDetails ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
              </div>
            ) : detailedData.length === 0 ? (
              <div className="text-center text-slate-600 dark:text-slate-400 py-8">
                No data available for {selectedYear}
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-slate-100/95 dark:bg-slate-950/90 backdrop-blur-md z-10">
                    <tr className="border-b border-slate-200 dark:border-slate-700/20">
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-400/70 uppercase tracking-wider">EIP #</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-400/70 uppercase tracking-wider">Title</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-400/70 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-400/70 uppercase tracking-wider">Meta</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-400/70 uppercase tracking-wider">Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/30">
                    {detailedData
                      .filter(item => item.eipNumber && item.eipNumber > 0) // Filter out invalid entries
                      .map((item) => {
                        const statusColor = isDarkMode ? statusColorsDark[item.status] : statusColorsLight[item.status] || '#64748B';
                        const meta = `${item.category || item.type || 'Unknown'}${item.author && item.author !== 'Unknown' ? ` · ${item.author}` : ''}`;
                        return (
                          <tr key={item.eipNumber} className="hover:bg-slate-200/60 dark:hover:bg-slate-800/20 transition-colors relative group">
                            {/* Row Heat - Left Accent Bar */}
                            <td className="absolute left-0 top-0 h-full w-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: statusColor }} />
                            <td className="px-3 py-2 text-xs font-mono text-cyan-700 dark:text-cyan-300/90">{item.eipNumber}</td>
                            <td className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300/90">{item.title || 'Untitled'}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium backdrop-blur-sm border ${
                              item.status === 'Final' ? isDarkMode ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' : 'bg-emerald-500/20 text-emerald-700 border-emerald-600/40' :
                              item.status === 'Draft' ? isDarkMode ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/20' : 'bg-cyan-500/20 text-cyan-700 border-cyan-600/40' :
                              item.status === 'Review' ? isDarkMode ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20' : 'bg-blue-500/20 text-blue-700 border-blue-600/40' :
                              item.status === 'Last Call' ? isDarkMode ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20' : 'bg-amber-500/20 text-amber-700 border-amber-600/40' :
                              item.status === 'Withdrawn' ? isDarkMode ? 'bg-slate-500/15 text-slate-400 border-slate-500/20' : 'bg-slate-500/20 text-slate-600 border-slate-600/40' :
                              isDarkMode ? 'bg-slate-500/15 text-slate-500 border-slate-500/20' : 'bg-slate-500/20 text-slate-600 border-slate-600/40'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[10px] text-slate-400/80">{meta}</td>
                          <td className="px-3 py-2">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-700 dark:text-cyan-400/90 hover:text-cyan-800 dark:hover:text-cyan-300 text-xs transition-colors"
                            >
                              →
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

      </div>
    </section>
    </>
  );
}
