'use client';

import React from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Heart, DollarSign, Users, ExternalLink } from 'lucide-react';
import { PageComments } from '@/components/page-comments';
import { Button } from '@/components/ui/button';

export default function DonatePage() {
  return (
    <div className="w-full py-8 pl-4 pr-4 sm:pl-6 sm:pr-6 lg:pl-8 lg:pr-8 xl:pl-12 xl:pr-12">
      <div className="mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {/* Hero Section */}
          <div className="mb-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-1.5 ring-1 ring-red-400/30">
              <Heart className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-300">
                Support Us
              </span>
            </div>
            <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-slate-100">
              Support EIPsInsight
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Your donation helps us maintain and improve tools for the Ethereum community.
            </p>
          </div>

          {/* Impact Section */}
          <section className="mb-12 rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
            <div className="mb-6 inline-flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-600 dark:text-red-400" />
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Your Impact</h2>
            </div>
            <div className="space-y-4 text-slate-700 dark:text-slate-300">
              <p>
                EIPsInsight is a community-driven project dedicated to providing transparent, accessible insights into Ethereum governance and protocol development. Your support enables us to:
              </p>
              <ul className="space-y-2 pl-4">
                <li>• Maintain and improve our data analytics infrastructure</li>
                <li>• Develop new tools for protocol analysis and community engagement</li>
                <li>• Support ongoing research into Ethereum governance</li>
                <li>• Keep our platform free and accessible to all</li>
                <li>• Fund community initiatives and educational programs</li>
              </ul>
            </div>
          </section>

          {/* Donation Methods */}
          <section className="mb-12 rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
            <div className="mb-6 inline-flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Donation Methods</h2>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Ethereum (ETH)</h3>
                <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
                  Send ETH directly to support development and maintenance.
                </p>
                <Button variant="outline" size="sm">
                  Donate ETH <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Other Cryptocurrencies</h3>
                <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
                  We accept contributions in various cryptocurrencies. Contact us for details.
                </p>
                <Button variant="outline" size="sm">
                  Other Crypto <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Sponsorship</h3>
                <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
                  Interested in sponsoring EIPsInsight? Reach out to discuss partnership opportunities.
                </p>
                <Link href="mailto:support@eipsinsight.com">
                  <Button variant="outline" size="sm">
                    Contact Us <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Transparency */}
          <section className="mb-12 rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
            <div className="mb-6 inline-flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Transparency & Accountability</h2>
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              We are committed to transparency in how donations are used. All funds go directly toward development, infrastructure, and community initiatives. We publish regular reports on our resource allocation and goals.
            </p>
          </section>

          {/* Footer Navigation */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/80 pt-6 dark:border-slate-700/50">
            <Link href="/" className="text-sm text-cyan-700 hover:underline dark:text-cyan-300">
              ← Back to Home
            </Link>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link
                href="/about"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                About
              </Link>
              <Link
                href="/grants"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                Grants
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Comments Section */}
        <div className="mt-12 pt-8 border-t border-slate-200/80 dark:border-slate-700/50">
          <PageComments />
        </div>
      </div>
    </div>
  );
}
