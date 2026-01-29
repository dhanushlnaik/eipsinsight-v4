'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, SectionSeparator } from '@/components/header';
import { client } from '@/lib/orpc';
import { Loader2 } from 'lucide-react';
import { PRVolumeChart } from '@/app/analytics/pr/_components/pr-volume-chart';
import { PROpenStateSnapshot } from '@/app/analytics/pr/_components/pr-open-state-snapshot';
import { PRLifecycleFunnel } from '@/app/analytics/pr/_components/pr-lifecycle-funnel';
import { PRTimeToOutcome } from '@/app/analytics/pr/_components/pr-time-to-outcome';
import { PRStalenessSection } from '@/app/analytics/pr/_components/pr-staleness-section';
import { PRHeroKPIs } from './_components/pr-hero-kpis';
import { PRClassificationDonut } from './_components/pr-classification-donut';
import { PRGovernanceWaiting } from './_components/pr-governance-waiting';

type RepoFilter = 'eips' | 'ercs' | 'rips' | undefined;

function getDefaultMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export default function PRAnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const yearParam = searchParams.get('year');
  const monthParam = searchParams.get('month');
  const [year, setYear] = useState(() => (yearParam ? parseInt(yearParam, 10) : getDefaultMonth().year));
  const [month, setMonth] = useState(() => (monthParam ? parseInt(monthParam, 10) : getDefaultMonth().month));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<RepoFilter>('eips');
  const [heroKPIs, setHeroKPIs] = useState<{
    month: string;
    openPRs: number;
    newPRs: number;
    mergedPRs: number;
    closedUnmerged: number;
    netDelta: number;
  } | null>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [openState, setOpenState] = useState<any>(null);
  const [governanceStates, setGovernanceStates] = useState<any[]>([]);
  const [governanceWaiting, setGovernanceWaiting] = useState<any[]>([]);
  const [classification, setClassification] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [lifecycleData, setLifecycleData] = useState<any[]>([]);
  const [timeToOutcome, setTimeToOutcome] = useState<any[]>([]);
  const [stalenessData, setStalenessData] = useState<any[]>([]);
  const [highRiskPRs, setHighRiskPRs] = useState<any[]>([]);
  const [openExport, setOpenExport] = useState<any[]>([]);

  useEffect(() => {
    const y = yearParam ? parseInt(yearParam, 10) : getDefaultMonth().year;
    const m = monthParam ? parseInt(monthParam, 10) : getDefaultMonth().month;
    if (!isNaN(y)) setYear(y);
    if (!isNaN(m) && m >= 1 && m <= 12) setMonth(m);
  }, [yearParam, monthParam]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const apiParams = selectedRepo ? { repo: selectedRepo } : {};
        const monthStr = `${year}-${String(month).padStart(2, '0')}`;

        const [
          kpis,
          monthly,
          openStateData,
          governance,
          govWaiting,
          classificationData,
          labelsData,
          lifecycle,
          timeData,
          staleness,
          highRisk,
          exportData,
        ] = await Promise.all([
          client.analytics.getPRMonthHeroKPIs({ year, month, ...apiParams }),
          client.analytics.getPRMonthlyActivity({ from: '2015-01', to: monthStr, ...apiParams }),
          client.analytics.getPROpenState(apiParams),
          client.analytics.getPRGovernanceStates(apiParams),
          client.analytics.getPRGovernanceWaitingState(apiParams),
          client.analytics.getPROpenClassification(apiParams),
          client.analytics.getPRLabels(apiParams),
          client.analytics.getPRLifecycleFunnel({}),
          client.analytics.getPRTimeToOutcome(apiParams),
          client.analytics.getPRStaleness(apiParams),
          client.analytics.getPRStaleHighRisk({ days: 30, ...apiParams }),
          client.analytics.getPROpenExport(apiParams),
        ]);

        setHeroKPIs(kpis);
        setMonthlyData(monthly);
        setOpenState(openStateData);
        setGovernanceStates(governance);
        setGovernanceWaiting(govWaiting);
        setClassification(classificationData);
        setLabels(labelsData);
        setLifecycleData(lifecycle);
        setTimeToOutcome(timeData);
        setStalenessData(staleness);
        setHighRiskPRs(highRisk);
        setOpenExport(exportData);
      } catch (err) {
        console.error('Failed to fetch PR analytics:', err);
        setError('Failed to load PR analytics data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedRepo, year, month]);

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
    router.push(`/analytics/prs?year=${newYear}&month=${newMonth}`);
  };

  const downloadOpenCSV = () => {
    if (openExport.length === 0) return;
    const headers = ['prNumber', 'repo', 'title', 'author', 'createdAt', 'governanceState', 'waitingSince', 'lastEventType', 'linkedEIPs'];
    const rows = openExport.map((r) => [
      r.prNumber,
      r.repo,
      (r.title ?? '').replace(/"/g, '""'),
      r.author ?? '',
      r.createdAt,
      r.governanceState,
      r.waitingSince ?? '',
      r.lastEventType ?? '',
      r.linkedEIPs ?? '',
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pr-open-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadOpenJSON = () => {
    const blob = new Blob([JSON.stringify(openExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pr-open-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadClassificationCSV = () => {
    const csv = ['category,count\n' + classification.map((r) => `${r.category},${r.count}`).join('\n')];
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pr-classification-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadClassificationJSON = () => {
    const blob = new Blob([JSON.stringify(classification, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pr-classification-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !heroKPIs) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const monthOptions: { year: number; month: number; label: string }[] = [];
  for (let i = 0; i < 24; i++) {
    const m = currentMonth - i;
    let y = currentYear;
    let mo = m;
    if (m <= 0) {
      mo = m + 12;
      y = currentYear - 1;
    }
    monthOptions.push({
      year: y,
      month: mo,
      label: new Date(y, mo - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    });
  }

  return (
    <div className="bg-background relative w-full overflow-hidden min-h-screen">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(52,211,153,0.15),_transparent_50%),_radial-gradient(ellipse_at_bottom_right,_rgba(6,182,212,0.12),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="absolute top-0 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-cyan-400/10 via-emerald-400/5 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10">
        <PageHeader
          title="PR Analytics"
          description="Governance throughput, backlog, and friction in PR flow. Time-aware, end-of-period snapshots."
          sectionId="pr-analytics"
          className="bg-background/80 backdrop-blur-xl"
        />

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 pb-2">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <label htmlFor="repo-filter" className="text-sm font-medium text-slate-300">
                Repository:
              </label>
              <select
                id="repo-filter"
                value={selectedRepo || 'all'}
                onChange={(e) => setSelectedRepo(e.target.value === 'all' ? undefined : (e.target.value as RepoFilter))}
                className="rounded-lg border border-cyan-400/20 bg-slate-950/50 backdrop-blur-sm px-3 py-1.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all"
              >
                <option value="all">All Repositories</option>
                <option value="eips">EIPs</option>
                <option value="ercs">ERCs</option>
                <option value="rips">RIPs</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="month-select" className="text-sm font-medium text-slate-300">
                Month:
              </label>
              <select
                id="month-select"
                value={`${year}-${String(month).padStart(2, '0')}`}
                onChange={(e) => {
                  const [y, m] = e.target.value.split('-').map(Number);
                  handleMonthChange(y, m);
                }}
                className="rounded-lg border border-cyan-400/20 bg-slate-950/50 backdrop-blur-sm px-3 py-1.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all"
              >
                {monthOptions.map((opt) => (
                  <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${String(opt.month).padStart(2, '0')}`}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <SectionSeparator />

        <section className="relative w-full bg-slate-950/30">
          <PageHeader
            title="Hero KPIs"
            description={`Snapshot as of end of ${new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
            sectionId="hero-kpis"
            className="bg-slate-950/30"
          />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6">
            <PRHeroKPIs data={heroKPIs} loading={loading} />
          </div>
        </section>

        <SectionSeparator />

        <section className="relative w-full bg-slate-950/30">
          <PageHeader
            title="PR Volume Over Time"
            description={`Monthly PR activity for ${selectedRepo ? selectedRepo.toUpperCase() : 'all repositories'} since 2015`}
            sectionId="pr-volume"
            className="bg-slate-950/30"
          />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6">
            <PRVolumeChart data={monthlyData} />
          </div>
        </section>

        <SectionSeparator />

        <section className="relative w-full bg-slate-950/30">
          <PageHeader
            title="Current Open PR State"
            description="Snapshot of open PRs and their governance states"
            sectionId="open-state"
            className="bg-slate-950/30"
          />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6">
            <PROpenStateSnapshot openState={openState} governanceStates={governanceStates} labels={labels} />
          </div>
        </section>

        <SectionSeparator />

        <section className="relative w-full bg-slate-950/30">
          <PageHeader
            title="Open PR Classification"
            description="DRAFT, TYPO, NEW_EIP, STATUS_CHANGE, OTHER — click to drill down"
            sectionId="classification"
            className="bg-slate-950/30"
          />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6">
            <PRClassificationDonut
              data={classification}
              onDownloadCSV={downloadClassificationCSV}
              onDownloadJSON={downloadClassificationJSON}
            />
          </div>
        </section>

        <SectionSeparator />

        <section className="relative w-full bg-slate-950/30">
          <PageHeader
            title="Governance Waiting State"
            description="Waiting on Editor, Author, Stalled — median wait and oldest PR per bucket"
            sectionId="governance-waiting"
            className="bg-slate-950/30"
          />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6">
            <PRGovernanceWaiting data={governanceWaiting} repoName={selectedRepo ? `ethereum/${selectedRepo.toUpperCase()}` : 'ethereum/EIPs'} />
          </div>
        </section>

        <SectionSeparator />

        <section className="relative w-full bg-slate-950/30">
          <PageHeader
            title="PR Lifecycle & Latency"
            description="Opened → Reviewed → Merged/Closed and time-to-outcome"
            sectionId="lifecycle"
            className="bg-slate-950/30"
          />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PRLifecycleFunnel data={lifecycleData} />
              <PRTimeToOutcome data={timeToOutcome} />
            </div>
          </div>
        </section>

        <SectionSeparator />

        <section className="relative w-full bg-slate-950/30">
          <PageHeader
            title="Staleness & Risk"
            description="PRs that may be abandoned or require attention"
            sectionId="staleness"
            className="bg-slate-950/30"
          />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6">
            <PRStalenessSection stalenessData={stalenessData} highRiskPRs={highRiskPRs} />
          </div>
        </section>

        <SectionSeparator />

        <section className="relative w-full bg-slate-950/30">
          <PageHeader
            title="PR Detail Export"
            description="Download all open PRs with governance state (CSV / JSON)"
            sectionId="export"
            className="bg-slate-950/30"
          />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6">
            <div className="flex gap-3">
              <button
                onClick={downloadOpenCSV}
                disabled={openExport.length === 0}
                className="rounded-lg border border-cyan-400/20 bg-slate-900/50 px-4 py-2 text-sm font-medium text-cyan-300 transition-all hover:border-cyan-400/40 hover:bg-cyan-400/10 disabled:opacity-50"
              >
                Download open PRs (CSV)
              </button>
              <button
                onClick={downloadOpenJSON}
                disabled={openExport.length === 0}
                className="rounded-lg border border-cyan-400/20 bg-slate-900/50 px-4 py-2 text-sm font-medium text-cyan-300 transition-all hover:border-cyan-400/40 hover:bg-cyan-400/10 disabled:opacity-50"
              >
                Download open PRs (JSON)
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
