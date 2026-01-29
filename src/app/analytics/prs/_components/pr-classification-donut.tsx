'use client';

import React from 'react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  DRAFT: '#8B5CF6',
  TYPO: '#06B6D4',
  NEW_EIP: '#10B981',
  STATUS_CHANGE: '#F59E0B',
  OTHER: '#64748B',
};

interface PRClassificationDonutProps {
  data: Array<{ category: string; count: number }>;
  onDownloadCSV?: () => void;
  onDownloadJSON?: () => void;
}

export function PRClassificationDonut({ data, onDownloadCSV, onDownloadJSON }: PRClassificationDonutProps) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const chartData = data.filter((d) => d.count > 0).map((d) => ({ name: d.category.replace('_', ' '), value: d.count }));

  if (total === 0) {
    return (
      <div className="rounded-lg border border-cyan-400/20 bg-slate-950/50 p-6 text-center text-slate-400 text-sm">
        No open PRs to classify
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
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white mb-1">Open PR Classification</h3>
          <p className="text-xs text-slate-400">End-of-period categories (DRAFT, TYPO, NEW_EIP, STATUS_CHANGE, OTHER)</p>
        </div>
        <div className="flex items-center gap-1">
          {onDownloadCSV && (
            <button
              onClick={onDownloadCSV}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-slate-900/50 px-2.5 py-1.5 text-xs font-medium text-cyan-300 transition-all hover:border-cyan-400/40 hover:bg-cyan-400/10"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          )}
          {onDownloadJSON && (
            <button
              onClick={onDownloadJSON}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-slate-900/50 px-2.5 py-1.5 text-xs font-medium text-cyan-300 transition-all hover:border-cyan-400/40 hover:bg-cyan-400/10"
            >
              <Download className="h-3.5 w-3.5" /> JSON
            </button>
          )}
        </div>
      </div>
      <div className="h-[240px] sm:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name.replace(/\s/g, '_')] ?? CATEGORY_COLORS.OTHER} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '12px',
              }}
              formatter={(value: number) => [value, 'PRs']}
            />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
