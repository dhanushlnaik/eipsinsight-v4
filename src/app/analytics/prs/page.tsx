"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAnalytics } from "../layout";
import { client } from "@/lib/orpc";
import {
  Loader2,
  GitPullRequest,
  ArrowUpRight,
  AlertCircle,
  Clock,
  Tag,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PRMonthlyPoint {
  month: string;
  created: number;
  merged: number;
  closed: number;
  openAtMonthEnd: number;
}

interface PRMonthHero {
  month: string;
  openPRs: number;
  newPRs: number;
  mergedPRs: number;
  closedUnmerged: number;
  netDelta: number;
}

interface OpenStateSummary {
  totalOpen: number;
  medianAge: number;
  oldestPR: {
    pr_number: number;
    title: string;
    author: string;
    age_days: number;
    repo: string;
  } | null;
}

interface GovernanceState {
  state: string;
  label: string;
  count: number;
}

interface LabelStat {
  label: string;
  count: number;
}

interface LifecycleStage {
  stage: string;
  count: number;
  percentage: number;
}

interface TimeToOutcomeMetric {
  metric: string;
  medianDays: number;
  p75Days: number;
  p90Days: number;
}

interface StalenessBucket {
  bucket: string;
  count: number;
}

interface OpenPRRow {
  prNumber: number;
  repo: string;
  title: string | null;
  author: string | null;
  createdAt: string;
  governanceState: string;
  waitingSince: string | null;
  lastEventType: string | null;
  linkedEIPs: string | null;
}

type TimeRange = "7d" | "30d" | "90d" | "1y" | "all" | "custom";

function getMonthWindow(range: TimeRange): { from?: string; to?: string } {
  const now = new Date();
  const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  if (range === "all") {
    // No from/to limits -> full history
    return { from: undefined, to: undefined };
  }

  const monthsBack =
    range === "7d" ? 1 : range === "30d" ? 3 : range === "90d" ? 6 : 12;

  const fromDate = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);
  const from = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(
    2,
    "0",
  )}`;

  return { from, to };
}

const governanceColors: Record<string, string> = {
  WAITING_ON_EDITOR: "#60a5fa",
  WAITING_ON_AUTHOR: "#f97316",
  STALLED: "#f97373",
  DRAFT: "#a855f7",
  NO_STATE: "#64748b",
};

const stalenessColors: Record<string, string> = {
  "0-7 days": "#22c55e",
  "7-30 days": "#eab308",
  "30-90 days": "#f97316",
  "90+ days": "#ef4444",
};

export default function PRsAnalyticsPage() {
  const { timeRange, repoFilter } = useAnalytics();
  const [loading, setLoading] = useState(true);

  const [monthlySeries, setMonthlySeries] = useState<PRMonthlyPoint[]>([]);
  const [heroMonth, setHeroMonth] = useState<PRMonthHero | null>(null);
  const [openSummary, setOpenSummary] = useState<OpenStateSummary | null>(null);
  const [governanceStates, setGovernanceStates] = useState<GovernanceState[]>([]);
  const [labelStats, setLabelStats] = useState<LabelStat[]>([]);
  const [lifecycleStages, setLifecycleStages] = useState<LifecycleStage[]>([]);
  const [timeToOutcome, setTimeToOutcome] = useState<TimeToOutcomeMetric[]>([]);
  const [staleness, setStaleness] = useState<StalenessBucket[]>([]);
  const [openPRs, setOpenPRs] = useState<OpenPRRow[]>([]);

  const repoParam = repoFilter === "all" ? undefined : repoFilter;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { from, to } = getMonthWindow(timeRange as TimeRange);
        const now = new Date();

        // Batch 1: Critical data (Hero KPIs and open state)
        const [openState, hero] = await Promise.all([
          client.analytics.getPROpenState({ repo: repoParam }),
          client.analytics.getPRMonthHeroKPIs({
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            repo: repoParam,
          }),
        ]);

        setOpenSummary(openState);
        setHeroMonth(hero);

        // Batch 2: Charts and visualizations
        const [monthly, govStates, labels, lifecycle] = await Promise.all([
          client.analytics.getPRMonthlyActivity({
            repo: repoParam,
            from,
            to,
          }),
          client.analytics.getPRGovernanceStates({ repo: repoParam }),
          client.analytics.getPRLabels({ repo: repoParam }),
          client.analytics.getPRLifecycleFunnel({}),
        ]);

        setMonthlySeries(monthly);
        setGovernanceStates(govStates);
        setLabelStats(labels.slice(0, 20));
        setLifecycleStages(lifecycle);

        // Batch 3: Heavy queries (load sequentially to avoid connection exhaustion)
        const tto = await client.analytics.getPRTimeToOutcome({ repo: repoParam });
        setTimeToOutcome(tto);

        const stale = await client.analytics.getPRStaleness({ repo: repoParam });
        setStaleness(stale);

        // Batch 4: Export data (load last, can be deferred)
        const openExport = await client.analytics.getPROpenExport({ repo: repoParam });
        setOpenPRs(openExport.slice(0, 50));
      } catch (err) {
        console.error("Failed to fetch PR analytics:", err);
        // Set empty states on error
        setMonthlySeries([]);
        setHeroMonth(null);
        setOpenSummary(null);
        setGovernanceStates([]);
        setLabelStats([]);
        setLifecycleStages([]);
        setTimeToOutcome([]);
        setStaleness([]);
        setOpenPRs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, repoFilter, repoParam]);

  const totalOpen = openSummary?.totalOpen ?? 0;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Open PRs</p>
              <p className="mt-1 text-3xl font-semibold text-white">
                {totalOpen.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Median age:{" "}
                {openSummary?.medianAge != null ? `${openSummary.medianAge} days` : "–"}
              </p>
            </div>
            <div className="rounded-full bg-cyan-500/20 p-3">
              <GitPullRequest className="h-6 w-6 text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5 backdrop-blur-sm">
          <p className="text-sm text-slate-400">
            Created this month ({heroMonth?.month ?? ""})
          </p>
          <p className="mt-1 text-3xl font-semibold text-white">
            {heroMonth?.newPRs.toLocaleString() ?? "0"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Net delta:{" "}
            <span
              className={cn(
                "font-medium",
                (heroMonth?.netDelta ?? 0) > 0
                  ? "text-emerald-400"
                  : (heroMonth?.netDelta ?? 0) < 0
                    ? "text-rose-400"
                    : "text-slate-400",
              )}
            >
              {(heroMonth?.netDelta ?? 0) >= 0 ? "+" : ""}
              {heroMonth?.netDelta ?? 0}
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5 backdrop-blur-sm">
          <p className="text-sm text-slate-400">Merged this month</p>
          <p className="mt-1 text-3xl font-semibold text-emerald-400">
            {heroMonth?.mergedPRs.toLocaleString() ?? "0"}
          </p>
          <p className="mt-1 text-xs text-slate-500">Includes all repos in scope</p>
        </div>

        <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5 backdrop-blur-sm">
          <p className="text-sm text-slate-400">Closed (unmerged)</p>
          <p className="mt-1 text-3xl font-semibold text-slate-200">
            {heroMonth?.closedUnmerged.toLocaleString() ?? "0"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Closed without merge during this month
          </p>
        </div>
      </div>

      {/* Monthly Activity + Governance Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-700/60 bg-slate-900/50 p-5 backdrop-blur-sm">
          <h2 className="mb-4 text-lg font-semibold text-white">Monthly Activity</h2>
          <ChartContainer
            config={{
              created: { label: "Created", color: "#60a5fa" },
              merged: { label: "Merged", color: "#22c55e" },
              closed: { label: "Closed", color: "#f97316" },
              openAtMonthEnd: { label: "Open (EOM)", color: "#e5e7eb" },
            }}
            className="h-72 w-full"
          >
            <ResponsiveContainer>
              <LineChart data={monthlySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="created"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="merged"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="closed"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="openAtMonthEnd"
                  stroke="#e5e7eb"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5 backdrop-blur-sm">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Governance State Distribution
          </h2>
          <div className="space-y-3">
            {governanceStates.map((g) => {
              const total = governanceStates.reduce((acc, s) => acc + s.count, 0);
              const pct = total > 0 ? (g.count / total) * 100 : 0;
              return (
                <div key={g.state}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-300">{g.label}</span>
                    <span className="text-slate-400">
                      {g.count.toLocaleString()} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: governanceColors[g.state] ?? "#64748b",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Labels + Lifecycle Funnel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5 backdrop-blur-sm">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Label Distribution (Open PRs)
          </h2>
          <div className="space-y-2">
            {labelStats.map((l) => (
              <div key={l.label} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-slate-800">
                    <Tag className="h-3 w-3 text-slate-300" />
                  </div>
                  <span className="max-w-[160px] truncate text-sm text-slate-200">
                    {l.label}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {l.count.toLocaleString()}
                </span>
              </div>
            ))}
            {labelStats.length === 0 && (
              <p className="text-sm text-slate-500">No labels found for open PRs.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5 backdrop-blur-sm">
          <h2 className="mb-4 text-lg font-semibold text-white">Lifecycle Funnel</h2>
          <ChartContainer
            config={{
              count: { label: "PRs", color: "#22c55e" },
            }}
            className="h-64 w-full"
          >
            <ResponsiveContainer>
              <BarChart data={lifecycleStages}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="stage" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <RechartsTooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {lifecycleStages.map((s) => (
                    <Bar
                      key={s.stage}
                      dataKey="count"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      {/* Time to Outcome + Staleness */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5 backdrop-blur-sm">
          <h2 className="mb-4 text-lg font-semibold text-white">Time to Outcome</h2>
          <div className="space-y-3">
            {timeToOutcome.map((m) => (
              <div
                key={m.metric}
                className="flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-900/70 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium capitalize text-slate-100">
                    {m.metric.replace("_", " ")}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-slate-300">
                  <span>p50: {m.medianDays}d</span>
                  <span>p75: {m.p75Days}d</span>
                  <span>p90: {m.p90Days}d</span>
                </div>
              </div>
            ))}
            {timeToOutcome.length === 0 && (
              <p className="text-sm text-slate-500">
                Not enough data to compute time to outcome metrics.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5 backdrop-blur-sm">
          <h2 className="mb-4 text-lg font-semibold text-white">Staleness Buckets</h2>
          <div className="grid grid-cols-2 gap-3">
            {staleness.map((b) => (
              <div
                key={b.bucket}
                className="rounded-lg border border-slate-700/70 bg-slate-900/80 p-3"
              >
                <p className="text-xs text-slate-400">{b.bucket}</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {b.count.toLocaleString()}
                </p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (b.count /
                          Math.max(...staleness.map((s) => s.count), 1)) *
                          100,
                      )}%`,
                      backgroundColor: stalenessColors[b.bucket] ?? "#64748b",
                    }}
                  />
                </div>
              </div>
            ))}
            {staleness.length === 0 && (
              <p className="col-span-2 text-sm text-slate-500">
                No open PRs in the current scope.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Open PRs Table */}
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Open PRs</h2>
            <p className="text-xs text-slate-500">
              Snapshot of currently open pull requests in the selected repositories.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-medium text-slate-400">
                <th className="py-2 pr-4">PR</th>
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Repo</th>
                <th className="py-2 pr-4">Author</th>
                <th className="py-2 pr-4">Governance</th>
                <th className="py-2 pr-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {openPRs.map((pr) => {
                const [org, repoName] = pr.repo.split("/");
                const url = `https://github.com/${org}/${repoName}/pull/${pr.prNumber}`;
                return (
                  <tr
                    key={`${pr.repo}-${pr.prNumber}`}
                    className="border-b border-slate-800/60 text-xs last:border-0 hover:bg-slate-800/40"
                  >
                    <td className="py-2 pr-4">
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                      >
                        #{pr.prNumber}
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="py-2 pr-4 text-slate-200">
                      {pr.title || <span className="text-slate-500">No title</span>}
                    </td>
                    <td className="py-2 pr-4 text-slate-400">{repoName}</td>
                    <td className="py-2 pr-4 text-slate-300">
                      {pr.author || <span className="text-slate-500">Unknown</span>}
                    </td>
                    <td className="py-2 pr-4">
                      <span className="inline-flex items-center rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                        {pr.governanceState || "NO_STATE"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-slate-400">{pr.createdAt}</td>
                  </tr>
                );
              })}
              {openPRs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-sm text-slate-500"
                  >
                    No open PRs found for the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {openSummary?.oldestPR && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              Oldest open PR:{" "}
              <span className="font-semibold">
                {openSummary.oldestPR.repo}#{openSummary.oldestPR.pr_number}
              </span>{" "}
              by {openSummary.oldestPR.author} — open for{" "}
              {openSummary.oldestPR.age_days} days.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

