'use client';

import { Info, GitPullRequest, MessageSquare, RefreshCw, Activity } from 'lucide-react';
import type { TrendingProposalRow } from './trending-list';

interface TrendingScoreInfoProps {
  selected: TrendingProposalRow | null;
  windowLabel: string;
}

export function TrendingScoreInfo({ selected, windowLabel }: TrendingScoreInfoProps) {
  return (
    <section className="rounded-xl border border-border bg-card/60 p-4">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-primary" />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Score model</p>
      </div>
      <h3 className="dec-title mt-1 text-lg font-semibold tracking-tight text-foreground">How trending is computed</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        We combine PR activity, discussion, and governance movement in {windowLabel}.
      </p>

      <div className="mt-3 space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
          <span className="inline-flex items-center gap-1"><GitPullRequest className="h-3.5 w-3.5" />PR events</span>
          <strong className="text-primary">×2</strong>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
          <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />Comments</span>
          <strong className="text-primary">×1</strong>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
          <span className="inline-flex items-center gap-1"><RefreshCw className="h-3.5 w-3.5" />Status changes</span>
          <strong className="text-primary">×3</strong>
        </div>
      </div>

      {selected ? (
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/10 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Selected proposal</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{selected.kind}-{selected.number} · score {selected.score}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {selected.topEvents.map((event) => (
              <span key={event.type} className="rounded-md border border-primary/30 bg-background/50 px-2 py-0.5 text-[11px] text-primary">
                {event.count} {event.type}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Activity className="h-4 w-4" />Select a proposal to see its score breakdown.</span>
        </div>
      )}
    </section>
  );
}
