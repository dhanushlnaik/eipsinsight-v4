"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CircleHelp } from "lucide-react";
import { CopyLinkButton } from "@/components/header";
import { InlineBrandLoader } from "@/components/inline-brand-loader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function InfoTip({ text, className }: { text: string; className?: string }) {
  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={text}
            className={cn(
              "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[var(--ink-faint)] transition-colors hover:text-[var(--ink)]",
              className
            )}
          >
            <CircleHelp className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs leading-relaxed">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function AnalyticsSectionHeader({
  id,
  index,
  title,
  tooltip,
  action,
  className,
}: {
  id: string;
  index?: string;
  title: string;
  tooltip?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div id={id} className={cn("scroll-mt-20 mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3", className)}>
      <div className="flex min-w-0 items-center gap-2">
        {index && (
          <span className="font-mono text-xs font-semibold tabular-nums text-[var(--brand-strong)]">
            {index}
          </span>
        )}
        <h2 className="font-serif text-lg font-bold tracking-tight text-[var(--ink)] sm:text-xl">
          {title}
        </h2>
        {tooltip && <InfoTip text={tooltip} />}
        <CopyLinkButton sectionId={id} className="h-6 w-6 shrink-0" />
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function ActorAvatar({
  handle,
  size = "sm",
  href,
}: {
  handle: string;
  size?: "xs" | "sm" | "md";
  href?: string;
}) {
  const clean = handle.replace(/^@/, "").trim();
  const dim = size === "xs" ? "h-5 w-5" : size === "md" ? "h-8 w-8" : "h-6 w-6";
  const avatar = (
    <img
      src={`https://github.com/${encodeURIComponent(clean)}.png?size=64`}
      alt={clean}
      loading="lazy"
      className={cn(
        "shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface-2)] object-cover",
        dim
      )}
    />
  );

  if (!href) return avatar;
  return (
    <Link href={href} className="inline-flex shrink-0 items-center gap-2 group">
      {avatar}
      <span className="font-medium text-[var(--ink)] group-hover:text-[var(--brand-strong)] group-hover:underline">
        {clean}
      </span>
    </Link>
  );
}

export function TablePager({
  page,
  total,
  pageSize = 10,
  onPageChange,
}: {
  page: number;
  total: number;
  pageSize?: number;
  onPageChange: (nextPage: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-xs">
      <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
        Showing {start}–{end} of {total.toLocaleString()}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="chip h-7 cursor-pointer gap-1 px-2 text-[11px] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </button>
        <span className="px-2 font-mono text-[11px] tabular-nums text-[var(--ink)]">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="chip h-7 cursor-pointer gap-1 px-2 text-[11px] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function AnalyticsLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-[var(--l-radius)] border border-[var(--border)] bg-[var(--surface)]">
      <InlineBrandLoader size="md" label={label} />
    </div>
  );
}
