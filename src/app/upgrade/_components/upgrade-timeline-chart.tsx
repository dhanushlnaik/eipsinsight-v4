'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { Group } from '@visx/group';
import { scaleLinear } from '@visx/scale';
import { Plus, Minus, RotateCcw, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

type StatusType = 'included' | 'scheduled' | 'declined' | 'considered' | 'proposed';

interface EIPData {
  date: string;
  included: string[];
  scheduled: string[];
  declined: string[];
  considered: string[];
  proposed: string[];
}

interface UpgradeTimelineChartProps {
  data: EIPData[];
  upgradeName: string;
}

const COLOR_SCHEME: Record<StatusType, string> = {
  included: '#10B981', // emerald-500
  scheduled: '#06B6D4', // cyan-500
  considered: '#F59E0B', // amber-500
  declined: '#EF4444', // red-500
  proposed: '#8B5CF6', // violet-500
};

const LEGEND_LABELS: Record<StatusType, string> = {
  included: 'INCLUDED',
  scheduled: 'SFI',
  considered: 'CFI',
  declined: 'DFI',
  proposed: 'PFI',
};

const cubeSize = 24;
const blockHeight = cubeSize;
const blockWidth = cubeSize * 2;
const padding = 80;
const rowHeight = cubeSize + 12;

export function UpgradeTimelineChart({ data, upgradeName }: UpgradeTimelineChartProps) {
  const router = useRouter();
  const [scrollIndex, setScrollIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredEip, setHoveredEip] = useState<{
    eip: string;
    type: StatusType;
    date: string;
    statusCounts: {
      included: number;
      scheduled: number;
      considered: number;
      declined: number;
      proposed: number;
    };
  } | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Global mouse tracking for accurate tooltip positioning
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (hoveredEip) {
        setMousePos({ x: e.clientX, y: e.clientY });
      }
    };

    if (hoveredEip) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
      };
    }
  }, [hoveredEip]);

  const dataToRender = Array.isArray(data) ? data : [];
  const maxVisibleRows = 15;
  const visibleData = [...dataToRender].reverse().slice(scrollIndex, scrollIndex + maxVisibleRows);

  const MIN_ITEMS_DISPLAYED = 7;
  const maxItems = Math.max(
    MIN_ITEMS_DISPLAYED,
    ...dataToRender.map(
      (d) =>
        (d.included?.length || 0) +
        (d.scheduled?.length || 0) +
        (d.considered?.length || 0) +
        (d.declined?.length || 0) +
        (d.proposed?.length || 0)
    )
  );

  const blockSpacing = 6;
  const xScale = scaleLinear({
    domain: [0, maxItems],
    range: [0, maxItems * (blockWidth + blockSpacing)],
  });
  const chartWidth = xScale(maxItems) + 200;
  const chartPaddingBottom = 40;
  const chartHeight = visibleData.length * rowHeight + chartPaddingBottom;

  const resetZoom = () => {
    setZoomLevel(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoomLevel > 1) {
        setIsDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY };
      }
    },
    [zoomLevel]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Update mouse position for tooltip
      setMousePos({ x: e.clientX, y: e.clientY });
      
      if (!isDragging || zoomLevel <= 1) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      dragStart.current = { x: e.clientX, y: e.clientY };
      setOffset((prev) => ({
        x: prev.x - dx / zoomLevel,
        y: prev.y - dy / zoomLevel,
      }));
    },
    [isDragging, zoomLevel]
  );

  const changeStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      included: 'INCLUDED',
      scheduled: 'SFI',
      considered: 'CFI',
      declined: 'DFI',
      proposed: 'PFI',
    };
    return statusMap[status.toLowerCase()] || status;
  };

  const downloadReport = () => {
    const rows = [...dataToRender].reverse().map((d) => ({
      date: d.date,
      included: d.included?.join(', ') || '-',
      considered: d.considered?.join(', ') || '-',
      declined: d.declined?.join(', ') || '-',
      scheduled: d.scheduled?.join(', ') || '-',
      proposed: d.proposed?.join(', ') || '-',
    }));

    const headers = ['ChangeDate', 'Included', 'Considered', 'Declined', 'Scheduled', 'Proposed'];
    const csv = [
      headers,
      ...rows.map((r) => [
        r.date,
        `"${r.included}"`,
        `"${r.considered}"`,
        `"${r.declined}"`,
        `"${r.scheduled}"`,
        `"${r.proposed}"`,
      ]),
    ]
      .map((r) => r.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${upgradeName.toLowerCase()}_network_upgrade.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative w-full rounded-lg border border-cyan-400/20 bg-white/90 dark:bg-slate-950/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-cyan-400/10 bg-slate-100/80 dark:bg-slate-900/30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">EIP Composition Timeline</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">Track EIP status changes over time for <span className="text-cyan-700 dark:text-cyan-300 font-medium">{upgradeName}</span></p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Zoom Controls */}
            <div className="flex gap-0.5 rounded-lg bg-white/90 dark:bg-slate-950/80 backdrop-blur-sm border border-cyan-400/20 p-1">
              <button
                onClick={() => setZoomLevel((z) => Math.min(z * 1.2, 3))}
                disabled={zoomLevel >= 3}
                className={cn(
                  'p-1.5 rounded transition-all text-cyan-700 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-200 hover:bg-cyan-500/15',
                  'disabled:opacity-30 disabled:cursor-not-allowed'
                )}
                aria-label="Zoom in"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(z / 1.2, 0.5))}
                disabled={zoomLevel <= 0.5}
                className={cn(
                  'p-1.5 rounded transition-all text-cyan-700 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-200 hover:bg-cyan-500/15',
                  'disabled:opacity-30 disabled:cursor-not-allowed'
                )}
                aria-label="Zoom out"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={resetZoom}
                disabled={zoomLevel === 1 && offset.x === 0 && offset.y === 0}
                className={cn(
                  'p-1.5 rounded transition-all text-cyan-700 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-200 hover:bg-cyan-500/15',
                  'disabled:opacity-30 disabled:cursor-not-allowed'
                )}
                aria-label="Reset"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
            {/* Export Button */}
            <button
              onClick={downloadReport}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/25 border border-cyan-400/25 transition-all text-xs font-medium flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 pt-3 border-t border-cyan-400/10 flex flex-wrap gap-2.5 sm:gap-3 justify-center items-center">
          {(Object.entries(COLOR_SCHEME) as [StatusType, string][]).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div
                className="h-2 w-2 rounded-full border border-white/10"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{LEGEND_LABELS[status]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div
        ref={chartContainerRef}
        className="relative overflow-auto bg-slate-100/70 dark:bg-slate-900/30"
        style={{ height: `${chartHeight + 10}px`, minHeight: '400px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          handleMouseUp();
          setHoveredEip(null);
        }}
      >
        {zoomLevel > 1 && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-cyan-400/20 px-2.5 py-1.5">
            <span className="text-xs text-cyan-700 dark:text-cyan-300 font-medium">Drag to pan</span>
          </div>
        )}

        <svg
          viewBox={`${offset.x} ${offset.y} ${chartWidth / zoomLevel} ${chartHeight / zoomLevel}`}
          preserveAspectRatio="xMinYMin meet"
          style={{
            width: '100%',
            height: 'auto',
            minWidth: `${chartWidth}px`,
            display: 'block',
            cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          }}
        >
          <Group top={padding} left={padding}>
            {visibleData.map((item, rowIndex) => {
              const allEips: { eip: string; type: StatusType }[] = [
                ...(item.included ?? []).map((eip) => ({ eip, type: 'included' as const })),
                ...(item.scheduled ?? []).map((eip) => ({ eip, type: 'scheduled' as const })),
                ...(item.considered ?? []).map((eip) => ({ eip, type: 'considered' as const })),
                ...(item.declined ?? []).map((eip) => ({ eip, type: 'declined' as const })),
                ...(item.proposed ?? []).map((eip) => ({ eip, type: 'proposed' as const })),
              ];

              return (
                <Group key={rowIndex} top={rowIndex * rowHeight}>
                  <Group left={80}>
                    {allEips.map((d, i) => {
                      const eipNum = d.eip.replace(/EIP-/, '');
                      return (
                        <g
                          key={i}
                          onClick={() => router.push(`/eip/${eipNum}`)}
                          className="cursor-pointer"
                          onMouseEnter={(e) => {
                            const nativeEvent = e.nativeEvent as MouseEvent;
                            setHoveredEip({
                              ...d,
                              date: item.date,
                              statusCounts: {
                                included: item.included?.length || 0,
                                scheduled: item.scheduled?.length || 0,
                                considered: item.considered?.length || 0,
                                declined: item.declined?.length || 0,
                                proposed: item.proposed?.length || 0,
                              },
                            });
                            // Set initial mouse position using native event (viewport coordinates)
                            setMousePos({ x: nativeEvent.clientX, y: nativeEvent.clientY });
                          }}
                          onMouseLeave={() => setHoveredEip(null)}
                        >
                          <rect
                            x={xScale(i)}
                            y={0}
                            width={blockWidth}
                            height={blockHeight}
                            rx={4}
                            fill={COLOR_SCHEME[d.type]}
                            stroke="#1e293b"
                            strokeWidth={1}
                            className="transition-opacity hover:opacity-90"
                          />
                          <text
                            x={xScale(i) + blockWidth / 2}
                            y={blockHeight / 1.5}
                            fontSize={14}
                            textAnchor="middle"
                            fill="white"
                            fontWeight="600"
                            className="pointer-events-none select-none"
                          >
                            {eipNum}
                          </text>
                        </g>
                      );
                    })}
                  </Group>
                </Group>
              );
            })}

            {/* Y-Axis Labels: Dates */}
            {visibleData.map((item, rowIndex) => {
              const yPos = rowIndex * rowHeight + blockHeight / 1.5;
              return (
                <g key={`ylabel-${rowIndex}`}>
                  <text
                    x={0}
                    y={yPos}
                    fontSize={11}
                    fontWeight="600"
                    fill="#06B6D4"
                    textAnchor="start"
                    className="select-none"
                  >
                    {new Date(item.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </text>
                </g>
              );
            })}
          </Group>
        </svg>

        {/* Tooltip */}
        {hoveredEip && (() => {
          const tooltipWidth = 260;
          const tooltipHeight = 180;
          const offset = 12; // Small offset from cursor
          
          // Use mousePos directly (already in clientX/Y coordinates)
          let left = mousePos.x + offset;
          let top = mousePos.y + offset;
          
          // Check right boundary - flip to left side if needed
          if (left + tooltipWidth > window.innerWidth - 10) {
            left = mousePos.x - tooltipWidth - offset;
          }
          
          // Check bottom boundary - flip to top if needed
          if (top + tooltipHeight > window.innerHeight - 10) {
            top = mousePos.y - tooltipHeight - offset;
          }
          
          // Ensure tooltip doesn't go off left edge
          if (left < 10) {
            left = 10;
          }
          
          // Ensure tooltip doesn't go off top edge
          if (top < 10) {
            top = 10;
          }
          
          return (
            <div
              className="fixed z-50 bg-white/98 dark:bg-slate-950/98 backdrop-blur-md border border-cyan-400/30 rounded-lg shadow-xl pointer-events-none"
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${tooltipWidth}px`,
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(6, 182, 212, 0.2)',
              }}
            >
              <div className="p-3 space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="px-2 py-0.5 rounded-md text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: COLOR_SCHEME[hoveredEip.type] }}
                  >
                    EIP-{hoveredEip.eip.replace(/EIP-/, '')}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {changeStatus(hoveredEip.type)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {new Date(hoveredEip.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <div className="pt-2 border-t border-slate-300/70 dark:border-slate-700/40">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Status counts:</p>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-emerald-700 dark:text-emerald-300">INCLUDED: {hoveredEip.statusCounts.included}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-cyan-500" />
                      <span className="text-cyan-700 dark:text-cyan-300">SFI: {hoveredEip.statusCounts.scheduled}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      <span className="text-amber-700 dark:text-amber-300">CFI: {hoveredEip.statusCounts.considered}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-red-700 dark:text-red-300">DFI: {hoveredEip.statusCounts.declined}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-violet-500" />
                      <span className="text-violet-700 dark:text-violet-300">PFI: {hoveredEip.statusCounts.proposed}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
