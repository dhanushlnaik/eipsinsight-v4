'use client';

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useTheme } from 'next-themes';

type UpgradeKey = 'pectra' | 'fusaka' | 'glamsterdam' | 'hegota';

interface TimelineUpgrade {
  name: string;
  key: UpgradeKey;
  date: string;
  color: string;
  isPast: boolean;
}

interface HorizontalUpgradeTimelineProps {
  selectedUpgrade?: UpgradeKey;
  onUpgradeClick?: (upgrade: UpgradeKey) => void;
  className?: string;
}

const MotionDiv = motion.div;

const upgrades: TimelineUpgrade[] = [
  {
    name: 'Previous Upgrades',
    key: 'pectra',
    date: '2015 – 2024',
    color: '#6B7280',
    isPast: true,
  },
  {
    name: 'Pectra',
    key: 'pectra',
    date: 'May 7, 2025',
    color: '#DC2626',
    isPast: true,
  },
  {
    name: 'Fusaka',
    key: 'fusaka',
    date: 'Dec 3, 2025',
    color: '#10B981',
    isPast: true,
  },
  {
    name: 'Glamsterdam',
    key: 'glamsterdam',
    date: '2026',
    color: '#8B5CF6',
    isPast: false,
  },
  {
    name: 'Hegotá',
    key: 'hegota',
    date: 'TBD',
    color: '#F59E0B',
    isPast: false,
  },
];

export function HorizontalUpgradeTimeline({
  selectedUpgrade = 'fusaka',
  onUpgradeClick,
  className,
}: HorizontalUpgradeTimelineProps) {
  const { resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme === 'dark';
  const currentIndex = upgrades.findIndex((u) => u.key === 'fusaka');
  // We are between Fusaka (index 2) and Glamsterdam (index 3)
  const transitionIndex = 2; // Index of the line between Fusaka and Glamsterdam

  return (
    <div
      className={cn(
        'relative overflow-x-auto rounded-2xl border border-slate-200 dark:border-cyan-400/20 bg-gradient-to-br from-white via-slate-50 to-cyan-50/40 dark:from-slate-950/70 dark:via-slate-950/90 dark:to-slate-950 p-4 shadow-[0_14px_28px_rgba(15,23,42,0.12)] dark:shadow-[0_18px_40px_rgba(8,47,73,0.5)] sm:p-5 md:p-6',
        className,
      )}
    >
      <div className="flex min-w-max items-center justify-between gap-3 px-1 sm:gap-4 sm:px-2 md:gap-6">
        {upgrades.map((upgrade, index) => {
          const isSelected = selectedUpgrade === upgrade.key && index !== 0;
          const isBeforeCurrent = index < currentIndex;
          const isTransitionLine = index === transitionIndex;

          return (
            <React.Fragment key={`${upgrade.key}-${index}`}>
              <Link
                href={
                  index === 0
                    ? '/upgrade'
                    : upgrade.key === 'pectra'
                      ? '/upgrade/pectra'
                      : upgrade.key === 'fusaka'
                        ? '/upgrade/fusaka'
                        : upgrade.key === 'glamsterdam'
                          ? '/upgrade/glamsterdam'
                          : upgrade.key === 'hegota'
                            ? '/upgrade/hegota'
                            : '/upgrade'
                }
                className={cn(
                  'relative z-10 flex flex-col items-center',
                  index === 0 ? 'cursor-default' : 'cursor-pointer',
                )}
              >
                <MotionDiv
                  whileHover={index > 0 ? { scale: 1.06, y: -4 } : {}}
                  whileTap={index > 0 ? { scale: 0.96 } : {}}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  onClick={(e) => {
                    if (index > 0 && onUpgradeClick) {
                      e.preventDefault();
                      onUpgradeClick(upgrade.key);
                    }
                  }}
                  className="w-full"
                >
                <div
                  className={cn(
                    'relative rounded-xl px-3 py-2.5 text-center text-xs font-semibold tracking-tight shadow-sm sm:px-4 sm:py-3 sm:text-sm md:px-5 md:py-3.5 md:text-base',
                    index === 0
                      ? 'border border-slate-300 dark:border-slate-700/60 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800/80 dark:to-slate-900/80 text-slate-700 dark:text-slate-300/80 shadow-[0_3px_10px_rgba(15,23,42,0.12)] dark:shadow-none'
                      : 'border border-slate-300 dark:border-slate-800/70 bg-gradient-to-br from-white to-slate-100 dark:from-slate-900/80 dark:to-slate-950/95 text-slate-800 dark:text-slate-100 shadow-[0_4px_14px_rgba(15,23,42,0.08)] dark:shadow-none',
                    !isSelected &&
                      index !== 0 &&
                      'hover:border-cyan-500/45 hover:bg-cyan-50 dark:hover:bg-slate-900/95 hover:text-cyan-800 dark:hover:text-cyan-50 hover:shadow-[0_10px_24px_rgba(8,145,178,0.18)] dark:hover:shadow-none',
                  )}
                  style={
                    isSelected
                      ? {
                          background: isDarkTheme
                            ? `linear-gradient(135deg, ${upgrade.color}, #0f172a)`
                            : `linear-gradient(135deg, ${upgrade.color}, #065f46)`,
                          boxShadow: isDarkTheme
                            ? `0 14px 45px ${upgrade.color}55, 0 8px 20px ${upgrade.color}40`
                            : `0 12px 30px ${upgrade.color}45, 0 6px 16px rgba(6,95,70,0.24)`,
                          borderColor: upgrade.color,
                          color: '#ecfeff',
                        }
                      : undefined
                  }
                >
                  <div className="whitespace-nowrap">{upgrade.name}</div>
                  {isBeforeCurrent && index > 0 && (
                    <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white dark:border-slate-950 bg-emerald-500 dark:bg-emerald-400 shadow-md shadow-emerald-400/60 sm:h-3.5 sm:w-3.5" />
                  )}
                </div>

                  <div className="mt-1.5 flex flex-col items-center gap-1 sm:mt-2">
                    <div className="text-[10px] font-semibold tracking-wide text-slate-600 dark:text-slate-400 sm:text-xs md:text-sm">
                      {upgrade.date}
                    </div>
                  </div>
                </MotionDiv>
              </Link>

              {index < upgrades.length - 1 && (
                <div
                  className="relative mx-2 h-1.5 flex-1 rounded-full bg-slate-300 dark:bg-slate-800/80 shadow-inner sm:mx-3 sm:h-1.5 md:mx-6 md:h-2"
                  style={{ minWidth: '32px', maxWidth: '220px' }}
                >
                  {/* Completed segments (fully green) */}
                  {isBeforeCurrent && (
                    <MotionDiv
                      className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.6)]"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  )}

                  {/* Transition segment (partial progress between Fusaka and Glamsterdam) */}
                  {isTransitionLine && (
                    <>
                      <MotionDiv
                        className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.8)]"
                        initial={{ width: '0%' }}
                        animate={{ width: '60%' }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                      />
                      {/* Compact "We are here" indicator positioned on the transition line */}
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-start" style={{ paddingLeft: '60%' }}>
                        <MotionDiv
                          className="relative -translate-x-1/2"
                          animate={{ 
                            scale: [1, 1.03, 1],
                            y: [0, -1.5, 0]
                          }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <div className="relative whitespace-nowrap rounded-md border border-emerald-400/25 bg-emerald-500/85 backdrop-blur-sm px-1.5 py-0.5 text-[7px] font-medium text-emerald-50/95 shadow-sm shadow-emerald-500/40 sm:px-2 sm:py-0.5 sm:text-[8px] md:px-2 md:py-1 md:text-[9px]">
                            <span className="mr-0.5 text-[6px] sm:text-[7px] md:text-[8px]">📍</span>
                            <span className="hidden sm:inline">We are here</span>
                            <span className="sm:hidden">Here</span>
                          </div>
                          {/* Tiny arrow pointing down */}
                          <div 
                            className="absolute left-1/2 top-full -translate-x-1/2 mt-0.5"
                            style={{
                              width: 0,
                              height: 0,
                              borderLeft: '2.5px solid transparent',
                              borderRight: '2.5px solid transparent',
                              borderTop: '3.5px solid #10B981',
                              filter: 'drop-shadow(0 1px 2px rgba(16, 185, 129, 0.25))',
                            }}
                          />
                        </MotionDiv>
                      </div>
                    </>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="pointer-events-none absolute -right-1 top-1/2 hidden -translate-y-1/2 md:block">
        <MotionDiv
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="h-0 w-0"
            style={{
              borderTop: '10px solid transparent',
              borderBottom: '10px solid transparent',
              borderLeft: '16px solid rgba(148, 163, 184, 0.9)',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
            }}
          />
        </MotionDiv>
      </div>
    </div>
  );
}
