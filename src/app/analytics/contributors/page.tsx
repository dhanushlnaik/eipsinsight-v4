"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAnalytics, useAnalyticsExport } from "../analytics-layout-client";
import { client } from "@/lib/orpc";
import { Users, Activity, Zap, Database, AlertCircle } from "lucide-react";
import { StatCard, AnalyticsHero } from "@/components/analytics/stat-card";
import { CHART_AXIS, CHART_GRID } from "@/lib/chart-colors";
import { LastUpdated } from "@/components/analytics/LastUpdated";
import { ChartWatermark } from "@/components/chart-watermark";
import { ChartFooter } from "@/components/chart-footer";
import { ContributorHeatmap } from "@/components/analytics/ContributorHeatmap";
import { AnalyticsAnnotation } from "@/components/analytics/AnalyticsAnnotation";
import { ContributorLookupPanel } from "@/components/analytics/contributor-lookup-panel";
import { AnalyticsKpiStrip, AnalyticsLoader, AnalyticsSectionHeader, ActorAvatar, TablePager } from "../_components/analytics-ui";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";
import Link from "next/link";

interface ContributorKPIs {
  totalContributors: number;
  activeContributors30d: number;
  totalActivities: number;
  last24hCount: number;
}

interface ActivityByType {
  actionType: string;
  count: number;
}

interface ActivityByRepo {
  repo: string;
  count: number;
}

interface ContributorRanking {
  actor: string;
  total: number;
  reviews: number;
  statusChanges: number;
  prsAuthored: number;
  prsReviewed: number;
}

interface LiveFeedItem {
  actor: string;
  actionType: string;
  prNumber: number;
  repo: string | null;
  occurredAt: string;
}

interface DailyActivityData {
  date: string;
  count: number;
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
  const to = now.toISOString().split('T')[0];
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
  
  return { from: from.toISOString().split('T')[0], to };
}

const actionTypeColors: Record<string, string> = {
  reviewed: "#22c55e",
  commented: "#60a5fa",
  committed: "#a78bfa",
  opened: "#fbbf24",
  status_change: "#ef4444",
};

const repoColors: Record<string, string> = {
  "ethereum/EIPs": "#22d3ee",
  "ethereum/ERCs": "#60a5fa",
  "ethereum/RIPs": "#94a3b8",
};

export default function ContributorsAnalyticsPage() {
  const { timeRange, repoFilter, customFromMonth, customToMonth } = useAnalytics();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataUpdatedAt, setDataUpdatedAt] = useState<Date>(new Date());
  const [sortBy, setSortBy] = useState<'total' | 'reviews' | 'status_changes' | 'prs_authored' | 'prs_reviewed'>('total');
  const [rankingsPage, setRankingsPage] = useState(1);
  
  const [kpis, setKPIs] = useState<ContributorKPIs | null>(null);
  const [activityByType, setActivityByType] = useState<ActivityByType[]>([]);
  const [activityByRepo, setActivityByRepo] = useState<ActivityByRepo[]>([]);
  const [rankings, setRankings] = useState<ContributorRanking[]>([]);
  const [liveFeed, setLiveFeed] = useState<LiveFeedItem[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DailyActivityData[]>([]);

  const repoParam = repoFilter === "all" ? undefined : repoFilter;
  const { from, to } = getTimeWindow(timeRange, customFromMonth, customToMonth);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [kpisData, typeData, repoData, rankingsData, feedData, dailyActivityData] = await Promise.all([
          client.analytics.getContributorKPIs({}),
          client.analytics.getContributorActivityByType({
            repo: repoParam,
            from,
            to,
          }),
          client.analytics.getContributorActivityByRepo({
            from,
            to,
          }),
          client.analytics.getContributorRankings({
            repo: repoParam,
            from,
            to,
            sortBy,
            limit: 50,
          }),
          client.analytics.getContributorLiveFeed({
            hours: 48,
            limit: 50,
          }),
          client.analytics.getContributorDailyActivity({
            repo: repoParam,
            from,
            to,
          }),
        ]);

        setKPIs(kpisData);
        setActivityByType(typeData);
        setActivityByRepo(repoData);
        setRankings(rankingsData);
        setLiveFeed(feedData);
        setDailyActivity(dailyActivityData);
        setDataUpdatedAt(new Date());
      } catch (error) {
        console.error("Failed to fetch contributors analytics:", error);
        setError("Failed to load contributor analytics. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, repoFilter, repoParam, from, to, sortBy]);

  // Prepare repo heatmap data
  const repoHeatmap = useMemo(() => {
    return activityByRepo.map(r => ({
      repo: r.repo.split('/')[1] || r.repo,
      count: r.count,
      color: repoColors[r.repo] || "#94a3b8",
    }));
  }, [activityByRepo]);

  // Export functionality
  useAnalyticsExport(() => {
    const combined: Record<string, unknown>[] = [];
    
    // KPIs
    if (kpis) {
      combined.push({
        type: 'KPIs',
        totalContributors: kpis.totalContributors,
        activeContributors30d: kpis.activeContributors30d,
        totalActivities: kpis.totalActivities,
        last24hCount: kpis.last24hCount,
      });
    }
    
    // Activity by type
    activityByType.forEach(a => {
      combined.push({
        type: 'Activity by Type',
        actionType: a.actionType,
        count: a.count,
      });
    });
    
    // Activity by repo
    activityByRepo.forEach(a => {
      combined.push({
        type: 'Activity by Repo',
        repo: a.repo,
        count: a.count,
      });
    });
    
    // Contributor rankings
    rankings.forEach(r => {
      combined.push({
        type: 'Contributor Ranking',
        contributor: r.actor,
        total: r.total,
        reviews: r.reviews,
        statusChanges: r.statusChanges,
        prsAuthored: r.prsAuthored,
        prsReviewed: r.prsReviewed,
      });
    });
    
    // Live feed (sampling first 20)
    liveFeed.slice(0, 20).forEach(l => {
      combined.push({
        type: 'Live Feed',
        actor: l.actor,
        actionType: l.actionType,
        prNumber: l.prNumber,
        repo: l.repo,
        occurredAt: l.occurredAt,
      });
    });
    
    return combined;
  }, `contributors-analytics-${repoFilter}-${timeRange}`);

  if (loading) {
    return <AnalyticsLoader label="Loading contributor analytics..." />;
  }

  const pagedRankings = rankings.slice((rankingsPage - 1) * 10, rankingsPage * 10);

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-[var(--l-radius)] border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPIs */}
      <AnalyticsKpiStrip
        columns={4}
        items={[
          { label: "Total contributors", value: kpis?.totalContributors ?? 0, sub: "all-time", href: "#contributor-rankings" },
          { label: "Active (30d)", value: kpis?.activeContributors30d ?? 0, sub: "recently engaged", href: "#contributor-activity" },
          { label: "Total activities", value: kpis?.totalActivities ?? 0, sub: "commits, PRs, reviews", href: "#activity-by-type" },
          { label: "Last 24h", value: kpis?.last24hCount ?? 0, sub: "activities today", href: "#live-activity-feed" },
        ]}
      />

      {/* Universal Contributor Lookup + Per-Contributor Chart */}
      <ContributorLookupPanel from={from} to={to} />

      {/* Contributor Activity Heatmap */}
      <section className="border-t border-[var(--border)] pt-6">
        <AnalyticsSectionHeader
          id="contributor-activity"
          title="Contributor Activity"
          tooltip="Daily activity heatmap across commits, PR reviews, status changes, and authored PRs."
          action={<LastUpdated timestamp={dataUpdatedAt} />}
        />
        <div className="relative">
          <ContributorHeatmap data={dailyActivity} />
          <ChartWatermark />
        </div>
        <ChartFooter nextUpdateAt={null} />
      </section>

      {/* Activity by Type + Activity by Repo */}
      <div className="grid grid-cols-1 gap-6 border-t border-[var(--border)] pt-6 lg:grid-cols-2">
        <section>
          <AnalyticsSectionHeader
            id="activity-by-type"
            title="Activity by Type"
            tooltip="Breakdown of contributor actions across reviews, PRs, commits, and status transitions."
          />
          <div className="relative">
            <ChartContainer
              config={Object.fromEntries(
                Object.entries(actionTypeColors).map(([type, color]) => [
                  type,
                  { label: type, color },
                ])
              )}
              className="h-64 w-full"
            >
              <ResponsiveContainer>
                <BarChart data={activityByType} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "var(--ink-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="actionType" type="category" tick={{ fill: "var(--ink-muted)", fontSize: 11 }} tickLine={false} axisLine={false} width={100} />
                  <ChartTooltip content={<ChartTooltipContent className="border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)]" />} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                    {activityByType.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={actionTypeColors[entry.actionType] || "#0F5E4D"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            <ChartWatermark />
          </div>
          <ChartFooter nextUpdateAt={null} />
        </section>

        <section>
          <AnalyticsSectionHeader
            id="activity-by-repo"
            title="Activity by Repository"
            tooltip="Distribution of contributor activity across ethereum/EIPs, ethereum/ERCs, and ethereum/RIPs."
          />
          <div className="relative">
            <ChartContainer
              config={Object.fromEntries(
                repoHeatmap.map((r) => [
                  r.repo,
                  { label: r.repo, color: r.color },
                ])
              )}
              className="h-64 w-full"
            >
              <ResponsiveContainer>
                <BarChart data={repoHeatmap} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="repo" tick={{ fill: "var(--ink-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "var(--ink-muted)", fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip content={<ChartTooltipContent className="border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)]" />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    {repoHeatmap.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            <ChartWatermark />
          </div>
          <ChartFooter nextUpdateAt={null} />
        </section>
      </div>

      {/* Contributor Rankings */}
      <section className="border-t border-[var(--border)] pt-6">
        <AnalyticsSectionHeader
          id="contributor-rankings"
          title="Contributor Rankings"
          tooltip="Top contributors ranked by total activity, reviews, status changes, or authored PRs (10 per page)."
          action={
            <div className="flex items-center gap-2">
              <LastUpdated timestamp={dataUpdatedAt} />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as typeof sortBy);
                  setRankingsPage(1);
                }}
                className="h-8 rounded-[var(--l-radius-control)] border border-[var(--border)] bg-[var(--surface-2)] px-2.5 font-mono text-[11px] text-[var(--ink)] outline-none focus:border-[var(--ink)]"
              >
                <option value="total">Total Activities</option>
                <option value="reviews">Reviews</option>
                <option value="status_changes">Status Changes</option>
                <option value="prs_authored">PRs Authored</option>
                <option value="prs_reviewed">PRs Reviewed</option>
              </select>
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="py-2.5 px-3 text-left font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">Rank</th>
                <th className="py-2.5 px-3 text-left font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">Contributor</th>
                <th className="py-2.5 px-3 text-right font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">Total</th>
                <th className="py-2.5 px-3 text-right font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">Reviews</th>
                <th className="py-2.5 px-3 text-right font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">Status Changes</th>
                <th className="py-2.5 px-3 text-right font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">PRs Authored</th>
                <th className="py-2.5 px-3 text-right font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">PRs Reviewed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/60">
              {pagedRankings.map((contributor, idx) => (
                <tr
                  key={contributor.actor}
                  className="transition-colors hover:bg-[var(--surface-2)]"
                >
                  <td className="py-2.5 px-3 font-mono text-[var(--ink-muted)]">#{(rankingsPage - 1) * 10 + idx + 1}</td>
                  <td className="py-2.5 px-3">
                    <ActorAvatar handle={contributor.actor} size="sm" href={`/analytics/contributors/${contributor.actor}`} />
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-[var(--ink)]">
                    {contributor.total.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[var(--ink-muted)]">
                    {contributor.reviews.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[var(--ink-muted)]">
                    {contributor.statusChanges.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[var(--ink-muted)]">
                    {contributor.prsAuthored.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[var(--ink-muted)]">
                    {contributor.prsReviewed.toLocaleString()}
                  </td>
                </tr>
              ))}
              {rankings.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-sm text-[var(--ink-muted)]">
                    No contributor data found for the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePager page={rankingsPage} total={rankings.length} pageSize={10} onPageChange={setRankingsPage} />
      </section>

      {/* Live Activity Feed */}
      <section className="border-t border-[var(--border)] pt-6">
        <AnalyticsSectionHeader
          id="live-activity-feed"
          title="Live Activity Feed (Last 48h)"
          tooltip="Most recent commits, reviews, PRs, and status changes across EIP, ERC, and RIP repositories."
        />
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {liveFeed.map((item, idx) => {
            const repoName = item.repo ? item.repo.split('/')[1] : 'Unknown';
            return (
              <div
                key={idx}
                className="flex items-center justify-between rounded-[var(--l-radius-control)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <ActorAvatar handle={item.actor} size="xs" href={`/analytics/contributors/${item.actor}`} />
                  <span className="text-[var(--ink-muted)]">
                    {item.actionType.replace('_', ' ')}
                  </span>
                  {item.prNumber > 0 && (
                    <Link href={`/pr/${repoName.toLowerCase()}/${item.prNumber}`} className="font-mono text-[var(--brand-strong)] hover:underline">
                      PR #{item.prNumber}
                    </Link>
                  )}
                  {item.repo && (
                    <span className="font-mono text-[var(--ink-faint)]">{repoName}</span>
                  )}
                </div>
                <span className="font-mono text-[10px] text-[var(--ink-muted)]">
                  {new Date(item.occurredAt).toLocaleString()}
                </span>
              </div>
            );
          })}
          {liveFeed.length === 0 && (
            <p className="text-sm text-[var(--ink-muted)]">No recent activity in the last 48 hours.</p>
          )}
        </div>
      </section>
    </div>
  );
}
