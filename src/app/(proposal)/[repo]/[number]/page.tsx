'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ExternalLink,
  AlertCircle,
  Github,
  Copy,
  Check,
  FileCode,
  RefreshCw,
  Newspaper,
  Sparkles,
  BookOpen,
  Building2,
  MessageSquare,
  Users,
  ListTree,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  ArrowUpRight,
  Video,
  Calendar,
  GitFork,
  Link2,
  Clock,
  Boxes,
  ArrowRight,
  Database,
} from 'lucide-react';
import { client } from '@/lib/orpc';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProposalSubscriptionCard } from '@/components/proposal-subscription-card';
import { RepositorySubscriptionCard } from '@/components/repository-subscription-card';
import { rawData, pairedUpgradeNames } from '@/data/network-upgrades';
import { normalizeUpgradeBucket } from '@/lib/upgrade-stages';
import { UpgradeStageSplitBadge } from '@/components/upgrade/stage-badge';
import { EnterpriseEIPBrief, type EipCuration } from '@/components/enterprise-eip-brief';
import { ProposalTimeline } from '@/components/proposal-timeline';
import { InlineBrandLoader } from '@/components/inline-brand-loader';
import { LucidProposalSection } from '@/components/lucid-proposal-section';
import { SectionHead } from '@/components/ledger/section-head';
import { LedgerBadge } from '@/components/ledger/badge';
import { OnThisPage, type RailItem } from '@/components/proposal/on-this-page';
import { DependencyGraph, type DepNode } from '@/components/proposal/dependency-graph';
import { EditorialPRs, type EditorialPRItem } from '@/components/proposal/editorial-prs';
import { Stakeholders } from '@/components/proposal/stakeholders';


interface ProposalData {
  repo: string;
  number: number;
  title: string;
  authors: string[];
  created: string | null;
  type: string | null;
  category: string | null;
  status: string;
  last_call_deadline: string | null;
  discussions_to: string | null;
  requires: number[];
}

interface StatusEvent {
  from: string | null;
  to: string;
  changed_at: string;
  commit_sha?: string;
}

interface StageEvent {
  upgrade_id: number | null;
  upgrade: string;
  slug: string;
  bucket: string;
  commit_sha: string | null;
  commit_date: string | null;
}

interface GovernanceState {
  pr_number: number | null;
  pr_url: string | null;
  current_pr_state: string | null;
  waiting_on: string | null;
  days_since_last_action: number | null;
  review_velocity: number | null;
}

interface UpgradeInclusion {
  upgrade_id: number;
  name: string;
  slug: string;
  bucket: string;
  commit_date: string | null;
  layer?: string | null;
}

interface ResourceArticle {
  title: string;
  url: string;
  excerpt: string;
  publishedAt: string;
  featureImage?: string | null;
  readingTime?: number | null;
  authorName?: string | null;
  tags?: string[];
}

interface ResourceVideo {
  title: string;
  url: string;
  description: string;
}

interface AiResourceRecommendation {
  kind: 'text' | 'audio' | 'video' | 'discussion';
  label: string;
  url: string;
  reason: string;
}

interface LiveSearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

function extractHeadingsFromMarkdown(markdown: string): HeadingItem[] {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const headings: HeadingItem[] = [];
  const seenIds = new Set<string>();

  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (!match) continue;

    const level = match[1].length;
    let text = match[2].trim();
    const customIdMatch = text.match(/^(.*?)\s*\{#([a-zA-Z0-9_-]+)\}\s*$/);
    let id = '';
    if (customIdMatch) {
      text = customIdMatch[1].trim();
      id = customIdMatch[2].trim();
    } else {
      id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    }

    if (!id || seenIds.has(id)) continue;
    seenIds.add(id);

    const lowerText = text.toLowerCase();
    if (
      lowerText.startsWith('eip-') ||
      lowerText.startsWith('erc-') ||
      lowerText.startsWith('rip-')
    ) {
      continue;
    }

    headings.push({ id, text, level });
  }

  return headings;
}

function getHistoricalUpgradeSlug(name: string, date: string): string {
  const pairedName = pairedUpgradeNames[date];
  if (pairedName === 'Shapella') return 'shanghai';
  if (pairedName === 'Dencun') return 'cancun';
  if (pairedName === 'Pectra') return 'pectra';
  if (pairedName === 'Fusaka') return 'fusaka';

  const directMap: Record<string, string> = {
    'frontier thawing': 'frontier-thawing',
    frontier: 'frontier',
    homestead: 'homestead',
    'dao fork': 'dao-fork',
    'tangerine whistle': 'tangerine-whistle',
    'spurious dragon': 'spurious-dragon',
    byzantium: 'byzantium',
    constantinople: 'constantinople',
    petersburg: 'petersburg',
    istanbul: 'istanbul',
    'muir glacier': 'muir-glacier',
    berlin: 'berlin',
    london: 'london',
    altair: 'altair',
    'arrow glacier': 'arrow-glacier',
    'gray glacier': 'gray-glacier',
    bellatrix: 'bellatrix',
    paris: 'paris',
    shanghai: 'shanghai',
    capella: 'capella',
    cancun: 'cancun',
    deneb: 'deneb',
    prague: 'pectra',
    electra: 'pectra',
    osaka: 'fusaka',
    fulu: 'fusaka',
  };

  return directMap[name.toLowerCase()] ?? name.toLowerCase().replace(/\s+/g, '-');
}

function getHistoricalIncludedUpgrades(eipNumber: number): UpgradeInclusion[] {
  const normalized = String(eipNumber);
  const mergeTimestamp = new Date('2022-09-15').getTime();
  const entries = new Map<string, UpgradeInclusion>();

  rawData.forEach((item) => {
    const includesEip = item.eips.some((value) => value.replace('EIP-', '').replace('-removed', '') === normalized);
    if (!includesEip) return;

    const itemTime = new Date(item.date).getTime();
    const displayName =
      itemTime > mergeTimestamp && pairedUpgradeNames[item.date]
        ? pairedUpgradeNames[item.date]
        : item.upgrade;
    const slug = getHistoricalUpgradeSlug(displayName, item.date);
    const key = `${item.date}:${slug}`;

    if (!entries.has(key)) {
      entries.set(key, {
        upgrade_id: -(entries.size + 1),
        name: displayName,
        slug,
        bucket: 'included',
        commit_date: new Date(item.date).toISOString(),
        layer: item.layer || null,
      });
    }
  });

  return Array.from(entries.values());
}

type ProposalRepo = 'eip' | 'erc' | 'rip';

// =============================================================================
// Helper functions
// =============================================================================

// Higher = more "active"/advanced. When an EIP sits in several upgrades (e.g.
// declined in one, then re-proposed in a newer one), the headline inclusion
// status should surface the live stage, not the dead-end DFI. Per-upgrade stages
// are still listed separately so the DFI history is preserved.
function bucketRank(bucket: string | null): number {
  switch (normalizeUpgradeBucket(bucket)) {
    case 'included':
      return 5;
    case 'scheduled':
      return 4;
    case 'considered':
      return 3;
    case 'proposed':
      return 2;
    case 'declined':
      return 1;
    default:
      return 0;
  }
}

function getStatusBadgeClass(status: string | null): string {
  if (!status) return 'border-slate-500/25 bg-slate-500/12 text-slate-700 dark:text-slate-300';
  const norm = status.toLowerCase();
  if (norm === 'draft') return 'border-slate-500/25 bg-slate-500/12 text-slate-700 dark:text-slate-300';
  if (norm === 'review') return 'border-amber-500/25 bg-amber-500/12 text-amber-700 dark:text-amber-300';
  if (norm === 'last call') return 'border-orange-500/25 bg-orange-500/12 text-orange-700 dark:text-orange-300';
  if (norm === 'final') return 'border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300';
  if (norm === 'living') return 'border-cyan-500/25 bg-cyan-500/12 text-cyan-700 dark:text-cyan-300';
  if (norm === 'stagnant') return 'border-gray-500/25 bg-gray-500/12 text-gray-700 dark:text-gray-400';
  if (norm === 'withdrawn') return 'border-red-500/25 bg-red-500/12 text-red-700 dark:text-red-300';
  return 'border-slate-500/25 bg-slate-500/12 text-slate-700 dark:text-slate-300';
}

const STATUS_MEANING: Record<string, string> = {
  draft: "Early work-in-progress. The proposal is open for discussion and may change substantially.",
  review: "Ready for peer and editor review. The author believes the design is solid.",
  "last call": "Final review window before moving to Final. Feedback closes on the last-call deadline.",
  final: "Accepted standard. Changes are no longer made except for errata.",
  living: "Continually updated standard that never freezes at Final.",
  stagnant: "No activity for 6+ months. Can be revived by an author or champion.",
  withdrawn: "Withdrawn by the authors and no longer pursued.",
};

function splitSpec(content: string): { head: string; rest: string } {
  const abs = content.match(/##\s*Abstract/i);
  if (!abs || abs.index == null) return { head: content, rest: "" };
  const afterAbs = content.slice(abs.index + abs[0].length);
  const nextRel = afterAbs.search(/\n#{1,2}\s/);
  if (nextRel === -1) return { head: content, rest: "" };
  const splitAt = abs.index + abs[0].length + nextRel;
  return { head: content.slice(0, splitAt).trim(), rest: content.slice(splitAt).trim() };
}

function formatShortDate(value: string | null | undefined): string {
  if (!value) return "–";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// Helper to get author initials
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// Helper to get GitHub avatar URL
function getGitHubAvatar(name: string): string | undefined {
  if (!name || !name.trim()) return undefined;
  
  // Pattern 1: Extract from parentheses like "Name (@username)"
  const parenMatch = name.match(/\(@([\w-]+)\)/i);
  if (parenMatch) {
    return `https://github.com/${parenMatch[1]}.png`;
  }
  
  // Pattern 2: Extract from URL like "github.com/username"
  const urlMatch = name.match(/github\.com\/([\w-]+)/i);
  if (urlMatch) {
    return `https://github.com/${urlMatch[1]}.png`;
  }
  
  // Pattern 3: Extract from email domain (if it's a GitHub email)
  const emailMatch = name.match(/([\w-]+)@users\.noreply\.github\.com/i);
  if (emailMatch) {
    return `https://github.com/${emailMatch[1]}.png`;
  }
  
  // Pattern 4: If name looks like a GitHub username (no spaces, alphanumeric + hyphens)
  const cleanName = name.trim();
  if (/^[\w-]+$/.test(cleanName) && cleanName.length > 0 && cleanName.length < 40) {
    // Could be a username, but don't assume - return undefined to use fallback
    // This prevents false positives
    return undefined;
  }
  
  // If we can't determine, return undefined to show fallback
  return undefined;
}

export default function ProposalDetailPage() {
  const params = useParams();
  const repo = params.repo as string;
  const number = parseInt(params.number as string, 10);

  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [statusEvents, setStatusEvents] = useState<StatusEvent[]>([]);
  const [stageEvents, setStageEvents] = useState<StageEvent[]>([]);
  const [governanceState, setGovernanceState] = useState<GovernanceState | null>(null);
  const [curation, setCuration] = useState<EipCuration | null>(null);
  const [upgrades, setUpgrades] = useState<UpgradeInclusion[]>([]);
  const [resourceArticles, setResourceArticles] = useState<ResourceArticle[]>([]);
  const [resourceVideos, setResourceVideos] = useState<ResourceVideo[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<AiResourceRecommendation[]>([]);
  const [webSuggestions, setWebSuggestions] = useState<LiveSearchResult[]>([]);
  const [videoSuggestions, setVideoSuggestions] = useState<LiveSearchResult[]>([]);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const [markdownLoading, setMarkdownLoading] = useState(false);
  const [markdownError, setMarkdownError] = useState<string | null>(null);
  const [discussionsTo, setDiscussionsTo] = useState<string | null>(null);
  const [proposalRequires, setProposalRequires] = useState<number[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const [markdownCopied, setMarkdownCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullSpecification, setShowFullSpecification] = useState(false);
  const [requiredBy, setRequiredBy] = useState<DepNode[]>([]);
  const [editorialPRs, setEditorialPRs] = useState<EditorialPRItem[]>([]);
  const [meetings, setMeetings] = useState<Array<{ title: string; date: string | null; url: string; snippet: string | null; mentionedBy: string | null }>>([]);
  // Enterprise view is URL-driven (?enterprise=1) so the exact view is shareable,
  // and remembered in localStorage so a user who prefers it keeps it across EIPs.
  const ENTERPRISE_STORAGE_KEY = 'eip-enterprise-view';
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'spec' | 'enterprise'>(() =>
    searchParams.get('enterprise') === '1' ? 'enterprise' : 'overview'
  );
  const [showEnterpriseView, setShowEnterpriseView] = useState(() => {
    if (searchParams.get('enterprise') === '1') return true;
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(ENTERPRISE_STORAGE_KEY) === '1';
      } catch {
        return false;
      }
    }
    return false;
  });

  const setEnterprise = React.useCallback((next: boolean) => {
    setShowEnterpriseView(next);
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (next) p.set('enterprise', '1');
      else p.delete('enterprise');
      const qs = p.toString();
      window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
      try {
        localStorage.setItem(ENTERPRISE_STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
    }
  }, []);

  // Normalize repo name
  const normalizedRepo = repo.toLowerCase().replace(/s$/, '');
  const proposalRepo = normalizedRepo as ProposalRepo;
  const repoDisplayName = normalizedRepo === 'eip' ? 'EIP' : normalizedRepo === 'erc' ? 'ERC' : 'RIP';
  const repoPath = normalizedRepo === 'eip' ? 'EIPs' : normalizedRepo === 'erc' ? 'ERCs' : 'RIPs';
  const filePath = normalizedRepo === 'eip' ? 'EIPS' : normalizedRepo === 'erc' ? 'ERCS' : 'RIPS';
  const fileName = `${normalizedRepo}-${number}.md`;
  // The "current" upgrade for headline fields: the most active/advanced stage
  // across all upgrades this EIP appears in (newest as tiebreak), so a DFI in an
  // older fork doesn't mask a live PFI/CFI/SFI in a newer one.
  const latestUpgrade =
    [...upgrades].sort((a, b) => {
      const rankDiff = bucketRank(b.bucket) - bucketRank(a.bucket);
      if (rankDiff !== 0) return rankDiff;
      const at = a.commit_date ? new Date(a.commit_date).getTime() : 0;
      const bt = b.commit_date ? new Date(b.commit_date).getTime() : 0;
      return bt - at;
    })[0] ?? null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [proposalData, statusData, stageData, governanceData, upgradesData, curationData, extrasData] = await Promise.all([
          client.proposals.getProposal({ repo: proposalRepo, number }),
          client.proposals.getStatusEvents({ repo: proposalRepo, number }),
          // Historical stage journey (PFI → CFI → SFI, declines, re-proposals).
          client.proposals.getStageEvents({ repo: proposalRepo, number }).catch(() => []),
          client.proposals.getGovernanceState({ repo: proposalRepo, number }),
          client.proposals.getUpgrades({ repo: proposalRepo, number }),
          // Curated per-EIP stakeholder impacts (editable in admin) ground the
          // Enterprise view instead of keyword-guessing from the title.
          client.curations.getEipCurations({ eipNumbers: [Number(number)] }).catch(() => []),
          client.proposals.getProposalExtras({ number }).catch(() => ({ requiredBy: [], editorialPRs: [], meetings: [] })),
        ]);

        setProposal(proposalData);
        setStatusEvents(statusData);
        setStageEvents(stageData);
        setGovernanceState(governanceData);
        setCuration(curationData?.[0] ?? null);
        setRequiredBy(extrasData?.requiredBy ?? []);
        setEditorialPRs(extrasData?.editorialPRs ?? []);
        setMeetings(extrasData?.meetings ?? []);
        const historical = getHistoricalIncludedUpgrades(number);
        const mergedBySlug = new Map<string, UpgradeInclusion>();
        upgradesData.forEach((entry) => mergedBySlug.set(entry.slug || entry.name.toLowerCase(), entry));
        historical.forEach((entry) => {
          const key = entry.slug || entry.name.toLowerCase();
          if (!mergedBySlug.has(key)) {
            mergedBySlug.set(key, entry);
          }
        });

        const mergedUpgrades = Array.from(mergedBySlug.values()).sort((a, b) => {
          const aTime = a.commit_date ? new Date(a.commit_date).getTime() : 0;
          const bTime = b.commit_date ? new Date(b.commit_date).getTime() : 0;
          return bTime - aTime;
        });

        setUpgrades(mergedUpgrades);
      } catch (err: unknown) {
        console.error('Failed to fetch proposal data:', err);
        const message = err instanceof Error ? err.message : 'Failed to load proposal';
        setError(message);
        if (
          typeof err === 'object' &&
          err !== null &&
          'code' in err &&
          (err as { code?: string }).code === 'NOT_FOUND'
        ) {
          setError('Proposal not found');
        }
      } finally {
        setLoading(false);
      }
    };

    if (number && normalizedRepo) {
      fetchData();
    }
  }, [number, normalizedRepo, proposalRepo]);

  // Fetch markdown content lazily via getContent (includes discussions_to, requires from frontmatter)
  useEffect(() => {
    if (!proposal || markdownContent !== null) return;

    const fetchContent = async () => {
      try {
        setMarkdownLoading(true);
        setMarkdownError(null);

        const data = await client.proposals.getContent({
          repo: proposalRepo,
          number,
        });

        setMarkdownContent(data.content);
        setDiscussionsTo(data.discussions_to ?? null);
        setProposalRequires(data.requires ?? []);
      } catch (err: unknown) {
        console.error('Failed to fetch proposal content:', err);
        setMarkdownError('Failed to load proposal content');
      } finally {
        setMarkdownLoading(false);
      }
    };

    fetchContent();
  }, [proposal, proposalRepo, number, markdownContent]);

  useEffect(() => {
    if (!proposal?.title) return;

    let cancelled = false;
    const fetchResources = async () => {
      try {
        setResourceLoading(true);
        const res = await fetch('/api/proposal-resources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repo: proposalRepo,
            number,
            title: proposal.title,
          }),
        });

        const data = await res.json();
        if (cancelled) return;

        setResourceArticles(Array.isArray(data.articles) ? data.articles : []);
        setResourceVideos(Array.isArray(data.videos) ? data.videos : []);
        setAiRecommendations(Array.isArray(data.aiRecommendations) ? data.aiRecommendations : []);
        setWebSuggestions(Array.isArray(data.webSuggestions) ? data.webSuggestions : []);
        setVideoSuggestions(Array.isArray(data.videoSuggestions) ? data.videoSuggestions : []);
      } catch {
        if (cancelled) return;
        setResourceArticles([]);
        setResourceVideos([]);
        setAiRecommendations([]);
        setWebSuggestions([]);
        setVideoSuggestions([]);
      } finally {
        if (!cancelled) setResourceLoading(false);
      }
    };

    fetchResources();
    return () => { cancelled = true; };
  }, [number, proposal?.title]);

  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleCopyMarkdown = async () => {
    if (!markdownContent) return;
    try {
      await navigator.clipboard.writeText(markdownContent);
      setMarkdownCopied(true);
      setTimeout(() => setMarkdownCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy markdown:', err);
    }
  };

  if (loading) {
    return (
      <div data-ledger className="flex min-h-[70vh] items-center justify-center bg-[var(--paper)] p-6 text-[var(--ink)]">
        <InlineBrandLoader size="md" label={`Loading ${repoDisplayName}-${number}...`} />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div data-ledger className="flex min-h-[70vh] items-center justify-center bg-[var(--paper)] p-6 text-[var(--ink)]">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-[#ef4444]" />
          <h2 className="font-serif text-2xl font-normal tracking-tight text-[var(--ink)]">
            Failed to load proposal
          </h2>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">{error || 'Unknown error'}</p>
          <Link href="/explore" className="btn btn-outline mt-5 inline-flex h-9 px-4 text-xs">
            Browse proposals
          </Link>
        </div>
      </div>
    );
  }

  const proposalId = `${repoDisplayName}-${proposal.number}`;
  const githubUrl = `https://github.com/ethereum/${repoPath}/blob/master/${filePath}/${fileName}`;
  const officialUrl =
    normalizedRepo === 'rip'
      ? `https://rips.ethereum.org/RIPS/rip-${proposal.number}`
      : normalizedRepo === 'erc'
        ? `https://eips.ethereum.org/ERCS/erc-${proposal.number}`
        : `https://eips.ethereum.org/EIPS/eip-${proposal.number}`;
  const discussionUrl = proposal.discussions_to || discussionsTo || null;
  const statusMeaning = proposal.status ? STATUS_MEANING[proposal.status.toLowerCase()] : null;
  const { head: specHead, rest: specRest } = markdownContent ? splitSpec(markdownContent) : { head: '', rest: '' };
  const hasPlainCuration = Boolean(
    curation && (curation.layman_summary || (curation.benefits?.length ?? 0) > 0 || (curation.tradeoffs?.length ?? 0) > 0)
  );

  const hasStakeholders = Boolean(
    curation?.stakeholder_impacts &&
      Object.values(curation.stakeholder_impacts).some((v) => Boolean(v?.description?.trim()))
  );
  const specHeadings = markdownContent
    ? extractHeadingsFromMarkdown(markdownContent).filter((h) => h.level === 2)
    : [];

  const overviewRailItems: RailItem[] = [
    { id: 'summary', label: 'Summary' },
    { id: 'proposal-timeline', label: 'Lifecycle & Upgrades' },
    ...(governanceState || editorialPRs.length > 0 || meetings.length > 0
      ? [{ id: 'governance', label: 'Governance & Edits' }]
      : []),
    ...(proposalRequires.length > 0 || requiredBy.length > 0
      ? [{ id: 'dependencies', label: 'Dependencies' }]
      : []),
    ...(hasStakeholders ? [{ id: 'impact', label: 'Who it affects' }] : []),
    ...(curation?.faq && curation.faq.length > 0 ? [{ id: 'faq', label: 'FAQ' }] : []),
    { id: 'resources', label: 'Resources' },
    { id: 'proposal-subscription', label: 'Stay Updated' },
  ];

  const specRailItems: RailItem[] = [
    { id: 'proposal-text', label: 'Specification' },
    ...specHeadings.map((h) => ({ id: h.id, label: h.text, sub: true })),
  ];

  const mobileRailItems: RailItem[] = [
    ...overviewRailItems,
    { id: 'proposal-text', label: 'Specification' },
    { id: 'enterprise-brief', label: 'Enterprise Assessment' },
  ];

  const activeRailItems: RailItem[] =
    activeTab === 'spec'
      ? specRailItems
      : activeTab === 'enterprise'
        ? [{ id: 'enterprise-brief', label: 'Enterprise Assessment' }]
        : overviewRailItems;

  return (
    <div data-ledger className="min-h-screen bg-[var(--paper)] text-[var(--ink)] pb-16">
      {/* ── Masthead: the document's identity ───────────────────── */}
      <header id="proposal-overview" className="masthead border-b border-[var(--border)] bg-[var(--paper)]">
        <div className="wrap">
          <div className="relative overflow-hidden pb-8 pt-7 sm:pt-9">
            <span
              aria-hidden
              className="pointer-events-none select-none font-serif text-[7rem] font-bold leading-none tracking-tight text-[var(--ink)]/[0.04] absolute -bottom-8 right-0 hidden md:block lg:text-[9rem]"
            >
              {proposal.number}
            </span>

            <div className="relative">
              <nav className="flex items-center gap-1.5 font-mono text-xs text-[var(--ink-faint)]" aria-label="Breadcrumb">
                <Link href="/" className="transition-colors hover:text-[var(--ink)]">Home</Link>
                <ChevronRight className="h-3 w-3" />
                <Link href="/explore" className="transition-colors hover:text-[var(--ink)]">Proposals</Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-[var(--ink-muted)]">{proposalId}</span>
              </nav>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <LedgerBadge token={proposal.status}>{proposal.status}</LedgerBadge>
                {(proposal.type || proposal.category) && (
                  <LedgerBadge token={proposal.category || proposal.type || 'core'}>
                    {proposal.type && proposal.category ? `${proposal.type}: ${proposal.category}` : proposal.type || proposal.category}
                  </LedgerBadge>
                )}
                {proposal.category === 'Core' && (latestUpgrade?.layer === 'consensus' || latestUpgrade?.layer === 'execution') && (
                  <span className="chip font-mono text-[11px]">
                    {latestUpgrade.layer === 'consensus' ? 'Consensus Layer (CL)' : 'Execution Layer (EL)'}
                  </span>
                )}
                {upgrades.length > 0 && upgrades.map((upgrade) => (
                  <UpgradeStageSplitBadge
                    key={upgrade.slug ?? upgrade.name}
                    upgradeName={upgrade.name || `Upgrade ${upgrade.upgrade_id}`}
                    bucket={upgrade.bucket}
                    className="text-xs"
                  />
                ))}
              </div>

              <h1 className="t-h1 mt-4 max-w-4xl text-[var(--ink)]">
                <span className="text-[var(--brand-strong)]">{proposalId}:</span> {proposal.title}
              </h1>

              {curation?.layman_summary && (
                <p className="t-lead mt-4 max-w-2xl text-[var(--ink-muted)]">{curation.layman_summary}</p>
              )}

              <div className="mt-7 flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
                {proposal.authors.length > 0 ? (
                  <div className="flex items-center gap-3">
                    <span className="eyebrow">Authors</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <TooltipProvider>
                        {proposal.authors.map((author, index) => (
                          <Tooltip key={index}>
                            <TooltipTrigger asChild>
                              <div className="cursor-default">
                                <Avatar className="h-7 w-7 border border-[var(--border)] bg-[var(--surface-2)] transition-colors hover:border-[var(--ink)]">
                                  <AvatarImage
                                    src={getGitHubAvatar(author) || undefined}
                                    alt={author}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                  <AvatarFallback className="bg-[var(--surface-2)] font-mono text-[10px] font-semibold text-[var(--ink-muted)]">
                                    {getInitials(author)}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{author}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </TooltipProvider>
                    </div>
                  </div>
                ) : <span />}

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline h-9 bg-[var(--surface)] px-3 text-xs text-[var(--ink)] border-[var(--border)] hover:border-[var(--ink)]"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Official page
                  </a>
                  {discussionUrl && (
                    <a
                      href={discussionUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Open discussion thread"
                      aria-label="Open discussion thread"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--l-radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--ink-muted)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </a>
                  )}
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="View source on GitHub"
                    aria-label="View source on GitHub"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--l-radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--ink-muted)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    title={linkCopied ? 'Copied!' : 'Copy link'}
                    aria-label="Copy link to this proposal"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--l-radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--ink-muted)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)] cursor-pointer"
                  >
                    {linkCopied ? <Check className="h-4 w-4 text-[var(--brand-strong)]" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Record strip */}
          <dl className="grid grid-cols-2 border-t border-[var(--border)] sm:grid-cols-4">
            {[
              { k: 'Created', v: formatShortDate(proposal.created) },
              {
                k: 'Governance',
                v: governanceState?.waiting_on
                  ? governanceState.waiting_on.replace(/_/g, ' ')
                  : proposal.last_call_deadline
                    ? `Deadline ${formatShortDate(proposal.last_call_deadline)}`
                    : proposal.status,
              },
              {
                k: 'Requires',
                v: proposalRequires.length
                  ? `${proposalRequires.length} proposal${proposalRequires.length === 1 ? '' : 's'}`
                  : 'None',
              },
              { k: 'Source', v: `ethereum/${repoPath}`, mono: true },
            ].map((f, i) => (
              <div
                key={f.k}
                className={cn(
                  'py-4',
                  i % 2 === 1 && 'border-l border-[var(--border)] pl-4 sm:pl-6',
                  i >= 2 && 'border-t border-[var(--border)] sm:border-t-0',
                  i === 2 && 'sm:border-l sm:pl-6'
                )}
              >
                <dt className="eyebrow">{f.k}</dt>
                <dd className={cn('mt-1.5 truncate text-sm text-[var(--ink)]', f.mono && 'font-mono text-xs')}>
                  {f.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {/* ── Phone: section jump bar ─────────────────────────────── */}
      <nav className="sticky top-[var(--header-h)] z-30 border-b border-[var(--border)] bg-[var(--paper)] lg:hidden" aria-label="On this page">
        <div className="wrap no-scrollbar flex gap-2 overflow-x-auto py-2.5">
          {mobileRailItems.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="chip shrink-0">
              {n.label}
            </a>
          ))}
        </div>
      </nav>

      {/* ── Body: Desktop tabs + OnThisPage rail | Mobile vertical scroll ── */}
      <div className="wrap pt-8 lg:pt-10">
        {/* Desktop 3-Tab Bar */}
        <div
          role="tablist"
          aria-label="Proposal views"
          className="mb-8 hidden flex-wrap items-center gap-2 border-b border-[var(--border)] pb-3 lg:flex"
        >
          {(
            [
              { id: 'overview', label: 'Overview' },
              { id: 'spec', label: 'Specification' },
              { id: 'enterprise', label: 'Enterprise Assessment' },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-active={active ? 'true' : undefined}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'enterprise') setEnterprise(true);
                }}
                className="chip cursor-pointer px-4 py-1.5 text-xs font-medium"
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-x-14 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <article className="min-w-0 space-y-14">
          {/* TAB 1: Overview (AI Summary, Lifecycle, Governance & Edits, Dependencies, Stakeholders, FAQ, Resources, Subscriptions) */}
          <div className={cn(activeTab === 'overview' ? 'block' : 'block lg:hidden', 'space-y-14')}>
            {statusMeaning && (
              <p className="flex items-start gap-3 border-l-2 border-[var(--brand)] bg-[var(--surface-2)] py-3 pl-4 pr-4 text-sm text-[var(--ink-muted)]">
                <span className="font-semibold text-[var(--ink)]">{proposal.status}</span>
                <span>{statusMeaning}</span>
              </p>
            )}

          {/* Summary (Database-backed from eip_curations) */}
          <section id="summary" className="scroll-mt-24">
            <SectionHead
              eyebrow="In brief"
              title="Summary"
              description="Plain-language overview of what this proposal changes, its benefits, and its tradeoffs."
            />

            {hasPlainCuration && curation?.layman_summary ? (
              <div className="card p-5">
                <p className="text-sm leading-relaxed text-[var(--ink)]">{curation.layman_summary}</p>
                {((curation.benefits?.length ?? 0) > 0 || (curation.tradeoffs?.length ?? 0) > 0) && (
                  <div className="mt-4 grid gap-4 border-t border-[var(--border)] pt-4 sm:grid-cols-2">
                    {(curation.benefits?.length ?? 0) > 0 && (
                      <div>
                        <p className="eyebrow mb-2 text-[var(--brand-strong)]">Benefits</p>
                        <ul className="space-y-1.5 text-xs text-[var(--ink-muted)]">
                          {curation.benefits!.map((b, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--brand)]" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(curation.tradeoffs?.length ?? 0) > 0 && (
                      <div>
                        <p className="eyebrow mb-2">Tradeoffs</p>
                        <ul className="space-y-1.5 text-xs text-[var(--ink-muted)]">
                          {curation.tradeoffs!.map((t, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--ink-faint)]" />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-5">
                <p className="text-sm text-[var(--ink-muted)]">
                  A curated plain-language summary for {proposalId} has not been added yet. Read the Abstract and Specification in the{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('spec')}
                    className="font-medium text-[var(--brand-strong)] hover:underline cursor-pointer"
                  >
                    Specification
                  </button>{' '}
                  tab.
                </p>
              </div>
            )}
          </section>

          {/* Unified lifecycle, upgrade-stage & PR timeline */}
          <section id="proposal-timeline" className="scroll-mt-24">
            <SectionHead
              eyebrow="Standards process"
              title="Lifecycle & Upgrade Timeline"
              description="Status transitions, editorial pull requests, and network upgrade inclusion."
            />
            <ProposalTimeline
              proposal={proposal}
              statusEvents={statusEvents}
              stageEvents={stageEvents}
              upgrades={upgrades}
              governanceState={governanceState}
              repoPath={repoPath}
              normalizedRepo={normalizedRepo}
            />
          </section>

          {/* Governance, Calls & Editorial PRs */}
          {(governanceState || meetings.length > 0 || editorialPRs.length > 0) && (
            <section id="governance" className="scroll-mt-24 space-y-8">
              <SectionHead
                eyebrow="Editorial and governance"
                title="Discussion and Edits"
                description="Current pull request queue state, core developer calls, and editorial pull requests."
              />
              {governanceState && (
                <dl className="grid grid-cols-2 divide-y divide-[var(--border)] border-y border-[var(--border)] bg-[var(--surface)] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
                  <div className="px-4 py-4">
                    <dt className="eyebrow">Active PR</dt>
                    <dd className="mt-1.5 font-mono text-sm text-[var(--ink)]">
                      {governanceState.pr_number ? (
                        <Link href={`/pr/${normalizedRepo}/${governanceState.pr_number}`} className="text-[var(--brand-strong)] hover:underline">
                          PR #{governanceState.pr_number}
                        </Link>
                      ) : 'None'}
                    </dd>
                  </div>
                  <div className="px-4 py-4">
                    <dt className="eyebrow">PR State</dt>
                    <dd className="mt-1.5 text-sm capitalize text-[var(--ink)]">
                      {governanceState.current_pr_state || '–'}
                    </dd>
                  </div>
                  <div className="px-4 py-4">
                    <dt className="eyebrow">Waiting On</dt>
                    <dd className="mt-1.5 text-sm capitalize text-[var(--ink)]">
                      {governanceState.waiting_on ? governanceState.waiting_on.replace(/_/g, ' ') : 'None'}
                    </dd>
                  </div>
                  <div className="px-4 py-4">
                    <dt className="eyebrow">Days Since Action</dt>
                    <dd className="mt-1.5 font-mono text-sm tabular-nums text-[var(--ink)]">
                      {governanceState.days_since_last_action != null ? `${governanceState.days_since_last_action}d` : '–'}
                    </dd>
                  </div>
                </dl>
              )}

              {meetings.length > 0 && (
                <div>
                  <h3 className="eyebrow mb-3">Discussed in calls</h3>
                  <ul className="card divide-y divide-[var(--border)] overflow-hidden">
                    {meetings.map((m, i) => (
                      <li key={i}>
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--surface-2)]"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-[var(--ink)]">{m.title}</span>
                            {m.snippet && (
                              <span className="mt-1.5 line-clamp-2 block border-l-2 border-[var(--border-strong)] pl-3 text-xs italic leading-relaxed text-[var(--ink-muted)]">
                                &ldquo;{m.snippet.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').trim()}&rdquo;
                              </span>
                            )}
                            <span className="mt-1.5 block font-mono text-[11px] text-[var(--ink-faint)]">
                              {m.mentionedBy ? `${m.mentionedBy} · ` : ''}{formatShortDate(m.date)}
                            </span>
                          </span>
                          <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--ink-faint)] transition-colors group-hover:text-[var(--ink)]" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {editorialPRs.length > 0 && (
                <div>
                  <h3 className="eyebrow mb-3">Pull requests</h3>
                  <EditorialPRs
                    prs={editorialPRs}
                    repo={`ethereum/${repoPath}`}
                    isFinal={proposal.status?.toLowerCase() === 'final'}
                  />
                </div>
              )}
            </section>
          )}

          {/* Dependencies (SVG Fan Graph) */}
          {(proposalRequires.length > 0 || requiredBy.length > 0) && (
            <section id="dependencies" className="scroll-mt-24">
              <SectionHead
                eyebrow="Relationships"
                title="Dependencies"
                description={`Builds on ${proposalRequires.length} and is depended on by ${requiredBy.length}. Select any proposal to open it.`}
              />
              <div className="card p-4 sm:p-5">
                <DependencyGraph
                  label={proposalId}
                  requires={proposalRequires.map((r) => ({ kind: normalizedRepo, number: r }))}
                  requiredBy={requiredBy}
                />
              </div>
            </section>
          )}

          {/* Who it affects (Stakeholders) */}
          {hasStakeholders && curation?.stakeholder_impacts && (
            <section id="impact" className="scroll-mt-24">
              <SectionHead
                eyebrow="Impact"
                title="Who It Affects"
                description="How this proposal lands for the people who build on, run, and rely on Ethereum."
              />
              <Stakeholders impacts={curation.stakeholder_impacts} />
            </section>
          )}

          {/* Dedicated Lucid (EIP-8184) Encrypted Mempool Sections */}
          {number === 8184 && <LucidProposalSection />}

          {/* Native AA (EIP-8141) → link to the Account Abstraction usage dashboard */}
          {number === 8141 && (
            <Link
              href="/aa"
              className="card group flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:border-[var(--ink)]"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                  <Boxes className="h-4 w-4 text-[var(--brand-strong)]" />
                  Account Abstraction usage dashboard
                </div>
                <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                  Live on-chain adoption of EIP-7702 and ERC-4337, the AA mechanisms in production today.
                </p>
              </div>
              <span className="chip inline-flex shrink-0 items-center gap-1 text-xs font-medium">
                Open /aa <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          )}

          {/* Blob data-layer EIPs → link to the Blob Data Layer dashboard */}
          {[4844, 7691, 7742, 7918, 7892].includes(number) && (
            <Link
              href="/blobs"
              className="card group flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:border-[var(--ink)]"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                  <Database className="h-4 w-4 text-[var(--brand-strong)]" />
                  Blob Data Layer dashboard
                </div>
                <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                  Live blob throughput, the fee market &amp; congestion forecast, and per-rollup DA cost since Dencun.
                </p>
              </div>
              <span className="chip inline-flex shrink-0 items-center gap-1 text-xs font-medium">
                Open /blobs <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          )}

            {/* FAQ (curated Q&A) */}
            {curation?.faq && curation.faq.length > 0 && (
              <section id="faq" className="scroll-mt-24">
                <SectionHead
                  eyebrow="Questions"
                  title="Frequently Asked"
                  description="Common questions about this proposal, answered plainly."
                />
                <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
                  {curation.faq.map((item, idx) => (
                    <details key={idx} className="group py-3">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-1 text-sm font-medium text-[var(--ink)]">
                        <span>{item.question}</span>
                        <span className="shrink-0 text-[var(--ink-muted)] transition-transform group-open:rotate-180">▾</span>
                      </summary>
                      <p className="pb-1 pt-2 pr-6 text-sm leading-relaxed text-[var(--ink-muted)]">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* Resources — Powered by EtherWorld API */}
            <section id="resources" className="scroll-mt-24">
              <SectionHead
                eyebrow="Further reading"
                title="Resources & EtherWorld Coverage"
                description="Editorial coverage from EtherWorld, community threads, and video explainers."
                action={
                  <Link
                    href={`/resources?q=${encodeURIComponent(proposalId)}`}
                    className="chip gap-1.5 px-3 py-1 text-xs"
                  >
                    <span>Resources Hub</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />

              {number === 8184 && (
                <div className="card mb-6 p-4">
                  <p className="eyebrow mb-3 text-[var(--brand-strong)]">
                    Official EIP-8184 (Lucid) Resources & Research
                  </p>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <a
                      href="https://encryptedmempool.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-[var(--l-radius-control)] border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-xs font-medium text-[var(--ink)] transition-colors hover:border-[var(--ink)]"
                    >
                      <span className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-[var(--brand-strong)]" />
                        encryptedmempool.org (Official Hub)
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
                    </a>
                    <a
                      href="https://ethereum-magicians.org/t/eip-8184-lucid-encrypted-mempool/28017"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-[var(--l-radius-control)] border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-xs font-medium text-[var(--ink)] transition-colors hover:border-[var(--ink)]"
                    >
                      <span className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-[var(--brand-strong)]" />
                        Ethereum Magicians: EIP-8184
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
                    </a>
                    <a
                      href="https://ethresear.ch/t/lucid-encrypted-mempool-with-distributed-payload-propagation/24042"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-[var(--l-radius-control)] border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-xs font-medium text-[var(--ink)] transition-colors hover:border-[var(--ink)]"
                    >
                      <span className="flex items-center gap-2">
                        <FileCode className="h-4 w-4 text-[var(--brand-strong)]" />
                        ethresear.ch: Lucid Architecture
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
                    </a>
                    <Link
                      href="/calls?series=etm"
                      className="flex items-center justify-between rounded-[var(--l-radius-control)] border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-xs font-medium text-[var(--ink)] transition-colors hover:border-[var(--ink)]"
                    >
                      <span className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-[var(--brand-strong)]" />
                        ETM Working Group Call Transcripts
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Featured EtherWorld Articles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="eyebrow inline-flex items-center gap-1.5">
                    <Newspaper className="h-3.5 w-3.5 text-[var(--brand-strong)]" />
                    EtherWorld Articles
                  </p>
                  {resourceLoading && (
                    <span className="font-mono text-[11px] text-[var(--ink-muted)]">Fetching from EtherWorld...</span>
                  )}
                </div>

                {resourceArticles.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {resourceArticles.slice(0, 6).map((article, idx) => (
                      <a
                        key={`${article.url}-${idx}`}
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="card group flex flex-col overflow-hidden transition-colors hover:border-[var(--ink)]"
                      >
                        {article.featureImage && (
                          <div className="h-36 w-full overflow-hidden border-b border-[var(--border)] bg-[var(--surface-2)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={article.featureImage}
                              alt={article.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            />
                          </div>
                        )}
                        <div className="flex flex-1 flex-col justify-between p-4">
                          <div>
                            {article.tags && article.tags.length > 0 && (
                              <div className="mb-2 flex flex-wrap gap-1.5">
                                {article.tags.map((tag) => (
                                  <span key={tag} className="rounded border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ink-muted)]">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <h3 className="line-clamp-2 text-sm font-semibold text-[var(--ink)] group-hover:text-[var(--brand-strong)]">
                              {article.title}
                            </h3>
                            {article.excerpt && (
                              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[var(--ink-muted)]">
                                {article.excerpt}
                              </p>
                            )}
                          </div>
                          <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-2.5 font-mono text-[11px] text-[var(--ink-faint)]">
                            <span>{article.authorName || 'EtherWorld'}</span>
                            <span>
                              {article.publishedAt ? formatShortDate(article.publishedAt) : ''}
                              {article.readingTime ? ` · ${article.readingTime}m read` : ''}
                            </span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : !resourceLoading ? (
                  <div className="card p-4 text-xs text-[var(--ink-muted)]">
                    No direct EtherWorld articles matched {proposalId} yet.{' '}
                    <a
                      href={`https://etherworld.co/?s=${encodeURIComponent(proposalId)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[var(--brand-strong)] hover:underline"
                    >
                      Search EtherWorld for {proposalId}
                    </a>
                  </div>
                ) : null}

                {/* Videos, Discussions & Web Suggestions */}
                <div className="grid grid-cols-1 gap-4 pt-2 lg:grid-cols-2">
                  <div className="card p-4">
                    <p className="eyebrow mb-3 inline-flex items-center gap-1.5">
                      <Video className="h-3.5 w-3.5 text-[var(--brand-strong)]" />
                      Video &amp; Audio
                    </p>
                    <div className="space-y-2">
                      {videoSuggestions.slice(0, 4).map((video, idx) => (
                        <a
                          key={`${video.url}-search-${idx}`}
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-2 rounded-[var(--l-radius-control)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs font-medium text-[var(--ink)] transition-colors hover:border-[var(--ink)]"
                        >
                          <span className="line-clamp-1">{video.title}</span>
                          <ExternalLink className="h-3 w-3 shrink-0 text-[var(--ink-faint)]" />
                        </a>
                      ))}
                      {resourceVideos.slice(0, 3).map((video, idx) => (
                        <a
                          key={`${video.url}-${idx}`}
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-2 rounded-[var(--l-radius-control)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs font-medium text-[var(--ink)] transition-colors hover:border-[var(--ink)]"
                        >
                          <span className="line-clamp-1">{video.title}</span>
                          <ExternalLink className="h-3 w-3 shrink-0 text-[var(--ink-faint)]" />
                        </a>
                      ))}
                      {!resourceLoading && videoSuggestions.length === 0 && resourceVideos.length === 0 && (
                        <p className="text-xs text-[var(--ink-muted)]">No video links found yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="card p-4">
                    <p className="eyebrow mb-3 inline-flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[var(--brand-strong)]" />
                      Web &amp; Discussions
                    </p>
                    <div className="space-y-2">
                      {webSuggestions.slice(0, 4).map((item, idx) => (
                        <a
                          key={`${item.url}-${idx}`}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-2 rounded-[var(--l-radius-control)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs font-medium text-[var(--ink)] transition-colors hover:border-[var(--ink)]"
                        >
                          <span className="line-clamp-1">{item.title}</span>
                          <ExternalLink className="h-3 w-3 shrink-0 text-[var(--ink-faint)]" />
                        </a>
                      ))}
                      {aiRecommendations.slice(0, 2).map((item, idx) => (
                        <a
                          key={`${item.url}-ai-${idx}`}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-2 rounded-[var(--l-radius-control)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--ink-muted)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
                        >
                          <span className="line-clamp-1">{item.label}: {item.reason}</span>
                          <ExternalLink className="h-3 w-3 shrink-0 text-[var(--ink-faint)]" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Email updates */}
            <section id="proposal-subscription" className="scroll-mt-24">
              <SectionHead
                eyebrow="Notifications"
                title="Stay Updated"
                description="Subscribe to status changes for this proposal or repository."
              />
              <div className="grid gap-4 md:grid-cols-2">
                <ProposalSubscriptionCard
                  repo={normalizedRepo as 'eip' | 'erc' | 'rip'}
                  number={number}
                  currentStatus={proposal.status}
                />
                <RepositorySubscriptionCard
                  repo={normalizedRepo as 'eip' | 'erc' | 'rip'}
                />
              </div>
            </section>
          </div>

          {/* TAB 2: Specification (full markdown on desktop, collapsible after Abstract on mobile) */}
          <div className={cn(activeTab === 'spec' ? 'block' : 'block lg:hidden', 'space-y-14')}>
            <section id="proposal-text" className="scroll-mt-24">
              <SectionHead
                eyebrow="Source text"
                title="Specification"
                description="Rendered directly from the canonical Ethereum specification file."
                action={
                  markdownContent ? (
                    <button
                      type="button"
                      onClick={handleCopyMarkdown}
                      className="chip cursor-pointer gap-1.5 px-3 py-1 text-xs"
                    >
                      {markdownCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[var(--brand-strong)]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <FileCode className="h-3.5 w-3.5 text-[var(--brand-strong)]" />
                          <span>Copy Markdown</span>
                        </>
                      )}
                    </button>
                  ) : null
                }
              />

              {markdownLoading ? (
                <div className="flex items-center justify-center py-12">
                  <InlineBrandLoader size="sm" label="Loading specification..." />
                </div>
              ) : markdownError ? (
                <div className="card p-6 text-center">
                  <AlertCircle className="mx-auto mb-2 h-7 w-7 text-[var(--ink-muted)]" />
                  <p className="mb-3 text-sm text-[var(--ink-muted)]">{markdownError}</p>
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand-strong)] hover:underline"
                  >
                    View on GitHub instead <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ) : markdownContent ? (
                <div>
                  <MarkdownRenderer
                    content={specHead || markdownContent}
                    skipPreamble={true}
                    stripDuplicateHeaders={true}
                    collapsibleSections={false}
                  />
                  {specRest && (
                    <div className="mt-6">
                      {showFullSpecification ? (
                        <div className="border-t border-[var(--border)] pt-6">
                          <MarkdownRenderer
                            content={specRest}
                            skipPreamble={false}
                            stripDuplicateHeaders={true}
                            collapsibleSections={false}
                          />
                          <div className="mt-6 flex justify-center border-t border-[var(--border)] pt-4">
                            <button
                              type="button"
                              onClick={() => setShowFullSpecification(false)}
                              className="btn btn-outline cursor-pointer h-9 px-4 text-xs"
                            >
                              <ChevronUp className="h-4 w-4" />
                              Collapse specification
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center border-t border-[var(--border)] pt-6">
                          <button
                            type="button"
                            onClick={() => setShowFullSpecification(true)}
                            className="btn btn-outline cursor-pointer h-9 px-5 text-xs font-medium"
                          >
                            <ChevronDown className="h-4 w-4" />
                            Read full specification
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </section>
          </div>

          {/* TAB 3: Enterprise Assessment */}
          <div className={cn(activeTab === 'enterprise' ? 'block' : 'block lg:hidden', 'space-y-14')}>
            <section id="enterprise-brief" className="scroll-mt-24">
              <SectionHead
                eyebrow="Institutional lens"
                title="Enterprise Assessment"
                description={`Client readiness, technical complexity, and operational risk for ${proposalId}.`}
              />
              <EnterpriseEIPBrief
                proposal={proposal}
                upgrades={upgrades}
                statusEvents={statusEvents}
                governanceState={governanceState}
                proposalRequires={proposalRequires}
                curation={curation}
              />
            </section>
          </div>
          </article>

          {/* ── Rail: on this page ──────────────────────────────── */}
          <aside className="hidden lg:block">
            <div className="sticky top-[calc(var(--header-h,3.75rem)+2rem)]">
              <p className="eyebrow">On this page</p>
              <OnThisPage items={activeRailItems} />
            </div>
          </aside>
        </div>
        </div>
      </div>
  );
}
