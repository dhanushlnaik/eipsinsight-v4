"use client";

type NewsItem = {
  id: number;
  title: string;
  summary: string;
  date: string;
  link?: string;
  categories: string[];
  source?: string;
  thumbnail?: string | null;
};


import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Newspaper,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Calendar,
  Tag,
  SlidersHorizontal,
  TrendingUp,
  Clock,
} from "lucide-react";

// ─── Category styling ────────────────────────────────────────────────────────
const colorPalette = [
  "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30",
  "bg-purple-500/10 text-purple-400 border border-purple-500/30",
  "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
  "bg-amber-500/10 text-amber-400 border border-amber-500/30",
  "bg-blue-500/10 text-blue-400 border border-blue-500/30",
  "bg-red-500/10 text-red-400 border border-red-500/30",
  "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30",
];

const getCategoryStyles = (category: string) => {
  const hash = category
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return colorPalette[hash % colorPalette.length];
};


// ─── Helpers ─────────────────────────────────────────────────────────────────
const capitalize = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

const readingTime = (text: string) => {
  const words = text.trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const relativeTime = (dateStr: string) => {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

// ─── StatPill ─────────────────────────────────────────────────────────────────
function StatPill({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2">
      <Icon className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
      <span className="text-slate-400 text-xs">{label}</span>
      <span className="text-white text-xs font-semibold">{value}</span>
    </div>
  );
}

// ─── NewsCard ─────────────────────────────────────────────────────────────────
function NewsCard({ item, index }: { item: NewsItem; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const long = item.summary.length > 220;

  

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: "easeOut" }}
      className="group relative pl-12"
    >
      {/* Dot */}
      <div className="absolute left-[21px] top-5 w-3 h-3 bg-cyan-500 rounded-full border-4 border-slate-950 shadow-md shadow-cyan-500/40 group-hover:scale-125 group-hover:shadow-cyan-400/60 transition-all duration-300" />

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden hover:border-cyan-500/40 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300">
        
        {/* Thumbnail */}
  {item.thumbnail && (
    <div className="relative w-full h-48 overflow-hidden">
      <img
        src={item.thumbnail}
        alt={item.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
    </div>
  )}
        {/* Accent bar */}
        <div className="h-px w-0 group-hover:w-full bg-gradient-to-r from-cyan-500/80 via-cyan-400/30 to-transparent transition-all duration-500" />

        <div className="p-5 md:p-6">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <Calendar className="h-3 w-3" />
              {formatDate(item.date)}
            </span>
            <span className="text-slate-700">·</span>
            <span className="text-xs text-slate-500">{relativeTime(item.date)}</span>
            <span className="text-slate-700">·</span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              {readingTime(item.summary)}
            </span>
            {item.source && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-xs font-medium text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700/40">
                  {item.source}
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <a
            href={item.link || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link inline-flex items-start gap-2 mb-3"
          >
            <h3 className="text-base md:text-lg font-semibold text-white leading-snug group-hover/link:text-cyan-400 transition-colors duration-200">
              {item.title}
            </h3>
            <ExternalLink className="h-3.5 w-3.5 mt-1 shrink-0 opacity-0 group-hover/link:opacity-60 transition-opacity text-cyan-400" />
          </a>

          {/* Summary */}
          <p className={`text-slate-400 text-sm leading-relaxed ${expanded ? "" : "line-clamp-3"}`}>
            {item.summary}
          </p>
          {long && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1.5 text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
            >
              {expanded ? "Show less ↑" : "Read more ↓"}
            </button>
          )}

          {/* Category badges */}
          {item.categories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {item.categories.map((cat) => (
                <span
                  key={cat}
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${getCategoryStyles(cat)}`}
                >
                  <Tag className="h-2.5 w-2.5 opacity-60" />
                  {capitalize(cat)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 12;

export default function NewsClient({ updates }: { updates: NewsItem[] }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setCurrentPage(1); }, [search, categoryFilter, sortOrder]);

  const allCategories = Array.from(
    new Set(updates.flatMap((i) => i.categories.map((c) => c.toLowerCase())))
  ).sort();

  const filteredUpdates = updates
    .filter((item) => {
      const matchesCat =
        categoryFilter === "all" ||
        item.categories.some((c) => c.toLowerCase() === categoryFilter);
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.categories.some((c) => c.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    })
    .sort((a, b) => {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return sortOrder === "latest" ? diff : -diff;
    });

  const totalPages = Math.max(1, Math.ceil(filteredUpdates.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedUpdates = filteredUpdates.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const grouped = paginatedUpdates.reduce((acc: Record<number, NewsItem[]>, item) => {
    const year = new Date(item.date).getFullYear();
    acc[year] = acc[year] || [];
    acc[year].push(item);
    return acc;
  }, {});

  const latestDate =
    updates.length > 0
      ? new Date(Math.max(...updates.map((i) => new Date(i.date).getTime())))
      : null;

  const hasFilters = search || categoryFilter !== "all" || sortOrder !== "latest";
  const clearFilters = () => { setSearch(""); setCategoryFilter("all"); setSortOrder("latest"); };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pageNumbers: (number | "…")[] = (() => {
    const range: (number | "…")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
    } else {
      range.push(1);
      if (safePage > 3) range.push("…");
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) range.push(i);
      if (safePage < totalPages - 2) range.push("…");
      range.push(totalPages);
    }
    return range;
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute top-0 right-1/4 w-64 h-64 bg-slate-600/5 rounded-full blur-2xl -translate-y-1/3" />
        </div>

        <div className="container mx-auto px-4 py-12 relative">
          <Link
            href="/resources"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Resources
          </Link>

          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-cyan-400" />
              </div>
              <span className="text-xs text-cyan-400 font-medium tracking-widest uppercase">
                Live Feed
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
              EIP Ecosystem{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-600">
                News
              </span>
            </h1>

            <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-2xl">
              Track Ethereum Improvement Proposals, governance updates, protocol
              upgrades, and major ecosystem milestones — all in one structured timeline.
            </p>

            <div className="flex flex-wrap gap-3">
              <StatPill icon={Newspaper} label="Updates" value={updates.length} />
              {latestDate && (
                <StatPill
                  icon={Calendar}
                  label="Last updated"
                  value={latestDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                />
              )}
              <StatPill icon={Tag} label="Categories" value={allCategories.length} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Sticky Filters ───────────────────────────────────────────────── */}
      <div ref={topRef} />
      <section className="sticky top-0 z-20 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search updates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg pl-9 pr-8 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              <SlidersHorizontal className="h-4 w-4 text-slate-500 hidden sm:block" />

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition"
              >
                <option value="all">All Categories</option>
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>{capitalize(cat)}</option>
                ))}
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
                className="bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition"
              >
                <option value="latest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>

              <AnimatePresence>
                {hasFilters && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition px-2.5 py-2 rounded-lg border border-slate-700/60 hover:border-slate-600 bg-slate-900/40"
                  >
                    <X className="h-3 w-3" />
                    Clear
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>
              <span className="text-white font-medium">{filteredUpdates.length}</span>{" "}
              {filteredUpdates.length === 1 ? "update" : "updates"}
            </span>
            {categoryFilter !== "all" && (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {capitalize(categoryFilter)}
              </span>
            )}
            {search && (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                "{search}"
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Timeline ─────────────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-12 pb-24">
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/40 via-slate-700/50 to-transparent" />

          {/* Empty state */}
          <AnimatePresence>
            {filteredUpdates.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="pl-12 py-24 text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/60 border border-slate-700 mb-6">
                  <Newspaper className="h-7 w-7 text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No updates found</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">
                  Try adjusting your search or removing filters.
                </p>
                <button onClick={clearFilters} className="text-sm text-cyan-400 hover:text-cyan-300 transition">
                  Clear all filters →
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Year groups */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${safePage}-${categoryFilter}-${sortOrder}-${search}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {Object.entries(grouped)
                .sort(([a], [b]) => sortOrder === "latest" ? Number(b) - Number(a) : Number(a) - Number(b))
                .map(([year, items]) => (
                  <div key={year} className="mb-16">
                    <div className="pl-12 mb-8 flex items-center gap-4">
                      <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{year}</h2>
                      <div className="flex-1 h-px bg-gradient-to-r from-slate-700/80 to-transparent" />
                      <span className="text-xs text-slate-500 bg-slate-800/60 border border-slate-700/50 px-2.5 py-1 rounded-full">
                        {(items as NewsItem[]).length} update{(items as NewsItem[]).length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="space-y-6">
                      {(items as NewsItem[]).map((item, i) => (
                        <NewsCard key={item.id} item={item} index={i} />
                      ))}
                    </div>
                  </div>
                ))}
            </motion.div>
          </AnimatePresence>

          {/* ── Pagination ─────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="pl-12 mt-16 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm text-slate-500 order-2 sm:order-1">
                Page <span className="text-white font-medium">{safePage}</span> of{" "}
                <span className="text-white font-medium">{totalPages}</span>
                {" · "}
                <span className="text-slate-400">{filteredUpdates.length} results</span>
              </span>

              <div className="flex items-center gap-1 order-1 sm:order-2">
                <button
                  disabled={safePage === 1}
                  onClick={() => goToPage(safePage - 1)}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-slate-800/60 border border-slate-700/60 rounded-lg text-slate-300 hover:text-white hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>

                <div className="flex items-center gap-1 mx-1">
                  {pageNumbers.map((p, i) =>
                    p === "…" ? (
                      <span key={`ell-${i}`} className="px-2 text-slate-600 text-sm">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => goToPage(p as number)}
                        className={`w-9 h-9 text-sm rounded-lg border transition ${
                          p === safePage
                            ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 font-semibold"
                            : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-500"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>

                <button
                  disabled={safePage === totalPages}
                  onClick={() => goToPage(safePage + 1)}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-slate-800/60 border border-slate-700/60 rounded-lg text-slate-300 hover:text-white hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}