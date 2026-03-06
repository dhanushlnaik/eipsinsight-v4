'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Mail, CheckCircle2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function NewsletterPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter a valid email');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Successfully subscribed to the newsletter!');
      setEmail('');
    } catch {
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full py-8 pl-4 pr-4 sm:pl-6 sm:pr-6 lg:pl-8 lg:pr-8 xl:pl-12 xl:pr-12">
      <div className="mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {/* Hero Section */}
          <div className="mb-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-cyan-500/10 px-3 py-1.5 ring-1 ring-cyan-400/30">
              <Mail className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                Newsletter
              </span>
            </div>
            <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-slate-100">
              EIPsInsight Newsletter
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Stay updated with the latest Ethereum Improvement Proposals, analysis, and insights delivered to your inbox.
            </p>
          </div>

          {/* Subscription Form */}
          <section className="mb-12 rounded-xl border border-slate-200/80 bg-white/90 p-8 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
            <h2 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Subscribe Now
            </h2>
            <form onSubmit={handleSubscribe} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-400"
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
          </section>

          {/* What You'll Get */}
          <section className="mb-12 rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
            <h2 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              What You'll Receive
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-cyan-600 dark:text-cyan-400" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Weekly EIP Updates</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Summaries of newly proposed, discussed, and finalized Ethereum Improvement Proposals.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-cyan-600 dark:text-cyan-400" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Governance Insights</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Analysis of protocol governance, voting trends, and community sentiment.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-cyan-600 dark:text-cyan-400" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Research Highlights</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Curated research papers and technical deep-dives related to Ethereum.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-cyan-600 dark:text-cyan-400" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Community News</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Announcements, events, and community highlights from the Ethereum ecosystem.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Frequency Info */}
          <section className="mb-12 rounded-lg bg-cyan-50/50 p-4 dark:bg-cyan-900/10">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 shrink-0 text-cyan-600 dark:text-cyan-400" />
              <div>
                <h3 className="font-semibold text-cyan-900 dark:text-cyan-100">Newsletter Frequency</h3>
                <p className="mt-1 text-sm text-cyan-800 dark:text-cyan-200">
                  We send newsletters weekly on Mondays with curated content. Unsubscribe at any time.
                </p>
              </div>
            </div>
          </section>

          {/* Footer Navigation */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/80 pt-6 dark:border-slate-700/50">
            <Link href="/" className="text-sm text-cyan-700 hover:underline dark:text-cyan-300">
              ← Back to Home
            </Link>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link
                href="/privacy"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                Privacy
              </Link>
              <Link
                href="/about"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                About
              </Link>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
