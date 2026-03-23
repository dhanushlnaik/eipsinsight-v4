'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { client } from '@/lib/orpc';
import Link from 'next/link';

interface YearData {
  year: number;
  newEIPs: number;
  statusChanges: number;
  activePRs: number;
}

interface SparklineData {
  month: number;
  count: number;
}

export function YearNavigator() {
  const [years, setYears] = useState<YearData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [sparklineData, setSparklineData] = useState<SparklineData[]>([]);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchYears() {
      try {
        const data = await client.explore.getYearsOverview({});
        setYears(data);
        if (data.length > 0) {
          setSelectedYear(data[0].year);
        }
      } catch (err) {
        console.error('Failed to fetch years:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchYears();
  }, []);

  useEffect(() => {
    async function fetchSparkline() {
      if (!selectedYear) return;
      try {
        const data = await client.explore.getYearSparkline({ year: selectedYear });
        setSparklineData(data);
      } catch (err) {
        console.error('Failed to fetch sparkline:', err);
      }
    }
    fetchSparkline();
  }, [selectedYear]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const maxCount = Math.max(...sparklineData.map(d => d.count), 1);
  const totalSparkline = sparklineData.reduce((sum, d) => sum + d.count, 0);
  const tooltipYear = hoveredYear !== null ? years.find(y => y.year === hoveredYear) : null;

  if (loading) {
    return (
      <section className="relative w-full py-8">
        <div className="mx-auto w-full px-3 sm:px-4 lg:px-5 xl:px-6">
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-8 w-48 rounded bg-muted/60" />
            <div className="h-24 rounded-xl bg-muted/50" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full py-8">
      <div className="mx-auto w-full px-3 sm:px-4 lg:px-5 xl:px-6">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-2">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <h2 className="dec-title text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Browse by Year</h2>
        </div>

        {/* Year Scroller */}
        <div className="relative">
          {/* Left scroll button */}
          <button
            onClick={() => scroll('left')}
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 z-10",
              "flex h-10 w-10 items-center justify-center rounded-full",
              "bg-background/95 border border-border backdrop-blur-sm",
              "text-muted-foreground hover:text-foreground hover:border-primary/40",
              "transition-all duration-200"
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Scrollable container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide px-12 py-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {years.map((yearData) => (
              <Link
                key={yearData.year}
                href={`/explore/years?year=${yearData.year}`}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedYear(yearData.year)}
                  onMouseEnter={() => setHoveredYear(yearData.year)}
                  onMouseLeave={() => setHoveredYear(null)}
                  className={cn(
                    "relative flex-shrink-0 px-6 py-4 rounded-xl cursor-pointer",
                    "border transition-all duration-200",
                    selectedYear === yearData.year
                      ? "bg-primary/10 border-primary/45 shadow-md shadow-primary/10 ring-1 ring-primary/25"
                      : "bg-card border-border shadow-sm ring-1 ring-border/60 hover:border-primary/30 hover:shadow-md"
                  )}
                >
                    <span className={cn(
                    "dec-title text-2xl font-bold tracking-tight",
                    selectedYear === yearData.year ? "text-primary" : "text-foreground"
                  )}>
                    {yearData.year}
                  </span>
                  
                  {/* Stats badge */}
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">
                      {yearData.newEIPs} EIPs
                    </span>
                  </div>

                  {/* Tooltip on hover */}
                  <AnimatePresence>
                    {hoveredYear === yearData.year && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={cn(
                          "absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-20",
                          "px-3 py-2 rounded-lg",
                          "bg-popover border border-border shadow-lg",
                          "text-xs text-muted-foreground whitespace-nowrap"
                        )}
                      >
                        <div className="mb-1 font-medium text-foreground">{yearData.year}</div>
                        <div>{yearData.newEIPs} new EIPs</div>
                        <div>{yearData.statusChanges} status changes</div>
                        <div>{yearData.activePRs} active PRs</div>
                        <div className="absolute left-1/2 top-full -mt-1 -translate-x-1/2 border-4 border-transparent border-t-popover" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Right scroll button */}
          <button
            onClick={() => scroll('right')}
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 z-10",
              "flex h-10 w-10 items-center justify-center rounded-full",
              "bg-background/95 border border-border backdrop-blur-sm",
              "text-muted-foreground hover:text-foreground hover:border-primary/40",
              "transition-all duration-200"
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Year Activity Sparkline */}
        {selectedYear && sparklineData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "mt-6 p-4 rounded-xl",
              "bg-card border border-border shadow-sm ring-1 ring-border/50"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">
                Monthly activity for {selectedYear}
              </span>
              <span className="text-xs text-muted-foreground">
                EIPs created or status-touched per month
              </span>
            </div>
            
            {/* Sparkline */}
            <div className="flex items-end gap-1 h-16">
              {sparklineData.map((data, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(data.count / maxCount) * 100}%` }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                    className={cn(
                      "w-full rounded-t",
                      data.count > 0 ? "bg-primary/70" : "bg-muted/40"
                    )}
                    style={{ minHeight: data.count > 0 ? '4px' : '2px' }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
                  </span>
                </div>
              ))}
            </div>
            {totalSparkline === 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                No recorded created/status activity for this year yet.
              </p>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
