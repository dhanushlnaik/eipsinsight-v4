"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAnalytics, useAnalyticsExport } from "../analytics-layout-client";
import { client } from "@/lib/orpc";
import { AlertCircle, Download, FileText, Repeat2, Sparkles, Users } from "lucide-react";
import { StatCard, AnalyticsHero } from "@/components/analytics/stat-card";
import { LastUpdated } from "@/components/analytics/LastUpdated";
import ReactECharts from "echarts-for-react";
import { AnalyticsLoader, AnalyticsSectionHeader, ActorAvatar, TablePager } from "../_components/analytics-ui";

interface AuthorKPIs {
  totalAuthors: number;
  newAuthors: number;
  repeatAuthors: number;
  proposalsAuthored: number;
  authorsWithMerged: number;
  prsCreated: number;
  eipsAuthored: number;
}

interface AuthorCohortTimelinePoint {
  month: string;
  activeAuthors: number;
  newAuthors: number;
  returningAuthors: number;
  proposalsAuthored: number;
}

interface AuthorRepoCompositionRow {
  repo: string;
  uniqueAuthors: number;
  repeatAuthors: number;
  proposals: number;
}

interface TopAuthorRow {
  author: string;
  prsCreated: number;
  prsMerged: number;
  prsOpen: number;
  prsClosed: number;
  avgTimeToMerge: number | null;
  firstSeen: string | null;
  lastActivity: string | null;
  topRepo: string | null;
}

function getTimeWindow(
  timeRange: string,
  customFromMonth?: string,
  customToMonth?: string,
): { from: string | undefined; to: string | undefined } {
  if (timeRange === "all") {
    return { from: undefined, to: undefined };
  }
  if (timeRange === "custom") {
    const from = customFromMonth ? `${customFromMonth}-01` : undefined;
    
    let to: string | undefined = undefined;
    if (customToMonth) {
      const [yearStr, monthStr] = customToMonth.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const date = new Date(year, month, 0); // Last day of month
      to = date.toISOString().split("T")[0];
    }
    
    return { from, to };
  }

  const now = new Date();
  const to = now.toISOString().split("T")[0];
  let from: Date;
  switch (timeRange) {
    case "this_month":
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "7d":
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "15d":
      from = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "1y":
      from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      from = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { from: from.toISOString().split("T")[0], to };
}

function getGitHubAvatarUrl(handle: string): string {
  return `https://github.com/${handle}.png?size=80`;
}

function labelRepo(repo: string | null | undefined): string {
  if (!repo) return "Unknown";
  const key = repo.toLowerCase();
  if (key === "eips") return "EIPs";
  if (key === "ercs") return "ERCs";
  if (key === "rips") return "RIPs";
  return repo.toUpperCase();
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AuthorsAnalyticsPage() {
  const { timeRange, repoFilter, customFromMonth, customToMonth } = useAnalytics();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataUpdatedAt, setDataUpdatedAt] = useState<Date>(new Date());

  const [kpis, setKPIs] = useState<AuthorKPIs | null>(null);
  const [cohortTimeline, setCohortTimeline] = useState<AuthorCohortTimelinePoint[]>([]);
  const [repoComposition, setRepoComposition] = useState<AuthorRepoCompositionRow[]>([]);
  const [topAuthors, setTopAuthors] = useState<TopAuthorRow[]>([]);
  const [dirPage, setDirPage] = useState(1);

  const repoParam = repoFilter === "all" ? undefined : repoFilter;
  const { from, to } = getTimeWindow(timeRange, customFromMonth, customToMonth);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const months = timeRange === "all" ? undefined : (timeRange === "7d" || timeRange === "15d") ? 3 : timeRange === "30d" ? 6 : timeRange === "90d" ? 12 : 24;

        const [kpisData, cohortData, repoData, topData] = await Promise.all([
          client.analytics.getAuthorKPIs({
            repo: repoParam,
            from,
            to,
          }),
          client.analytics.getAuthorCohortTimeline({
            repo: repoParam,
            from,
            to,
            months,
          }),
          client.analytics.getAuthorRepoComposition({
            repo: repoParam,
            from,
            to,
          }),
          client.analytics.getTopAuthors({
            repo: repoParam,
            from,
            to,
            limit: 50,
          }),
        ]);

        setKPIs(kpisData);
        setCohortTimeline(cohortData);
        setRepoComposition(repoData);
        setTopAuthors(topData);
        setDataUpdatedAt(new Date());
      } catch (fetchError) {
        console.error("Failed to fetch author analytics:", fetchError);
        setError("Failed to load author analytics. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, repoFilter, repoParam, from, to]);

  const topAuthorCards = useMemo(() => topAuthors.slice(0, 6), [topAuthors]);
  const oneTimeAuthors = useMemo(() => Math.max(0, (kpis?.totalAuthors ?? 0) - (kpis?.repeatAuthors ?? 0)), [kpis]);
  const concentrationTop10Pct = useMemo(() => {
    if (!kpis?.proposalsAuthored || kpis.proposalsAuthored === 0) return 0;
    const top10Total = topAuthors.slice(0, 10).reduce((sum, row) => sum + row.prsCreated, 0);
    return (top10Total / kpis.proposalsAuthored) * 100;
  }, [kpis, topAuthors]);

  const outcomeRows = useMemo(() => topAuthors.slice(0, 10), [topAuthors]);

  const cohortTrendOption = useMemo(() => ({
    backgroundColor: "transparent",
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: {
      top: 0,
      textStyle: { color: "var(--muted-foreground)", fontSize: 11 },
    },
    grid: { top: 36, left: 28, right: 20, bottom: 28 },
    xAxis: {
      type: "category",
      data: cohortTimeline.map((row) => row.month),
      axisLabel: { color: "var(--muted-foreground)", fontSize: 11 },
      axisLine: { lineStyle: { color: "rgba(148,163,184,0.25)" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "var(--muted-foreground)", fontSize: 11 },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.15)", type: "dashed" } },
    },
    series: [
      {
        name: "New Authors",
        type: "bar",
        stack: "authors",
        itemStyle: { color: "#22d3ee", borderRadius: [4, 4, 0, 0] },
        data: cohortTimeline.map((row) => row.newAuthors),
      },
      {
        name: "Returning Authors",
        type: "bar",
        stack: "authors",
        itemStyle: { color: "#60a5fa", borderRadius: [4, 4, 0, 0] },
        data: cohortTimeline.map((row) => row.returningAuthors),
      },
      {
        name: "Proposals Authored",
        type: "line",
        smooth: true,
        symbol: "none",
        lineStyle: { color: "#fbbf24", width: 2 },
        data: cohortTimeline.map((row) => row.proposalsAuthored),
      },
    ],
  }), [cohortTimeline]);

  const repoCompositionOption = useMemo(() => ({
    backgroundColor: "transparent",
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: {
      top: 0,
      textStyle: { color: "var(--muted-foreground)", fontSize: 11 },
    },
    grid: { top: 36, left: 28, right: 20, bottom: 28 },
    xAxis: {
      type: "category",
      data: repoComposition.map((row) => labelRepo(row.repo)),
      axisLabel: { color: "var(--muted-foreground)", fontSize: 11 },
      axisLine: { lineStyle: { color: "rgba(148,163,184,0.25)" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "var(--muted-foreground)", fontSize: 11 },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.15)", type: "dashed" } },
    },
    series: [
      {
        name: "Unique Authors",
        type: "bar",
        itemStyle: { color: "#22d3ee", borderRadius: [4, 4, 0, 0] },
        data: repoComposition.map((row) => row.uniqueAuthors),
      },
      {
        name: "Repeat Authors",
        type: "bar",
        itemStyle: { color: "#10b981", borderRadius: [4, 4, 0, 0] },
        data: repoComposition.map((row) => row.repeatAuthors),
      },
    ],
  }), [repoComposition]);

  const downloadCohortReport = useCallback(() => {
    const headers = ["Month", "Active Authors", "New Authors", "Returning Authors", "Proposals Authored"];
    const rows = cohortTimeline.map((row) => [row.month, row.activeAuthors, row.newAuthors, row.returningAuthors, row.proposalsAuthored]);
    downloadCsv(`authors-cohort-timeline-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  }, [cohortTimeline]);

  const downloadRepoCompositionReport = useCallback(() => {
    const headers = ["Repository", "Unique Authors", "Repeat Authors", "Proposals"];
    const rows = repoComposition.map((row) => [labelRepo(row.repo), row.uniqueAuthors, row.repeatAuthors, row.proposals]);
    downloadCsv(`authors-repo-composition-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  }, [repoComposition]);

  const downloadOutcomesReport = useCallback(() => {
    const headers = ["Author", "Proposals Authored", "Merged", "Open", "Closed (Unmerged)", "Median Time to Merge (days)", "First Seen", "Last Activity", "Top Repo"];
    const rows = topAuthors.map((row) => [
      row.author,
      row.prsCreated,
      row.prsMerged,
      row.prsOpen,
      row.prsClosed,
      row.avgTimeToMerge ?? "",
      row.firstSeen ?? "",
      row.lastActivity ?? "",
      labelRepo(row.topRepo),
    ]);
    downloadCsv(`authors-directory-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  }, [topAuthors]);

  useAnalyticsExport(() => {
    const combined: Record<string, unknown>[] = [];

    if (kpis) {
      combined.push({
        type: "KPIs",
        totalAuthors: kpis.totalAuthors,
        newAuthors: kpis.newAuthors,
        repeatAuthors: kpis.repeatAuthors,
        proposalsAuthored: kpis.proposalsAuthored,
        authorsWithMerged: kpis.authorsWithMerged,
      });
    }

    cohortTimeline.forEach((row) => {
      combined.push({
        type: "Cohort Timeline",
        month: row.month,
        activeAuthors: row.activeAuthors,
        newAuthors: row.newAuthors,
        returningAuthors: row.returningAuthors,
        proposalsAuthored: row.proposalsAuthored,
      });
    });

    repoComposition.forEach((row) => {
      combined.push({
        type: "Repo Composition",
        repo: labelRepo(row.repo),
        uniqueAuthors: row.uniqueAuthors,
        repeatAuthors: row.repeatAuthors,
        proposals: row.proposals,
      });
    });

    topAuthors.forEach((row) => {
      combined.push({
        type: "Author Directory",
        author: row.author,
        proposalsAuthored: row.prsCreated,
        merged: row.prsMerged,
        open: row.prsOpen,
        closed: row.prsClosed,
        firstSeen: row.firstSeen,
        lastActivity: row.lastActivity,
        topRepo: labelRepo(row.topRepo),
      });
    });

    return combined;
  }, `authors-analytics-${repoFilter}-${timeRange}`);

  if (loading) {
    return <AnalyticsLoader label="Loading author analytics..." />;
  }

  const pagedAuthors = topAuthors.slice((dirPage - 1) * 10, dirPage * 10);

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-[var(--l-radius)] border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Users} accent="emerald" label="Total authors" value={kpis?.totalAuthors.toLocaleString() ?? "0"} sub="all-time" />
        <StatCard icon={Sparkles} accent="blue" label="New authors" value={kpis?.newAuthors.toLocaleString() ?? "0"} sub="this window" />
        <StatCard icon={Repeat2} accent="violet" label="Repeat authors" value={kpis?.repeatAuthors.toLocaleString() ?? "0"} sub="2+ proposals" />
        <StatCard icon={FileText} accent="amber" label="Proposals authored" value={kpis?.proposalsAuthored.toLocaleString() ?? "0"} sub={`Top 10 share: ${concentrationTop10Pct.toFixed(1)}%`} />
      </div>

      <section className="rounded-[var(--l-radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <AnalyticsSectionHeader
          id="authorship-trend"
          index="01"
          title="Authorship Trend"
          tooltip="New vs. returning authors with authored proposals overlay, showing onboarding velocity and repeat-contributor stability month by month."
          action={
            <div className="flex items-center gap-2">
              <LastUpdated timestamp={dataUpdatedAt} className="text-xs" />
              <button
                type="button"
                onClick={downloadCohortReport}
                className="chip cursor-pointer gap-1.5 px-2.5 py-1 text-xs font-medium text-[var(--ink)] hover:border-[var(--ink)]"
              >
                <Download className="h-3.5 w-3.5 text-[var(--brand-strong)]" />
                CSV
              </button>
            </div>
          }
        />
        <div className="relative h-72 w-full">
          <ReactECharts option={cohortTrendOption} style={{ height: "100%", width: "100%" }} opts={{ renderer: "svg" }} notMerge />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-xl font-semibold text-[var(--ink)]/10">EIPsInsight.com</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-[var(--l-radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
          <AnalyticsSectionHeader
            id="authorship-composition"
            index="02"
            title="Composition by Repository"
            tooltip="Unique vs. repeat authors across EIPs, ERCs, and RIPs."
            action={
              <button
                type="button"
                onClick={downloadRepoCompositionReport}
                className="chip cursor-pointer gap-1.5 px-2.5 py-1 text-xs font-medium text-[var(--ink)] hover:border-[var(--ink)]"
              >
                <Download className="h-3.5 w-3.5 text-[var(--brand-strong)]" />
                CSV
              </button>
            }
          />
          <div className="relative h-72 w-full">
            <ReactECharts option={repoCompositionOption} style={{ height: "100%", width: "100%" }} opts={{ renderer: "svg" }} notMerge />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-xl font-semibold text-[var(--ink)]/10">EIPsInsight.com</span>
            </div>
          </div>
        </section>

        <section className="rounded-[var(--l-radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
          <AnalyticsSectionHeader
            id="author-outcomes"
            index="03"
            title="Author Outcomes"
            tooltip="Top 10 authors by authored proposals and their landed, active, and closed shares."
            action={
              <button
                type="button"
                onClick={downloadOutcomesReport}
                className="chip cursor-pointer gap-1.5 px-2.5 py-1 text-xs font-medium text-[var(--ink)] hover:border-[var(--ink)]"
              >
                <Download className="h-3.5 w-3.5 text-[var(--brand-strong)]" />
                CSV
              </button>
            }
          />
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {outcomeRows.map((row) => {
              const landedPct = row.prsCreated > 0 ? Math.round((row.prsMerged / row.prsCreated) * 100) : 0;
              const activePct = row.prsCreated > 0 ? Math.round((row.prsOpen / row.prsCreated) * 100) : 0;
              const closedPct = row.prsCreated > 0 ? Math.round((row.prsClosed / row.prsCreated) * 100) : 0;
              return (
                <div key={row.author} className="rounded-[var(--l-radius-control)] border border-[var(--border)] bg-[var(--surface-2)] p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <ActorAvatar handle={row.author} size="xs" href={`/user/${row.author}`} />
                    <span className="font-mono text-[11px] text-[var(--ink-muted)]">{row.prsCreated} proposals</span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--surface)]">
                    <div className="h-full bg-[#0F5E4D]" style={{ width: `${landedPct}%` }} />
                    <div className="h-full bg-[#0284c7]" style={{ width: `${activePct}%` }} />
                    <div className="h-full bg-[#9ca3af]" style={{ width: `${closedPct}%` }} />
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-[var(--ink-muted)]">
                    Landed {landedPct}% · Active {activePct}% · Closed {closedPct}%
                  </p>
                </div>
              );
            })}
            {outcomeRows.length === 0 && (
              <p className="text-sm text-[var(--ink-muted)]">No outcome data available for current filters.</p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-[var(--l-radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <AnalyticsSectionHeader
          id="top-authors"
          index="04"
          title="Top Active Authors"
          tooltip="Most active proposal authors in the selected window."
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {topAuthorCards.map((author) => (
            <div key={author.author} className="rounded-[var(--l-radius-control)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <ActorAvatar handle={author.author} size="md" href={`/user/${author.author}`} />
                  <p className="mt-1 font-mono text-[10px] text-[var(--ink-muted)]">Top repo: {labelRepo(author.topRepo)}</p>
                </div>
                <p className="font-mono text-lg font-bold tabular-nums text-[var(--ink)]">{author.prsCreated}</p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[11px]">
                <div className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1">
                  <p className="text-[10px] text-[var(--ink-muted)]">Landed</p>
                  <p className="font-semibold tabular-nums text-[var(--ink)]">{author.prsMerged}</p>
                </div>
                <div className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1">
                  <p className="text-[10px] text-[var(--ink-muted)]">Open</p>
                  <p className="font-semibold tabular-nums text-[var(--ink)]">{author.prsOpen}</p>
                </div>
                <div className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1">
                  <p className="text-[10px] text-[var(--ink-muted)]">Closed</p>
                  <p className="font-semibold tabular-nums text-[var(--ink)]">{author.prsClosed}</p>
                </div>
              </div>
            </div>
          ))}
          {topAuthorCards.length === 0 && (
            <p className="text-sm text-[var(--ink-muted)]">No author cards available for current filters.</p>
          )}
        </div>
      </section>

      <section className="rounded-[var(--l-radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <AnalyticsSectionHeader
          id="author-directory"
          index="05"
          title="Author Directory"
          tooltip="Full author directory ranked by proposals authored (10 per page)."
          action={<LastUpdated timestamp={dataUpdatedAt} />}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">Rank</th>
                <th className="px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">Author</th>
                <th className="px-3 py-2.5 text-right font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">Proposals</th>
                <th className="px-3 py-2.5 text-right font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">Landed</th>
                <th className="px-3 py-2.5 text-right font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">Active</th>
                <th className="px-3 py-2.5 text-right font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">Closed</th>
                <th className="px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">Top Repo</th>
                <th className="px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">First Seen</th>
                <th className="px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/60">
              {pagedAuthors.map((author, idx) => {
                const rank = (dirPage - 1) * 10 + idx + 1;
                return (
                  <tr key={author.author} className="transition-colors hover:bg-[var(--surface-2)]">
                    <td className="px-3 py-2.5 font-mono text-[var(--ink-muted)]">#{rank}</td>
                    <td className="px-3 py-2.5">
                      <ActorAvatar handle={author.author} size="sm" href={`/user/${author.author}`} />
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums text-[var(--ink)]">{author.prsCreated.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--ink-muted)]">{author.prsMerged.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--ink-muted)]">{author.prsOpen.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--ink-muted)]">{author.prsClosed.toLocaleString()}</td>
                    <td className="px-3 py-2.5 font-mono text-[var(--ink-muted)]">{labelRepo(author.topRepo)}</td>
                    <td className="px-3 py-2.5 font-mono tabular-nums text-[var(--ink-muted)]">{author.firstSeen ? new Date(author.firstSeen).toLocaleDateString() : "–"}</td>
                    <td className="px-3 py-2.5 font-mono tabular-nums text-[var(--ink-muted)]">{author.lastActivity ? new Date(author.lastActivity).toLocaleDateString() : "–"}</td>
                  </tr>
                );
              })}
              {topAuthors.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-sm text-[var(--ink-muted)]">
                    No author data found for the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePager page={dirPage} total={topAuthors.length} pageSize={10} onPageChange={setDirPage} />
      </section>
    </div>
  );
}
