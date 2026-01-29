'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, SectionSeparator } from '@/components/header';
import { client } from '@/lib/orpc';
import { Loader2, UserCheck, BarChart3, Download } from 'lucide-react';
import { motion } from 'motion/react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

export default function EditorsAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<Array<{ actor: string; totalReviews: number; prsTouched: number; medianResponseDays: number | null }>>([]);
  const [repoDistribution, setRepoDistribution] = useState<Array<{ actor: string; repo: string; count: number; pct: number }>>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<Array<{ month: string; count: number }>>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const [lb, dist, trend] = await Promise.all([
          client.analytics.getEditorsLeaderboard({ limit: 30 }),
          client.analytics.getEditorsRepoDistribution({}),
          client.analytics.getMonthlyReviewTrend({ from: '2015-01-01' }),
        ]);
        setLeaderboard(lb);
        setRepoDistribution(dist);
        setMonthlyTrend(trend);
      } catch (err) {
        console.error('Failed to fetch editors analytics:', err);
        setError('Failed to load editors analytics');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const downloadLeaderboardCSV = () => {
    const headers = ['actor', 'totalReviews', 'prsTouched', 'medianResponseDays'];
    const rows = leaderboard.map((r) => [r.actor, r.totalReviews, r.prsTouched, r.medianResponseDays ?? ''].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `editors-leaderboard-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && leaderboard.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' as const },
    grid: { left: '8%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category' as const,
      data: monthlyTrend.map((d) => d.month),
      axisLabel: { color: '#94a3b8', fontSize: 10 },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.08)' } },
    },
    series: [
      {
        name: 'Reviews',
        type: 'line' as const,
        data: monthlyTrend.map((d) => d.count),
        smooth: true,
        lineStyle: { color: '#06B6D4', width: 2 },
        itemStyle: { color: '#06B6D4' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(6,182,212,0.3)' }, { offset: 1, color: 'rgba(6,182,212,0)' }]) },
      },
    ],
  };

  const actorsWithDist = [...new Set(repoDistribution.map((d) => d.actor))].slice(0, 15);
  const distByActor = actorsWithDist.map((actor) => {
    const rows = repoDistribution.filter((d) => d.actor === actor);
    return { actor, rows };
  });

  return (
    <div className="bg-background relative w-full overflow-hidden min-h-screen">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(52,211,153,0.15),_transparent_50%),_radial-gradient(ellipse_at_bottom_right,_rgba(6,182,212,0.12),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="relative z-10">
        <PageHeader
          title="Editors & Reviewers Analytics"
          description="Editorial throughput, load balancing, and review quality. Event-sourced from contributor_activity."
          sectionId="editors"
          className="bg-background/80 backdrop-blur-xl"
        />

        <SectionSeparator />

        <section className="relative w-full bg-slate-950/30">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 pb-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <PageHeader title="Editors & Reviewers Leaderboard" description="Total reviews, PRs touched, median response time" sectionId="leaderboard" className="bg-transparent p-0" />
              <button onClick={downloadLeaderboardCSV} className="flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-cyan-300">
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            </div>
            <div className="rounded-lg border border-cyan-400/20 bg-slate-950/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cyan-400/20 bg-slate-900/50">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">#</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Actor</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Total reviews</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">PRs touched</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Median response (days)</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((r, i) => (
                    <tr key={r.actor} className="border-b border-slate-800/50 hover:bg-slate-900/30">
                      <td className="py-2 px-4 text-slate-500">{i + 1}</td>
                      <td className="py-2 px-4 text-cyan-300 font-medium">{r.actor}</td>
                      <td className="py-2 px-4 text-right text-white">{r.totalReviews.toLocaleString()}</td>
                      <td className="py-2 px-4 text-right text-slate-300">{r.prsTouched.toLocaleString()}</td>
                      <td className="py-2 px-4 text-right text-slate-300">{r.medianResponseDays ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <SectionSeparator />

        <section className="relative w-full bg-slate-950/30">
          <PageHeader title="Monthly Review Trend" description="PRs reviewed per month since 2015" sectionId="trend" className="bg-slate-950/30" />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6">
            <div className="rounded-lg border border-cyan-400/20 bg-slate-950/50 p-4">
              <div className="h-[320px]">
                <ReactECharts option={chartOption} style={{ width: '100%', height: '100%' }} opts={{ renderer: 'svg' }} />
              </div>
            </div>
          </div>
        </section>

        <SectionSeparator />

        <section className="relative w-full bg-slate-950/30">
          <PageHeader title="Repository Distribution" description="% of reviews per editor by repo" sectionId="repo-dist" className="bg-slate-950/30" />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6">
            <div className="space-y-4">
              {distByActor.map(({ actor, rows }) => (
                <motion.div key={actor} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-cyan-400/20 bg-slate-950/50 p-4">
                  <p className="text-sm font-medium text-cyan-300 mb-2">{actor}</p>
                  <div className="flex flex-wrap gap-2">
                    {rows.map((r) => (
                      <span
                        key={`${actor}-${r.repo}`}
                        className="rounded-md bg-slate-800/50 px-2.5 py-1 text-xs text-slate-300"
                        title={`${r.count} (${r.pct}%)`}
                      >
                        {r.repo} {r.pct}%
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
