'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, ExternalLink, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface EIP {
  id: number;
  number: number;
  author: string | null;
  title: string;
  type: string | null;
  status: string;
  category: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  metricCount: number;
  metricLatestAt: string | null;
  prNumber: number | null;
  prRepo: string | null;
  prState: string | null;
  linkedEipNumbers: number[];
}

interface YearEIPTableProps {
  eips: EIP[];
  total: number;
  metricTotal: number;
  mode: 'new_eips' | 'status_changes' | 'pr_activity';
  loading: boolean;
  page: number;
  pageSize: number;
  filters: {
    q: string;
    status: string;
    category: string;
    type: string;
  };
  onFiltersChange: (filters: { q: string; status: string; category: string; type: string }) => void;
  onDownloadReport: () => void;
  onPageChange: (page: number) => void;
}

const statusColors: Record<string, string> = {
  'Draft': 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
  'Review': 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  'Last Call': 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
  'Final': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  'Stagnant': 'bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30',
  'Withdrawn': 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
};

const typeColors: Record<string, string> = {
  'Standards Track': 'text-primary',
  'Meta': 'text-violet-500',
  'Informational': 'text-amber-500',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatPrState(state: string | null): string {
  if (!state) return '-';
  return state.charAt(0).toUpperCase() + state.slice(1).toLowerCase();
}

export function YearEIPTable({
  eips,
  total,
  metricTotal,
  mode,
  loading,
  page,
  pageSize,
  filters,
  onFiltersChange,
  onDownloadReport,
  onPageChange,
}: YearEIPTableProps) {
  const totalPages = Math.ceil(total / pageSize);
  const modeLabel = mode === 'new_eips' ? 'New EIPs' : mode === 'status_changes' ? 'Status Changes' : 'PR Activity';
  const metricLabel = mode === 'new_eips' ? 'Entries' : mode === 'status_changes' ? 'Status Events' : 'PR Entries';
  const isPrMode = mode === 'pr_activity';

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-border bg-card/60 overflow-hidden"
    >
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-border/70">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="dec-title text-xl font-semibold tracking-tight text-foreground">
            {modeLabel} Breakdown
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total} · {metricLabel}: {metricTotal.toLocaleString()}
            </span>
            <button
              type="button"
              onClick={onDownloadReport}
              className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
            >
              <Download className="h-3.5 w-3.5" />
              Download Reports
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/70">
              <th className="px-6 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {isPrMode ? 'PR #' : 'EIP #'}
              </th>
              <th className="px-6 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Title
              </th>
              {!isPrMode && (
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
              )}
              {!isPrMode && (
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
              )}
              {!isPrMode && (
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
              )}
              <th className="px-6 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {isPrMode ? 'Updated' : 'Created'}
              </th>
              {!isPrMode && (
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Updated
                </th>
              )}
              {isPrMode && (
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  PR State
                </th>
              )}
              {isPrMode && (
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Repository
                </th>
              )}
              {isPrMode && (
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  View PR
                </th>
              )}
              {!isPrMode && (
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {metricLabel}
                </th>
              )}
            </tr>
            <tr className="border-b border-border/70 bg-muted/20">
              <th className="px-6 py-2">
                <input value={filters.q} onChange={(e) => onFiltersChange({ ...filters, q: e.target.value })} placeholder="Search number/title/author" className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground" />
              </th>
              <th className="px-6 py-2">
                <input value="" readOnly placeholder="" className="h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-xs text-foreground" />
              </th>
              {!isPrMode && (
                <th className="px-6 py-2">
                  <input value={filters.status} onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })} placeholder="Status" className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground" />
                </th>
              )}
              {!isPrMode && (
                <th className="px-6 py-2">
                  <input value={filters.category} onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })} placeholder="Category" className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground" />
                </th>
              )}
              {!isPrMode && (
                <th className="px-6 py-2">
                  <input value={filters.type} onChange={(e) => onFiltersChange({ ...filters, type: e.target.value })} placeholder="Type" className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground" />
                </th>
              )}
              <th className="px-6 py-2" />
              {!isPrMode && <th className="px-6 py-2" />}
              {isPrMode && (
                <th className="px-6 py-2">
                  <input value={filters.status} onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })} placeholder="PR state" className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground" />
                </th>
              )}
              {isPrMode && (
                <th className="px-6 py-2">
                  <input value={filters.category} onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })} placeholder="Repository" className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground" />
                </th>
              )}
              {isPrMode && <th className="px-6 py-2" />}
              {!isPrMode && <th className="px-6 py-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {eips.length === 0 ? (
              <tr>
                <td colSpan={isPrMode ? 6 : 8} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No proposals match the current breakdown filters.
                </td>
              </tr>
            ) : eips.map((eip, index) => (
              <motion.tr
                key={eip.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                className="hover:bg-muted/40 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  {isPrMode ? (
                    <span className="font-medium text-foreground">PR-{eip.prNumber ?? eip.number}</span>
                  ) : (
                    <Link
                      href={`/eips/${eip.number}`}
                      className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
                    >
                      EIP-{eip.number}
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </Link>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-foreground/90 line-clamp-1 max-w-xs">
                    {eip.title}
                  </span>
                </td>
                {!isPrMode && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "inline-flex px-2.5 py-1 rounded-full text-xs font-medium border",
                      statusColors[eip.status] || statusColors['Draft']
                    )}>
                      {eip.status}
                    </span>
                  </td>
                )}
                {!isPrMode && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {eip.category || '-'}
                  </td>
                )}
                {!isPrMode && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "text-sm",
                      typeColors[eip.type || ''] || 'text-muted-foreground'
                    )}>
                      {eip.type || '-'}
                    </span>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {isPrMode ? formatDate(eip.updatedAt) : formatDate(eip.createdAt)}
                </td>
                {!isPrMode && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(eip.updatedAt)}
                  </td>
                )}
                {isPrMode && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {formatPrState(eip.prState)}
                  </td>
                )}
                {isPrMode && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {(eip.prRepo || '-').toUpperCase()}
                  </td>
                )}
                {isPrMode && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {eip.prNumber && eip.prRepo ? (
                      <Link
                        href={`/pr/${eip.prRepo}/${eip.prNumber}`}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        View PR
                        <ExternalLink className="h-3 w-3 opacity-50" />
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                )}
                {!isPrMode && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-foreground">
                    {eip.metricCount.toLocaleString()}
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-border/70 flex items-center justify-between">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm",
              "border border-border transition-all",
              page === 1
                ? "opacity-50 cursor-not-allowed text-muted-foreground"
                : "text-foreground hover:border-primary/50 hover:text-primary"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
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
                  key={i}
                  onClick={() => onPageChange(pageNum)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-all",
                    pageNum === page
                      ? "bg-primary/15 text-primary border border-primary/40"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm",
              "border border-border transition-all",
              page === totalPages
                ? "opacity-50 cursor-not-allowed text-muted-foreground"
                : "text-foreground hover:border-primary/50 hover:text-primary"
            )}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
