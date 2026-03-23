'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Eye, Users, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { client } from '@/lib/orpc';
import Link from 'next/link';
import { CopyLinkButton } from '@/components/header';

interface RoleCount {
  role: string;
  uniqueActors: number;
  totalActions: number;
}

interface TopActor {
  actor: string;
  actions: number;
}

const roleConfig: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  color: {
    border: string;
    bg: string;
    text: string;
    iconBg: string;
    icon: string;
  };
}> = {
  'EDITOR': {
    icon: Shield,
    label: 'Editors',
    description: 'Maintain standards and review proposals',
    color: {
      border: 'border-primary/25',
      bg: 'from-primary/10 via-background/70 to-background/70',
      text: 'text-foreground',
      iconBg: 'bg-primary/10',
      icon: 'text-primary',
    },
  },
  'REVIEWER': {
    icon: Eye,
    label: 'Reviewers',
    description: 'Provide feedback and technical review',
    color: {
      border: 'border-primary/25',
      bg: 'from-primary/10 via-background/70 to-background/70',
      text: 'text-foreground',
      iconBg: 'bg-primary/10',
      icon: 'text-primary',
    },
  },
  'CONTRIBUTOR': {
    icon: Users,
    label: 'Contributors',
    description: 'Author and contribute to proposals',
    color: {
      border: 'border-primary/25',
      bg: 'from-primary/10 via-background/70 to-background/70',
      text: 'text-foreground',
      iconBg: 'bg-primary/10',
      icon: 'text-primary',
    },
  },
};

function RoleCard({ 
  role, 
  count, 
  topActors 
}: { 
  role: string; 
  count: RoleCount | undefined;
  topActors: TopActor[];
}) {
  const config = roleConfig[role];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Link href={`/explore/roles?role=${role.toLowerCase()}`}>
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "relative p-6 rounded-xl border cursor-pointer overflow-hidden",
          "bg-gradient-to-br backdrop-blur-sm",
          "bg-card shadow-sm ring-1 ring-border/50",
          "hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10",
          "transition-all duration-200",
          config.color.border,
          config.color.bg
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            config.color.iconBg
          )}>
            <Icon className={cn("h-6 w-6", config.color.icon)} />
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Title & Description */}
        <h3 className={cn("dec-title text-lg font-semibold tracking-tight mb-1", config.color.text)}>
          {config.label}
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {config.description}
        </p>

        {/* Stats */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="dec-title text-3xl font-bold tracking-tight text-foreground">
            {count?.uniqueActors || 0}
          </span>
          <span className="text-sm text-muted-foreground">
            total {config.label.toLowerCase()}
          </span>
        </div>

        {/* Top Actors */}
        {topActors.length > 0 && (
          <div className="border-t border-border pt-4">
            <p className="mb-2 text-xs text-muted-foreground">Most Active</p>
            <div className="space-y-2">
              {topActors.map((actor, i) => (
                <div
                  key={actor.actor}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="max-w-[120px] truncate text-foreground">
                      {actor.actor}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {actor.actions} actions
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </Link>
  );
}

export function RoleCards() {
  const [roleCounts, setRoleCounts] = useState<RoleCount[]>([]);
  const [topActorsByRole, setTopActorsByRole] = useState<Record<string, TopActor[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [counts, editors, reviewers, contributors] = await Promise.all([
          client.explore.getRoleCounts({}),
          client.explore.getTopActorsByRole({ role: 'EDITOR', limit: 3 }),
          client.explore.getTopActorsByRole({ role: 'REVIEWER', limit: 3 }),
          client.explore.getTopActorsByRole({ role: 'CONTRIBUTOR', limit: 3 }),
        ]);

        setRoleCounts(counts);
        setTopActorsByRole({
          'EDITOR': editors,
          'REVIEWER': reviewers,
          'CONTRIBUTOR': contributors,
        });
      } catch (err) {
        console.error('Failed to fetch role data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <section id="browse-by-role" className="relative w-full py-8">
        <div className="mx-auto w-full px-3 sm:px-4 lg:px-5 xl:px-6">
          <div className="animate-pulse">
            <div className="mb-6 h-8 w-48 rounded bg-muted/60" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 rounded-xl bg-muted/50" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const roles = ['EDITOR', 'REVIEWER', 'CONTRIBUTOR'];

  return (
    <section id="browse-by-role" className="relative w-full py-8">
        <div className="mx-auto w-full px-3 sm:px-4 lg:px-5 xl:px-6">
        {/* Section Header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-2">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <h2 className="dec-title text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Browse by Role</h2>
          </div>
          <CopyLinkButton sectionId="browse-by-role" />
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role, index) => (
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <RoleCard
                role={role}
                count={roleCounts.find(c => c.role === role)}
                topActors={topActorsByRole[role] || []}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
