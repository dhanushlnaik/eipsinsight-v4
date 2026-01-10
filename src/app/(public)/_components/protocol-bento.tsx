"use client";

import React from "react";
import { motion } from "motion/react";
import { TrendingUp, ArrowRight, Clock, Activity, Info, Download } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Mock data - replace with actual data later
const activeProposals = {
  total: 245,
  draft: 156,
  review: 89,
  lastCall: 12, // CRITICAL: Last Call is governance-critical
};

const lifecycleData = [
  { stage: "Draft", count: 156, color: "cyan", opacity: "full" },
  { stage: "Review", count: 89, color: "blue", opacity: "full" },
  { stage: "Last Call", count: 12, color: "amber", opacity: "full" }, // NEW: Governance-critical
  { stage: "Final", count: 412, color: "emerald", opacity: "full" },
  { stage: "Stagnant", count: 67, color: "slate", opacity: "dim" }, // NEW: Shows friction
  { stage: "Withdrawn", count: 134, color: "slate", opacity: "dim" },
  { stage: "Living", count: 3, color: "violet", opacity: "full" }, // NEW: Special status (EIP-1, etc.)
];

const standardsMix = [
  { type: "Core", count: 45, percentage: 16, color: "emerald", category: "Standards Track" },
  { type: "ERC", count: 120, percentage: 42, color: "cyan", category: "Standards Track" },
  { type: "Networking", count: 30, percentage: 11, color: "blue", category: "Standards Track" },
  { type: "Interface", count: 25, percentage: 9, color: "violet", category: "Standards Track" },
  { type: "Meta", count: 28, percentage: 10, color: "pink", category: "Meta" }, // NEW: Meta type
  { type: "Informational", count: 30, percentage: 11, color: "slate", category: "Informational" },
  { type: "RIP", count: 8, percentage: 3, color: "orange", category: "RIP" }, // NEW: RIPs
];

const recentChanges = [
  { eip: "7702", from: "Review", to: "Final", days: 2, statusColor: "emerald" },
  { eip: "7691", from: "Draft", to: "Review", days: 3, statusColor: "blue" },
  { eip: "7623", from: "Last Call", to: "Final", days: 1, statusColor: "emerald" },
];

const decisionVelocity = {
  current: 186,
  previous: 214,
  change: -13,
};

const momentumData = [45, 52, 48, 61, 68, 72, 65, 78, 82, 75, 88, 91];

const prsData = [
  { number: "8234", title: "Add EIP-7702: Set EOA account code", author: "lightclient", status: "merged", days: 1 },
  { number: "8227", title: "Update EIP-7623: Increase calldata cost", author: "vbuterin", status: "open", days: 2 },
  { number: "8219", title: "Add EIP-7691: Execution layer withdrawals", author: "adietrichs", status: "merged", days: 3 },
];

const lastCallWatchlist = [
  { eip: "7702", title: "Set EOA account code", deadline: "2026-01-18", daysRemaining: 8 },
  { eip: "7628", "title": "ERC-721 metadata extension", deadline: "2026-01-22", daysRemaining: 12 },
  { eip: "7691", title: "Execution layer triggerable withdrawals", deadline: "2026-01-15", daysRemaining: 5 },
  { eip: "7623", title: "Increase calldata cost", deadline: "2026-01-25", daysRemaining: 15 },
];

const stagnationData = {
  count: 67,
  medianInactivity: 8.5, // months
  topCategories: [
    { type: "ERC", count: 28 },
    { type: "Core", count: 15 },
    { type: "Meta", count: 12 },
  ],
};

export default function ProtocolBento() {
  return (
    <TooltipProvider>
      <section className="relative overflow-hidden bg-background py-16">
        <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <h2 className="dec-title mb-2 bg-gradient-to-br from-emerald-300 via-slate-100 to-cyan-200 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
            Ethereum Proposal Snapshot
          </h2>
          <p className="text-slate-400">Live protocol heartbeat and governance insights</p>
        </motion.div>

        {/* Bento Grid - 4-Column Symmetric Layout
            4 columns × 4 rows on desktop
            Each column = equal width
            Each row = 260px fixed height
            
            LAYOUT:
            Row 1: [Recent]     [Active Proposals] [Last Call]
            Row 2: [Recent]     [Standards Comp.] [Last Call]
            Row 3: [Lifecycle]  [Standards Comp.] [Momentum]
            Row 4: [Lifecycle]  [PRs] [Decision Velocity]
        */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[260px]">
          
          {/* ==================== TOP BAND (Row 1) ==================== */}
          
          {/* Active Proposals - Cols 2-3, Row 1 (WIDE BOX - LEFT: GRAPH, RIGHT: NUMBERS) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="group relative col-span-1 order-2 overflow-hidden rounded-2xl border border-cyan-400/30 bg-gradient-to-b from-cyan-500/10 via-cyan-500/5 to-transparent p-6 shadow-xl backdrop-blur transition hover:border-cyan-400/50 hover:shadow-cyan-500/20 md:col-span-2 lg:col-span-2 lg:col-start-2 lg:row-start-1"
          >
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-blue-500/5" />
            
            <div className="relative z-10 flex h-full flex-col">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
                    Active Proposals
                  </h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="cursor-help">
                        <Info className="h-3 w-3 text-slate-400 transition-colors hover:text-cyan-300" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        EIPs currently in Draft, Review, or Last Call. Represents active governance work.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                {/* Live indicator */}
                <div className="flex items-center gap-1.5">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
                    className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 motion-reduce:animate-none motion-reduce:opacity-100"
                  />
                  <span className="text-xs font-medium text-emerald-300">LIVE</span>
                </div>
              </div>

              {/* Content - LEFT: Ring Chart, RIGHT: Number Breakdown */}
              <div className="flex flex-1 items-center gap-8">
                {/* Left: Ring chart */}
                <div className="flex flex-shrink-0 items-center justify-center">
                  <div className="relative">
                    <svg className="h-36 w-36 lg:h-40 lg:w-40" viewBox="0 0 100 100">
                      {/* Background ring */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-slate-800"
                      />
                      
                      {/* Draft segment */}
                      <motion.circle
                        initial={{ strokeDashoffset: 251.2 }}
                        whileInView={{ strokeDashoffset: 251.2 - (251.2 * activeProposals.draft) / activeProposals.total }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray="251.2"
                        strokeLinecap="round"
                        className="text-cyan-400"
                        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                      />
                      
                      {/* Review segment */}
                      <motion.circle
                        initial={{ strokeDashoffset: 251.2 }}
                        whileInView={{ strokeDashoffset: 251.2 - (251.2 * activeProposals.review) / activeProposals.total }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray="251.2"
                        strokeDashoffset={(251.2 * activeProposals.draft) / activeProposals.total}
                        strokeLinecap="round"
                        className="text-blue-400"
                        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                      />
                      
                      {/* Last Call segment */}
                      <motion.circle
                        initial={{ strokeDashoffset: 251.2 }}
                        whileInView={{ strokeDashoffset: 251.2 - (251.2 * activeProposals.lastCall) / activeProposals.total }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray="251.2"
                        strokeDashoffset={(251.2 * (activeProposals.draft + activeProposals.review)) / activeProposals.total}
                        strokeLinecap="round"
                        className="text-amber-400"
                        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                      />
                    </svg>

                    {/* Center number */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="text-4xl font-bold text-cyan-300 lg:text-5xl"
                      >
                        {activeProposals.total}
                      </motion.span>
                      <span className="mt-1 text-[10px] text-cyan-400/60">in motion</span>
                    </div>
                  </div>
                </div>

                {/* Right: Numbers breakdown */}
                <div className="flex flex-1 flex-col justify-center space-y-6">
                  {/* Row 1: Draft and Review side by side */}
                  <div className="flex items-center justify-center gap-8">
                    <div className="flex items-baseline gap-3">
                      <div className="h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-cyan-300">{activeProposals.draft}</span>
                          <span className="text-sm text-slate-400">Draft</span>
                        </div>
                        <div className="text-xs text-slate-500">{Math.round((activeProposals.draft / activeProposals.total) * 100)}%</div>
                      </div>
                    </div>
                    
                    <div className="flex items-baseline gap-3">
                      <div className="h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-blue-300">{activeProposals.review}</span>
                          <span className="text-sm text-slate-400">Review</span>
                        </div>
                        <div className="text-xs text-slate-500">{Math.round((activeProposals.review / activeProposals.total) * 100)}%</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Row 2: Last Call centered, spanning full width */}
                  <div className="flex justify-center">
                    <div className="flex items-baseline gap-3">
                      <div className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-amber-300">{activeProposals.lastCall}</span>
                          <span className="text-sm text-slate-400">Last Call</span>
                        </div>
                        <div className="text-xs text-slate-500">{Math.round((activeProposals.lastCall / activeProposals.total) * 100)}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Proposal Lifecycle - Col 1, Rows 3-4 (TALL LEFT BOTTOM) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="group relative col-span-1 order-5 overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/5 to-transparent p-6 shadow-lg backdrop-blur transition hover:border-emerald-400/30 lg:col-start-1 lg:row-start-3 lg:row-span-2"
          >
            <div className="relative z-10 flex h-full flex-col">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300">
                    Proposal Lifecycle
                  </h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="cursor-help">
                        <Info className="h-3 w-3 text-slate-400 transition-colors hover:text-emerald-300" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Breakdown of EIPs across all formal lifecycle states defined in EIP-1.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className="flex h-11 w-11 min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-500/10 transition-all hover:border-emerald-400/40 hover:bg-emerald-500/20"
                      onClick={() => {
                        const csv = "status,count\n" + lifecycleData.map(d => `${d.stage},${d.count}`).join("\n");
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "eip-lifecycle.csv";
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="h-3.5 w-3.5 text-emerald-300" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Download proposal counts by lifecycle status</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {/* Content */}
              <div className="flex-1 space-y-2">
                {lifecycleData.map((stage, index) => {
                  const maxCount = Math.max(...lifecycleData.map((d) => d.count));
                  const width = (stage.count / maxCount) * 100;
                  const isDimmed = stage.opacity === "dim";
                  
                  const colorClasses = {
                    cyan: isDimmed ? "bg-cyan-400/20 border-cyan-400/30" : "bg-cyan-400/40 border-cyan-400/50",
                    blue: isDimmed ? "bg-blue-400/20 border-blue-400/30" : "bg-blue-400/40 border-blue-400/50",
                    amber: "bg-amber-400/40 border-amber-400/50",
                    emerald: isDimmed ? "bg-emerald-400/20 border-emerald-400/30" : "bg-emerald-400/40 border-emerald-400/50",
                    slate: "bg-slate-400/15 border-slate-400/25 border-dashed",
                    violet: "bg-violet-400/40 border-violet-400/50",
                    pink: "bg-pink-400/40 border-pink-400/50",
                    orange: "bg-orange-400/40 border-orange-400/50",
                  };
                  
                  const textColors = {
                    cyan: isDimmed ? "text-cyan-300/60" : "text-cyan-300",
                    blue: isDimmed ? "text-blue-300/60" : "text-blue-300",
                    amber: "text-amber-300",
                    emerald: isDimmed ? "text-emerald-300/60" : "text-emerald-300",
                    slate: "text-slate-400/60",
                    violet: "text-violet-300",
                    pink: "text-pink-300",
                    orange: "text-orange-300",
                  };
                  
                  return (
                    <div key={stage.stage} className="flex items-center gap-2">
                      <span className={`w-20 text-[11px] font-medium ${textColors[stage.color as keyof typeof textColors]}`}>
                        {stage.stage}
                      </span>
                      <div className="relative h-5 flex-1 overflow-hidden rounded-md border border-slate-700/50 bg-slate-900/30">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${width}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                          className={`h-full ${colorClasses[stage.color as keyof typeof colorClasses]} ${isDimmed ? 'opacity-60' : ''} border-r-2`}
                        />
                      </div>
                      <span className={`w-10 text-right text-[11px] font-bold ${isDimmed ? 'text-white/40' : 'text-white'}`}>
                        {stage.count}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              {/* Footer with summary stats */}
              <div className="mt-4 space-y-2 border-t border-emerald-400/10 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Total EIPs</span>
                  <span className="text-sm font-bold text-emerald-300">
                    {lifecycleData.reduce((sum, d) => sum + d.count, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Active (Draft+Review)</span>
                  <span className="text-sm font-bold text-cyan-300">
                    {lifecycleData.filter(d => d.stage === 'Draft' || d.stage === 'Review').reduce((sum, d) => sum + d.count, 0)}
                  </span>
                </div>
                <p className="pt-2 text-[10px] text-slate-600">
                  Draft → Review → Last Call → Final
                </p>
              </div>
            </div>
          </motion.div>

          {/* Standards Composition - Cols 2-3, Rows 2-3 (CENTER TILE) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="group relative col-span-2 order-6 overflow-hidden rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-500/5 to-transparent p-6 shadow-lg backdrop-blur transition hover:border-blue-400/30 lg:col-span-2 lg:col-start-2 lg:row-start-2 lg:row-span-2"
          >
            <div className="relative z-10 flex h-full flex-col">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-blue-300">
                    Standards Composition
                  </h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="cursor-help">
                        <Info className="h-3 w-3 text-slate-400 transition-colors hover:text-blue-300" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Distribution of EIPs by proposal type and category.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className="flex h-11 w-11 min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-lg border border-blue-400/20 bg-blue-500/10 transition-all hover:border-blue-400/40 hover:bg-blue-500/20"
                      onClick={() => {
                        const csv = "type,category,count,percentage\n" + standardsMix.map(d => `${d.type},${d.category},${d.count},${d.percentage}`).join("\n");
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "eip-standards-composition.csv";
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="h-3.5 w-3.5 text-blue-300" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Download proposal distribution by type and category</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {/* Content - Donut Chart */}
              <div className="relative flex flex-1 items-center justify-center">
                {/* EIPsInsight Watermark */}
                <div className="absolute bottom-4 right-4 text-[10px] font-medium text-slate-600/40">
                  EIPsInsight
                </div>
                
                <div className="relative">
                  {/* Donut Chart SVG */}
                  <svg className="h-80 w-80 lg:h-96 lg:w-96" viewBox="0 0 100 100">
                    {/* Background ring */}
                    <circle
                      cx="50"
                      cy="50"
                      r="35"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-slate-800/50"
                    />
                    
                    {(() => {
                      const circumference = 2 * Math.PI * 35;
                      
                      return standardsMix.map((standard, index) => {
                        const cumulativeBeforeThis = standardsMix
                          .slice(0, index)
                          .reduce((sum, s) => sum + s.percentage, 0);
                        const offset = circumference - cumulativeBeforeThis * circumference / 100;
                        
                        const colorMap: Record<string, string> = {
                          emerald: "#10b981",
                          cyan: "#22d3ee",
                          blue: "#60a5fa",
                          violet: "#a78bfa",
                          slate: "#94a3b8",
                          pink: "#f472b6",
                          orange: "#fb923c",
                        };
                        
                        return (
                          <Tooltip key={standard.type}>
                            <TooltipTrigger asChild>
                              <motion.circle
                                initial={{ strokeDashoffset: circumference }}
                                whileInView={{ 
                                  strokeDashoffset: circumference - (standard.percentage * circumference / 100)
                                }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, delay: index * 0.15, ease: "easeOut" }}
                                cx="50"
                                cy="50"
                                r="35"
                                fill="none"
                                stroke={colorMap[standard.color as keyof typeof colorMap]}
                                strokeWidth="12"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="butt"
                                className="cursor-pointer transition-all hover:brightness-125"
                                style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                <span className="font-bold">{standard.type}</span>: {standard.count} ({standard.percentage}%)
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      });
                    })()}
                  </svg>
                  
                  {/* Center count */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-white">
                      {standardsMix.reduce((sum, s) => sum + s.count, 0)}
                    </span>
                    <span className="text-xs text-slate-400">Total EIPs</span>
                  </div>
                </div>
                
                {/* Legend - Compact, grouped by category */}
                <div className="mt-4 space-y-2">
                  {/* Standards Track */}
                  <div className="flex flex-wrap gap-2">
                    {standardsMix.filter(s => s.category === "Standards Track").map((standard) => {
                      const colors = {
                        emerald: "bg-emerald-500 shadow-emerald-500/30",
                        cyan: "bg-cyan-500 shadow-cyan-500/30",
                        blue: "bg-blue-500 shadow-blue-500/30",
                        violet: "bg-violet-500 shadow-violet-500/30",
                      };
                      return (
                        <div key={standard.type} className="flex items-center gap-1">
                          <div className={`h-1.5 w-1.5 rounded-full shadow-sm ${colors[standard.color as keyof typeof colors]}`} />
                          <span className="text-[10px] font-medium text-slate-400">
                            {standard.type}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Other types */}
                  <div className="flex flex-wrap gap-2">
                    {standardsMix.filter(s => s.category !== "Standards Track").map((standard) => {
                      const colors = {
                        pink: "bg-pink-500 shadow-pink-500/30",
                        slate: "bg-slate-500 shadow-slate-500/30",
                        orange: "bg-orange-500 shadow-orange-500/30",
                      };
                      return (
                        <div key={standard.type} className="flex items-center gap-1">
                          <div className={`h-1.5 w-1.5 rounded-full shadow-sm ${colors[standard.color as keyof typeof colors]}`} />
                          <span className="text-[10px] font-medium text-slate-400">
                            {standard.type}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ==================== GOVERNANCE DYNAMICS ==================== */}

          {/* Momentum - Col 4, Row 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="group relative col-span-1 order-4 overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/5 to-transparent p-5 shadow-lg backdrop-blur transition hover:border-violet-400/30 lg:col-start-4 lg:row-start-3"
          >
            <div className="relative z-10 flex h-full flex-col">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-violet-300">
                      Momentum
                    </h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="cursor-help">
                          <Info className="h-3 w-3 text-slate-400 transition-colors hover:text-violet-300" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          Rolling activity trend showing proposal throughput over time.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-500">Proposal throughput over time</p>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400">+18%</span>
                </div>
              </div>
              
              {/* Content */}
              <div className="group/graph relative flex-1">
                {/* EIPsInsight Watermark */}
                <div className="absolute bottom-2 right-2 text-[8px] font-medium text-slate-600/30">
                  EIPsInsight
                </div>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative h-full cursor-help">
                      {/* Axis labels */}
                      <div className="absolute left-0 top-0 text-[9px] text-slate-600">Events/month</div>
                      <div className="absolute bottom-0 right-0 text-[9px] text-slate-600">Last 12 months</div>
                      
                      {/* Baseline grid */}
                      <div className="absolute inset-0 flex flex-col justify-between opacity-10">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="h-px bg-slate-500" />
                        ))}
                      </div>
                      
                      {/* Average line */}
                      <div className="absolute inset-0 flex items-center">
                        <div className="h-px w-full border-t border-dashed border-violet-400/30" />
                        <span className="absolute right-2 -mt-4 rounded bg-violet-500/20 px-1 py-0.5 text-[8px] font-medium text-violet-300">
                          Avg: {Math.round(momentumData.reduce((a, b) => a + b, 0) / momentumData.length)}
                        </span>
                      </div>
                      
                      {/* Sparkline */}
                      <svg className="relative h-full w-full" viewBox="0 0 300 80" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="momentum-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgb(167, 139, 250)" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="rgb(167, 139, 250)" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {/* Area fill */}
                        <motion.path
                          initial={{ pathLength: 0, opacity: 0 }}
                          whileInView={{ pathLength: 1, opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, ease: "easeInOut" }}
                          d={`M 0 ${80 - (momentumData[0] / 100) * 80} ${momentumData
                            .map((val, i) => `L ${(i / (momentumData.length - 1)) * 300} ${80 - (val / 100) * 80}`)
                            .join(" ")} L 300 80 L 0 80 Z`}
                          fill="url(#momentum-gradient)"
                        />
                        {/* Line */}
                        <motion.path
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, ease: "easeInOut" }}
                          d={`M 0 ${80 - (momentumData[0] / 100) * 80} ${momentumData
                            .map((val, i) => `L ${(i / (momentumData.length - 1)) * 300} ${80 - (val / 100) * 80}`)
                            .join(" ")}`}
                          fill="none"
                          stroke="rgb(167, 139, 250)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          className="drop-shadow-[0_0_4px_rgba(167,139,250,0.5)]"
                        />
                      </svg>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold">Monthly Activity</p>
                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        {momentumData.slice(-6).map((val, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <span className="text-slate-400">M{momentumData.length - 5 + i}:</span>
                            <span className="font-bold text-violet-300">{val}</span>
                          </div>
                        ))}
                      </div>
                      <p className="pt-1 text-[10px] text-slate-400">
                        Avg: {Math.round(momentumData.reduce((a, b) => a + b, 0) / momentumData.length)} events/month
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {/* Footer */}
              <div className="mt-4 flex items-center justify-between border-t border-violet-400/10 pt-3">
                <span className="text-xs text-slate-400">+12 this month</span>
                <span className="text-xs text-slate-500">Last 12mo</span>
              </div>
            </div>
          </motion.div>

          {/* Recent Changes - Col 1, Rows 1-2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="group relative col-span-1 order-1 overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/5 to-transparent p-5 shadow-lg backdrop-blur transition hover:border-cyan-400/30 lg:col-start-1 lg:row-start-1 lg:row-span-2"
          >
            <div className="relative z-10 flex h-full flex-col">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
                    Recent Changes
                  </h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="cursor-help">
                        <Info className="h-3 w-3 text-slate-400 transition-colors hover:text-cyan-300" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Latest lifecycle transitions recorded in the EIPs repository.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        className="flex h-11 w-11 min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-500/10 transition-all hover:border-cyan-400/40 hover:bg-cyan-500/20"
                        onClick={() => {
                          const csv = "eip,from,to,days_since_change\n" + recentChanges.map(d => `${d.eip},${d.from},${d.to},${d.days}`).join("\n");
                          const blob = new Blob([csv], { type: "text/csv" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "eip-recent-changes.csv";
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download className="h-3.5 w-3.5 text-cyan-300" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Download recent lifecycle transitions</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="flex items-center gap-1">
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
                      className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 motion-reduce:animate-none motion-reduce:opacity-100"
                    />
                    <Activity className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 space-y-3">
                {recentChanges.map((change, index) => {
                  const statusColors = {
                    emerald: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
                    blue: "bg-blue-500/20 text-blue-300 border-blue-400/30",
                    amber: "bg-amber-500/20 text-amber-300 border-amber-400/30",
                    slate: "bg-slate-500/20 text-slate-300 border-slate-400/30",
                  };
                  return (
                    <motion.div
                      key={change.eip}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="group/item cursor-pointer rounded-lg border border-slate-700/50 bg-slate-900/30 p-3 transition-all hover:border-cyan-400/40 hover:bg-slate-900/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-cyan-300">#{change.eip}</span>
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-slate-500">{change.from}</span>
                            <ArrowRight className="h-3 w-3 text-slate-600" />
                            <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${statusColors[change.statusColor as keyof typeof statusColors]}`}>
                              {change.to}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-500">{change.days}d</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              {/* Footer */}
              <p className="mt-4 text-xs text-slate-500">Latest updates</p>
            </div>
          </motion.div>

          {/* Decision Velocity - Cols 3-4, Row 4 (WIDE BOTTOM-RIGHT) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="group relative col-span-1 order-8 overflow-hidden rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-8 shadow-2xl backdrop-blur transition hover:border-emerald-400/40 md:col-span-2 lg:col-span-2 lg:col-start-3 lg:row-start-4"
          >
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400/5 via-transparent to-cyan-500/5" />
            
            <div className="relative z-10 flex h-full flex-col">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300">
                    Decision Velocity
                  </h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="cursor-help">
                        <Info className="h-3 w-3 text-slate-400 transition-colors hover:text-emerald-300" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Median time taken for EIPs to move from Draft to Final.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="mt-2 text-xs text-slate-500">Lower is better ↓ · Reflects governance efficiency</p>
              </div>

              {/* Content - centered */}
              <div className="flex flex-1 flex-col items-center justify-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-center"
                >
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-7xl font-bold text-emerald-300 drop-shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                      {decisionVelocity.current}
                    </span>
                    <span className="text-2xl text-slate-400">days</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">median to finalization</p>
                </motion.div>
                
                {/* Comparison */}
                <div className="mt-12 w-full max-w-xs">
                  <div className="mb-3 flex items-center justify-between text-xs font-medium text-slate-400">
                    <span>This year</span>
                    <span>Last year</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <div className="h-3 overflow-hidden rounded-full bg-slate-800/50 shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: "100%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.6 }}
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-sm shadow-emerald-400/50"
                        />
                      </div>
                      <span className="absolute -top-6 left-0 text-sm font-bold text-emerald-300">
                        {decisionVelocity.current}d
                      </span>
                    </div>
                    <div className="relative flex-1">
                      <div className="h-3 overflow-hidden rounded-full bg-slate-800/50 shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${(decisionVelocity.current / decisionVelocity.previous) * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.6 }}
                          className="h-full bg-slate-500/70"
                        />
                      </div>
                      <span className="absolute -top-6 right-0 text-sm font-bold text-slate-400">
                        {decisionVelocity.previous}d
                      </span>
                    </div>
                  </div>
                </div>

                {/* Improvement badge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="mt-8 flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2"
                >
                  <Clock className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-300">{Math.abs(decisionVelocity.change)}% faster</span>
                  <span className="text-sm text-slate-400">YoY</span>
                </motion.div>
              </div>

              {/* Footer */}
              <div className="mt-8 border-t border-emerald-400/10 pt-4">
                <p className="text-center text-xs text-slate-500">
                  Governance is accelerating
                </p>
              </div>
            </div>
          </motion.div>

          {/* Last Call Watchlist - Col 4, Rows 1-2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="group relative col-span-1 order-3 overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-transparent p-5 shadow-lg backdrop-blur transition hover:border-amber-400/40 lg:col-start-4 lg:row-start-1 lg:row-span-2"
          >
            <div className="relative z-10 flex h-full flex-col">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300">
                    Last Call Watchlist
                  </h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="cursor-help">
                        <Info className="h-3 w-3 text-slate-400 transition-colors hover:text-amber-300" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        EIPs in their final review window before Finalization.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className="flex h-11 w-11 min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-lg border border-amber-400/20 bg-amber-500/10 transition-all hover:border-amber-400/40 hover:bg-amber-500/20"
                      onClick={() => {
                        const csv = "eip,title,deadline,days_remaining\n" + lastCallWatchlist.map(d => `${d.eip},"${d.title}",${d.deadline},${d.daysRemaining}`).join("\n");
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "eip-last-call-watchlist.csv";
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="h-3.5 w-3.5 text-amber-300" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Download Last Call proposals with deadlines</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {/* Content */}
              <div className="flex-1 space-y-2.5">
                {lastCallWatchlist.map((item, index) => {
                  const urgency = item.daysRemaining <= 7 ? "urgent" : "normal";
                  return (
                    <motion.div
                      key={item.eip}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className={`group/item rounded-lg border p-3 transition-all ${
                        urgency === "urgent"
                          ? "border-red-400/30 bg-red-500/10 hover:border-red-400/50 hover:bg-red-500/15"
                          : "border-amber-400/20 bg-amber-500/5 hover:border-amber-400/40 hover:bg-amber-500/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-amber-300">#{item.eip}</span>
                            <span className={`text-[10px] font-bold ${urgency === "urgent" ? "text-red-400" : "text-amber-400"}`}>
                              {item.daysRemaining}d left
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-400 line-clamp-1">{item.title}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[10px] text-slate-500">Deadline</p>
                          <p className="text-[11px] font-medium text-slate-400">{new Date(item.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              {/* Footer */}
              <p className="mt-4 text-xs text-slate-500">Review window closing soon</p>
            </div>
          </motion.div>

          {/* Stagnation Radar - Hidden in main grid, can be shown elsewhere */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="group relative col-span-1 order-7 hidden overflow-hidden rounded-2xl border border-slate-400/20 bg-gradient-to-br from-slate-500/5 to-transparent p-5 shadow-lg backdrop-blur transition hover:border-slate-400/30"
          >
            <div className="relative z-10 flex h-full flex-col">
              {/* Header */}
              <div className="mb-3 flex items-center gap-1.5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Stagnation
                </h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="cursor-help">
                      <Info className="h-3 w-3 text-slate-400 transition-colors hover:text-slate-300" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Draft or Review EIPs inactive for ≥6 months.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {/* Content - Compact */}
              <div className="flex flex-1 items-center justify-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-center"
                >
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold text-slate-300">{stagnationData.count}</span>
                    <span className="text-sm text-slate-500">EIPs</span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">{stagnationData.medianInactivity}mo median</p>
                </motion.div>
              </div>
              
              {/* Footer */}
              <p className="mt-3 text-xs text-slate-500">Need attention</p>
            </div>
          </motion.div>

          {/* PRs - Col 2, Row 4 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="group relative col-span-1 order-9 overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/5 to-transparent p-5 shadow-lg backdrop-blur transition hover:border-emerald-400/30 lg:col-start-2 lg:row-start-4"
          >
            <div className="relative z-10 flex h-full flex-col">
              {/* Header */}
              <div className="mb-3 flex items-center gap-1.5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300">
                  Recent PRs
                </h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="cursor-help">
                      <Info className="h-3 w-3 text-slate-400 transition-colors hover:text-emerald-300" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Latest pull requests to the EIPs repository.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {/* Content */}
              <div className="flex-1 space-y-2">
                {prsData.map((pr, index) => {
                  const statusColors = {
                    merged: "bg-violet-500/20 text-violet-300 border-violet-400/30",
                    open: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
                  };
                  return (
                    <motion.div
                      key={pr.number}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-2.5 transition-all hover:border-emerald-400/40 hover:bg-slate-900/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-emerald-300">#{pr.number}</span>
                            <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-semibold ${statusColors[pr.status as keyof typeof statusColors]}`}>
                              {pr.status}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-400 line-clamp-1">{pr.title}</p>
                        </div>
                        <span className="text-[10px] text-slate-500">{pr.days}d</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              {/* Footer */}
              <p className="mt-3 text-xs text-slate-500">GitHub activity</p>
            </div>
          </motion.div>
        </div>

        {/* How to Contribute Callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 p-6 backdrop-blur lg:p-8"
        >
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h3 className="mb-2 text-lg font-bold text-cyan-300">
                Want to shape Ethereum&apos;s future?
              </h3>
              <p className="text-sm text-slate-400">
                Anyone can propose an EIP. Here&apos;s how to get started:
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="flex items-start gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-300">
                    1
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-300">Read EIP-1</p>
                    <p className="text-[10px] text-slate-500">Understand the process</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-300">
                    2
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-300">Use the template</p>
                    <p className="text-[10px] text-slate-500">Fork ethereum/EIPs repo</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-300">
                    3
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-300">Submit PR</p>
                    <p className="text-[10px] text-slate-500">Open for community review</p>
                  </div>
                </div>
              </div>
            </div>
            <a
              href="https://github.com/ethereum/EIPs"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-300 transition-all hover:border-cyan-400/50 hover:bg-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/20"
            >
              View on GitHub
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
    </TooltipProvider>
  );
}
