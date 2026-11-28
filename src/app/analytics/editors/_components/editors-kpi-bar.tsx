"use client";

import React from "react";
import { AnalyticsKpiStrip } from "../../_components/analytics-ui";

interface EditorsKpiBarProps {
  totalActions: number;
  activeEditors: number;
  totalEditors: number;
  totalReviews: number;
  avgResponseDays: number | null;
  totalCategories: number;
  thinCategoriesCount: number;
  onSelectTab?: (tab: "leaderboard" | "explorer" | "coverage" | "trends") => void;
}

export function EditorsKpiBar({
  totalActions,
  activeEditors,
  totalEditors,
  totalReviews,
  avgResponseDays,
  totalCategories,
  thinCategoriesCount,
  onSelectTab,
}: EditorsKpiBarProps) {
  const activeRate = totalEditors > 0 ? Math.round((activeEditors / totalEditors) * 100) : 0;
  const reviewPct = totalActions > 0 ? Math.round((totalReviews / totalActions) * 100) : 0;
  const isHealthyCoverage = thinCategoriesCount === 0;

  return (
    <AnalyticsKpiStrip
      columns={5}
      items={[
        {
          label: "Active Editors",
          value: `${activeEditors} / ${totalEditors}`,
          sub: `${activeRate}% active in window`,
          onClick: onSelectTab ? () => onSelectTab("leaderboard") : undefined,
          href: onSelectTab ? undefined : "#editors-tab-content",
        },
        {
          label: "PR Reviews",
          value: totalReviews,
          sub: `${reviewPct}% of total actions`,
          onClick: onSelectTab ? () => onSelectTab("leaderboard") : undefined,
          href: onSelectTab ? undefined : "#editors-tab-content",
        },
        {
          label: "Total Actions",
          value: totalActions,
          sub: "Reviews, comments & commits",
          onClick: onSelectTab ? () => onSelectTab("explorer") : undefined,
          href: onSelectTab ? undefined : "#editors-tab-content",
        },
        {
          label: "Median Latency",
          value: avgResponseDays != null ? `${avgResponseDays.toFixed(1)}d` : "–",
          sub: "PR open to first review",
          onClick: onSelectTab ? () => onSelectTab("trends") : undefined,
          href: onSelectTab ? undefined : "#editors-tab-content",
        },
        {
          label: "Coverage Health",
          value: `${Math.max(0, totalCategories - thinCategoriesCount)} / ${totalCategories}`,
          sub: isHealthyCoverage ? "All categories staffed" : `${thinCategoriesCount} thin categories`,
          onClick: onSelectTab ? () => onSelectTab("coverage") : undefined,
          href: onSelectTab ? undefined : "#editors-tab-content",
        },
      ]}
    />
  );
}
