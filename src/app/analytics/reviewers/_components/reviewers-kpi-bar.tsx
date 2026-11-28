"use client";

import React from "react";
import { AnalyticsKpiCard } from "../../_components/analytics-ui";

interface ReviewersKpiBarProps {
  activeReviewers: number;
  totalReviewers: number;
  totalReviews: number;
  totalPrsTouched: number;
  avgResponseDays: number | null;
  onSelectTab?: (tab: "leaderboard" | "explorer" | "distribution" | "trends") => void;
}

export function ReviewersKpiBar({
  activeReviewers,
  totalReviewers,
  totalReviews,
  totalPrsTouched,
  avgResponseDays,
  onSelectTab,
}: ReviewersKpiBarProps) {
  const activeRate = totalReviewers > 0 ? Math.round((activeReviewers / totalReviewers) * 100) : 0;
  const avgPerReviewer = activeReviewers > 0 ? Math.round(totalReviews / activeReviewers) : 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <AnalyticsKpiCard
        label="Active Reviewers"
        value={`${activeReviewers} / ${totalReviewers}`}
        sub={`${activeRate}% active in window`}
        onClick={onSelectTab ? () => onSelectTab("leaderboard") : undefined}
        href={onSelectTab ? undefined : "#reviewers-tab-content"}
      />
      <AnalyticsKpiCard
        label="PR Reviews Logged"
        value={totalReviews}
        sub={`${avgPerReviewer} avg per active reviewer`}
        onClick={onSelectTab ? () => onSelectTab("explorer") : undefined}
        href={onSelectTab ? undefined : "#reviewers-tab-content"}
      />
      <AnalyticsKpiCard
        label="PRs Touched"
        value={totalPrsTouched}
        sub="Unique PRs with reviewer action"
        onClick={onSelectTab ? () => onSelectTab("distribution") : undefined}
        href={onSelectTab ? undefined : "#reviewers-tab-content"}
      />
      <AnalyticsKpiCard
        label="Median Turnaround"
        value={avgResponseDays != null ? `${avgResponseDays.toFixed(1)}d` : "–"}
        sub="PR open to first review"
        onClick={onSelectTab ? () => onSelectTab("trends") : undefined}
        href={onSelectTab ? undefined : "#reviewers-tab-content"}
      />
    </div>
  );
}
