"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactECharts from "echarts-for-react";
import { useAnalytics, useAnalyticsExport } from "../analytics-layout-client";
import { client } from "@/lib/orpc";
import {
  Loader2,
  Github,
  ArrowUpRight,
  AlertCircle,
  Download,
  Activity,
  BarChart3,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CopyLinkButton } from "@/components/header";
import { LastUpdated } from "@/components/analytics/LastUpdated";
import { AnalyticsLoader, AnalyticsSectionHeader, ActorAvatar, TablePager } from "../_components/analytics-ui";

interface IssueMonthlyPoint {
  month: string;
  created: number;
  closed: number;
  openAtMonthEnd: number;
}

interface IssueMonthlySummary {
  month: string;
  openIssues: number;
  newIssues: number;
  closedIssues: number;
}

interface OpenIssueState {
  totalOpen: number;
  medianAge: number;
  oldestIssue: {
    issueNumber: number;
    title: string | null;
    author: string | null;
    ageDays: number;
  } | null;
}

interface LabelStat {
  label: string;
  count: number;
}

interface OpenIssueRow {
  issueNumber: number;
  repo: string;
  title: string | null;
  author: string | null;
  createdAt: string;
  state: string;
  updatedAt: string | null;
  linkedEIPs: string | null;
  labels: string[];
  numComments: number;
}

function Section({ title, tooltip, children, action, className, id }: {
  title: string;
  tooltip?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section className={cn("rounded-[var(--l-radius)] border border-[var(--border)] bg-[var(--surface)] p-5", className)}>
      <AnalyticsSectionHeader id={id ?? title.toLowerCase().replace(/\s+/g, "-")} title={title} tooltip={tooltip} action={action} />
      {children}
    </section>
  );
}

export default function IssuesAnalyticsPage() {
  const { timeRange, repoFilter } = useAnalytics();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataUpdatedAt, setDataUpdatedAt] = useState<Date>(new Date());

  const [monthlySeries, setMonthlySeries] = useState<IssueMonthlyPoint[]>([]);
  const [heroMonth, setHeroMonth] = useState<IssueMonthlySummary | null>(null);
  const [openSummary, setOpenSummary] = useState<OpenIssueState | null>(null);
  const [labelStats, setLabelStats] = useState<LabelStat[]>([]);
  const [openIssues, setOpenIssues] = useState<OpenIssueRow[]>([]);

  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [issuesPage, setIssuesPage] = useState(1);
  const repoParam = repoFilter === "all" ? undefined : repoFilter;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const contextMonth = selectedMonth ?? currentMonth;
        const [heroYearStr, heroMonthStr] = contextMonth.split("-");
        const heroYear = Number(heroYearStr);
        const heroMonthNum = Number(heroMonthStr);

        const [monthly, summary, labels, issues, openState] = await Promise.all([
          client.analytics.getIssueMonthlyActivity({ repo: repoParam }),
          client.analytics.getIssueMonthlySummary({
            year: Number.isFinite(heroYear) ? heroYear : now.getFullYear(),
            month: Number.isFinite(heroMonthNum) ? heroMonthNum : now.getMonth() + 1,
            repo: repoParam,
          }),
          client.analytics.getIssueLabels({ repo: repoParam }),
          client.analytics.getIssueOpenExport({ repo: repoParam, month: contextMonth }),
          client.analytics.getIssueOpenState({ repo: repoParam }),
        ]);

        setMonthlySeries(monthly);
        setHeroMonth(summary);
        setLabelStats(labels.slice(0, 20));
        setOpenIssues(issues);
        setOpenSummary(openState);
        setDataUpdatedAt(new Date());
      } catch (err) {
        console.error("Failed to fetch issue analytics:", err);
        setError("Failed to load issue analytics. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [repoFilter, repoParam, selectedMonth]);

  useEffect(() => {
    if (!selectedMonth && monthlySeries.length > 0) {
      setSelectedMonth(monthlySeries[monthlySeries.length - 1].month);
    }
  }, [monthlySeries, selectedMonth]);

  const monthlyOption = useMemo(() => {
    return {
      backgroundColor: "transparent",
      tooltip: { trigger: "axis" },
      legend: {
        top: 0,
        textStyle: { color: "var(--muted-foreground)", fontSize: 11 },
      },
      grid: { top: 36, left: 38, right: 22, bottom: 50 },
      xAxis: {
        type: "category",
        data: monthlySeries.map((m) => m.month),
        axisLabel: { color: "var(--muted-foreground)", fontSize: 11 },
        axisLine: { lineStyle: { color: "rgba(148,163,184,0.25)" } },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "var(--muted-foreground)", fontSize: 11 },
        splitLine: { lineStyle: { color: "rgba(148,163,184,0.15)", type: "dashed" } },
      },
      dataZoom: [
        { type: "inside", xAxisIndex: 0, start: 0, end: 100 },
        {
          type: "slider",
          xAxisIndex: 0,
          bottom: 6,
          height: 18,
          borderColor: "rgba(148,163,184,0.22)",
          backgroundColor: "rgba(148,163,184,0.08)",
          fillerColor: "rgba(34,211,238,0.22)",
          handleSize: 10,
          showDetail: false,
          start: 0,
          end: 100,
        },
      ],
      series: [
        { name: "Created", type: "bar", data: monthlySeries.map((m) => m.created), itemStyle: { color: "#60A5FA", borderRadius: [6, 6, 0, 0] } },
        { name: "Closed", type: "bar", data: monthlySeries.map((m) => m.closed), itemStyle: { color: "#F59E0B", borderRadius: [6, 6, 0, 0] } },
        { name: "Open EOM", type: "line", smooth: true, symbol: "circle", symbolSize: 6, data: monthlySeries.map((m) => m.openAtMonthEnd), lineStyle: { width: 2.5, color: "#A78BFA" }, itemStyle: { color: "#A78BFA" } },
      ],
    };
  }, [monthlySeries]);

  const monthContext = selectedMonth || heroMonth?.month || "Latest";
  const nextUpdateAt = useMemo(() => new Date(dataUpdatedAt.getTime() + 24 * 60 * 60 * 1000), [dataUpdatedAt]);
  const totalOpen = openSummary?.totalOpen ?? 0;

  const downloadObjectRowsCsv = useCallback(
    (rows: Array<Record<string, unknown>>, filename: string) => {
      if (!rows.length) return;
      const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
      const escapeCsv = (value: unknown) => `"${String(value ?? "").replaceAll(`"`, `""`)}"`;
      const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escapeCsv(r[h])).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
    [],
  );

  const downloadOpenIssuesDetailedCSV = useCallback(() => {
    const generatedAt = new Date().toISOString();
    const rows: Array<Record<string, string | number | null>> = openIssues.map((issue) => ({
      issue_number: issue.issueNumber,
      repo: issue.repo,
      title: issue.title,
      author: issue.author,
      state: issue.state,
      labels: issue.labels.join("; "),
      linked_eips: issue.linkedEIPs,
      created_at: issue.createdAt,
      updated_at: issue.updatedAt,
      num_comments: issue.numComments,
      month_context: monthContext,
      repo_filter: repoFilter,
      generated_at: generatedAt,
    }));
    downloadObjectRowsCsv(
      rows,
      `eip-open-issues-detailed-${repoFilter}-${monthContext}-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  }, [downloadObjectRowsCsv, monthContext, openIssues, repoFilter]);

  useAnalyticsExport(() => {
    const combined: Record<string, unknown>[] = [];
    monthlySeries.forEach((item) => combined.push({ type: "monthly", ...item }));
    labelStats.forEach((item) => combined.push({ type: "labels", ...item }));
    openIssues.forEach((issue) => combined.push({ type: "open_issue", ...issue }));
    return combined;
  }, `analytics-issues-${repoFilter}`);

  if (loading) {
    return <AnalyticsLoader label="Loading issue analytics..." />;
  }

  const pagedIssues = openIssues.slice((issuesPage - 1) * 10, issuesPage * 10);

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-[var(--l-radius)] border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Open Issues", value: totalOpen, sub: `Median age: ${openSummary?.medianAge != null ? `${openSummary.medianAge}d` : "–"}` },
          { label: `Created (${heroMonth?.month ?? ""})`, value: heroMonth?.newIssues ?? 0, sub: "Current month" },
          { label: "Closed", value: heroMonth?.closedIssues ?? 0, sub: "Current month" },
          { label: "Active", value: heroMonth?.openIssues ?? 0, sub: "In current month" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-[var(--l-radius)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">{kpi.label}</p>
            <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-[var(--ink)]">{kpi.value.toLocaleString()}</p>
            <p className="mt-1 font-mono text-[10px] text-[var(--ink-faint)]">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <Section
        id="issue-trend"
        title="Open Issue trend by month"
        tooltip="Created and Closed count issues by activity within each month. Open EOM (Open at End of Month) tracks the running backlog still open on the last day of each month."
        action={
          <div className="flex items-center gap-2">
            <span className="chip px-2 py-0.5 font-mono text-[11px]">{monthContext}</span>
            <LastUpdated timestamp={dataUpdatedAt} />
          </div>
        }
      >
        {monthlySeries.length > 0 ? (
          <div className="h-[360px] w-full">
            <ReactECharts
              option={monthlyOption}
              style={{ height: "100%", width: "100%" }}
              opts={{ renderer: "svg" }}
              notMerge
            />
          </div>
        ) : (
          <p className="text-sm text-[var(--ink-muted)]">No monthly data available.</p>
        )}
      </Section>

      <Section id="issue-labels" title="Label distribution" tooltip="Most frequent GitHub labels across open issues in the selected repository scope.">
        <div className="space-y-2">
          {labelStats.length > 0 ? (
            labelStats.map((label) => {
              const maxCount = Math.max(...labelStats.map((l) => l.count));
              const percentage = (label.count / maxCount) * 100;
              return (
                <div key={label.label} className="flex items-center gap-3">
                  <span className="w-32 truncate font-mono text-xs text-[var(--ink)]">{label.label}</span>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-[var(--surface-2)]">
                      <div className="h-full rounded-full bg-[var(--brand-strong)]" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                  <span className="w-12 text-right font-mono text-xs tabular-nums text-[var(--ink-muted)]">{label.count}</span>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-[var(--ink-muted)]">No labels found.</p>
          )}
        </div>
      </Section>

      <Section
        id="open-issues-section"
        title="Open Issues"
        tooltip="Currently open issues in the selected repository scope, paginated 10 per page."
        action={
          <button
            type="button"
            onClick={downloadOpenIssuesDetailedCSV}
            className="chip cursor-pointer gap-1.5 px-2.5 py-1 text-xs font-medium text-[var(--ink)] hover:border-[var(--ink)]"
          >
            <Download className="h-3.5 w-3.5 text-[var(--brand-strong)]" />
            CSV
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="py-2 pr-4 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Issue</th>
                <th className="py-2 pr-4 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Title</th>
                <th className="py-2 pr-4 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Repo</th>
                <th className="py-2 pr-4 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Author</th>
                <th className="py-2 pr-4 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Comments</th>
                <th className="py-2 pr-4 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/60">
              {pagedIssues.map((issue) => {
                const [org, repoName] = issue.repo.split("/");
                const url = `https://github.com/${org}/${repoName}/issues/${issue.issueNumber}`;
                const repoShort = repoName.toLowerCase();
                return (
                  <tr key={`${issue.repo}-${issue.issueNumber}`} className="transition-colors hover:bg-[var(--surface-2)]">
                    <td className="py-2.5 pr-4">
                      <div className="inline-flex items-center gap-1.5">
                        <Link href={`/issue/${repoShort}/${issue.issueNumber}`} className="font-mono font-semibold text-[var(--brand-strong)] hover:underline">
                          #{issue.issueNumber}
                        </Link>
                        <a href={url} target="_blank" rel="noreferrer" className="text-[var(--ink-faint)] hover:text-[var(--ink)]" title="Open on GitHub">
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      </div>
                    </td>
                    <td className="max-w-xs truncate py-2.5 pr-4 text-[var(--ink)]">{issue.title || <span className="text-[var(--ink-faint)]">No title</span>}</td>
                    <td className="py-2.5 pr-4 font-mono text-[var(--ink-muted)]">{repoName}</td>
                    <td className="py-2.5 pr-4">
                      {issue.author ? (
                        <ActorAvatar handle={issue.author} size="xs" href={`/user/${issue.author}`} />
                      ) : (
                        <span className="text-[var(--ink-faint)]">Unknown</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 font-mono tabular-nums text-[var(--ink-muted)]">{issue.numComments}</td>
                    <td className="py-2.5 pr-4 font-mono tabular-nums text-[var(--ink-muted)]">{issue.createdAt}</td>
                  </tr>
                );
              })}
              {openIssues.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-[var(--ink-muted)]">
                    No open issues found for current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePager page={issuesPage} total={openIssues.length} pageSize={10} onPageChange={setIssuesPage} />

        {openSummary?.oldestIssue && (
          <div className="mt-4 flex items-center gap-2 rounded-[var(--l-radius-control)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--ink-muted)]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[var(--c-review)]" />
            <span>
              <strong className="text-[var(--ink)]">Oldest:</strong> #{openSummary.oldestIssue.issueNumber} by {openSummary.oldestIssue.author} ({openSummary.oldestIssue.ageDays}d) — {openSummary.oldestIssue.title}
            </span>
          </div>
        )}
      </Section>
    </div>
  );
}
