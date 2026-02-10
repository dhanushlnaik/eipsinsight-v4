"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAnalytics } from "../layout";
import { client } from "@/lib/orpc";
import { Loader2, ExternalLink, TrendingUp, FileText, CheckCircle, AlertCircle } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HeroKPIs {
  active: number;
  newDrafts: number;
  finalized: number;
  stagnant: number;
}

interface StatusTransition {
  from: string;
  to: string;
  value: number;
}

interface ThroughputData {
  month: string;
  draft: number;
  review: number;
  lastCall: number;
  final: number;
}

interface CategoryData {
  type: string;
  category: string;
  repository?: string;
  count: number;
  percentage: number;
  color: string;
}

interface RecentChange {
  eip: string;
  eip_type: string;
  title: string;
  from: string;
  to: string;
  days: number;
  statusColor: string;
  repository: string;
  changed_at: Date;
}

const statusColors: Record<string, string> = {
  Draft: "#22d3ee",
  Review: "#60a5fa",
  "Last Call": "#fbbf24",
  Final: "#34d399",
  Stagnant: "#94a3b8",
  Withdrawn: "#ef4444",
};

const categoryColors: Record<string, string> = {
  Core: "#34d399",
  ERC: "#60a5fa",
  Networking: "#a78bfa",
  Interface: "#f472b6",
  Meta: "#fbbf24",
  Informational: "#94a3b8",
};

export default function EIPsAnalyticsPage() {
  const { timeRange, repoFilter } = useAnalytics();
  const [loading, setLoading] = useState(true);
  const [heroKPIs, setHeroKPIs] = useState<HeroKPIs | null>(null);
  const [transitions, setTransitions] = useState<StatusTransition[]>([]);
  const [throughput, setThroughput] = useState<ThroughputData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [recentChanges, setRecentChanges] = useState<RecentChange[]>([]);
  const [lifecycleData, setLifecycleData] = useState<Array<{ stage: string; count: number; color: string }>>([]);

  const repoParam = repoFilter === "all" ? undefined : repoFilter;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Batch queries in smaller groups to avoid connection exhaustion
        // First batch: Critical data
        const [kpis, lifecycleDataRes] = await Promise.all([
          client.analytics.getEIPHeroKPIs({ repo: repoParam }),
          client.analytics.getLifecycleData({ repo: repoParam }),
        ]);

        setHeroKPIs(kpis);
        setLifecycleData(lifecycleDataRes);

        // Second batch: Charts and visualizations
        const [transitionsData, throughputData, categoryDataRes] = await Promise.all([
          client.analytics.getEIPStatusTransitions({ repo: repoParam }),
          client.analytics.getEIPThroughput({ repo: repoParam, months: timeRange === "7d" ? 3 : timeRange === "30d" ? 6 : timeRange === "90d" ? 12 : timeRange === "1y" ? 24 : timeRange === "all" ? 60 : 24 }),
          client.analytics.getStandardsComposition({ repo: repoParam }),
        ]);

        setTransitions(transitionsData);
        setThroughput(throughputData);
        setCategoryData(categoryDataRes);

        // Third batch: Recent changes (less critical, can load last)
        const recentChangesData = await client.analytics.getRecentChanges({ repo: repoParam, limit: 20 });
        setRecentChanges(recentChangesData);
      } catch (error) {
        console.error("Failed to fetch EIP analytics:", error);
        // Set empty states on error to prevent UI breaking
        setHeroKPIs(null);
        setTransitions([]);
        setThroughput([]);
        setCategoryData([]);
        setRecentChanges([]);
        setLifecycleData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, repoFilter, repoParam]);

  // Prepare funnel data
  const funnelData = useMemo(() => {
    const stages = ["Draft", "Review", "Last Call", "Final"];
    return stages.map(stage => {
      const data = lifecycleData.find(d => d.stage === stage);
      return {
        stage,
        count: data?.count || 0,
        color: statusColors[stage] || "#94a3b8",
      };
    });
  }, [lifecycleData]);

  // Prepare transition flow data (simplified visualization)
  const transitionFlow = useMemo(() => {
    const flows = [
      { from: "Draft", to: "Review" },
      { from: "Review", to: "Last Call" },
      { from: "Last Call", to: "Final" },
      { from: "Draft", to: "Withdrawn" },
    ];
    return flows.map(flow => {
      const transition = transitions.find(t => t.from === flow.from && t.to === flow.to);
      return {
        ...flow,
        value: transition?.value || 0,
      };
    }).filter(t => t.value > 0);
  }, [transitions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Active EIPs</p>
              <p className="text-3xl font-bold text-white">{heroKPIs?.active.toLocaleString() || 0}</p>
            </div>
            <div className="rounded-full bg-cyan-500/20 p-3">
              <FileText className="h-6 w-6 text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">New Drafts</p>
              <p className="text-3xl font-bold text-white">{heroKPIs?.newDrafts.toLocaleString() || 0}</p>
            </div>
            <div className="rounded-full bg-blue-500/20 p-3">
              <TrendingUp className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Finalized</p>
              <p className="text-3xl font-bold text-white">{heroKPIs?.finalized.toLocaleString() || 0}</p>
            </div>
            <div className="rounded-full bg-emerald-500/20 p-3">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Stagnant</p>
              <p className="text-3xl font-bold text-white">{heroKPIs?.stagnant.toLocaleString() || 0}</p>
            </div>
            <div className="rounded-full bg-slate-500/20 p-3">
              <AlertCircle className="h-6 w-6 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Transitions Flow */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
        <h2 className="text-xl font-semibold text-white mb-4">Status Transition Flow</h2>
        <div className="space-y-3">
          {transitionFlow.map((flow, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-300">{flow.from} → {flow.to}</span>
                  <span className="text-sm font-medium text-white">{flow.value.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (flow.value / Math.max(...transitionFlow.map(f => f.value), 1)) * 100)}%`,
                      backgroundColor: statusColors[flow.to] || "#60a5fa",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lifecycle Funnel */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-white mb-4">Lifecycle Funnel</h2>
          <ChartContainer
            config={{
              count: { label: "Count", color: "#22c55e" },
            }}
            className="h-[300px] w-full"
          >
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="stage" type="category" stroke="#94a3b8" width={80} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList dataKey="count" position="right" fill="#e2e8f0" />
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>

        {/* Category Composition */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-white mb-4">Category Composition</h2>
          <ChartContainer
            config={Object.fromEntries(
              categoryData.map((entry) => [
                entry.category.toLowerCase(),
                { label: entry.category, color: categoryColors[entry.category] || entry.color },
              ])
            )}
            className="h-[300px] w-full"
          >
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={categoryColors[entry.category] || entry.color} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
        </div>
      </div>

      {/* Monthly Throughput */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
        <h2 className="text-xl font-semibold text-white mb-4">Monthly Throughput</h2>
        <ChartContainer
          config={{
            draft: { label: "Draft", color: "#22d3ee" },
            review: { label: "Review", color: "#60a5fa" },
            lastCall: { label: "Last Call", color: "#fbbf24" },
            final: { label: "Final", color: "#34d399" },
          }}
          className="h-[300px] w-full"
        >
          <LineChart data={throughput}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="draft" stroke="#22d3ee" strokeWidth={2} name="Draft" />
            <Line type="monotone" dataKey="review" stroke="#60a5fa" strokeWidth={2} name="Review" />
            <Line type="monotone" dataKey="lastCall" stroke="#fbbf24" strokeWidth={2} name="Last Call" />
            <Line type="monotone" dataKey="final" stroke="#34d399" strokeWidth={2} name="Final" />
          </LineChart>
        </ChartContainer>
      </div>

      {/* Recent Changes Table */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Changes</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">EIP #</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Title</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Transition</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Repo</th>
              </tr>
            </thead>
            <tbody>
              {recentChanges.map((change, idx) => {
                const repoPath = change.repository.toLowerCase().includes("ercs") ? "ercs" : 
                                change.repository.toLowerCase().includes("rips") ? "rips" : "eips";
                return (
                  <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        href={`/standards/${repoPath}/${change.eip}`}
                        className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                      >
                        {change.eip_type}-{change.eip}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-300">{change.title}</td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium",
                        change.statusColor === "emerald" && "bg-emerald-500/20 text-emerald-300",
                        change.statusColor === "blue" && "bg-blue-500/20 text-blue-300",
                        "bg-slate-700/50 text-slate-300"
                      )}>
                        {change.from} → {change.to}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-400">
                      {new Date(change.changed_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-400">
                      {change.repository.split("/")[1]}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
