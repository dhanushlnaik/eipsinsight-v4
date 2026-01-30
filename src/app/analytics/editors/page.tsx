'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader, SectionSeparator } from '@/components/header';
import { client } from '@/lib/orpc';
import Image from 'next/image';
import { Loader2, UserCheck, BarChart3, Download, Info, TrendingUp, Copy, List, BarChart2 } from 'lucide-react';
import { motion } from 'motion/react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { cn } from '@/lib/utils';
import { TIME_RANGE_OPTIONS, getTimeRangeBounds, type TimeRangePreset } from './_lib/time-range';

type RepoFilter = 'eips' | 'ercs' | 'rips' | undefined;

/** Whitelist: only these editors are shown on the page. */
const EDITOR_USERNAMES = [
  'SamWilsn', 'lightclient', 'Pandapip1', 'g11tech', 'MicahZoltu', 'axic', 'xinbenlv',
  'jochem-brouwer', 'nconsigny', 'yoavw', 'CarlBeek', 'adietrichs', 'gcolvin',
] as const;

/** Whitelist: only these reviewers are shown on the page. */
const REVIEWER_USERNAMES = [
  'bomanaps', 'Marchhill', 'SkandaBhat', 'advaita-saha', 'nalepae', 'daniellehrner',
] as const;

interface LeaderboardRow {
  actor: string;
  totalReviews: number;
  prsTouched: number;
  medianResponseDays: number | null;
}

const BAR_COLORS = [
  '#06B6D4', '#EF4444', '#8B5CF6', '#EC4899', '#3B82F6', '#F59E0B', '#10B981', '#F97316',
  '#6366F1', '#14B8A6', '#A855F7', '#64748B', '#E11D48', '#0EA5E9',
];

function Avatar({ name, size = 8 }: { name: string; size?: number }) {
  const [imgError, setImgError] = React.useState(false);
  const initial = name.charAt(0).toUpperCase();
  const bg = `hsl(${(name.charCodeAt(0) * 17) % 360}, 60%, 40%)`;
  const px = size * 4;
  if (!imgError) {
    return (
      <div className="relative rounded-full overflow-hidden flex-shrink-0 bg-slate-800" style={{ width: px, height: px, minWidth: px, minHeight: px }}>
        <Image
          src={`https://github.com/${name}.png`}
          alt={name}
          width={px}
          height={px}
          className="rounded-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full text-white font-semibold flex-shrink-0"
      style={{ width: px, height: px, minWidth: px, minHeight: px, backgroundColor: bg, fontSize: Math.max(10, size * 1.5) }}
      title={name}
    >
      {initial}
    </div>
  );
}

function HorizontalContributionChart({
  title,
  timeLabel,
  data,
  loading,
  onDownloadCSV,
  emptyMessage = 'No data',
  titleColor = 'text-cyan-300',
}: {
  title: string;
  timeLabel: string;
  data: LeaderboardRow[];
  loading?: boolean;
  onDownloadCSV?: () => void;
  emptyMessage?: string;
  titleColor?: string;
}) {
  const top = useMemo(() => data.slice(0, 14), [data]);
  const maxVal = useMemo(() => Math.max(...top.map((r) => r.totalReviews), 1), [top]);

  if (loading) {
    return (
      <div className="rounded-xl border border-cyan-400/20 bg-slate-950/50 p-6 h-[420px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="rounded-xl border border-cyan-400/20 bg-slate-950/50 p-6 h-[420px] flex items-center justify-center text-slate-400 text-sm">
        {emptyMessage}
      </div>
    );
  }

  const timestamp = new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="rounded-xl border border-cyan-400/20 bg-slate-950/50 overflow-hidden flex flex-col">
      {/* Header: title + icons + Download CSV */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-cyan-400/10">
        <h3 className={cn('text-base font-bold', titleColor)}>{title} — {timeLabel} Contributions</h3>
        <div className="flex items-center gap-2">
          <button type="button" className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/50" title="Copy">
            <Copy className="h-4 w-4" />
          </button>
          <button type="button" className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/50" title="List view">
            <List className="h-4 w-4" />
          </button>
          <button type="button" className="p-1.5 rounded-md text-cyan-400 bg-cyan-500/20 border border-cyan-400/30" title="Bar chart view">
            <BarChart2 className="h-4 w-4" />
          </button>
          {onDownloadCSV && (
            <button
              onClick={onDownloadCSV}
              className="ml-2 flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Download CSV
            </button>
          )}
        </div>
      </div>
      {/* Horizontal bars: name (left) | bar | value | avatar (right) */}
      <div className="flex-1 overflow-auto p-4 space-y-2 min-h-[320px]">
        {top.map((r, i) => {
          const pct = (r.totalReviews / maxVal) * 100;
          const color = BAR_COLORS[i % BAR_COLORS.length];
          return (
            <div key={r.actor} className="flex items-center gap-3 w-full group">
              <span className="text-sm font-medium text-slate-200 w-[120px] sm:w-[140px] truncate shrink-0" title={r.actor}>
                {r.actor}
              </span>
              <div className="flex-1 min-w-0 h-7 rounded-md bg-slate-800/60 overflow-hidden flex items-center">
                <div
                  className="h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${pct}%`, minWidth: r.totalReviews > 0 ? '2rem' : 0, backgroundColor: color }}
                >
                  <span className="text-xs font-bold text-white drop-shadow-sm tabular-nums">{r.totalReviews.toLocaleString()}</span>
                </div>
              </div>
              <Avatar name={r.actor} size={7} />
            </div>
          );
        })}
      </div>
      {/* Footer: branding + timestamp */}
      <div className="flex items-center justify-between px-5 py-2 border-t border-cyan-400/10 text-xs text-slate-500">
        <span>EIPsInsight.com</span>
        <span>{timestamp}</span>
      </div>
    </div>
  );
}

function normRepo(repo: string): string {
  const r = repo ?? '';
  if (r.includes('EIPs')) return 'EIPs';
  if (r.includes('ERCs')) return 'ERCs';
  if (r.includes('RIPs')) return 'RIPs';
  return r || 'Other';
}

function RepoDistributionCards({
  distribution,
  title,
  accent = 'cyan',
  loading,
}: {
  distribution: Array<{ actor: string; repo: string; count: number; pct: number }>;
  title: string;
  accent?: 'cyan' | 'emerald';
  loading?: boolean;
}) {
  const byActor = useMemo(() => {
    const map = new Map<string, { total: number; repos: Record<string, number> }>();
    for (const d of distribution) {
      const key = normRepo(d.repo);
      if (!map.has(d.actor)) map.set(d.actor, { total: 0, repos: {} });
      const entry = map.get(d.actor)!;
      entry.total += d.count;
      entry.repos[key] = (entry.repos[key] ?? 0) + d.count;
    }
    return Array.from(map.entries())
      .map(([actor, data]) => {
        const total = data.total;
        const repos: Record<string, { count: number; pct: number }> = {};
        for (const [k, count] of Object.entries(data.repos)) {
          repos[k] = { count, pct: total ? (count / total) * 100 : 0 };
        }
        return { actor, total, repos };
      })
      .sort((a, b) => b.total - a.total);
  }, [distribution]);

  if (loading) {
    return (
      <div className="rounded-xl border border-cyan-400/20 bg-slate-950/50 p-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!byActor.length) {
    return (
      <div className="rounded-xl border border-cyan-400/20 bg-slate-950/50 p-8 text-center text-slate-400 text-sm">
        No distribution data
      </div>
    );
  }

  const labels = ['EIPs', 'ERCs', 'RIPs'] as const;

  return (
    <div className="space-y-4">
      {byActor.map(({ actor, total, repos }) => (
        <motion.div
          key={actor}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-slate-700/50 bg-slate-950/50 overflow-hidden"
        >
          <div className="flex items-center gap-4 p-4 border-b border-slate-700/50">
            <Avatar name={actor} size={8} />
            <div>
              <p className="font-semibold text-white">{actor}</p>
              <p className="text-sm text-slate-400">{total.toLocaleString()} total reviews</p>
            </div>
          </div>
          <div className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5" />
              Monthly Review Trend
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {labels.map((label) => {
                const r = repos[label] ?? { count: 0, pct: 0 };
                return (
                  <div key={label} className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-3">
                    <p className="text-sm font-medium text-slate-300">{label}</p>
                    <p className="text-lg font-bold text-white tabular-nums">{r.count.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">{r.pct.toFixed(0)}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function EditorsAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repo, setRepo] = useState<RepoFilter>(undefined);
  const [timePreset, setTimePreset] = useState<TimeRangePreset>('all_time');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const [editorsLeaderboard, setEditorsLeaderboard] = useState<LeaderboardRow[]>([]);
  const [reviewersLeaderboard, setReviewersLeaderboard] = useState<LeaderboardRow[]>([]);
  const [byCategory, setByCategory] = useState<Array<{ category: string; actors: string[] }>>([]);
  const [editorsRepoDistribution, setEditorsRepoDistribution] = useState<Array<{ actor: string; repo: string; count: number; pct: number }>>([]);
  const [reviewersRepoDistribution, setReviewersRepoDistribution] = useState<Array<{ actor: string; repo: string; count: number; pct: number }>>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<Array<{ month: string; count: number }>>([]);

  const { from, to, label: timeLabel } = useMemo(
    () => getTimeRangeBounds(timePreset, customFrom || undefined, customTo || undefined),
    [timePreset, customFrom, customTo]
  );

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const apiParams = { repo: repo || undefined, from: from || undefined, to: to || undefined };
        const [editors, reviewers, category, editorsDist, reviewersDist, trend] = await Promise.all([
          client.analytics.getEditorsLeaderboard({ ...apiParams, limit: 100 }),
          client.analytics.getReviewersLeaderboard({ ...apiParams, limit: 100 }),
          client.analytics.getEditorsByCategory({ repo: repo || undefined }),
          client.analytics.getEditorsRepoDistribution(apiParams),
          client.analytics.getReviewersRepoDistribution(apiParams),
          client.analytics.getMonthlyReviewTrend({ ...apiParams, from: from ?? '2015-01-01' }),
        ]);
        setEditorsLeaderboard(editors);
        setReviewersLeaderboard(reviewers);
        setByCategory(category);
        setEditorsRepoDistribution(editorsDist);
        setReviewersRepoDistribution(reviewersDist);
        setMonthlyTrend(trend);
      } catch (err) {
        console.error('Failed to fetch editors analytics:', err);
        setError('Failed to load editors analytics');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [repo, from, to]);

  // Only show whitelisted editors and reviewers (preserve order; fill missing with zeros)
  const filteredEditorsLeaderboard = useMemo(() => {
    const byActor = new Map(editorsLeaderboard.map((r) => [r.actor, r]));
    return EDITOR_USERNAMES.map((actor) => byActor.get(actor) ?? { actor, totalReviews: 0, prsTouched: 0, medianResponseDays: null as number | null });
  }, [editorsLeaderboard]);

  const filteredReviewersLeaderboard = useMemo(() => {
    const byActor = new Map(reviewersLeaderboard.map((r) => [r.actor, r]));
    return REVIEWER_USERNAMES.map((actor) => byActor.get(actor) ?? { actor, totalReviews: 0, prsTouched: 0, medianResponseDays: null as number | null });
  }, [reviewersLeaderboard]);

  const filteredEditorsRepoDistribution = useMemo(() => {
    const set = new Set(EDITOR_USERNAMES);
    return editorsRepoDistribution.filter((d) => set.has(d.actor as typeof EDITOR_USERNAMES[number]));
  }, [editorsRepoDistribution]);

  const filteredReviewersRepoDistribution = useMemo(() => {
    const set = new Set(REVIEWER_USERNAMES);
    return reviewersRepoDistribution.filter((d) => set.has(d.actor as typeof REVIEWER_USERNAMES[number]));
  }, [reviewersRepoDistribution]);

  const allowedActorsSet = useMemo(() => new Set<string>([...EDITOR_USERNAMES, ...REVIEWER_USERNAMES]), []);
  const filteredByCategory = useMemo(
    () => byCategory.map(({ category, actors }) => ({ category, actors: actors.filter((a) => allowedActorsSet.has(a)) })),
    [byCategory, allowedActorsSet]
  );

  function buildRepoBreakdown(distribution: Array<{ actor: string; repo: string; count: number; pct: number }>) {
    const map = new Map<string, { total: number; EIPs: number; ERCs: number; RIPs: number }>();
    for (const d of distribution) {
      if (!map.has(d.actor)) map.set(d.actor, { total: 0, EIPs: 0, ERCs: 0, RIPs: 0 });
      const entry = map.get(d.actor)!;
      entry.total += d.count;
      const key = normRepo(d.repo);
      if (key === 'EIPs') entry.EIPs += d.count;
      else if (key === 'ERCs') entry.ERCs += d.count;
      else if (key === 'RIPs') entry.RIPs += d.count;
    }
    return map;
  }

  const downloadDetailedEditorsCSV = () => {
    const breakdown = buildRepoBreakdown(editorsRepoDistribution);
    const headers = [
      'role', 'actor', 'total_reviews', 'prs_touched', 'median_response_days',
      'eips_reviews', 'ercs_reviews', 'rips_reviews', 'eips_pct', 'ercs_pct', 'rips_pct',
      'activity_summary',
    ];
    const rows = filteredEditorsLeaderboard.map((r) => {
      const b = breakdown.get(r.actor) ?? { total: 0, EIPs: 0, ERCs: 0, RIPs: 0 };
      const total = b.total || r.totalReviews;
      const eipPct = total ? ((b.EIPs / total) * 100).toFixed(1) : '0';
      const ercPct = total ? ((b.ERCs / total) * 100).toFixed(1) : '0';
      const ripPct = total ? ((b.RIPs / total) * 100).toFixed(1) : '0';
      const summary = `${r.totalReviews} total reviews (${eipPct}% EIPs, ${ercPct}% ERCs, ${ripPct}% RIPs). PRs touched: ${r.prsTouched}. Median response: ${r.medianResponseDays ?? '—'} days.`;
      return [
        'Editor',
        r.actor,
        r.totalReviews,
        r.prsTouched,
        r.medianResponseDays ?? '',
        b.EIPs,
        b.ERCs,
        b.RIPs,
        eipPct,
        ercPct,
        ripPct,
        `"${summary.replace(/"/g, '""')}"`,
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `editors-detailed-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadDetailedReviewersCSV = () => {
    const breakdown = buildRepoBreakdown(reviewersRepoDistribution);
    const headers = [
      'role', 'actor', 'total_reviews', 'prs_touched', 'median_response_days',
      'eips_reviews', 'ercs_reviews', 'rips_reviews', 'eips_pct', 'ercs_pct', 'rips_pct',
      'activity_summary',
    ];
    const rows = filteredReviewersLeaderboard.map((r) => {
      const b = breakdown.get(r.actor) ?? { total: 0, EIPs: 0, ERCs: 0, RIPs: 0 };
      const total = b.total || r.totalReviews;
      const eipPct = total ? ((b.EIPs / total) * 100).toFixed(1) : '0';
      const ercPct = total ? ((b.ERCs / total) * 100).toFixed(1) : '0';
      const ripPct = total ? ((b.RIPs / total) * 100).toFixed(1) : '0';
      const summary = `${r.totalReviews} total reviews (${eipPct}% EIPs, ${ercPct}% ERCs, ${ripPct}% RIPs). PRs touched: ${r.prsTouched}. Median response: ${r.medianResponseDays ?? '—'} days.`;
      return [
        'Reviewer',
        r.actor,
        r.totalReviews,
        r.prsTouched,
        r.medianResponseDays ?? '',
        b.EIPs,
        b.ERCs,
        b.RIPs,
        eipPct,
        ercPct,
        ripPct,
        `"${summary.replace(/"/g, '""')}"`,
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reviewers-detailed-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }


  const monthlyTrendOption = useMemo(
    () => ({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' as const },
      grid: { left: '8%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: monthlyTrend.map((d) => d.month),
        axisLabel: { color: '#94a3b8', fontSize: 10 },
      },
      yAxis: { type: 'value' as const, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.08)' } } },
      series: [
        {
          name: 'Reviews',
          type: 'line' as const,
          data: monthlyTrend.map((d) => d.count),
          smooth: true,
          lineStyle: { color: '#06B6D4', width: 2 },
          itemStyle: { color: '#06B6D4' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(6,182,212,0.3)' },
              { offset: 1, color: 'rgba(6,182,212,0)' },
            ]),
          },
        },
      ],
    }),
    [monthlyTrend]
  );

  return (
    <div className="bg-background relative w-full overflow-hidden min-h-screen">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(52,211,153,0.12),_transparent_50%),_radial-gradient(ellipse_at_bottom_right,_rgba(6,182,212,0.1),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="relative z-10">
        <PageHeader
          title="Editors & Reviewers Leaderboard"
          description="Track and analyze EIP editor and reviewer activity, contributions, and review patterns. Monitor monthly statistics, compare performance metrics, and explore detailed review histories."
          sectionId="editors"
          className="bg-background/80 backdrop-blur-xl"
        />

        {/* Filters */}
        <section className="border-b border-cyan-400/10 bg-slate-950/40">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Repository</label>
                <select
                  value={repo ?? 'all'}
                  onChange={(e) => setRepo(e.target.value === 'all' ? undefined : (e.target.value as RepoFilter))}
                  className="rounded-lg border border-cyan-400/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 min-w-[140px]"
                >
                  <option value="all">All</option>
                  <option value="eips">EIP</option>
                  <option value="ercs">ERC</option>
                  <option value="rips">RIP</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Time range</label>
                <select
                  value={timePreset}
                  onChange={(e) => setTimePreset(e.target.value as TimeRangePreset)}
                  className="rounded-lg border border-cyan-400/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 min-w-[160px]"
                >
                  {TIME_RANGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {timePreset === 'custom' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">From (YYYY-MM)</label>
                    <input
                      type="month"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="rounded-lg border border-cyan-400/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-cyan-400/40 focus:outline-none min-w-[140px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">To (YYYY-MM)</label>
                    <input
                      type="month"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="rounded-lg border border-cyan-400/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-cyan-400/40 focus:outline-none min-w-[140px]"
                    />
                  </div>
                </>
              )}
              <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
                <Info className="h-3.5 w-3.5" />
                <span>{repo ? repo.toUpperCase() : 'All repos'} · {timeLabel}</span>
              </div>
            </div>
          </div>
        </section>

        <SectionSeparator />

        {/* Two contribution charts side by side - horizontal bars with avatars */}
        <section className="relative w-full bg-slate-950/30" id="contributions">
          <PageHeader
            title="All-Time Contributions"
            description="Editors and reviewers ranked by review activity. Horizontal bars with avatars; download CSV or copy data."
            sectionId="contributions"
            className="bg-slate-950/30"
          />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <HorizontalContributionChart
                  title="Editors"
                  timeLabel={timeLabel}
                  data={filteredEditorsLeaderboard}
                  loading={loading}
                  onDownloadCSV={downloadDetailedEditorsCSV}
                  titleColor="text-cyan-300"
                />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                <HorizontalContributionChart
                  title="Reviewers"
                  timeLabel={timeLabel}
                  data={filteredReviewersLeaderboard}
                  loading={loading}
                  onDownloadCSV={downloadDetailedReviewersCSV}
                  titleColor="text-emerald-300"
                />
              </motion.div>
            </div>
          </div>
        </section>

        <SectionSeparator />

        {/* Governance leaderboard by category */}
        <section className="relative w-full bg-slate-950/30" id="governance">
          <PageHeader
            title="Governance Leaderboard by Category"
            description="Editors and reviewers who contribute to each EIP category. Sourced from PR reviews linked to EIPs and their current category (governance, core, ERC, networking, interface, meta, informational)."
            sectionId="governance"
            className="bg-slate-950/30"
          />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8">
            <div className="rounded-xl border border-cyan-400/20 bg-slate-950/50 overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
                {filteredByCategory.map(({ category, actors }) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-4"
                  >
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-3">
                      {category === 'erc' ? 'ERC' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </h4>
                    <ul className="space-y-2">
                      {actors.length ? (
                        actors.slice(0, 12).map((actor) => (
                          <li key={actor} className="flex items-center gap-2 text-sm text-slate-200">
                            <Avatar name={actor} size={5} />
                            <span className="truncate">{actor}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-slate-500">—</li>
                      )}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <SectionSeparator />

        {/* Editors Repository Distribution */}
        <section className="relative w-full bg-slate-950/30" id="editors-repo-dist">
          <PageHeader
            title="Editors Repository Distribution"
            description="All editors with review activity in the selected period. Each card shows total reviews and breakdown by repository (EIPs, ERCs, RIPs) with counts and percentages."
            sectionId="editors-repo-dist"
            className="bg-slate-950/30"
          />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8">
            <div className="rounded-xl border border-cyan-400/20 bg-slate-950/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-cyan-400/10">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-cyan-400" />
                  Editors Repository Distribution
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Everyone with role = editor in contributor_activity. Each card: total reviews and EIPs / ERCs / RIPs count and %</p>
              </div>
              <div className="p-6">
                <RepoDistributionCards
                  distribution={filteredEditorsRepoDistribution}
                  title="Editors"
                  accent="cyan"
                  loading={loading}
                />
              </div>
            </div>
          </div>
        </section>

        <SectionSeparator />

        {/* Reviewers Repository Distribution */}
        <section className="relative w-full bg-slate-950/30" id="reviewers-repo-dist">
          <PageHeader
            title="Reviewers Repository Distribution"
            description="All reviewers with review activity in the selected period. Each card shows total reviews and breakdown by repository (EIPs, ERCs, RIPs) with counts and percentages."
            sectionId="reviewers-repo-dist"
            className="bg-slate-950/30"
          />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8">
            <div className="rounded-xl border border-emerald-400/20 bg-slate-950/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-emerald-400/10">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                  Reviewers Repository Distribution
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Everyone with role = reviewer or review activity (non-editor). Each card: total reviews and EIPs / ERCs / RIPs count and %</p>
              </div>
              <div className="p-6">
                <RepoDistributionCards
                  distribution={filteredReviewersRepoDistribution}
                  title="Reviewers"
                  accent="emerald"
                  loading={loading}
                />
              </div>
            </div>
          </div>
        </section>

        <SectionSeparator />

        {/* Monthly trend */}
        <section className="relative w-full bg-slate-950/30" id="trend">
          <PageHeader
            title="Monthly Review Trend"
            description="Reviews per month over time. Reflects selected repo and time range."
            sectionId="trend"
            className="bg-slate-950/30"
          />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8">
            <div className="rounded-xl border border-cyan-400/20 bg-slate-950/50 p-4">
              <div className="h-[320px]">
                <ReactECharts option={monthlyTrendOption} style={{ width: '100%', height: '100%' }} opts={{ renderer: 'svg' }} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
