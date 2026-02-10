"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Users, FileText, GitPullRequest, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const analyticsSections = [
  {
    title: "EIPs",
    description: "Track proposal lifecycle, status transitions, and category breakdowns",
    href: "/analytics/eips",
    icon: FileText,
    color: "cyan",
  },
  {
    title: "PRs",
    description: "Monitor pull request activity, governance states, and merge velocity",
    href: "/analytics/prs",
    icon: GitPullRequest,
    color: "blue",
  },
  {
    title: "Editors",
    description: "Analyze editor workload, review patterns, and category coverage",
    href: "/analytics/editors",
    icon: UserCheck,
    color: "violet",
  },
  {
    title: "Reviewers",
    description: "Track reviewer contributions, cycles per PR, and repo distribution",
    href: "/analytics/reviewers",
    icon: Users,
    color: "emerald",
  },
  {
    title: "Authors",
    description: "Monitor author activity, success rates, and proposal creation trends",
    href: "/analytics/authors",
    icon: FileText,
    color: "amber",
  },
  {
    title: "Contributors",
    description: "Explore contributor activity, engagement patterns, and live feeds",
    href: "/analytics/contributors",
    icon: Users,
    color: "pink",
  },
];

export default function AnalyticsOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
        <p className="text-slate-400">
          Comprehensive insights into Ethereum standards governance and activity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analyticsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-sm hover:border-slate-600/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  "rounded-lg p-3",
                  section.color === "cyan" && "bg-cyan-500/20",
                  section.color === "blue" && "bg-blue-500/20",
                  section.color === "violet" && "bg-violet-500/20",
                  section.color === "emerald" && "bg-emerald-500/20",
                  section.color === "amber" && "bg-amber-500/20",
                  section.color === "pink" && "bg-pink-500/20",
                )}>
                  <Icon className={cn(
                    "h-6 w-6",
                    section.color === "cyan" && "text-cyan-400",
                    section.color === "blue" && "text-blue-400",
                    section.color === "violet" && "text-violet-400",
                    section.color === "emerald" && "text-emerald-400",
                    section.color === "amber" && "text-amber-400",
                    section.color === "pink" && "text-pink-400",
                  )} />
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-slate-300 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{section.title}</h3>
              <p className="text-sm text-slate-400">{section.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
