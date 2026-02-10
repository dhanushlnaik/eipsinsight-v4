"use client";

import Link from "next/link";
import { ArrowLeft, Newspaper, Github } from "lucide-react";

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
      <section className="border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <Link
            href="/resources"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Resources
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            News
          </h1>
          <p className="text-slate-400">
            Latest updates in the EIP ecosystem.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-24 flex items-center justify-center">
        <div className="text-center max-w-lg">
          <div className="rounded-full bg-amber-500/20 p-6 inline-flex mb-6">
            <Newspaper className="h-12 w-12 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            News Coming Soon
          </h2>
          <p className="text-slate-400 mb-8">
            We're building a timeline of important EIP ecosystem updates, governance decisions, and network upgrades. Check back soon!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/analytics"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-cyan-500/20 border border-cyan-500/40 rounded-lg hover:bg-cyan-500/30 hover:border-cyan-400 transition-colors"
            >
              View analytics
            </Link>
            <a
              href="https://github.com/AvarchLLC/EIPsInsight"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-slate-300 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-700/50 hover:text-white transition-colors"
            >
              <Github className="h-4 w-4" />
              Follow us on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
