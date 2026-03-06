'use client';

import React from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { team } from '@/data/resources/team';
import { grants } from '@/data/resources/grants';
import { partners } from '@/data/resources/partners';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Code,
  Crown,
  ExternalLink,
  FileText,
  Globe,
  Github,
  Heart,
  Linkedin,
  MessageCircle,
  Rocket,
  Search,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Twitter,
  Users,
  Zap,
} from 'lucide-react';

export default function AboutPage() {
  const badgeColors: Record<string, string> = {
    significant: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
    medium: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40',
    small: 'bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/40',
  };

  const partnerLogos: Record<string, string> = {
    EtherWorld: '/brand/partners/ew.png',
    'ECH (Ethereum Cat Herders)': '/brand/partners/ech.png',
  };

  const socialLinks = [
    { label: 'GitHub', href: 'https://github.com/AvarchLLC/eipsinsight-v4', icon: Github },
    { label: 'Contact', href: 'mailto:dev@avarch.com', icon: Users },
    { label: 'Discord', href: 'https://discord.com/invite/tUXgfV822C', icon: MessageCircle },
    { label: 'Donate', href: '/donate', icon: Heart },
  ];

  return (
    <div className="w-full py-8 px-3 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="mb-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-cyan-500/10 px-3 py-1.5 ring-1 ring-cyan-400/30">
              <Heart className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">About Us</span>
            </div>
            <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-slate-100">Empowering the Ethereum Community with Data-Driven Insights</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">EIPs Insight is your comprehensive platform for tracking, analyzing, and understanding Ethereum Improvement Proposals, Ethereum Request for Comments, and Rollup Improvement Proposals.</p>
          </div>

          <section className="mb-12 rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
            <div className="mb-5 inline-flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Our Team</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {team.map((member) => (
                <article key={member.name} className="rounded-lg border border-slate-200/80 bg-white/90 p-5 text-center shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
                  {member.avatar ? (
                    <div className="mx-auto mb-3 h-16 w-16 overflow-hidden rounded-full border border-cyan-400/40">
                      <Image src={member.avatar} alt={member.name} width={64} height={64} className="h-16 w-16 object-cover" />
                    </div>
                  ) : (
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/10 text-base font-semibold text-cyan-700 dark:text-cyan-300">
                      {member.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                  )}
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{member.name}</h3>
                  <p className="mb-3 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{member.role}</p>
                  <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                    {member.github && (
                      <a href={`https://github.com/${member.github}`} target="_blank" rel="noreferrer" aria-label={`${member.name} GitHub`}>
                        <Github className="h-3.5 w-3.5 hover:text-cyan-600 dark:hover:text-cyan-300" />
                      </a>
                    )}
                    <a href={member.twitter ? `https://x.com/${member.twitter}` : 'https://x.com/eipsinsight'} target="_blank" rel="noreferrer" aria-label="X">
                      <Twitter className="h-3.5 w-3.5 hover:text-cyan-600 dark:hover:text-cyan-300" />
                    </a>
                    <a href={member.linkedin ?? 'https://www.linkedin.com/company/avarch'} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                      <Linkedin className="h-3.5 w-3.5 hover:text-cyan-600 dark:hover:text-cyan-300" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mb-12 rounded-xl border border-cyan-400/40 bg-cyan-500/10 p-6 shadow-sm ring-1 ring-cyan-400/30">
            <div className="mb-3 inline-flex items-center gap-2">
              <Heart className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Support EIPsInsight</h2>
            </div>
            <p className="mb-4 text-slate-700 dark:text-slate-300">We welcome contributions, partnerships, and funding opportunities.</p>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map((item) => {
                const Icon = item.icon;
                const isExternal = item.href.startsWith('http') || item.href.startsWith('mailto:');
                const classes = 'inline-flex items-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-700 transition hover:bg-cyan-500/20 dark:text-cyan-300';
                return isExternal ? (
                  <a key={item.label} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noreferrer' : undefined} className={classes}>
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </a>
                ) : (
                  <Link key={item.label} href={item.href} className={classes}>
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="mb-12 rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
            <div className="mb-5 inline-flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Grants & Funding</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {grants.map((grant) => (
                <article key={grant.id} className="rounded-lg border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{grant.title}</h3>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${badgeColors[grant.badge]}`}>{grant.badge}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{grant.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {grant.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-slate-200 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600/30">{tag}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mb-12 rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
            <div className="mb-5 inline-flex items-center gap-2">
              <Crown className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Our Partners</h2>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {partners.map((partner) => (
                <a key={partner.name} href={partner.website} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-3 rounded-lg border border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm transition hover:border-cyan-400/40 dark:border-slate-700/50 dark:bg-slate-900/55">
                  {partnerLogos[partner.name] && <Image src={partnerLogos[partner.name]} alt={partner.name} width={80} height={36} className="h-9 w-auto object-contain" />}
                  <span className="text-sm font-medium text-slate-700 transition group-hover:text-cyan-700 dark:text-slate-200 dark:group-hover:text-cyan-300">{partner.name}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-300" />
                </a>
              ))}
            </div>
          </section>

          <section className="mb-12 rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
            <div className="mb-4 inline-flex items-center gap-2">
              <Target className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Our Mission</h2>
            </div>
            <div className="space-y-3 text-slate-700 dark:text-slate-300">
              <p>We believe that transparency and accessibility are fundamental to the growth and success of the Ethereum ecosystem. Our mission is to provide developers, researchers, and community members with the tools and insights they need to stay informed about the evolution of Ethereum standards.</p>
              <p>By aggregating data from multiple sources and presenting it in an intuitive, searchable format, we help you navigate the complex landscape of Ethereum proposals, track governance activity, and understand the impact of protocol changes.</p>
            </div>
          </section>

          <section className="mb-12">
            <div className="mb-6 flex items-center gap-2">
              <Rocket className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">What We Offer</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10"><Search className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /></div>
                <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Comprehensive Search</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Search and filter through thousands of EIPs, ERCs, and RIPs with advanced filtering by status, category, author, and more.</p>
              </div>

              <div className="rounded-lg border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10"><BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
                <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Real-Time Analytics</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Track proposal trends, status changes, and contributor activity with live dashboards and historical data visualization.</p>
              </div>

              <div className="rounded-lg border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10"><Bell className="h-5 w-5 text-violet-600 dark:text-violet-400" /></div>
                <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Governance Tracking</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Stay updated on recent changes, editor activity, and proposal lifecycle transitions with our governance activity feed.</p>
              </div>

              <div className="rounded-lg border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10"><Code className="h-5 w-5 text-amber-600 dark:text-amber-400" /></div>
                <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Developer API</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Integrate EIPs data into your own applications with our powerful, well-documented API and customizable access tokens.</p>
              </div>
            </div>
          </section>

          <section className="mb-12 rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
            <div className="mb-4 inline-flex items-center gap-2"><Zap className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /><h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Our Core Values</h2></div>
            <div className="space-y-4">
              <div className="flex gap-3"><div className="shrink-0"><Shield className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /></div><div><h3 className="mb-1 font-semibold text-slate-900 dark:text-slate-100">Transparency</h3><p className="text-sm text-slate-600 dark:text-slate-400">We believe in open data and clear communication. All our data sources are publicly accessible, and we're committed to being transparent about how we collect and present information.</p></div></div>
              <div className="flex gap-3"><div className="shrink-0"><Users className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /></div><div><h3 className="mb-1 font-semibold text-slate-900 dark:text-slate-100">Community-Driven</h3><p className="text-sm text-slate-600 dark:text-slate-400">Built by the community, for the community. We actively listen to feedback and continuously improve our platform based on user needs and suggestions.</p></div></div>
              <div className="flex gap-3"><div className="shrink-0"><TrendingUp className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /></div><div><h3 className="mb-1 font-semibold text-slate-900 dark:text-slate-100">Innovation</h3><p className="text-sm text-slate-600 dark:text-slate-400">We're constantly exploring new ways to visualize and analyze Ethereum governance data, pushing the boundaries of what's possible in blockchain analytics.</p></div></div>
              <div className="flex gap-3"><div className="shrink-0"><Globe className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /></div><div><h3 className="mb-1 font-semibold text-slate-900 dark:text-slate-100">Accessibility</h3><p className="text-sm text-slate-600 dark:text-slate-400">Whether you're a seasoned Ethereum core developer or just getting started, our platform is designed to be intuitive and accessible to everyone.</p></div></div>
            </div>
          </section>

          <section className="mb-12 rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
            <div className="mb-4 inline-flex items-center gap-2"><FileText className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /><h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Our Data Sources</h2></div>
            <div className="space-y-3 text-slate-700 dark:text-slate-300">
              <p>We aggregate data from official Ethereum repositories to ensure accuracy and reliability:</p>
              <ul className="ml-6 list-disc space-y-1">
                <li><strong>ethereum/EIPs:</strong> Core Ethereum Improvement Proposals</li>
                <li><strong>ethereum/ERCs:</strong> Ethereum Request for Comments (Application-level standards)</li>
                <li><strong>ethereum/RIPs:</strong> Rollup Improvement Proposals</li>
              </ul>
              <p className="mt-3">Our platform automatically syncs with these repositories to provide real-time updates on proposal status changes, new submissions, and editor activity.</p>
            </div>
          </section>

          <section className="mb-12 rounded-xl border border-cyan-400/40 bg-cyan-500/10 p-6 shadow-sm ring-1 ring-cyan-400/30">
            <div className="mb-4 inline-flex items-center gap-2"><Heart className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /><h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Get Involved</h2></div>
            <div className="space-y-3 text-slate-700 dark:text-slate-300">
              <p>EIPs Insight is more than just a data platform—it's a community resource. Here's how you can participate:</p>
              <ul className="ml-6 list-disc space-y-1">
                <li>Contribute to proposal discussions on GitHub</li>
                <li>Share your insights and analytics on social media</li>
                <li>Provide feedback to help us improve the platform</li>
                <li>Use our API to build complementary tools and services</li>
                <li>Join our community channels to connect with other Ethereum enthusiasts</li>
              </ul>
            </div>
          </section>

          <section className="mb-12 rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
            <div className="mb-4 inline-flex items-center gap-2"><Shield className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /><h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Legal & Privacy</h2></div>
            <div className="space-y-3 text-slate-700 dark:text-slate-300">
              <p>We take your privacy and data security seriously. Our platform is built with privacy-first principles and complies with industry best practices.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/privacy" className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-700 transition hover:bg-cyan-500/20 dark:text-cyan-300">Privacy Policy<ArrowRight className="h-4 w-4" /></Link>
                <Link href="/terms" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">Terms of Service<ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
            <div className="mb-4 inline-flex items-center gap-2"><Users className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /><h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Contact Us</h2></div>
            <div className="space-y-3 text-slate-700 dark:text-slate-300">
              <p>Have questions, suggestions, or feedback? We'd love to hear from you!</p>
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
                <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">General Inquiries:</p>
                <a href="mailto:dev@avarch.com" className="text-cyan-700 hover:underline dark:text-cyan-300">dev@avarch.com</a>
              </div>
            </div>
          </section>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/80 pt-6 dark:border-slate-700/50">
            <Link href="/" className="text-sm text-cyan-700 hover:underline dark:text-cyan-300">← Back to Home</Link>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/pricing" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">Pricing</Link>
              <Link href="/api-tokens" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">API</Link>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
