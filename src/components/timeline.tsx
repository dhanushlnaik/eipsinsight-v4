'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Simple time-ago formatter
function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
  return `${Math.floor(seconds / 31536000)}y ago`;
}

export interface TimelineEvent {
  id: string;
  type: 'created' | 'updated' | 'comment' | 'review' | 'merge' | 'close' | 'reopen' | 'status_change';
  title: string;
  description?: string;
  author?: {
    login: string;
    avatarUrl: string;
    profileUrl: string;
  };
  timestamp: string; // ISO datetime
  metadata?: Record<string, any>;
}

interface TimelineProps {
  events: TimelineEvent[];
  loading?: boolean;
  error?: string | null;
}

// Color mapping for event types
const eventTypeColors: Record<TimelineEvent['type'], { bg: string; border: string; dot: string; text: string }> = {
  'created': {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-400/40',
    dot: 'bg-cyan-500',
    text: 'text-cyan-700 dark:text-cyan-200',
  },
  'updated': {
    bg: 'bg-blue-500/10',
    border: 'border-blue-400/40',
    dot: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-200',
  },
  'comment': {
    bg: 'bg-slate-500/10',
    border: 'border-slate-400/40',
    dot: 'bg-slate-500',
    text: 'text-slate-700 dark:text-slate-200',
  },
  'review': {
    bg: 'bg-amber-500/10',
    border: 'border-amber-400/40',
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-200',
  },
  'merge': {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-400/40',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-200',
  },
  'close': {
    bg: 'bg-red-500/10',
    border: 'border-red-400/40',
    dot: 'bg-red-500',
    text: 'text-red-700 dark:text-red-200',
  },
  'reopen': {
    bg: 'bg-blue-500/10',
    border: 'border-blue-400/40',
    dot: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-200',
  },
  'status_change': {
    bg: 'bg-purple-500/10',
    border: 'border-purple-400/40',
    dot: 'bg-purple-500',
    text: 'text-purple-700 dark:text-purple-200',
  },
};

const typeLabel: Record<TimelineEvent['type'], string> = {
  'created': 'Created',
  'updated': 'Updated',
  'comment': 'Comment',
  'review': 'Review',
  'merge': 'Merged',
  'close': 'Closed',
  'reopen': 'Reopened',
  'status_change': 'Status Changed',
};

export function Timeline({ events, loading = false, error = null }: TimelineProps) {
  if (error) {
    return (
      <div className="rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-200">
        Failed to load timeline: {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 animate-pulse" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-6 text-center">
        <p className="text-slate-600 dark:text-slate-400">No timeline events</p>
      </div>
    );
  }

  // Sort events chronologically (newest first)
  const sortedEvents = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      {/* Timeline header */}
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Activity Timeline</h3>
        <span className="text-xs text-slate-600 dark:text-slate-400">{events.length} event{events.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Timeline items */}
      <div className="relative space-y-4 pl-8">
        {/* Vertical line */}
        <div className="absolute left-0 top-6 bottom-0 w-px bg-linear-to-b from-cyan-400/40 to-transparent dark:from-cyan-400/20" />

        {sortedEvents.map((event, index) => {
          const colors = eventTypeColors[event.type];
          const timestamp = new Date(event.timestamp);
          const timeAgo = formatTimeAgo(event.timestamp);

          return (
            <div key={event.id} className="relative space-y-2 pb-2">
              {/* Timeline dot */}
              <div className="absolute -left-12 top-0.5 h-4 w-4 rounded-full border-4 border-background ring-4 ring-cyan-500/20 dark:ring-cyan-400/20" style={{ background: colors.dot.split('-')[1] }}>
                <div className="absolute inset-0 rounded-full" style={{ background: colors.dot }} />
              </div>

              {/* Event card */}
              <div className={cn('rounded-lg border px-4 py-3', colors.border, colors.bg)}>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('text-xs font-semibold', colors.text)}>
                        {typeLabel[event.type]}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {timestamp.toLocaleDateString()} {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {event.title}
                    </p>
                  </div>

                  {event.author && (
                    <a
                      href={event.author.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <Avatar className="h-8 w-8 border border-slate-300 dark:border-slate-700 hover:ring-2 hover:ring-cyan-400/50 transition-all">
                        <AvatarImage src={event.author.avatarUrl} alt={event.author.login} />
                        <AvatarFallback className="text-xs font-bold">
                          {event.author.login.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </a>
                  )}
                </div>

                {event.description && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 pl-0 mt-2">
                    {event.description}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-2 text-xs text-slate-600 dark:text-slate-400">
                  {event.author && <span>{event.author.login}</span>}
                  {event.author && <span className="text-slate-400 dark:text-slate-600">•</span>}
                  <span>{timeAgo}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
