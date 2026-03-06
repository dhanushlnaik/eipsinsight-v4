'use client';

import React from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Zap, Users, Heart, ExternalLink } from 'lucide-react';

export default function GrantsPage() {
  return (
    <div className="w-full py-8 pl-4 pr-4 sm:pl-6 sm:pr-6 lg:pl-8 lg:pr-8 xl:pl-12 xl:pr-12">
      <div className="mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {/* Hero Section */}
          <div className="mb-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-cyan-500/10 px-3 py-1.5 ring-1 ring-cyan-400/30">
              <Heart className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                Grants & Support
              </span>
            </div>
            <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-slate-100">
              Grants & Funding Opportunities
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Discover grant programs and funding opportunities for Ethereum research and development.
            </p>
          </div>

          {/* Programs Section */}
          <section className="mb-12 rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
            <div className="mb-6 inline-flex items-center gap-2">
              <Zap className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Active Programs</h2>
            </div>
            <div className="space-y-6">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Ethereum Foundation Grants</h3>
                <p className="mb-3 text-slate-600 dark:text-slate-400">
                  The Ethereum Foundation provides grants for projects that contribute to Ethereum's development and adoption.
                </p>
                <a href="#" className="inline-flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300">
                  Learn more <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Protocol Research Programs</h3>
                <p className="mb-3 text-slate-600 dark:text-slate-400">
                  Fund innovative research into Ethereum protocol improvements and network optimization.
                </p>
                <a href="#" className="inline-flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300">
                  Learn more <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Community Development</h3>
                <p className="mb-3 text-slate-600 dark:text-slate-400">
                  Support for community initiatives, educational projects, and developer tools development.
                </p>
                <a href="#" className="inline-flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300">
                  Learn more <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </section>

          {/* Application Process */}
          <section className="mb-12 rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
            <div className="mb-6 inline-flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">How to Apply</h2>
            </div>
            <div className="space-y-4 text-slate-700 dark:text-slate-300">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">1. Prepare Your Proposal</h3>
                <p className="mt-1 text-sm">Develop a clear proposal outlining your project goals, timeline, and expected outcomes.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">2. Review Requirements</h3>
                <p className="mt-1 text-sm">Check specific program requirements and eligibility criteria.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">3. Submit Application</h3>
                <p className="mt-1 text-sm">Complete the application form and submit required documentation.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">4. Review & Funding</h3>
                <p className="mt-1 text-sm">Your proposal will be reviewed by the grant committee, with decisions typically made within 4-6 weeks.</p>
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
                href="/about"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                Contact
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Comments Section */}
      </div>
    </div>
  );
}
