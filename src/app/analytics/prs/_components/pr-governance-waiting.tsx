'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATE_COLORS: Record<string, string> = {
  WAITING_ON_EDITOR: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300',
  WAITING_ON_AUTHOR: 'border-amber-400/30 bg-amber-500/10 text-amber-300',
  STALLED: 'border-rose-400/30 bg-rose-500/10 text-rose-300',
  DRAFT: 'border-violet-400/30 bg-violet-500/10 text-violet-300',
  NO_STATE: 'border-slate-500/30 bg-slate-500/10 text-slate-400',
};

interface PRGovernanceWaitingProps {
  data: Array<{
    state: string;
    label: string;
    count: number;
    medianWaitDays: number | null;
    oldestPRNumber: number | null;
    oldestWaitDays: number | null;
  }>;
  repoName?: string;
}

export function PRGovernanceWaiting({ data, repoName }: PRGovernanceWaitingProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-cyan-400/20 bg-slate-950/50 p-6 text-center text-slate-400 text-sm">
        No governance state data
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-lg border border-cyan-400/20 bg-slate-950/50 backdrop-blur-sm p-4 sm:p-5"
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white mb-1">Governance Waiting State (Open PRs)</h3>
        <p className="text-xs text-slate-400">Waiting on Editor, Author, Bot/CI, Stalled, No State — with median wait and oldest PR</p>
      </div>
      <div className="space-y-3">
        {data.map((row) => (
          <div
            key={row.state}
            className={cn(
              'rounded-lg border p-3 transition-all',
              STATE_COLORS[row.state] ?? STATE_COLORS.NO_STATE
            )}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-sm font-medium">{row.label}</span>
              <span className="text-lg font-bold tabular-nums">{row.count}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
              {row.medianWaitDays != null && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Median wait: {row.medianWaitDays}d
                </span>
              )}
              {row.oldestPRNumber != null && row.oldestWaitDays != null && (
                <a
                  href={`https://github.com/${repoName ?? 'ethereum/EIPs'}/pull/${row.oldestPRNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-cyan-400 hover:underline"
                >
                  <AlertCircle className="h-3 w-3" />
                  Oldest: #{row.oldestPRNumber} ({row.oldestWaitDays}d)
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
