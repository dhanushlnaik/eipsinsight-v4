'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { PageHeader } from '@/components/header';
import { ZoomableTimeline } from '@/app/upgrade/_components/zoomable-timeline';
import { UpgradeStatsCards } from '@/app/upgrade/_components/upgrade-stats-cards';
import { CollapsibleHeader } from '@/app/upgrade/_components/collapsible-header';
import { NetworkUpgradesChart } from '@/app/upgrade/_components/network-upgrades-chart';
import { HorizontalUpgradeTimeline } from '@/app/upgrade/_components/horizontal-upgrade-timeline';
import { UpgradeTimelineChart } from '@/app/upgrade/_components/upgrade-timeline-chart';
import { EipInclusionProcessGraph } from '@/app/upgrade/_components/eip-inclusion-process-graph';

import { client } from '@/lib/orpc';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { eipTitles, rawData, upgradeMetaEIPs, pairedUpgradeNames } from '@/data/network-upgrades';

export default function UpgradePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTable, setActiveTable] = useState<'core' | 'meta' | 'execution' | 'consensus' | null>(null);
  const [page, setPage] = useState(1);
  const [columnSearch, setColumnSearch] = useState({
    eip: '',
    title: '',
    upgrade: '',
    layer: '',
    date: '',
  });
  const [glamsterdamTimeline, setGlamsterdamTimeline] = useState<Array<{
    date: string;
    included: string[];
    scheduled: string[];
    declined: string[];
    considered: string[];
    proposed: string[];
  }>>([]);
  const detailsSectionRef = useRef<HTMLDivElement>(null);
  const totalUpgradeCount = useMemo(
    () => new Set(rawData.map((item) => getDisplayUpgradeName(item.upgrade, item.date))).size,
    []
  );

  const coreEipRows = useMemo(() => {
    return rawData
      .flatMap((item) =>
        item.eips
          .filter((eip) => eip !== 'NO-EIP' && eip !== 'CONSENSUS')
          .map((eip) => {
            const eipNumber = eip.replace('EIP-', '').replace('-removed', '');
            const eipInfo = eipTitles[eipNumber];

            return {
              id: `${item.upgrade}-${eip}`,
              eipNumber,
              title: eipInfo?.title ?? `EIP-${eipNumber}`,
              upgrade: getDisplayUpgradeName(item.upgrade, item.date),
              upgradeHref: getUpgradeHref(item.upgrade, item.date),
              layer: item.layer === 'consensus' ? 'Consensus' : 'Execution',
              date: item.date,
            };
          })
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  const metaEipRows = useMemo(() => {
    return rawData
      .filter((item) => upgradeMetaEIPs[item.upgrade])
      .map((item) => {
        const metaEip = upgradeMetaEIPs[item.upgrade];
        const eipNumber = metaEip.replace('EIP-', '');
        const eipInfo = eipTitles[eipNumber];

        return {
          id: `${item.upgrade}-${metaEip}`,
          eipNumber,
          title: eipInfo?.title ?? `Meta EIP for ${item.upgrade}`,
          upgrade: getDisplayUpgradeName(item.upgrade, item.date),
          upgradeHref: getUpgradeHref(item.upgrade, item.date),
          layer: item.layer === 'consensus' ? 'Consensus' : 'Execution',
          date: item.date,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  const activeRows = useMemo(() => {
    if (activeTable === 'meta') return metaEipRows;
    if (activeTable === 'execution') return coreEipRows.filter((row) => row.layer === 'Execution');
    if (activeTable === 'consensus') return coreEipRows.filter((row) => row.layer === 'Consensus');
    return coreEipRows;
  }, [activeTable, coreEipRows, metaEipRows]);
  const filteredRows = useMemo(() => {
    return activeRows.filter((row) =>
      Object.entries(columnSearch).every(([key, search]) => {
        const normalizedSearch = search.trim().toLowerCase();
        if (!normalizedSearch) return true;

        if (key === 'eip') {
          return `eip-${row.eipNumber}`.toLowerCase().includes(normalizedSearch) || row.eipNumber.toLowerCase().includes(normalizedSearch);
        }

        return String(row[key as keyof typeof row] ?? '')
          .toLowerCase()
          .includes(normalizedSearch);
      })
    );
  }, [activeRows, columnSearch]);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page]);
  const isTableFiltered = Object.values(columnSearch).some((value) => value.trim().length > 0);

  const handleSelectTable = (mode: 'core' | 'meta' | 'execution' | 'consensus') => {
    setActiveTable(mode);
    setPage(1);

    requestAnimationFrame(() => {
      detailsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleColumnSearch = (key: keyof typeof columnSearch, value: string) => {
    setColumnSearch((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setColumnSearch({
      eip: '',
      title: '',
      upgrade: '',
      layer: '',
      date: '',
    });
    setPage(1);
  };

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (!activeTable) {
      clearFilters();
    }
  }, [activeTable]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const timelineData = await client.upgrades
          .getUpgradeTimeline({ slug: 'glamsterdam' })
          .catch(() => []);

        setGlamsterdamTimeline(timelineData);
      } catch (err) {
        console.error('Failed to fetch upgrade data:', err);
        setError('Failed to load upgrade data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full px-4 py-16 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full px-4 py-16 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center">
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background relative w-full overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(52,211,153,0.18),_transparent_60%)]" />
        <div className="absolute top-0 left-1/2 -z-10 h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-300/10 blur-3xl" />
      </div>

      {/* Collapsible Header */}
      <CollapsibleHeader />

      {/* Stats & Flowchart Section */}
      <section className="relative w-full bg-background">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-12 pt-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Stats Cards */}
            <div className="flex h-full">
              <div className="w-full h-full min-h-[260px] sm:min-h-[280px] lg:min-h-[300px] flex items-stretch">
                <UpgradeStatsCards
                  totalUpgrades={totalUpgradeCount}
                  activeTable={activeTable}
                  onSelectTable={handleSelectTable}
                />
              </div>
            </div>

            {/* Right: EIP Inclusion Flowchart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={cn(
                "relative rounded-xl border border-border",
                "bg-card/60 backdrop-blur-sm overflow-hidden",
                "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/15",
                "transition-all duration-200",
                "h-full min-h-[260px] sm:min-h-[280px] lg:min-h-[300px]"
              )}
            >
              <EipInclusionProcessGraph />
            </motion.div>
          </div>
        </div>
      </section>

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="h-px w-full bg-border/60" />
      </div>

      {/* Timeline Section */}
      <section className="relative w-full bg-background">
        <PageHeader
          title="Ethereum Upgrade Timeline (by timeline)"
          description="Visual timeline of all network upgrades from Frontier to present"
          sectionId="timeline"
          titleAs="h2"
          className="bg-background"
        />
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-12 pb-6">
          <ZoomableTimeline
            imagePath="/upgrade/ethupgradetimeline.png"
            alt="Ethereum Network Upgrade Timeline"
          />
        </div>
      </section>

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="h-px w-full bg-border/60" />
      </div>

      {/* Network Upgrades Chart Section */}
      <section className="relative w-full bg-background">
        <PageHeader
          title="Network Upgrade Timeline (by distribution of EIPs)"
          description="Interactive timeline showing all Ethereum network upgrades and their EIP implementations"
          sectionId="network-upgrades-chart"
          titleAs="h2"
          className="bg-background"
        />
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-12 pb-6">
          <NetworkUpgradesChart />
        </div>
      </section>

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="h-px w-full bg-border/60" />
      </div>

      {/* Upgrades List / Roadmap Section */}
      <section className="relative w-full bg-background">
        <PageHeader
          title="Network Upgrade Roadmap"
          description="High‑level view of recent and upcoming coordinated Ethereum network upgrades."
          sectionId="upgrades"
          titleAs="h2"
          className="bg-background"
        />
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-12 pb-6">
          <div className="mb-6">
            <HorizontalUpgradeTimeline />
          </div>

          {/* Glamsterdam Timeline Chart */}
          {glamsterdamTimeline.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-6"
            >
              <UpgradeTimelineChart data={glamsterdamTimeline} upgradeName="Glamsterdam" />
            </motion.div>
          )}
        </div>
      </section>

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="h-px w-full bg-border/60" />
      </div>

      <section ref={detailsSectionRef} className="relative w-full bg-background">
        <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-12">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur-sm"
          >
            <div className="flex flex-col gap-2 border-b border-border/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="dec-title text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {activeTable === 'meta'
                    ? 'Hard Fork Meta EIPs'
                    : activeTable === 'execution'
                      ? 'Execution Layer EIPs'
                      : activeTable === 'consensus'
                        ? 'Consensus Layer EIPs'
                    : activeTable === 'core'
                      ? 'EIPs Deployed'
                      : 'Upgrade EIP Details'}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {activeTable === 'meta'
                    ? 'Meta EIPs associated with upgrades in the distribution chart.'
                    : activeTable === 'execution'
                      ? 'Core EIPs deployed through execution-layer upgrades.'
                      : activeTable === 'consensus'
                        ? 'Core EIPs deployed through consensus-layer upgrades.'
                    : activeTable === 'core'
                      ? 'Core EIPs deployed in upgrades from the distribution chart.'
                      : 'Select either stats card above to jump here and inspect the linked EIPs.'}
                </p>
              </div>
              {activeTable && (
                <button
                  type="button"
                  onClick={() => setActiveTable(null)}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-1 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary"
                >
                  Hide table
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              {activeTable ? (
                <table className="w-full min-w-full table-fixed text-sm">
                  <colgroup>
                    <col className="w-[14%]" />
                    <col className="w-[34%]" />
                    <col className="w-[16%]" />
                    <col className="w-[14%]" />
                    <col className="w-[22%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-border/70 bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="px-2 py-2">EIP</th>
                      <th className="px-2 py-2">Title</th>
                      <th className="px-2 py-2">Upgrade</th>
                      <th className="px-2 py-2">Layer</th>
                      <th className="px-2 py-2">Date</th>
                    </tr>
                    <tr className="border-b border-border/60 bg-muted/40">
                      <th className="px-2 py-2">
                        <input
                          value={columnSearch.eip}
                          onChange={(e) => handleColumnSearch('eip', e.target.value)}
                          placeholder="EIP-1559 / 1559"
                          className="h-8 w-full rounded-md border border-border bg-muted/60 px-2 text-xs text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                        />
                      </th>
                      <th className="px-2 py-2">
                        <input
                          value={columnSearch.title}
                          onChange={(e) => handleColumnSearch('title', e.target.value)}
                          placeholder="Title"
                          className="h-8 w-full rounded-md border border-border bg-muted/60 px-2 text-xs text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                        />
                      </th>
                      <th className="px-2 py-2">
                        <input
                          value={columnSearch.upgrade}
                          onChange={(e) => handleColumnSearch('upgrade', e.target.value)}
                          placeholder="Upgrade"
                          className="h-8 w-full rounded-md border border-border bg-muted/60 px-2 text-xs text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                        />
                      </th>
                      <th className="px-2 py-2">
                        <input
                          value={columnSearch.layer}
                          onChange={(e) => handleColumnSearch('layer', e.target.value)}
                          placeholder="Layer"
                          className="h-8 w-full rounded-md border border-border bg-muted/60 px-2 text-xs text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                        />
                      </th>
                      <th className="px-2 py-2">
                        <input
                          value={columnSearch.date}
                          onChange={(e) => handleColumnSearch('date', e.target.value)}
                          placeholder="YYYY-MM-DD"
                          className="h-8 w-full rounded-md border border-border bg-muted/60 px-2 text-xs text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row) => (
                      <tr key={row.id} className="border-b border-border/60 text-foreground hover:bg-muted/40">
                        <td className="px-2 py-2 font-medium text-primary">
                          <Link href={`/eip/${row.eipNumber}`} className="hover:underline">
                            EIP-{row.eipNumber}
                          </Link>
                        </td>
                        <td className="px-2 py-2 text-foreground">{row.title}</td>
                        <td className="px-2 py-2 text-muted-foreground">
                          {row.upgradeHref ? (
                            <Link href={row.upgradeHref} className="text-primary hover:underline">
                              {row.upgrade}
                            </Link>
                          ) : (
                            row.upgrade
                          )}
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">{row.layer}</td>
                        <td className="px-2 py-2 text-muted-foreground">{row.date}</td>
                      </tr>
                    ))}
                    {paginatedRows.length === 0 && (
                      <tr className="border-b border-border/60">
                        <td colSpan={5} className="px-4 py-8 text-sm text-muted-foreground">
                          No matching rows found for the current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="px-4 py-10 text-sm text-muted-foreground">
                  Choose <span className="text-foreground">EIPs Deployed</span> or <span className="text-foreground">Hard Fork Meta EIPs</span> above to load the table.
                </div>
              )}
            </div>
            {activeTable && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <span>{isTableFiltered ? 'Filtered results' : 'Results'}: {filteredRows.length.toLocaleString()}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearFilters}
                    className="rounded-md border border-border bg-muted/60 px-2 py-1 text-muted-foreground hover:border-primary/40 hover:text-primary"
                  >
                    Reset Filters
                  </button>
                  <button
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1}
                    className="rounded-md border border-border bg-muted/60 px-2 py-1 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span>Page {page} / {totalPages}</span>
                  <button
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page >= totalPages}
                    className="rounded-md border border-border bg-muted/60 px-2 py-1 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function getUpgradeHref(upgrade: string, date: string): string | null {
  const pairedUpgradeName = pairedUpgradeNames[date];
  if (pairedUpgradeName === 'Shapella') return '/upgrade/shanghai';
  if (pairedUpgradeName === 'Dencun') return '/upgrade/cancun';
  if (pairedUpgradeName === 'Pectra') return '/upgrade/pectra';
  if (pairedUpgradeName === 'Fusaka') return '/upgrade/fusaka';

  const directMap: Record<string, string> = {
    Frontier: '/upgrade/frontier',
    Homestead: '/upgrade/homestead',
    'DAO Fork': '/upgrade/dao-fork',
    'Tangerine Whistle': '/upgrade/tangerine-whistle',
    'Spurious Dragon': '/upgrade/spurious-dragon',
    Byzantium: '/upgrade/byzantium',
    Constantinople: '/upgrade/constantinople',
    Istanbul: '/upgrade/istanbul',
    Berlin: '/upgrade/berlin',
    London: '/upgrade/london',
    Paris: '/upgrade/paris',
    Shanghai: '/upgrade/shanghai',
    Cancun: '/upgrade/cancun',
    Prague: '/upgrade/pectra',
    Electra: '/upgrade/pectra',
    Osaka: '/upgrade/fusaka',
    Fulu: '/upgrade/fusaka',
  };

  if (directMap[upgrade]) return directMap[upgrade];
  if (date === '2024-03-13') return '/upgrade/cancun';
  if (date === '2025-05-07') return '/upgrade/pectra';
  if (date === '2025-12-03') return '/upgrade/fusaka';
  return null;
}

function getDisplayUpgradeName(upgrade: string, date: string): string {
  const mergeTimestamp = new Date('2022-09-15').getTime();
  const upgradeTimestamp = new Date(date).getTime();
  if (upgradeTimestamp > mergeTimestamp && pairedUpgradeNames[date]) {
    return pairedUpgradeNames[date];
  }
  return upgrade;
}
