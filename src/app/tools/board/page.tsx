"use client";

import React, { useState, useEffect } from "react";
import { client } from "@/lib/orpc";
import {
  Loader2, ArrowLeft, Search, X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STATUS_ORDER = ["Draft", "Review", "Last Call", "Final", "Stagnant", "Withdrawn", "Living"];
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Draft: { bg: "bg-cyan-500/10", text: "text-cyan-300", border: "border-cyan-500/30" },
  Review: { bg: "bg-blue-500/10", text: "text-blue-300", border: "border-blue-500/30" },
  "Last Call": { bg: "bg-amber-500/10", text: "text-amber-300", border: "border-amber-500/30" },
  Final: { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/30" },
  Stagnant: { bg: "bg-slate-500/10", text: "text-slate-300", border: "border-slate-500/30" },
  Withdrawn: { bg: "bg-red-500/10", text: "text-red-300", border: "border-red-500/30" },
  Living: { bg: "bg-purple-500/10", text: "text-purple-300", border: "border-purple-500/30" },
};

type BoardItem = {
  eipNumber: number; title: string | null; type: string | null;
  category: string | null; author: string | null; repo: string;
  createdAt: string | null; updatedAt: string | null;
};

export default function BoardPage() {
  const [loading, setLoading] = useState(true);
  const [repo, setRepo] = useState<"eips" | "ercs" | "rips" | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [board, setBoard] = useState<Record<string, BoardItem[]>>({});
  const [filterOptions, setFilterOptions] = useState<{ types: string[]; categories: string[] }>({ types: [], categories: [] });
  const [collapsedColumns, setCollapsedColumns] = useState<string[]>([]);

  useEffect(() => {
    client.tools.getBoardFilterOptions({ repo }).then(setFilterOptions).catch(console.error);
  }, [repo]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await client.tools.getBoardData({
          repo,
          search: search || undefined,
          type: typeFilter || undefined,
          category: catFilter || undefined,
        });
        setBoard(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [repo, search, typeFilter, catFilter]);

  const toggleColumn = (status: string) => {
    setCollapsedColumns((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const totalCards = Object.values(board).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-2">
            <ArrowLeft className="h-4 w-4" />Back to Tools
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-white">EIP / ERC / RIP Board</h1>
              <p className="text-xs text-slate-400">{totalCards.toLocaleString()} proposals loaded</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by number or title..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-52"
                />
                {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="h-3 w-3 text-slate-500" /></button>}
              </div>
              <select value={repo ?? "all"} onChange={(e) => setRepo(e.target.value === "all" ? undefined : e.target.value as "eips" | "ercs" | "rips")}
                className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50">
                <option value="all">All Repos</option>
                <option value="eips">EIPs</option>
                <option value="ercs">ERCs</option>
                <option value="rips">RIPs</option>
              </select>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50">
                <option value="">All Types</option>
                {filterOptions.types.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
                className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50">
                <option value="">All Categories</option>
                {filterOptions.categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="p-4 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-cyan-500" /></div>
        ) : (
          <div className="flex gap-3 min-w-max">
            {STATUS_ORDER.map((status) => {
              const items = board[status] ?? [];
              const colors = STATUS_COLORS[status] ?? STATUS_COLORS.Draft;
              const isCollapsed = collapsedColumns.includes(status);

              return (
                <div key={status} className={cn(
                  "rounded-xl border bg-slate-900/40 backdrop-blur-sm flex flex-col transition-all",
                  colors.border,
                  isCollapsed ? "w-12" : "w-72"
                )}>
                  {/* Column header */}
                  <button
                    onClick={() => toggleColumn(status)}
                    className={cn("px-3 py-3 border-b flex items-center gap-2", colors.border, colors.bg)}
                  >
                    {isCollapsed ? (
                      <span className={cn("text-xs font-bold", colors.text, "writing-mode-vertical [writing-mode:vertical-lr] rotate-180")}>
                        {status} ({items.length})
                      </span>
                    ) : (
                      <>
                        <span className={cn("text-sm font-semibold", colors.text)}>{status}</span>
                        <span className="text-xs text-slate-500 ml-auto">{items.length}</span>
                      </>
                    )}
                  </button>

                  {/* Cards */}
                  {!isCollapsed && (
                    <div className="flex-1 overflow-y-auto max-h-[calc(100vh-200px)] p-2 space-y-2">
                      {items.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">No proposals</p>
                      ) : items.slice(0, 100).map((item) => (
                        <Link
                          key={`${item.repo}-${item.eipNumber}`}
                          href={`/tools/timeline?eip=${item.eipNumber}`}
                          className="block rounded-lg border border-slate-700/30 bg-slate-800/30 p-3 hover:bg-slate-800/50 hover:border-slate-600/50 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="text-xs font-bold text-cyan-300">#{item.eipNumber}</span>
                            <span className="text-[10px] font-medium text-slate-500 uppercase">{item.repo}</span>
                          </div>
                          <p className="text-xs text-slate-200 leading-snug line-clamp-2 mb-2 group-hover:text-white">
                            {item.title || "Untitled"}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.type && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">{item.type}</span>}
                            {item.category && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">{item.category}</span>}
                          </div>
                        </Link>
                      ))}
                      {items.length > 100 && (
                        <p className="text-xs text-slate-500 text-center py-2">+{items.length - 100} more</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
