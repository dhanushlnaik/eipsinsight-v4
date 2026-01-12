'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ExternalLink, MessageSquare } from 'lucide-react';
import { client } from '@/lib/orpc';
import { PageHeader } from '@/components/header';

type TrendingProposal = {
  proposalNumber: number;
  proposalType: 'EIP' | 'ERC' | 'RIP';
  title: string;
  status?: string;
  category?: string;
  replies: number;
  lastActivityAt: string;
  destination: 'internal' | 'magicians';
  url: string;
  magiciansUrl: string;
};

export default function TrendingProposals() {
  const [proposals, setProposals] = useState<TrendingProposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrendingProposals() {
      try {
        const data = await client.governanceTimeline.getTrendingProposals({ limit: 6 });
        setProposals(data || []);
      } catch (error) {
        console.error('Failed to fetch trending proposals:', error);
        setProposals([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTrendingProposals();
  }, []);

  const typeColors = {
    EIP: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
    ERC: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20',
    RIP: 'bg-orange-500/15 text-orange-300 border-orange-500/20',
  };

  const statusColors: Record<string, string> = {
    'Draft': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20',
    'Review': 'bg-blue-500/15 text-blue-300 border-blue-500/20',
    'Last Call': 'bg-amber-500/15 text-amber-300 border-amber-500/20',
    'Final': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
    'Withdrawn': 'bg-slate-500/15 text-slate-400 border-slate-500/20',
    'Stagnant': 'bg-slate-500/15 text-slate-500 border-slate-500/20',
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <PageHeader
        indicator={{ icon: "trending", label: "Live" }}
        title="Trending Proposals"
        description="Explore the most impactful proposals shaping Ethereum today."
        sectionId="trending-proposals"
        className="bg-slate-950/30"
      />
      <section className="relative w-full bg-slate-950/30 py-8 sm:py-12 lg:py-16">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border border-slate-700/30 bg-slate-900/40 p-6 backdrop-blur-sm"
                >
                  <div className="mb-4 h-5 w-20 rounded bg-slate-800/50" />
                  <div className="mb-2 h-6 w-full rounded bg-slate-800/50" />
                  <div className="mb-4 h-4 w-3/4 rounded bg-slate-800/50" />
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-16 rounded bg-slate-800/50" />
                    <div className="h-4 w-20 rounded bg-slate-800/50" />
                  </div>
                </div>
              ))}
            </div>
          ) : proposals.length === 0 ? (
            <div className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-12 text-center backdrop-blur-sm">
              <p className="text-slate-400">No active proposal discussions at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {proposals.map((proposal) => (
                <motion.a
                  key={`${proposal.proposalType}-${proposal.proposalNumber}`}
                  href={proposal.url}
                  target={proposal.destination === 'magicians' ? '_blank' : '_self'}
                  rel={proposal.destination === 'magicians' ? 'noopener noreferrer' : undefined}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3 }}
                  className="group relative flex flex-col rounded-xl border border-slate-700/30 bg-slate-900/40 p-6 backdrop-blur-sm transition-all hover:border-cyan-400/30 hover:bg-slate-900/60 hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  {/* Proposal Badge */}
                  <div className="mb-4 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm ${typeColors[proposal.proposalType]}`}
                    >
                      {proposal.proposalType}-{proposal.proposalNumber}
                    </span>
                    {proposal.status && (
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm ${
                          statusColors[proposal.status] || statusColors['Draft']
                        }`}
                      >
                        {proposal.status}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="mb-4 line-clamp-2 text-sm font-semibold leading-snug text-slate-200 transition-colors group-hover:text-white">
                    {proposal.title}
                  </h3>

                  {/* Meta Info */}
                  <div className="mt-auto flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                      {proposal.category && (
                        <span className="text-slate-500">{proposal.category}</span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{proposal.replies} replies</span>
                      </div>
                    </div>
                    <span className="text-slate-500">{formatTimeAgo(proposal.lastActivityAt)}</span>
                  </div>

                  {/* CTA */}
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-cyan-400 transition-colors group-hover:text-cyan-300">
                    {proposal.destination === 'internal' ? (
                      <>
                        View Proposal
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </>
                    ) : (
                      <>
                        Open Discussion
                        <ExternalLink className="h-3.5 w-3.5" />
                      </>
                    )}
                  </div>
                </motion.a>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
