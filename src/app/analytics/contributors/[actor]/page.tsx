'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader, SectionSeparator } from '@/components/header';
import { client } from '@/lib/orpc';
import { Loader2, ArrowLeft, User, Activity, BarChart3, Download } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function ContributorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const actor = typeof params.actor === 'string' ? decodeURIComponent(params.actor) : '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{
    actor: string;
    totalActivities: number;
    byRepo: Array<{ repo: string; count: number }>;
    recentActivities: Array<{ actionType: string; prNumber: number; repo: string | null; occurredAt: string }>;
  } | null>(null);

  useEffect(() => {
    if (!actor) return;
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const data = await client.analytics.getContributorProfile({ actor, limit: 100 });
        setProfile(data);
      } catch (err) {
        console.error('Failed to fetch contributor profile:', err);
        setError('Failed to load contributor profile');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [actor]);

  const downloadCSV = () => {
    if (!profile) return;
    const headers = ['actionType', 'prNumber', 'repo', 'occurredAt'];
    const rows = profile.recentActivities.map((a) => [a.actionType, a.prNumber, a.repo ?? '', a.occurredAt].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contributor-${actor}-activity-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!actor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-slate-400">Missing actor</p>
      </div>
    );
  }

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">{error ?? 'Not found'}</p>
          <Link href="/analytics/contributors" className="mt-4 inline-flex items-center gap-2 text-cyan-400 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Contributors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background relative w-full overflow-hidden min-h-screen">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(52,211,153,0.15),_transparent_50%),_radial-gradient(ellipse_at_bottom_right,_rgba(6,182,212,0.12),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="relative z-10">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 pb-2">
          <Link href="/analytics/contributors" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-300 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Contributors
          </Link>
        </div>

        <PageHeader
          title={profile.actor}
          description="Per-contributor profile: KPIs, repository distribution, activity timeline"
          sectionId="profile"
          className="bg-background/80 backdrop-blur-xl"
        />

        <SectionSeparator />

        <section className="relative w-full bg-slate-950/30">
          <PageHeader title="Personal KPIs" sectionId="kpis" className="bg-slate-950/30" />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-cyan-400/20 bg-slate-950/50 p-4">
                <div className="flex items-center gap-2 mb-2"><Activity className="h-4 w-4 text-cyan-400" /><span className="text-xs text-slate-400">Total Activities</span></div>
                <p className="text-2xl font-bold text-white">{profile.totalActivities}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-lg border border-cyan-400/20 bg-slate-950/50 p-4">
                <div className="flex items-center gap-2 mb-2"><BarChart3 className="h-4 w-4 text-emerald-400" /><span className="text-xs text-slate-400">Repositories</span></div>
                <p className="text-2xl font-bold text-white">{profile.byRepo.length}</p>
              </motion.div>
            </div>
          </div>
        </section>

        <SectionSeparator />

        <section className="relative w-full bg-slate-950/30">
          <PageHeader title="Repository Distribution" sectionId="by-repo" className="bg-slate-950/30" />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6">
            <div className="rounded-lg border border-cyan-400/20 bg-slate-950/50 p-4">
              <div className="flex flex-wrap gap-3">
                {profile.byRepo.map((r) => (
                  <div key={r.repo} className="rounded-lg bg-slate-900/50 px-4 py-2 flex items-center justify-between gap-4 min-w-[160px]">
                    <span className="text-sm text-slate-300 truncate">{r.repo}</span>
                    <span className="text-lg font-bold text-cyan-300">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <SectionSeparator />

        <section className="relative w-full bg-slate-950/30">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 pb-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <PageHeader title="Activity Timeline" description="Event-level feed" sectionId="timeline" className="bg-transparent p-0" />
              <button onClick={downloadCSV} className="flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-cyan-300">
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            </div>
            <div className="rounded-lg border border-cyan-400/20 bg-slate-950/50 divide-y divide-slate-800/50 max-h-[400px] overflow-y-auto">
              {profile.recentActivities.map((a, i) => (
                <div key={`${a.occurredAt}-${a.prNumber}-${i}`} className="flex items-center justify-between gap-4 py-2 px-4 text-sm">
                  <span className="text-cyan-300 font-medium">{a.actionType}</span>
                  <span className="text-slate-500">PR #{a.prNumber}</span>
                  <span className="text-slate-500">{a.repo ?? '—'}</span>
                  <span className="text-slate-500 text-xs">{new Date(a.occurredAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
