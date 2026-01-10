"use client";

import React from "react";
import { motion } from "motion/react";
import Link from "next/link";
import {
  Search,
  BarChart3,
  GitBranch,
  Users,
  FileText,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

const tools = [
  {
    name: "Proposal Explorer",
    description: "Explore any EIP with full lifecycle context",
    icon: Search,
    href: "/eips",
    color: "emerald",
  },
  {
    name: "Governance Timeline",
    description: "Follow discussions, PRs, and decisions over time",
    icon: GitBranch,
    href: "/timeline",
    color: "cyan",
  },
  {
    name: "Analytics Boards",
    description: "Visualize proposal activity across years and categories",
    icon: BarChart3,
    href: "/dashboard",
    color: "blue",
  },
  {
    name: "Editors & Reviewers",
    description: "Understand who drives standards forward",
    icon: Users,
    href: "/contributors",
    color: "violet",
  },
  {
    name: "Search & Filters",
    description: "Find EIPs by author, status, type, or keyword",
    icon: FileText,
    href: "/search",
    color: "cyan",
  },
  {
    name: "Trending Proposals",
    description: "See what's active and gaining momentum",
    icon: TrendingUp,
    href: "/trending",
    color: "emerald",
  },
];

const getColorClasses = (color: string) => {
  const colors: Record<string, { border: string; bg: string; icon: string; hover: string }> = {
    emerald: {
      border: "border-emerald-400/30",
      bg: "bg-emerald-500/10",
      icon: "text-emerald-300",
      hover: "hover:border-emerald-400/50 hover:bg-emerald-500/15",
    },
    cyan: {
      border: "border-cyan-400/30",
      bg: "bg-cyan-500/10",
      icon: "text-cyan-300",
      hover: "hover:border-cyan-400/50 hover:bg-cyan-500/15",
    },
    blue: {
      border: "border-blue-400/30",
      bg: "bg-blue-500/10",
      icon: "text-blue-300",
      hover: "hover:border-blue-400/50 hover:bg-blue-500/15",
    },
    violet: {
      border: "border-violet-400/30",
      bg: "bg-violet-500/10",
      icon: "text-violet-300",
      hover: "hover:border-violet-400/50 hover:bg-violet-500/15",
    },
  };
  return colors[color] || colors.cyan;
};

export default function OurTools() {
  return (
    <section className="relative overflow-hidden bg-background py-16">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_50%,rgba(52,211,153,0.12),transparent_45%)]" />

      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="dec-title mb-3 bg-gradient-to-br from-emerald-300 via-slate-100 to-cyan-200 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
            Our Tools
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-300">
            Everything you need to explore, analyze, and contribute to Ethereum proposals
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool, index) => {
            const colors = getColorClasses(tool.color);
            const Icon = tool.icon;

            return (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Link
                  href={tool.href}
                  className={`group block h-full rounded-2xl border ${colors.border} ${colors.bg} p-6 backdrop-blur transition ${colors.hover}`}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className={`rounded-lg ${colors.bg} p-3`}>
                      <Icon className={`h-6 w-6 ${colors.icon}`} />
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                  </div>

                  <h3 className="dec-title mb-2 text-lg font-semibold text-slate-50">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-slate-400">{tool.description}</p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
