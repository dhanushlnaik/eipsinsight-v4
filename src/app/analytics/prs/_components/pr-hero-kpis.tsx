'use client';

import React from 'react';
import { motion } from 'motion/react';
import { FilePlus, GitMerge, GitPullRequestClosed, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export type RepoFilter = 'eips' | 'ercs' | 'rips' | undefined;

interface HeroKPIsProps {
  data: {
    month: string;
    openPRs: number;
    newPRs: number;
    mergedPRs: number;
    closedUnmerged: number;
    netDelta: number;
  } | null;
  loading?: boolean;
}

const cards = [
  { key: 'openPRs' as const, label: 'Open PRs', icon: FilePlus, desc: 'End-of-period open' },
  { key: 'newPRs' as const, label: 'New PRs', icon: FilePlus, desc: 'Opened this month' },
  { key: 'mergedPRs' as const, label: 'Merged', icon: GitMerge, desc: 'Merged this month' },
  { key: 'closedUnmerged' as const, label: 'Closed (Unmerged)', icon: GitPullRequestClosed, desc: 'Closed without merge' },
  { key: 'netDelta' as const, label: 'Net PR Delta', icon: TrendingUp, desc: 'New − Resolved' },
];

export function PRHeroKPIs({ data, loading }: HeroKPIsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((_, i) => (
          <div key={i} className="rounded-lg border border-cyan-400/20 bg-slate-950/50 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-cyan-400/20 bg-slate-950/50 p-6 text-center text-slate-400 text-sm">
        Select a month to view KPIs
      </div>
    );
  }

  const values: Record<string, number> = {
    openPRs: data.openPRs,
    newPRs: data.newPRs,
    mergedPRs: data.mergedPRs,
    closedUnmerged: data.closedUnmerged,
    netDelta: data.netDelta,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map(({ key, label, icon: Icon, desc }, i) => {
        const value = values[key];
        const isDelta = key === 'netDelta';
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className={cn(
              'rounded-lg border bg-slate-950/50 p-4 transition-all',
              isDelta && value < 0 && 'border-amber-400/20',
              isDelta && value >= 0 && 'border-cyan-400/20',
              !isDelta && 'border-cyan-400/20'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-4 w-4 text-cyan-400/80" />
              <span className="text-xs font-medium text-slate-400">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">
              {isDelta && value >= 0 ? '+' : ''}{value}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{desc}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
