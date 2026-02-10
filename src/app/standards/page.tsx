"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { client } from "@/lib/orpc";
import {
  Loader2,
  Download,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
  GitCommitHorizontal,
  RotateCcw,
  ChevronDown,
  Filter,
} from "lucide-react";
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
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

// ──────── Types ────────
type RepoTab = "all" | "eips" | "ercs" | "rips";

interface KPIs {
  total: number;
  inReview: number;
  finalized: number;
  newThisYear: number;
}

interface RIPKPIs {
  total: number;
  active: number;
  recentCommits: number;
  mostActiveRip: number | null;
  mostActiveTitle: string | null;
  mostActiveCommits: number;
}

interface StatusDist {
  status: string;
  repo: string;
  count: number;
}

interface TrendItem {
  year: number;
  repo: string;
  count: number;
}

interface CategoryItem {
  category: string;
  count: number;
}

interface TableRow {
  repo: string;
  number: number;
  title: string | null;
  author: string | null;
  status: string;
  type: string | null;
  category: string | null;
  createdAt: string | null;
  updatedAt: string;
  daysInStatus: number;
  linkedPRs: number;
}

interface RIPRow {
  number: number;
  title: string | null;
  status: string | null;
  author: string | null;
  createdAt: string | null;
  lastCommit: string | null;
  commits: number;
}

interface RIPActivity {
  month: string;
  count: number;
}

// ──────── Colors ────────
const STATUS_COLORS: Record<string, string> = {
  Draft: "#22d3ee",
  Review: "#60a5fa",
  "Last Call": "#fbbf24",
  Final: "#34d399",
  Living: "#a78bfa",
  Stagnant: "#94a3b8",
  Withdrawn: "#ef4444",
};

const REPO_COLORS: Record<string, string> = {
  eips: "#34d399",
  ercs: "#60a5fa",
  rips: "#fbbf24",
  unknown: "#94a3b8",
};

const CATEGORY_COLORS = [
  "#34d399",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
  "#fbbf24",
  "#94a3b8",
  "#fb923c",
  "#22d3ee",
];

// ──────── Page Content ────────
function StandardsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── URL-driven state ──
  const repo = (searchParams.get("repo") as RepoTab) || "all";

  // ── Filter state ──
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [yearFrom, setYearFrom] = useState<number | undefined>(undefined);
  const [yearTo, setYearTo] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // ── Sort + Pagination ──
  const [sortBy, setSortBy] = useState<string>("number");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 30;

  // ── Data state ──
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [ripKpis, setRipKpis] = useState<RIPKPIs | null>(null);
  const [statusDist, setStatusDist] = useState<StatusDist[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryItem[]>([]);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [ripTableData, setRipTableData] = useState<RIPRow[]>([]);
  const [ripActivity, setRipActivity] = useState<RIPActivity[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterOptions, setFilterOptions] = useState<{
    statuses: string[];
    types: string[];
    categories: string[];
  }>({ statuses: [], types: [], categories: [] });

  // ── Debounce search ──
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Tab switch helper ──
  const setRepo = useCallback(
    (newRepo: RepoTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newRepo === "all") {
        params.delete("repo");
      } else {
        params.set("repo", newRepo);
      }
      router.replace(`/standards?${params.toString()}`);
      setPage(1);
    },
    [router, searchParams]
  );

  const repoParam = repo === "all" ? undefined : repo;
  const isRIP = repo === "rips";

  // Reset sort to valid value when switching to/from RIPs
  React.useEffect(() => {
    if (isRIP) {
      // Valid RIP sortBy values: number, title, status, author, created_at, last_commit, commits
      const validRIPSorts = ['number', 'title', 'status', 'author', 'created_at', 'last_commit', 'commits'];
      if (!validRIPSorts.includes(sortBy)) {
        setSortBy('number');
      }
    } else {
      // Valid EIP/ERC sortBy values
      const validEIPSorts = ['number', 'title', 'status', 'type', 'category', 'created_at', 'updated_at', 'days_in_status', 'linked_prs'];
      if (!validEIPSorts.includes(sortBy)) {
        setSortBy('number');
      }
    }
  }, [isRIP]);

  // ── Fetch filter options ──
  useEffect(() => {
    if (!isRIP) {
      client.standards.getFilterOptions({ repo: repoParam }).then(setFilterOptions).catch(console.error);
    }
  }, [repoParam, isRIP]);

  // ── Fetch KPIs + Charts ──
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (isRIP) {
          const [rk, ra] = await Promise.all([
            client.standards.getRIPKPIs(),
            client.standards.getRIPActivity(),
          ]);
          setRipKpis(rk);
          setRipActivity(ra);
        } else {
          const [k, sd, tr, cat] = await Promise.all([
            client.standards.getKPIs({ repo: repoParam }),
            client.standards.getStatusDistribution({ repo: repoParam }),
            client.standards.getCreationTrends({ repo: repoParam }),
            client.standards.getCategoryBreakdown({ repo: repoParam }),
          ]);
          setKpis(k);
          setStatusDist(sd);
          setTrends(tr);
          setCategoryData(cat);
        }
      } catch (err) {
        console.error("Failed to load KPIs/charts:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [repoParam, isRIP]);

  // ── Fetch table ──
  useEffect(() => {
    const loadTable = async () => {
      try {
        if (isRIP) {
          const res = await client.standards.getRIPsTable({
            search: debouncedSearch || undefined,
            sortBy: sortBy as "number" | "title" | "status" | "author" | "created_at" | "last_commit" | "commits",
            sortDir,
            page,
            pageSize,
          });
          setRipTableData(res.rows);
          setTotalRows(res.total);
          setTotalPages(res.totalPages);
        } else {
          const res = await client.standards.getTable({
            repo: repoParam,
            status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
            type: selectedTypes.length > 0 ? selectedTypes : undefined,
            category: selectedCategories.length > 0 ? selectedCategories : undefined,
            yearFrom,
            yearTo,
            search: debouncedSearch || undefined,
            sortBy: sortBy as "number" | "title" | "status" | "type" | "category" | "created_at" | "updated_at" | "days_in_status" | "linked_prs",
            sortDir,
            page,
            pageSize,
          });
          setTableData(res.rows);
          setTotalRows(res.total);
          setTotalPages(res.totalPages);
        }
      } catch (err) {
        console.error("Failed to load table:", err);
      }
    };
    loadTable();
  }, [
    repoParam,
    isRIP,
    selectedStatuses,
    selectedTypes,
    selectedCategories,
    yearFrom,
    yearTo,
    debouncedSearch,
    sortBy,
    sortDir,
    page,
    pageSize,
  ]);

  // ── CSV Download ──
  const handleCSVDownload = useCallback(async () => {
    try {
      const result = await client.standards.exportCSV({
        repo: repoParam,
        status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
        type: selectedTypes.length > 0 ? selectedTypes : undefined,
        category: selectedCategories.length > 0 ? selectedCategories : undefined,
      });
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export failed:", err);
    }
  }, [repoParam, selectedStatuses, selectedTypes, selectedCategories]);

  // ── Reset filters ──
  const resetFilters = () => {
    setSelectedStatuses([]);
    setSelectedTypes([]);
    setSelectedCategories([]);
    setYearFrom(undefined);
    setYearTo(undefined);
    setSearchQuery("");
    setPage(1);
  };

  const hasActiveFilters =
    selectedStatuses.length > 0 ||
    selectedTypes.length > 0 ||
    selectedCategories.length > 0 ||
    yearFrom !== undefined ||
    yearTo !== undefined ||
    searchQuery.trim() !== "";

  // ── Sort handler ──
  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
    setPage(1);
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <ArrowUpDown className="h-3 w-3 ml-1 text-slate-500" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1 text-cyan-400" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 text-cyan-400" />
    );
  };

  // ── Chart Data Transforms ──
  const stackedStatusData = useMemo(() => {
    const byStatus: Record<string, Record<string, number>> = {};
    for (const d of statusDist) {
      if (!byStatus[d.status]) byStatus[d.status] = {};
      byStatus[d.status][d.repo] = d.count;
    }
    return Object.entries(byStatus).map(([status, repos]) => ({
      status,
      eips: repos.eips ?? 0,
      ercs: repos.ercs ?? 0,
      rips: repos.rips ?? 0,
      total: (repos.eips ?? 0) + (repos.ercs ?? 0) + (repos.rips ?? 0),
    }));
  }, [statusDist]);

  const trendLineData = useMemo(() => {
    const byYear: Record<number, Record<string, number>> = {};
    for (const t of trends) {
      if (!byYear[t.year]) byYear[t.year] = {};
      byYear[t.year][t.repo] = t.count;
    }
    return Object.entries(byYear)
      .map(([year, repos]) => ({
        year: Number(year),
        eips: repos.eips ?? 0,
        ercs: repos.ercs ?? 0,
        rips: repos.rips ?? 0,
      }))
      .sort((a, b) => a.year - b.year);
  }, [trends]);

  const donutData = useMemo(() => {
    const byStatus: Record<string, number> = {};
    for (const d of statusDist) {
      byStatus[d.status] = (byStatus[d.status] ?? 0) + d.count;
    }
    return Object.entries(byStatus).map(([name, value]) => ({
      name,
      value,
    }));
  }, [statusDist]);

  // ── Render helpers ──
  const StatusBadge = ({ status }: { status: string }) => (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: `${STATUS_COLORS[status] ?? "#94a3b8"}20`,
        color: STATUS_COLORS[status] ?? "#94a3b8",
        border: `1px solid ${STATUS_COLORS[status] ?? "#94a3b8"}30`,
      }}
    >
      {status}
    </span>
  );

  const TypeBadge = ({ value }: { value: string | null }) =>
    value ? (
      <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/30">
        {value}
      </span>
    ) : null;

  // ─────────────────────────────────
  // ─── RENDER ──────────────────────
  // ─────────────────────────────────
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* ── Page Header ── */}
      <div className="border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Standards Explorer
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Browse, filter, and analyze Ethereum standards across
                repositories.
              </p>
            </div>
            <button
              onClick={handleCSVDownload}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-700/50 hover:text-white transition-colors"
            >
              <Download className="h-4 w-4" />
              Download CSV
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* ── Repo Tabs ── */}
        <div className="flex items-center gap-2 flex-wrap">
          {(
            [
              { value: "all", label: "All Standards" },
              { value: "eips", label: "EIPs" },
              { value: "ercs", label: "ERCs" },
              { value: "rips", label: "RIPs" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setRepo(tab.value)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200",
                repo === tab.value
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(34,211,238,0.15)]"
                  : "bg-slate-800/30 text-slate-400 border-slate-700/50 hover:text-white hover:border-slate-600"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Filters Bar ── */}
        {!isRIP && (
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-300">
                  Filters
                </span>
                {hasActiveFilters && (
                  <span className="inline-flex items-center rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-300">
                    Active
                  </span>
                )}
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-slate-400 transition-transform",
                  filtersOpen && "rotate-180"
                )}
              />
            </button>

            {filtersOpen && (
              <div className="border-t border-slate-700/50 px-4 py-4 space-y-4">
                {/* Search */}
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by number, title, or author..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-10 pr-10 py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-slate-400 hover:text-white" />
                    </button>
                  )}
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                  {/* Status */}
                  <MultiSelect
                    label="Status"
                    options={filterOptions.statuses}
                    selected={selectedStatuses}
                    onChange={(v) => {
                      setSelectedStatuses(v);
                      setPage(1);
                    }}
                  />

                  {/* Type */}
                  <MultiSelect
                    label="Type"
                    options={filterOptions.types}
                    selected={selectedTypes}
                    onChange={(v) => {
                      setSelectedTypes(v);
                      setPage(1);
                    }}
                  />

                  {/* Category */}
                  <MultiSelect
                    label="Category"
                    options={filterOptions.categories}
                    selected={selectedCategories}
                    onChange={(v) => {
                      setSelectedCategories(v);
                      setPage(1);
                    }}
                  />

                  {/* Year Range */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">
                      Year Range
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="From"
                        min={2015}
                        max={new Date().getFullYear()}
                        value={yearFrom ?? ""}
                        onChange={(e) => {
                          setYearFrom(
                            e.target.value ? Number(e.target.value) : undefined
                          );
                          setPage(1);
                        }}
                        className="w-full py-1.5 px-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                      />
                      <span className="text-slate-500 text-xs">to</span>
                      <input
                        type="number"
                        placeholder="To"
                        min={2015}
                        max={new Date().getFullYear()}
                        value={yearTo ?? ""}
                        onChange={(e) => {
                          setYearTo(
                            e.target.value ? Number(e.target.value) : undefined
                          );
                          setPage(1);
                        }}
                        className="w-full py-1.5 px-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="flex justify-end">
                    <button
                      onClick={resetFilters}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── RIP Search (simple) ── */}
        {isRIP && (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search RIPs by number, title, or author..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-10 py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
          </div>
        ) : (
          <>
            {/* ────── KPI Cards ────── */}
            {isRIP && ripKpis ? (
              <div id="standards-kpis" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  label="Total RIPs"
                  value={ripKpis.total}
                  icon={<FileText className="h-6 w-6 text-cyan-400" />}
                  color="cyan"
                />
                <KPICard
                  label="Active RIPs"
                  value={ripKpis.active}
                  icon={<CheckCircle2 className="h-6 w-6 text-emerald-400" />}
                  color="emerald"
                />
                <KPICard
                  label="Recent Commits (30d)"
                  value={ripKpis.recentCommits}
                  icon={
                    <GitCommitHorizontal className="h-6 w-6 text-amber-400" />
                  }
                  color="amber"
                />
                <KPICard
                  label="Most Active RIP"
                  value={
                    ripKpis.mostActiveRip
                      ? `RIP-${ripKpis.mostActiveRip}`
                      : "N/A"
                  }
                  subtitle={
                    ripKpis.mostActiveTitle
                      ? `${ripKpis.mostActiveCommits} commits`
                      : undefined
                  }
                  icon={<Sparkles className="h-6 w-6 text-purple-400" />}
                  color="purple"
                />
              </div>
            ) : !isRIP && kpis ? (
              <div id="standards-kpis" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  label="Total Standards"
                  value={kpis.total}
                  icon={<FileText className="h-6 w-6 text-cyan-400" />}
                  color="cyan"
                />
                <KPICard
                  label="Active in Review"
                  value={kpis.inReview}
                  icon={<Clock className="h-6 w-6 text-amber-400" />}
                  color="amber"
                />
                <KPICard
                  label="Finalized"
                  value={kpis.finalized}
                  icon={<CheckCircle2 className="h-6 w-6 text-emerald-400" />}
                  color="emerald"
                />
                <KPICard
                  label="New This Year"
                  value={kpis.newThisYear}
                  icon={<Sparkles className="h-6 w-6 text-purple-400" />}
                  color="purple"
                />
              </div>
            ) : null}

            {/* ────── Charts ────── */}
            {isRIP ? (
              /* RIP Activity Over Time */
              <div id="standards-charts" className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4">
                  RIP Activity Over Time
                </h3>
                {ripActivity.length > 0 ? (
                  <ChartContainer
                    config={
                      {
                        commits: {
                          label: "Commits",
                          color: REPO_COLORS.rips,
                        },
                      } satisfies ChartConfig
                    }
                    className="h-[300px] w-full"
                  >
                    <LineChart data={ripActivity}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#334155"
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        tickFormatter={(v: string) => {
                          const [y, m] = v.split("-");
                          return `${m}/${y.slice(2)}`;
                        }}
                      />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="Commits"
                        stroke={REPO_COLORS.rips}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <p className="text-slate-400 text-sm">No data available</p>
                )}
              </div>
            ) : (
              <div id="standards-charts" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Distribution */}
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Status Distribution
                  </h3>
                  {stackedStatusData.length > 0 ? (
                    <ChartContainer
                      config={
                        {
                          eips: {
                            label: "EIPs",
                            color: REPO_COLORS.eips,
                          },
                          ercs: {
                            label: "ERCs",
                            color: REPO_COLORS.ercs,
                          },
                          rips: {
                            label: "RIPs",
                            color: REPO_COLORS.rips,
                          },
                        } satisfies ChartConfig
                      }
                      className="h-[300px] w-full"
                    >
                      <BarChart data={stackedStatusData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#334155"
                        />
                        <XAxis
                          dataKey="status"
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                        />
                        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend
                          wrapperStyle={{ fontSize: 12, color: "#94a3b8" }}
                        />
                        {repo === "all" ? (
                          <>
                            <Bar
                              dataKey="eips"
                              stackId="a"
                              fill={REPO_COLORS.eips}
                              radius={[0, 0, 0, 0]}
                              name="EIPs"
                            />
                            <Bar
                              dataKey="ercs"
                              stackId="a"
                              fill={REPO_COLORS.ercs}
                              name="ERCs"
                            />
                            <Bar
                              dataKey="rips"
                              stackId="a"
                              fill={REPO_COLORS.rips}
                              radius={[4, 4, 0, 0]}
                              name="RIPs"
                            />
                          </>
                        ) : (
                          <Bar
                            dataKey="total"
                            fill={REPO_COLORS[repo] ?? "#34d399"}
                            radius={[4, 4, 0, 0]}
                            name="Count"
                          />
                        )}
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <p className="text-slate-400 text-sm">No data available</p>
                  )}
                </div>

                {/* Status Donut (for single-repo views) */}
                {repo !== "all" ? (
                  <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Status Breakdown
                    </h3>
                    {donutData.length > 0 ? (
                      <ChartContainer
                        config={
                          Object.fromEntries(
                            donutData.map((d) => [
                              d.name,
                              {
                                label: d.name,
                                color:
                                  STATUS_COLORS[d.name] ?? "#94a3b8",
                              },
                            ])
                          ) as ChartConfig
                        }
                        className="h-[300px] w-full"
                      >
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                          >
                            {donutData.map((d, i) => (
                              <Cell
                                key={`cell-${i}`}
                                fill={
                                  STATUS_COLORS[d.name] ?? "#94a3b8"
                                }
                              />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend
                            wrapperStyle={{
                              fontSize: 12,
                              color: "#94a3b8",
                            }}
                          />
                        </PieChart>
                      </ChartContainer>
                    ) : (
                      <p className="text-slate-400 text-sm">
                        No data available
                      </p>
                    )}
                  </div>
                ) : (
                  /* Trends Over Time */
                  <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Standards Created Over Time
                    </h3>
                    {trendLineData.length > 0 ? (
                      <ChartContainer
                        config={
                          {
                            eips: {
                              label: "EIPs",
                              color: REPO_COLORS.eips,
                            },
                            ercs: {
                              label: "ERCs",
                              color: REPO_COLORS.ercs,
                            },
                            rips: {
                              label: "RIPs",
                              color: REPO_COLORS.rips,
                            },
                          } satisfies ChartConfig
                        }
                        className="h-[300px] w-full"
                      >
                        <LineChart data={trendLineData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#334155"
                          />
                          <XAxis
                            dataKey="year"
                            tick={{ fill: "#94a3b8", fontSize: 11 }}
                          />
                          <YAxis
                            tick={{ fill: "#94a3b8", fontSize: 11 }}
                          />
                          <ChartTooltip
                            content={<ChartTooltipContent />}
                          />
                          <Legend
                            wrapperStyle={{
                              fontSize: 12,
                              color: "#94a3b8",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="eips"
                            stroke={REPO_COLORS.eips}
                            strokeWidth={2}
                            name="EIPs"
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="ercs"
                            stroke={REPO_COLORS.ercs}
                            strokeWidth={2}
                            name="ERCs"
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="rips"
                            stroke={REPO_COLORS.rips}
                            strokeWidth={2}
                            name="RIPs"
                            dot={false}
                          />
                        </LineChart>
                      </ChartContainer>
                    ) : (
                      <p className="text-slate-400 text-sm">
                        No data available
                      </p>
                    )}
                  </div>
                )}

                {/* Category Breakdown (always shown for non-RIP) */}
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm lg:col-span-2">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Category Breakdown
                  </h3>
                  {categoryData.length > 0 ? (
                    <ChartContainer
                      config={
                        Object.fromEntries(
                          categoryData.map((d, i) => [
                            d.category,
                            {
                              label: d.category,
                              color:
                                CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                            },
                          ])
                        ) as ChartConfig
                      }
                      className="h-[300px] w-full"
                    >
                      <BarChart data={categoryData} layout="vertical">
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#334155"
                        />
                        <XAxis
                          type="number"
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                        />
                        <YAxis
                          dataKey="category"
                          type="category"
                          width={120}
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Count">
                          {categoryData.map((_, i) => (
                            <Cell
                              key={`cat-${i}`}
                              fill={
                                CATEGORY_COLORS[i % CATEGORY_COLORS.length]
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <p className="text-slate-400 text-sm">No data available</p>
                  )}
                </div>

                {/* Trends Over Time (for single-repo view) */}
                {repo !== "all" && (
                  <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm lg:col-span-2">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Standards Created Over Time
                    </h3>
                    {trendLineData.length > 0 ? (
                      <ChartContainer
                        config={
                          {
                            [repo]: {
                              label: repo.toUpperCase(),
                              color:
                                REPO_COLORS[repo] ?? "#34d399",
                            },
                          } satisfies ChartConfig
                        }
                        className="h-[250px] w-full"
                      >
                        <LineChart data={trendLineData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#334155"
                          />
                          <XAxis
                            dataKey="year"
                            tick={{ fill: "#94a3b8", fontSize: 11 }}
                          />
                          <YAxis
                            tick={{ fill: "#94a3b8", fontSize: 11 }}
                          />
                          <ChartTooltip
                            content={<ChartTooltipContent />}
                          />
                          <Line
                            type="monotone"
                            dataKey={repo}
                            stroke={REPO_COLORS[repo] ?? "#34d399"}
                            strokeWidth={2}
                            name={repo.toUpperCase()}
                            dot={false}
                          />
                        </LineChart>
                      </ChartContainer>
                    ) : (
                      <p className="text-slate-400 text-sm">
                        No data available
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ────── Table ────── */}
            <div id="standards-table" className="rounded-xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  {isRIP ? "RIPs" : "Standards"}{" "}
                  <span className="text-sm font-normal text-slate-400">
                    ({totalRows.toLocaleString()} results)
                  </span>
                </h3>
              </div>

              <div className="overflow-x-auto">
                {isRIP ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700/50 bg-slate-800/20">
                        <TH
                          label="RIP #"
                          col="number"
                          sortBy={sortBy}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                        <TH
                          label="Title"
                          col="title"
                          sortBy={sortBy}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                        <TH
                          label="Status"
                          col="status"
                          sortBy={sortBy}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                        <TH
                          label="Author"
                          col="author"
                          sortBy={sortBy}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                        <TH
                          label="Created"
                          col="created_at"
                          sortBy={sortBy}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                        <TH
                          label="Last Commit"
                          col="last_commit"
                          sortBy={sortBy}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                        <TH
                          label="Commits"
                          col="commits"
                          sortBy={sortBy}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                      </tr>
                    </thead>
                    <tbody>
                      {ripTableData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-12 text-center text-slate-400"
                          >
                            No RIPs found
                          </td>
                        </tr>
                      ) : (
                        ripTableData.map((row) => (
                          <tr
                            key={row.number}
                            className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium text-cyan-300">
                              RIP-{row.number}
                            </td>
                            <td className="px-4 py-3 text-slate-200 max-w-[300px] truncate">
                              {row.title ?? "—"}
                            </td>
                            <td className="px-4 py-3">
                              {row.status ? (
                                <StatusBadge status={row.status} />
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-300 text-xs">
                              {row.author ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-400 text-xs">
                              {row.createdAt ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-400 text-xs">
                              {row.lastCommit ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-300">
                              {row.commits}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700/50 bg-slate-800/20">
                        {repo === "all" && (
                          <TH
                            label="Repo"
                            col="repo"
                            sortBy={sortBy}
                            sortDir={sortDir}
                            onSort={handleSort}
                            noSort
                          />
                        )}
                        <TH
                          label="#"
                          col="number"
                          sortBy={sortBy}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                        <TH
                          label="Title"
                          col="title"
                          sortBy={sortBy}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                        <TH
                          label="Status"
                          col="status"
                          sortBy={sortBy}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                        <TH
                          label="Type"
                          col="type"
                          sortBy={sortBy}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                        <TH
                          label="Category"
                          col="category"
                          sortBy={sortBy}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                        <TH
                          label="Created"
                          col="created_at"
                          sortBy={sortBy}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                        <TH
                          label="Updated"
                          col="updated_at"
                          sortBy={sortBy}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                        <TH
                          label="Days in Status"
                          col="days_in_status"
                          sortBy={sortBy}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                        <TH
                          label="PRs"
                          col="linked_prs"
                          sortBy={sortBy}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                        <th className="px-4 py-3 text-xs font-medium text-slate-400"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={repo === "all" ? 11 : 10}
                            className="py-12 text-center text-slate-400"
                          >
                            No standards found
                          </td>
                        </tr>
                      ) : (
                        tableData.map((row) => {
                          const repoShort = row.repo
                            .split("/")
                            .pop()
                            ?.toLowerCase() ?? "eips";
                          const kind = repoShort === "ercs" ? "ercs" : repoShort === "rips" ? "rips" : "eips";
                          return (
                            <tr
                              key={`${row.repo}-${row.number}`}
                              className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                            >
                              {repo === "all" && (
                                <td className="px-4 py-3">
                                  <span
                                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                                    style={{
                                      backgroundColor: `${REPO_COLORS[kind] ?? "#94a3b8"}20`,
                                      color: REPO_COLORS[kind] ?? "#94a3b8",
                                    }}
                                  >
                                    {kind.toUpperCase()}
                                  </span>
                                </td>
                              )}
                              <td className="px-4 py-3 font-medium text-cyan-300">
                                {row.number}
                              </td>
                              <td
                                className="px-4 py-3 text-slate-200 max-w-[250px] truncate"
                                title={row.title ?? ""}
                              >
                                {row.title ?? "—"}
                              </td>
                              <td className="px-4 py-3">
                                <StatusBadge status={row.status} />
                              </td>
                              <td className="px-4 py-3">
                                <TypeBadge value={row.type} />
                              </td>
                              <td className="px-4 py-3">
                                <TypeBadge value={row.category} />
                              </td>
                              <td className="px-4 py-3 text-slate-400 text-xs">
                                {row.createdAt ?? "—"}
                              </td>
                              <td className="px-4 py-3 text-slate-400 text-xs">
                                {row.updatedAt}
                              </td>
                              <td className="px-4 py-3 text-slate-300">
                                {row.daysInStatus}d
                              </td>
                              <td className="px-4 py-3 text-slate-300">
                                {row.linkedPRs}
                              </td>
                              <td className="px-4 py-3">
                                <a
                                  href={`https://github.com/${row.repo}/blob/master/EIPS/eip-${row.number}.md`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-slate-400 hover:text-cyan-300 transition-colors"
                                  title="View on GitHub"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    Page {page} of {totalPages} ({totalRows.toLocaleString()}{" "}
                    total)
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-md border border-slate-700/50 bg-slate-800/30 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-md border transition-colors",
                            page === pageNum
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                              : "border-slate-700/50 bg-slate-800/30 text-slate-400 hover:text-white"
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      disabled={page >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="p-1.5 rounded-md border border-slate-700/50 bg-slate-800/30 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ──────── Reusable Sub-components ────────

function KPICard({
  label,
  value,
  subtitle,
  icon,
  color,
}: {
  label: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    cyan: "bg-cyan-500/20",
    emerald: "bg-emerald-500/20",
    amber: "bg-amber-500/20",
    purple: "bg-purple-500/20",
  };

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn("rounded-full p-3", colorMap[color] ?? colorMap.cyan)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1.5 relative">
      <label className="text-xs font-medium text-slate-400">{label}</label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-1.5 px-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-md text-slate-300 hover:border-slate-600 transition-colors"
      >
        <span className="truncate">
          {selected.length === 0
            ? `All ${label}`
            : `${selected.length} selected`}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-slate-400 transition-transform shrink-0 ml-2",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-slate-800 border border-slate-700/50 rounded-lg shadow-xl max-h-48 overflow-y-auto scrollbar-thin">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700/50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selected, opt]);
                  } else {
                    onChange(selected.filter((s) => s !== opt));
                  }
                }}
                className="rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500/30"
              />
              <span className="text-sm text-slate-200">{opt}</span>
            </label>
          ))}
          {options.length === 0 && (
            <p className="px-3 py-2 text-xs text-slate-500">No options</p>
          )}
        </div>
      )}
    </div>
  );
}

function TH({
  label,
  col,
  sortBy,
  sortDir,
  onSort,
  noSort,
}: {
  label: string;
  col: string;
  sortBy: string;
  sortDir: string;
  onSort: (col: string) => void;
  noSort?: boolean;
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-xs font-medium text-slate-400 text-left whitespace-nowrap",
        !noSort && "cursor-pointer hover:text-white transition-colors select-none"
      )}
      onClick={noSort ? undefined : () => onSort(col)}
    >
      <span className="inline-flex items-center">
        {label}
        {!noSort &&
          (sortBy === col ? (
            sortDir === "asc" ? (
              <ArrowUp className="h-3 w-3 ml-1 text-cyan-400" />
            ) : (
              <ArrowDown className="h-3 w-3 ml-1 text-cyan-400" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3 ml-1 text-slate-600" />
          ))}
      </span>
    </th>
  );
}

// ──────── Suspense wrapper (Next.js 16 requirement) ────────
export default function StandardsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      }
    >
      <StandardsPageContent />
    </Suspense>
  );
}
