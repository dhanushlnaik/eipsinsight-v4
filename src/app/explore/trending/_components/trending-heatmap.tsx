'use client';

import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InlineBrandLoader } from '@/components/inline-brand-loader';

interface DailyActivity {
  date: string;
  value: number;
}

interface HeatmapRow {
  eipNumber: number;
  title: string;
  repo: string;
  totalActivity: number;
  dailyActivity: DailyActivity[];
}

interface TrendingHeatmapProps {
  data: HeatmapRow[];
  loading: boolean;
  windowLabel: string;
  selectedProposal?: string | null;
  onSelectProposal?: (proposal: string) => void;
}

function cellClass(value: number, maxValue: number) {
  if (value <= 0) return 'bg-muted/60';
  const ratio = value / Math.max(maxValue, 1);
  if (ratio >= 0.8) return 'bg-primary';
  if (ratio >= 0.5) return 'bg-primary/75';
  if (ratio >= 0.3) return 'bg-primary/55';
  return 'bg-primary/35';
}

export function TrendingHeatmap({ data, loading, windowLabel, selectedProposal, onSelectProposal }: TrendingHeatmapProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card/60 p-4">
        <div className="flex h-[220px] items-center justify-center">
          <InlineBrandLoader label="Loading matrix..." size="sm" />
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="rounded-xl border border-border bg-card/60 p-8 text-center text-sm text-muted-foreground">
        No activity matrix for current filters.
      </div>
    );
  }

  const maxValue = Math.max(...data.flatMap((row) => row.dailyActivity.map((d) => d.value)), 1);

  return (
    <section className="rounded-xl border border-border bg-card/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Matrix</p>
          <h3 className="dec-title text-lg font-semibold tracking-tight text-foreground">Trending activity matrix ({windowLabel})</h3>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[680px] space-y-1.5">
          {data.map((row) => {
            const proposalKey = `${row.repo}:${row.eipNumber}`;
            const selected = selectedProposal === proposalKey;
            return (
              <div key={proposalKey} className={cn('flex items-center gap-2 rounded-md px-2 py-1', selected ? 'bg-primary/10' : 'hover:bg-muted/30')}>
                <button
                  type="button"
                  onClick={() => onSelectProposal?.(proposalKey)}
                  className="w-28 shrink-0 text-left text-xs font-semibold text-primary hover:underline"
                >
                  {row.repo.toUpperCase()}-{row.eipNumber}
                </button>
                <div className="flex gap-0.5">
                  {row.dailyActivity.map((day) => (
                    <button
                      key={`${proposalKey}-${day.date}`}
                      type="button"
                      onClick={() => onSelectProposal?.(proposalKey)}
                      title={`${day.date}: ${day.value} events`}
                      className={cn('h-3.5 w-3.5 rounded-[3px] transition-transform hover:scale-110', cellClass(day.value, maxValue))}
                    />
                  ))}
                </div>
                <span className="ml-2 w-12 text-right text-xs text-muted-foreground">{row.totalActivity}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
