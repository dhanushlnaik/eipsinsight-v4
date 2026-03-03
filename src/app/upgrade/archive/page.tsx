'use client';

import Link from 'next/link';
import { ArrowRight, CalendarDays, FileText, GitBranch, Sparkles, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader, SectionSeparator } from '@/components/header';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useState } from 'react';

type UpgradeType = 'Hard Fork' | 'Merge';
type LayerType = 'execution' | 'consensus' | 'beacon_genesis';

interface HistoricalUpgrade {
  name: string;
  slug: string;
  date: string;
  eipCount: number;
  type: UpgradeType;
  layer: LayerType;
  summary: string;
  description: string;
  impact: string;
  relatedLinks: Array<{ title: string; url: string }>;
}

const previousUpgrades: HistoricalUpgrade[] = [
  {
    name: 'Frontier',
    slug: 'frontier',
    date: '2015-07-30',
    eipCount: 0,
    type: 'Hard Fork',
    layer: 'execution',
    summary: 'Ethereum mainnet launch and foundational protocol activation.',
    description: 'Frontier was the first Ethereum mainnet release, enabling the deployment of smart contracts and the beginning of decentralized applications on the network.',
    impact: 'Genesis of Ethereum network; established core protocol functionality.',
    relatedLinks: [{ title: 'Ethereum History', url: 'https://etherworld.co/tag/ethereum-history/' }],
  },
  {
    name: 'Homestead',
    slug: 'homestead',
    date: '2016-03-14',
    eipCount: 3,
    type: 'Hard Fork',
    layer: 'execution',
    summary: 'First planned protocol upgrade focused on stability and safety.',
    description: 'Homestead introduced critical safety improvements including the DELEGATECALL opcode and fixes to the contract creation process.',
    impact: 'Improved protocol safety and enabled complex contract interactions.',
    relatedLinks: [{ title: 'Homestead Hard Fork', url: 'https://etherworld.co/tag/hard-fork/' }],
  },
  {
    name: 'DAO Fork',
    slug: 'dao-fork',
    date: '2016-07-20',
    eipCount: 1,
    type: 'Hard Fork',
    layer: 'execution',
    summary: 'Emergency state transition to recover funds after The DAO exploit.',
    description: 'Following the DAO hack, the community coordinated an irregular state change to recover stolen funds, establishing precedent for protocol governance.',
    impact: 'Protected network integrity; demonstrated community coordination.',
    relatedLinks: [{ title: 'DAO Attack & Fork', url: 'https://etherworld.co/tag/dao/' }],
  },
  {
    name: 'Tangerine Whistle',
    slug: 'tangerine-whistle',
    date: '2016-10-18',
    eipCount: 1,
    type: 'Hard Fork',
    layer: 'execution',
    summary: 'DoS mitigation via gas repricing of state-heavy operations.',
    description: 'This upgrade addressed denial-of-service vulnerabilities by repricing gas for state-access operations, making attacks economically infeasible.',
    impact: 'Enhanced network resilience against spam attacks.',
    relatedLinks: [{ title: 'EIP-150 Explained', url: 'https://etherworld.co/tag/eip-150/' }],
  },
  {
    name: 'Spurious Dragon',
    slug: 'spurious-dragon',
    date: '2016-11-22',
    eipCount: 4,
    type: 'Hard Fork',
    layer: 'execution',
    summary: 'Further anti-DoS hardening and state cleanup improvements.',
    description: 'Spurious Dragon continued security improvements with EXP gas repricing, contract code size limits, and transaction replay protection via ChainID.',
    impact: 'Hardened against further DoS vectors; enabled cross-chain transaction safety.',
    relatedLinks: [{ title: 'EIP-155 Replay Protection', url: 'https://etherworld.co/tag/eip-155/' }],
  },
  {
    name: 'Byzantium',
    slug: 'byzantium',
    date: '2017-10-16',
    eipCount: 9,
    type: 'Hard Fork',
    layer: 'execution',
    summary: 'Major Metropolis phase with privacy and VM upgrades.',
    description: 'Byzantium was a significant upgrade introducing the REVERT opcode, zk-SNARKs precompiles, and block rewards reduction toward Proof-of-Stake.',
    impact: 'Enabled privacy technologies; reduced inflation; modernized EVM.',
    relatedLinks: [{ title: 'Byzantium Hard Fork', url: 'https://etherworld.co/tag/byzantium/' }],
  },
  {
    name: 'Constantinople',
    slug: 'constantinople',
    date: '2019-02-28',
    eipCount: 5,
    type: 'Hard Fork',
    layer: 'execution',
    summary: 'EVM efficiency improvements and delayed difficulty bomb updates.',
    description: 'Constantinople optimized EVM operations (SSTORE gas cost, CREATE2, bitwise shifting) and further delayed the difficulty bomb.',
    impact: 'Reduced smart contract deployment costs; improved EVM performance.',
    relatedLinks: [{ title: 'Constantinople Hard Fork', url: 'https://etherworld.co/tag/constantinople/' }],
  },
  {
    name: 'Istanbul',
    slug: 'istanbul',
    date: '2019-12-07',
    eipCount: 6,
    type: 'Hard Fork',
    layer: 'execution',
    summary: 'Interoperability and gas model updates for scalability readiness.',
    description: 'Istanbul introduced gas repricing for state-rent preparation (EIP-1679), privacy-enabling precompiles, and STATICCALL optimizations.',
    impact: 'Prepared network for scalability solutions; enhanced interoperability.',
    relatedLinks: [{ title: 'Istanbul Hard Fork', url: 'https://etherworld.co/tag/istanbul/' }],
  },
  {
    name: 'Berlin',
    slug: 'berlin',
    date: '2021-04-15',
    eipCount: 4,
    type: 'Hard Fork',
    layer: 'execution',
    summary: 'Gas repricing and transaction format improvements.',
    description: 'Berlin optimized gas accounting for state-access operations and introduced transaction access lists to enable more efficient L2 solutions.',
    impact: 'Improved L2 scalability readiness; optimized gas costs.',
    relatedLinks: [{ title: 'Berlin Hard Fork', url: 'https://etherworld.co/tag/berlin/' }],
  },
  {
    name: 'London',
    slug: 'london',
    date: '2021-08-05',
    eipCount: 5,
    type: 'Hard Fork',
    layer: 'execution',
    summary: 'Introduced EIP-1559 fee market and burn mechanism.',
    description: "London fundamentally reformed Ethereum's fee market with dynamic base fees, burn mechanics, and the BASEFEE opcode, improving UX and reducing inflation.",
    impact: 'Revolutionized fee market; began ETH deflation; improved predictability.',
    relatedLinks: [{ title: 'EIP-1559 & London Fork', url: 'https://etherworld.co/tag/eip-1559/' }],
  },
  {
    name: 'Merge',
    slug: 'paris',
    date: '2022-09-15',
    eipCount: 2,
    type: 'Merge',
    layer: 'execution',
    summary: 'Transition from Proof-of-Work to Proof-of-Stake consensus.',
    description: "The Merge was Ethereum's highest-stakes upgrade, transitioning consensus from PoW to PoS, reducing energy consumption by 99.95% and establishing validator-based security.",
    impact: 'Reduced energy by 99.95%; shifted to Proof-of-Stake; enabled staking.',
    relatedLinks: [{ title: 'The Merge Explained', url: 'https://etherworld.co/tag/the-merge/' }],
  },
  {
    name: 'Shanghai',
    slug: 'shanghai',
    date: '2023-04-12',
    eipCount: 4,
    type: 'Hard Fork',
    layer: 'execution',
    summary: 'Enabled staked ETH withdrawals and execution-layer refinements.',
    description: 'Shanghai allowed validators to withdraw accrued staking rewards and exited stake, fulfilling a critical Proof-of-Stake requirement.',
    impact: 'Unlocked staking; completed PoS functionality; enabled validator exits.',
    relatedLinks: [{ title: 'Shanghai Upgrade', url: 'https://etherworld.co/tag/shanghai/' }],
  },
  {
    name: 'Cancun',
    slug: 'cancun',
    date: '2024-03-13',
    eipCount: 6,
    type: 'Hard Fork',
    layer: 'execution',
    summary: 'Delivered proto-danksharding groundwork for L2 scaling.',
    description: 'Cancun introduced EIP-4844 (blobs), enabling Layer 2 solutions to post data more economically and reducing rollup costs by orders of magnitude.',
    impact: 'Enabled L2 scaling; reduced rollup costs; laid danksharding groundwork.',
    relatedLinks: [{ title: 'EIP-4844 & Cancun', url: 'https://etherworld.co/tag/eip-4844/' }],
  },
];

const totalEips = previousUpgrades.reduce((sum, upgrade) => sum + upgrade.eipCount, 0);
const avgEips = (totalEips / previousUpgrades.length).toFixed(1);
const maxEips = Math.max(...previousUpgrades.map((upgrade) => upgrade.eipCount));

function complexityScore(eipCount: number) {
  return Math.max(1, Math.min(10, Math.round((eipCount / maxEips) * 10)));
}

export default function PreviousUpgradesPage() {
  const [hoveredUpgrade, setHoveredUpgrade] = useState<string | null>(null);
  const [currentUpgradeIndex, setCurrentUpgradeIndex] = useState(0);

  return (
    <div className="bg-background relative w-full overflow-hidden min-h-screen">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.14),transparent_60%)]" />
        <div className="absolute top-0 left-1/2 -z-10 h-225 w-225 -translate-x-1/2 rounded-full bg-cyan-300/10 blur-3xl" />
      </div>

      <div className="relative z-10">
        <PageHeader
          title="Previous Upgrades (2015–2024)"
          description="Historical governance analytics dashboard for major Ethereum upgrades, from Frontier through Cancun."
          sectionId="previous-upgrades-overview"
          className="bg-slate-100/70 dark:bg-slate-950/30"
        />

        <section className="relative w-full bg-slate-100/70 dark:bg-slate-950/30">
          <PageHeader
            title="Global Comparison"
            description="EIP count per upgrade with normalized complexity scores."
            sectionId="comparison"
            className="bg-slate-100/70 dark:bg-slate-950/30"
          />
          <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 pb-6">
            <div className="rounded-xl border border-cyan-400/20 bg-white/85 p-4 dark:bg-slate-950/50">
              <div className="space-y-3">
                {previousUpgrades.map((upgrade) => {
                  const barWidth = `${(upgrade.eipCount / maxEips) * 100}%`;
                  const score = complexityScore(upgrade.eipCount);

                  return (
                    <div key={upgrade.slug} className="grid grid-cols-[120px_1fr_auto] items-center gap-3">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{upgrade.name}</span>
                      <div className="h-3 overflow-hidden rounded bg-slate-200 dark:bg-slate-800">
                        <div className="h-full rounded bg-linear-to-r from-emerald-500 to-cyan-500" style={{ width: barWidth }} />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {upgrade.eipCount} EIPs · C{score}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <SectionSeparator />

        <section className="relative w-full bg-slate-100/70 dark:bg-slate-950/30">
          <PageHeader
            title="Governance Heatmap"
            description="Relative activity intensity by upgrade using EIP count."
            sectionId="heatmap"
            className="bg-slate-100/70 dark:bg-slate-950/30"
          />
          <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 pb-6">
            <div className="overflow-x-auto rounded-xl border border-cyan-400/20 bg-white/85 p-4 dark:bg-slate-950/50">
              <div className="grid min-w-max grid-cols-[160px_repeat(13,minmax(72px,1fr))] gap-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upgrade</div>
                {previousUpgrades.map((upgrade) => (
                  <div key={`${upgrade.slug}-header`} className="text-center text-[11px] text-slate-500">
                    {upgrade.name}
                  </div>
                ))}

                <div className="self-center text-xs font-semibold uppercase tracking-wide text-slate-500">EIP Intensity</div>
                {previousUpgrades.map((upgrade) => {
                  const intensity = Math.max(0.08, upgrade.eipCount / maxEips);
                  return (
                    <div
                      key={`${upgrade.slug}-cell`}
                      className={cn(
                        'flex h-12 items-center justify-center rounded border text-xs font-semibold',
                        'border-cyan-400/20 text-slate-100',
                      )}
                      style={{
                        backgroundColor: `rgba(34, 211, 238, ${intensity})`,
                      }}
                      title={`${upgrade.name}: ${upgrade.eipCount} EIPs`}
                    >
                      {upgrade.eipCount}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <SectionSeparator />

        <section className="relative w-full bg-slate-100/70 dark:bg-slate-950/30">
          <PageHeader
            title="Upgrade Details"
            description="Complete reference for each historical upgrade with descriptions, impact assessment, and links."
            sectionId="details"
            className="bg-slate-100/70 dark:bg-slate-950/30"
          />
          <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 pb-10">
            {/* Carousel Navigation */}
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() =>
                  setCurrentUpgradeIndex((i) => (i === 0 ? previousUpgrades.length - 1 : i - 1))
                }
                className="flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-700 transition-all hover:border-cyan-400/60 hover:bg-cyan-500/20 dark:text-cyan-300"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>

              <div className="flex flex-col items-center gap-2">
                <span className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  {currentUpgradeIndex + 1} / {previousUpgrades.length}
                </span>
                <div className="h-1 w-48 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full bg-linear-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
                    style={{
                      width: `${((currentUpgradeIndex + 1) / previousUpgrades.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() =>
                  setCurrentUpgradeIndex((i) => (i === previousUpgrades.length - 1 ? 0 : i + 1))
                }
                className="flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-700 transition-all hover:border-cyan-400/60 hover:bg-cyan-500/20 dark:text-cyan-300"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Upgrade Card Carousel */}
            <motion.div
              key={previousUpgrades[currentUpgradeIndex].slug}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-linear-to-br from-white/90 via-cyan-50/40 to-white/85 p-8 dark:from-slate-950/80 dark:via-slate-900/50 dark:to-slate-950/80 shadow-xl"
            >
              {/* Gradient Accent */}
              <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-linear-to-bl from-cyan-500/10 to-emerald-500/5 blur-3xl dark:from-cyan-500/5 dark:to-emerald-500/5" />
              
              {(() => {
                const upgrade = previousUpgrades[currentUpgradeIndex];
                const score = complexityScore(upgrade.eipCount);
                const [showComplexityTooltip, setShowComplexityTooltip] = useState(false);

                return (
                  <>
                    {/* Header Row: Name, Type, Date */}
                    <div className="relative z-10 mb-8">
                      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div className="flex-1">
                          <h3 className="text-4xl font-black bg-linear-to-r from-slate-900 via-cyan-800 to-slate-900 bg-clip-text text-transparent dark:from-white dark:via-cyan-300 dark:to-slate-200">
                            {upgrade.name}
                          </h3>
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-xs font-bold tracking-wide",
                              upgrade.type === 'Merge' 
                                ? 'bg-linear-to-r from-violet-500/20 to-purple-500/20 text-violet-700 dark:text-violet-300'
                                : 'bg-linear-to-r from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300'
                            )}>
                              {upgrade.type === 'Merge' ? '🔀 Merge' : '🍴 Hard Fork'}
                            </span>
                            <span className={cn(
                              "px-2.5 py-1 rounded text-xs font-semibold",
                              upgrade.layer === 'execution' 
                                ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-400/30'
                                : upgrade.layer === 'consensus'
                                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30'
                                  : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/30'
                            )}>
                              {upgrade.layer === 'execution' 
                                ? '⚙️ Execution Layer' 
                                : upgrade.layer === 'consensus'
                                  ? '⛓️ Consensus Layer'
                                  : '🌟 Beacon Genesis'}
                            </span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              {upgrade.summary}
                            </span>
                          </div>
                        </div>
                        <div className="rounded-xl bg-linear-to-br from-cyan-500/20 to-cyan-600/10 px-4 py-2.5 border border-cyan-400/30 backdrop-blur-sm">
                          <p className="text-xs uppercase tracking-widest font-bold text-cyan-700 dark:text-cyan-300">
                            {new Date(upgrade.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats Row - Enhanced */}
                    <div className="relative z-10 mb-8 grid grid-cols-3 gap-4">
                      {/* EIPs Stat */}
                      <div className="group rounded-xl border border-emerald-400/20 bg-linear-to-br from-emerald-500/10 to-teal-500/5 p-4 transition-all duration-300 hover:border-emerald-400/40 hover:shadow-lg hover:shadow-emerald-500/10 dark:border-emerald-400/10 dark:from-emerald-500/5 dark:to-teal-500/5">
                        <p className="text-xs uppercase tracking-widest font-bold text-emerald-700 dark:text-emerald-300">
                          EIP Count
                        </p>
                        <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                          {upgrade.eipCount}
                        </p>
                        <div className="mt-1 h-1 w-8 bg-linear-to-r from-emerald-500 to-teal-500 rounded-full" />
                      </div>

                      {/* Complexity Stat */}
                      <div className="group relative rounded-xl border border-cyan-400/20 bg-linear-to-br from-cyan-500/10 to-blue-500/5 p-4 transition-all duration-300 hover:border-cyan-400/40 hover:shadow-lg hover:shadow-cyan-500/10 dark:border-cyan-400/10 dark:from-cyan-500/5 dark:to-blue-500/5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-widest font-bold text-cyan-700 dark:text-cyan-300">
                              Complexity
                            </p>
                            <p className="mt-2 text-3xl font-black text-cyan-600 dark:text-cyan-400">
                              {score}<span className="text-lg opacity-70">/10</span>
                            </p>
                          </div>
                          <button
                            onMouseEnter={() => setShowComplexityTooltip(true)}
                            onMouseLeave={() => setShowComplexityTooltip(false)}
                            className="rounded-full p-1.5 text-cyan-600/60 hover:bg-cyan-500/15 hover:text-cyan-700 transition-all dark:text-cyan-400/60 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-300"
                          >
                            <HelpCircle className="h-5 w-5" />
                          </button>
                        </div>
                        <div className="mt-1 h-1 w-8 bg-linear-to-r from-cyan-500 to-blue-500 rounded-full" />

                        {/* Complexity Tooltip */}
                        {showComplexityTooltip && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute right-4 top-full z-50 mt-3 w-56 rounded-xl border border-cyan-400/30 bg-white/98 p-4 text-xs text-slate-700 shadow-2xl backdrop-blur-sm dark:border-cyan-400/20 dark:bg-slate-900/98 dark:text-slate-300"
                          >
                            <p className="mb-2 font-bold text-cyan-700 dark:text-cyan-300">
                              What is Complexity?
                            </p>
                            <p className="mb-3 leading-relaxed opacity-90">
                              Normalized 1-10 scale based on the number of EIPs included in the upgrade.
                            </p>
                            <div className="space-y-1.5 border-t border-cyan-200/50 pt-3 dark:border-cyan-900/50">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span><strong>1-3:</strong> Minor updates</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                <span><strong>4-7:</strong> Moderate changes</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                <span><strong>8-10:</strong> Major upgrades</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Type Stat */}
                      <div className="group rounded-xl border border-violet-400/20 bg-linear-to-br from-violet-500/10 to-purple-500/5 p-4 transition-all duration-300 hover:border-violet-400/40 hover:shadow-lg hover:shadow-violet-500/10 dark:border-violet-400/10 dark:from-violet-500/5 dark:to-purple-500/5">
                        <p className="text-xs uppercase tracking-widest font-bold text-violet-700 dark:text-violet-300">
                          Category
                        </p>
                        <p className="mt-2 text-lg font-bold text-violet-600 dark:text-violet-400">
                          {upgrade.type}
                        </p>
                        <div className="mt-1 h-1 w-8 bg-linear-to-r from-violet-500 to-purple-500 rounded-full" />
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="relative z-10 mb-8 h-px bg-linear-to-r from-transparent via-cyan-400/20 to-transparent" />

                    {/* Description Sections */}
                    <div className="relative z-10 space-y-6 mb-8">
                      {/* About Section */}
                      <div className="space-y-3">
                        <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                          <span className="h-5 w-1 rounded-full bg-linear-to-b from-cyan-500 to-emerald-500" />
                          About {upgrade.name}
                        </h4>
                        <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                          {upgrade.description}
                        </p>
                      </div>

                      {/* Impact Section */}
                      <div className="space-y-3">
                        <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                          <span className="h-5 w-1 rounded-full bg-linear-to-b from-emerald-500 to-teal-500" />
                          Network Impact
                        </h4>
                        <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                          {upgrade.impact}
                        </p>
                      </div>
                    </div>

                    {/* Related Resources */}
                    {upgrade.relatedLinks.length > 0 && (
                      <div className="relative z-10 mb-8">
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                          <span className="h-5 w-1 rounded-full bg-linear-to-b from-violet-500 to-cyan-500" />
                          Learn More
                        </h4>
                        <div className="flex flex-wrap gap-2.5">
                          {upgrade.relatedLinks.map((link, idx) => (
                            <motion.a
                              key={idx}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.98 }}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-linear-to-r from-cyan-500/15 to-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition-all duration-300 hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-500/20 dark:border-cyan-400/20 dark:from-cyan-500/10 dark:to-emerald-500/5 dark:text-cyan-300 dark:hover:shadow-cyan-500/10"
                            >
                              <FileText className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                              <span>{link.title}</span>
                              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                            </motion.a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CTA Button */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative z-10"
                    >
                      <Link
                        href={`/upgrade/${upgrade.slug}`}
                        className="group inline-flex items-center gap-2 rounded-xl border-2 border-cyan-400/30 bg-linear-to-r from-cyan-500/20 to-emerald-500/10 px-6 py-3.5 text-base font-bold text-cyan-700 transition-all duration-300 hover:border-cyan-400/60 hover:shadow-2xl hover:shadow-cyan-500/30 dark:border-cyan-400/20 dark:from-cyan-500/15 dark:to-emerald-500/5 dark:text-cyan-300 dark:hover:shadow-cyan-500/20"
                      >
                        <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" />
                        <span>Explore Full Upgrade</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </motion.div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}