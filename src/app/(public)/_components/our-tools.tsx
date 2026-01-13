"use client";

import React from "react";
import { motion } from "motion/react";
import Link from "next/link";
import {
  BarChart3,
  Trophy,
  LayoutDashboard,
  Search,
  FileText,
  Wrench,
  MessageSquare,
  BookOpen,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/header";

const tools = [
  {
    name: "Analytics",
    description: "Comprehensive analytics and insights into Ethereum Standards",
    icon: BarChart3,
    href: "/analytics",
    color: "cyan",
  },
  {
    name: "Editors Leaderboard",
    description: "Top contributors driving Ethereum standards forward",
    icon: Trophy,
    href: "/editors",
    color: "emerald",
  },
  {
    name: "Boards",
    description: "Visualize proposal activity across years and categories",
    icon: LayoutDashboard,
    href: "/boards",
    color: "blue",
  },
  {
    name: "Search by Author",
    description: "Find proposals by specific authors and contributors",
    icon: Search,
    href: "/search",
    color: "cyan",
  },
  {
    name: "All EIPs",
    description: "Browse all Ethereum Improvement Proposals",
    icon: FileText,
    href: "/eips",
    color: "emerald",
  },
  {
    name: "Proposal Builder",
    description: "Create and submit new Ethereum proposals",
    icon: Wrench,
    href: "/builder",
    color: "violet",
  },
  {
    name: "Feedback Form",
    description: "Share your feedback and suggestions",
    icon: MessageSquare,
    href: "/feedback",
    color: "cyan",
  },
  {
    name: "More Resources",
    description: "Additional resources and documentation",
    icon: BookOpen,
    href: "/resources",
    color: "emerald",
  },
  {
    name: "Did you Know",
    description: "Interesting facts and insights about Ethereum",
    icon: Lightbulb,
    href: "/did-you-know",
    color: "amber",
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
    amber: {
      border: "border-amber-400/30",
      bg: "bg-amber-500/10",
      icon: "text-amber-300",
      hover: "hover:border-amber-400/50 hover:bg-amber-500/15",
    },
  };
  return colors[color] || colors.cyan;
};

export default function OurTools() {
  return (
    <>
      <PageHeader
        title="Our Tools"
        description="A high-level overview of Ethereum Standards by Analytics, Editors Leaderboard, Boards, Search by Author, All EIPs, and More Resources."
        sectionId="our-tools"
        className="bg-slate-950/30"
      />
      <section className="relative w-full bg-slate-950/30 py-8 sm:py-12">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool, index) => {
              const colors = getColorClasses(tool.color);
              const Icon = tool.icon;

              return (
                <motion.div
                  key={tool.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  <Link
                    href={tool.href}
                    className={`group relative flex h-full min-h-[160px] flex-col rounded-lg border ${colors.border} ${colors.bg} bg-gradient-to-br from-slate-900/60 via-slate-900/50 to-slate-900/60 p-5 backdrop-blur-sm transition-all duration-300 ${colors.hover} hover:shadow-xl hover:shadow-cyan-500/10`}
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className={`rounded-lg ${colors.bg} p-3 border ${colors.border} shadow-md`}>
                        <Icon className={`h-5 w-5 ${colors.icon} drop-shadow-sm`} />
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-500 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-cyan-400" />
                    </div>

                    <h3 className="mb-2 text-base font-bold text-slate-100 transition-colors group-hover:text-white">
                      {tool.name}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-400">
                      {tool.description}
                    </p>

                    {/* Hover glow effect */}
                    {tool.color === 'emerald' && (
                      <div className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-cyan-500/0 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-15" />
                    )}
                    {tool.color === 'cyan' && (
                      <div className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-br from-cyan-500/0 via-cyan-500/0 to-emerald-500/0 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-15" />
                    )}
                    {tool.color === 'blue' && (
                      <div className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-cyan-500/0 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-15" />
                    )}
                    {tool.color === 'violet' && (
                      <div className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-br from-violet-500/0 via-violet-500/0 to-cyan-500/0 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-15" />
                    )}
                    {tool.color === 'amber' && (
                      <div className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-br from-amber-500/0 via-amber-500/0 to-cyan-500/0 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-15" />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
