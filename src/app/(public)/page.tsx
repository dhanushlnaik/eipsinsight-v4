'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { client } from '@/lib/orpc';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  FileText,
  Layers,
  Info,
  Code,
  FileCode2,
  Cpu,
  Network,
  Boxes,
  ScrollText,
  Eye,
  Bell,
  CheckCircle2,
  Zap,
  Pause,
  XCircle,
  GitCommitHorizontal,
  LayoutGrid,
  BarChart3,
} from 'lucide-react';

// ────────────────────────────────────────────────────────────────
// TYPES & CONSTANTS
// ────────────────────────────────────────────────────────────────

type ViewMode = 'type' | 'status';

interface TabDef {
  id: string;
  label: string;
  filter?: { category?: string[]; type?: string[]; status?: string[] };
  isRip?: boolean;
  description: string;
  icon: React.ReactNode;
}

const TYPE_TABS: TabDef[] = [
  {
    id: 'all',
    label: 'All',
    description: 'All Ethereum proposals across every type and category.',
    icon: <Layers className="h-3.5 w-3.5" />,
  },
  {
    id: 'core',
    label: 'Core',
    filter: { category: ['Core'] },
    description: 'Improvements requiring a consensus fork or relevant to core dev discussions.',
    icon: <Cpu className="h-3.5 w-3.5" />,
  },
  {
    id: 'networking',
    label: 'Networking',
    filter: { category: ['Networking'] },
    description: 'Improvements around devp2p, Light Ethereum Subprotocol, and network protocol specifications.',
    icon: <Network className="h-3.5 w-3.5" />,
  },
  {
    id: 'interface',
    label: 'Interface',
    filter: { category: ['Interface'] },
    description: 'Improvements around client API/RPC specifications and language-level standards.',
    icon: <Code className="h-3.5 w-3.5" />,
  },
  {
    id: 'erc',
    label: 'ERC',
    filter: { category: ['ERC'] },
    description: 'Application-level standards including token standards, name registries, and account abstraction.',
    icon: <FileCode2 className="h-3.5 w-3.5" />,
  },
  {
    id: 'meta',
    label: 'Meta',
    filter: { type: ['Meta'] },
    description: 'Process proposals that apply to areas other than the Ethereum protocol itself.',
    icon: <Boxes className="h-3.5 w-3.5" />,
  },
  {
    id: 'informational',
    label: 'Informational',
    filter: { type: ['Informational'] },
    description: 'General guidelines or information for the Ethereum community.',
    icon: <Info className="h-3.5 w-3.5" />,
  },
  {
    id: 'rips',
    label: 'RIPs',
    isRip: true,
    description: 'Rollup Improvement Proposals for the Ethereum rollup ecosystem.',
    icon: <GitCommitHorizontal className="h-3.5 w-3.5" />,
  },
];

const STATUS_TABS: TabDef[] = [
  {
    id: 'all',
    label: 'All',
    description: 'All Ethereum proposals across every status.',
    icon: <Layers className="h-3.5 w-3.5" />,
  },
  {
    id: 'draft',
    label: 'Draft',
    filter: { status: ['Draft'] },
    description: 'The first formally tracked stage of an EIP in development.',
    icon: <FileText className="h-3.5 w-3.5" />,
  },
  {
    id: 'review',
    label: 'Review',
    filter: { status: ['Review'] },
    description: 'EIPs marked as ready for and requesting Peer Review.',
    icon: <Eye className="h-3.5 w-3.5" />,
  },
  {
    id: 'last-call',
    label: 'Last Call',
    filter: { status: ['Last Call'] },
    description: 'The final review window for an EIP before moving to Final.',
    icon: <Bell className="h-3.5 w-3.5" />,
  },
  {
    id: 'final',
    label: 'Final',
    filter: { status: ['Final'] },
    description: 'EIPs that represent the final standard and exist in a state of finality.',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  {
    id: 'living',
    label: 'Living',
    filter: { status: ['Living'] },
    description: 'EIPs designed to be continually updated and not reach a state of finality.',
    icon: <Zap className="h-3.5 w-3.5" />,
  },
  {
    id: 'stagnant',
    label: 'Stagnant',
    filter: { status: ['Stagnant'] },
    description: 'EIPs in Draft or Review that have been inactive for 6 months or greater.',
    icon: <Pause className="h-3.5 w-3.5" />,
  },
  {
    id: 'withdrawn',
    label: 'Withdrawn',
    filter: { status: ['Withdrawn'] },
    description: 'EIPs whose authors have withdrawn the proposal. This state has finality.',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  {
    id: 'rips',
    label: 'RIPs',
    isRip: true,
    description: 'Rollup Improvement Proposals for the Ethereum rollup ecosystem.',
    icon: <GitCommitHorizontal className="h-3.5 w-3.5" />,
  },
];

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  Review: 'bg-amber-500/20 text-amber-200 border-amber-500/30',
  'Last Call': 'bg-orange-500/20 text-orange-200 border-orange-500/30',
  Final: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Stagnant: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  Withdrawn: 'bg-red-500/20 text-red-300 border-red-500/30',
  Living: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

const STATUS_DOT_COLORS: Record<string, string> = {
  Draft: 'bg-slate-400',
  Review: 'bg-amber-400',
  'Last Call': 'bg-orange-400',
  Final: 'bg-emerald-400',
  Stagnant: 'bg-gray-500',
  Withdrawn: 'bg-red-400',
  Living: 'bg-cyan-400',
};

const STATUS_STAT_COLORS: Record<string, string> = {
  Draft: 'text-slate-300',
  Review: 'text-amber-300',
  'Last Call': 'text-orange-300',
  Final: 'text-emerald-400',
  Living: 'text-cyan-300',
  Stagnant: 'text-gray-400',
  Withdrawn: 'text-red-300',
};

const STATUS_TERMS = [
  {
    name: 'Idea',
    description: 'An idea that is pre-draft. This is not tracked within the EIP Repository.',
    color: 'text-purple-300',
  },
  {
    name: 'Draft',
    description:
      'The first formally tracked stage of an EIP in development. An EIP is merged by an EIP Editor into the EIP repository when properly formatted.',
    color: 'text-slate-300',
  },
  {
    name: 'Review',
    description: 'An EIP Author marks an EIP as ready for and requesting Peer Review.',
    color: 'text-amber-300',
  },
  {
    name: 'Last Call',
    description:
      'The final review window for an EIP before moving to Final. An EIP editor will assign Last Call status and set a review end date, typically 14 days later.',
    color: 'text-orange-300',
  },
  {
    name: 'Final',
    description:
      'This EIP represents the final standard. A Final EIP exists in a state of finality and should only be updated to correct errata and add non-normative clarifications.',
    color: 'text-emerald-300',
  },
  {
    name: 'Stagnant',
    description:
      'Any EIP in Draft or Review if inactive for a period of 6 months or greater is moved to Stagnant. An EIP may be resurrected from this state by Authors or EIP Editors through moving it back to Draft.',
    color: 'text-gray-400',
  },
  {
    name: 'Withdrawn',
    description:
      'The EIP Author(s) have withdrawn the proposed EIP. This state has finality and can no longer be resurrected using this EIP number.',
    color: 'text-red-300',
  },
  {
    name: 'Living',
    description:
      'A special status for EIPs that are designed to be continually updated and not reach a state of finality. This includes most notably EIP-1.',
    color: 'text-cyan-300',
  },
];

const TYPE_INFO = [
  {
    name: 'Standards Track',
    description:
      'Describes any change that affects most or all Ethereum implementations, such as a change to the network protocol, a change in block or transaction validity rules, proposed application standards/conventions, or any change or addition that affects the interoperability of applications using Ethereum.',
    subcategories: [
      {
        name: 'Core',
        description:
          'Improvements requiring a consensus fork, as well as changes that are not necessarily consensus critical but may be relevant to "core dev" discussions.',
      },
      {
        name: 'Networking',
        description:
          'Includes improvements around devp2p and Light Ethereum Subprotocol, as well as proposed improvements to network protocol specifications.',
      },
      {
        name: 'Interface',
        description:
          'Includes improvements around client API/RPC specifications and standards, and also certain language-level standards like method names and contract ABIs.',
      },
      {
        name: 'ERC',
        description:
          'Application-level standards and conventions, including contract standards such as token standards, name registries, URI schemes, and account abstraction.',
      },
    ],
  },
  {
    name: 'Meta',
    description:
      'Describes a process surrounding Ethereum or proposes a change to a process. They may propose an implementation, but not to Ethereum\'s codebase; they often require community consensus.',
  },
  {
    name: 'Informational',
    description:
      'Provides general guidelines or information to the Ethereum community, but does not propose a new feature. Informational EIPs do not necessarily represent Ethereum community consensus.',
  },
];

// Valid sort fields per mode
const EIP_SORT_FIELDS = ['number', 'title', 'status', 'type', 'category', 'created_at', 'updated_at', 'days_in_status', 'linked_prs'] as const;
const RIP_SORT_FIELDS = ['number', 'title', 'status', 'author', 'created_at', 'last_commit', 'commits'] as const;

type EipSortField = (typeof EIP_SORT_FIELDS)[number];
type RipSortField = (typeof RIP_SORT_FIELDS)[number];

// ────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_COLORS[status] || 'bg-slate-400'}`} />
      {status}
    </span>
  );
}

function SortIcon({ column, current, dir }: { column: string; current: string; dir: string }) {
  if (current !== column) return <ArrowUpDown className="ml-1 inline h-3 w-3 text-slate-600" />;
  return dir === 'asc' ? (
    <ArrowUp className="ml-1 inline h-3 w-3 text-cyan-400" />
  ) : (
    <ArrowDown className="ml-1 inline h-3 w-3 text-cyan-400" />
  );
}

function TableSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className={`h-8 animate-pulse rounded bg-slate-800/${j === 0 ? '60' : '40'} ${j === 1 ? 'flex-1' : 'w-24'}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-lg font-bold tabular-nums sm:text-xl ${color}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
      <span className="text-[10px] font-medium tracking-wider text-slate-500 uppercase sm:text-xs">
        {label}
      </span>
    </div>
  );
}

function ViewModeSwitch({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-slate-800/80 bg-slate-900/60 p-0.5 backdrop-blur-sm">
      <button
        onClick={() => onChange('type')}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
          mode === 'type'
            ? 'bg-slate-800 text-white shadow-sm'
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <LayoutGrid className="h-3 w-3" />
        By Type
      </button>
      <button
        onClick={() => onChange('status')}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
          mode === 'status'
            ? 'bg-slate-800 text-white shadow-sm'
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <BarChart3 className="h-3 w-3" />
        By Status
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// MAIN PAGE
// ────────────────────────────────────────────────────────────────

export default function EIPsHomePage() {
  // ─── State ──────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('type');
  const [activeTab, setActiveTab] = useState('all');
  const [columnSearch, setColumnSearch] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('number');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Table data (EIPs/ERCs)
  const [eipData, setEipData] = useState<{
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    rows: Array<{
      repo: string;
      number: number;
      title: string | null;
      author: string | null;
      status: string;
      type: string | null;
      category: string | null;
      createdAt: string | null;
      updatedAt: string | null;
    }>;
  } | null>(null);

  // Table data (RIPs)
  const [ripData, setRipData] = useState<{
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    rows: Array<{
      number: number;
      title: string | null;
      status: string | null;
      author: string | null;
      createdAt: string | null;
      lastCommit: string | null;
      commits: number;
    }>;
  } | null>(null);

  const [tableLoading, setTableLoading] = useState(true);

  const [kpis, setKpis] = useState<{
    total: number;
    inReview: number;
    finalized: number;
    newThisYear: number;
  } | null>(null);

  const [ripKpis, setRipKpis] = useState<{
    total: number;
    active: number;
  } | null>(null);

  const [categoryBreakdown, setCategoryBreakdown] = useState<
    Array<{ category: string; count: number }>
  >([]);

  const [statusDist, setStatusDist] = useState<
    Array<{ status: string; count: number }>
  >([]);

  const [exporting, setExporting] = useState(false);

  // ─── Derived values ────────────────────────────────────────
  const isRipMode = activeTab === 'rips';
  const currentTabs = viewMode === 'type' ? TYPE_TABS : STATUS_TABS;
  const activeTabDef = currentTabs.find((t) => t.id === activeTab);

  const totalRows = isRipMode ? (ripData?.total || 0) : (eipData?.total || 0);
  const totalPages = isRipMode ? (ripData?.totalPages || 1) : (eipData?.totalPages || 1);

  // ─── Reset page on tab change ───────────────────────────────
  useEffect(() => {
    setPage(1);
    setColumnSearch({});
  }, [activeTab]);

  // ─── Reset tab on view mode change ─────────────────────────
  useEffect(() => {
    if (activeTab !== 'rips') {
      setActiveTab('all');
    }
    setPage(1);
    setColumnSearch({});
  }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Validate sortBy when switching between EIP/RIP mode ──
  useEffect(() => {
    if (isRipMode && !(RIP_SORT_FIELDS as readonly string[]).includes(sortBy)) {
      setSortBy('number');
    } else if (!isRipMode && !(EIP_SORT_FIELDS as readonly string[]).includes(sortBy)) {
      setSortBy('number');
    }
  }, [isRipMode, sortBy]);

  // ─── Fetch overview data ───────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [kpiRes, catRes, statusRes, ripRes] = await Promise.all([
          client.standards.getKPIs({}),
          client.standards.getCategoryBreakdown({}),
          client.standards.getStatusDistribution({}),
          client.standards.getRIPKPIs(),
        ]);
        setKpis(kpiRes);
        setCategoryBreakdown(catRes);
        setRipKpis({ total: ripRes.total, active: ripRes.active });

        // Aggregate status distribution across repos
        const statusMap = new Map<string, number>();
        statusRes.forEach((r: { status: string; count: number }) => {
          statusMap.set(r.status, (statusMap.get(r.status) || 0) + r.count);
        });
        setStatusDist(
          Array.from(statusMap.entries())
            .map(([status, count]) => ({ status, count }))
            .sort((a, b) => b.count - a.count)
        );
      } catch (err) {
        console.error('Failed to load overview data:', err);
      }
    };
    load();
  }, []);

  // ─── Fetch table data ──────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setTableLoading(true);
      try {
        if (isRipMode) {
          // Fetch RIPs
          const ripSortBy = (RIP_SORT_FIELDS as readonly string[]).includes(sortBy)
            ? (sortBy as RipSortField)
            : 'number';
          const res = await client.standards.getRIPsTable({
            sortBy: ripSortBy,
            sortDir,
            page,
            pageSize: 50,
          });
          setRipData(res);
        } else {
          // Fetch EIPs/ERCs
          const tab = currentTabs.find((t) => t.id === activeTab);
          const eipSortBy = (EIP_SORT_FIELDS as readonly string[]).includes(sortBy)
            ? (sortBy as EipSortField)
            : 'number';
          const filters: {
            sortBy: EipSortField;
            sortDir: 'asc' | 'desc';
            page: number;
            pageSize: number;
            category?: string[];
            type?: string[];
            status?: string[];
          } = {
            sortBy: eipSortBy,
            sortDir,
            page,
            pageSize: 50,
          };
          if (tab?.filter) {
            if (tab.filter.category) filters.category = tab.filter.category;
            if (tab.filter.type) filters.type = tab.filter.type;
            if (tab.filter.status) filters.status = tab.filter.status;
          }
          const res = await client.standards.getTable(filters);
          setEipData(res);
        }
      } catch (err) {
        console.error('Failed to load table:', err);
      } finally {
        setTableLoading(false);
      }
    };
    load();
  }, [activeTab, sortBy, sortDir, page, isRipMode, currentTabs, viewMode]);

  // ─── Client-side column filtering ───────────────────────────
  const filteredEipRows = useMemo(() => {
    if (!eipData?.rows) return [];
    const searches = Object.entries(columnSearch).filter(([, v]) => v.trim());
    if (searches.length === 0) return eipData.rows;
    return eipData.rows.filter((row) =>
      searches.every(([key, val]) => {
        const q = val.toLowerCase();
        switch (key) {
          case 'number': return String(row.number).includes(q);
          case 'title': return (row.title || '').toLowerCase().includes(q);
          case 'author': return (row.author || '').toLowerCase().includes(q);
          case 'type': return (row.type || '').toLowerCase().includes(q);
          case 'category': return (row.category || '').toLowerCase().includes(q);
          case 'status': return row.status.toLowerCase().includes(q);
          default: return true;
        }
      })
    );
  }, [eipData, columnSearch]);

  const filteredRipRows = useMemo(() => {
    if (!ripData?.rows) return [];
    const searches = Object.entries(columnSearch).filter(([, v]) => v.trim());
    if (searches.length === 0) return ripData.rows;
    return ripData.rows.filter((row) =>
      searches.every(([key, val]) => {
        const q = val.toLowerCase();
        switch (key) {
          case 'number': return String(row.number).includes(q);
          case 'title': return (row.title || '').toLowerCase().includes(q);
          case 'author': return (row.author || '').toLowerCase().includes(q);
          case 'status': return (row.status || '').toLowerCase().includes(q);
          case 'created_at': return (row.createdAt || '').includes(q);
          case 'last_commit': return (row.lastCommit || '').includes(q);
          case 'commits': return String(row.commits).includes(q);
          default: return true;
        }
      })
    );
  }, [ripData, columnSearch]);

  const hasColumnFilter = Object.values(columnSearch).some((v) => v.trim());
  const filteredCount = isRipMode ? filteredRipRows.length : filteredEipRows.length;
  const pageRowCount = isRipMode ? (ripData?.rows.length || 0) : (eipData?.rows.length || 0);

  // ─── Tab count getter ──────────────────────────────────────
  const getTabCount = useCallback(
    (tabId: string, tabs: TabDef[]) => {
      const tab = tabs.find((t) => t.id === tabId);
      if (!tab) return 0;

      // RIPs
      if (tab.isRip) return ripKpis?.total || 0;

      // "All" tab
      if (tabId === 'all') return kpis?.total || 0;

      // Status-based tabs
      if (tab.filter?.status) {
        const statusName = tab.filter.status[0];
        const match = statusDist.find((d) => d.status === statusName);
        return match?.count || 0;
      }

      // Type/category-based tabs
      const label = tab.label;
      const match = categoryBreakdown.find(
        (c) => c.category.toLowerCase() === label.toLowerCase()
      );
      return match?.count || 0;
    },
    [kpis, categoryBreakdown, statusDist, ripKpis]
  );

  // ─── Sort handler ──────────────────────────────────────────
  const handleSort = useCallback(
    (col: string) => {
      if (sortBy === col) {
        setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortBy(col);
        setSortDir('desc');
      }
    },
    [sortBy]
  );

  // ─── URL helpers ───────────────────────────────────────────
  const getProposalUrl = useCallback((repo: string, number: number) => {
    const repoShort = (repo.toLowerCase().split('/').pop() || 'eips').replace(/s$/, '');
    return `/${repoShort}/${number}`;
  }, []);

  const getProposalPrefix = useCallback((repo: string) => {
    const repoShort = repo.toLowerCase().split('/').pop() || 'eips';
    if (repoShort === 'ercs') return 'ERC';
    if (repoShort === 'rips') return 'RIP';
    return 'EIP';
  }, []);

  // ─── CSV export ────────────────────────────────────────────
  const handleExportCSV = useCallback(async () => {
    setExporting(true);
    try {
      if (isRipMode) {
        const res = await client.standards.exportCSV({ repo: 'rips' });
        downloadCSV(res.csv, res.filename);
      } else {
        const tab = currentTabs.find((t) => t.id === activeTab);
        const filters: {
          category?: string[];
          type?: string[];
          status?: string[];
        } = {};
        if (tab?.filter) {
          if (tab.filter.category) filters.category = tab.filter.category;
          if (tab.filter.type) filters.type = tab.filter.type;
          if (tab.filter.status) filters.status = tab.filter.status;
        }
        const res = await client.standards.exportCSV(filters);
        downloadCSV(res.csv, res.filename);
      }
    } catch (err) {
      console.error('CSV export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [activeTab, isRipMode, currentTabs]);

  // ─── Computed values ───────────────────────────────────────
  const standardsTrackTotal = useMemo(() => {
    const subcats = ['core', 'networking', 'interface', 'erc'];
    return categoryBreakdown
      .filter((c) => subcats.includes(c.category.toLowerCase()))
      .reduce((sum, c) => sum + c.count, 0);
  }, [categoryBreakdown]);

  const getCatCount = useCallback(
    (name: string) => {
      const match = categoryBreakdown.find(
        (c) => c.category.toLowerCase() === name.toLowerCase()
      );
      return match?.count || 0;
    },
    [categoryBreakdown]
  );

  const statusSummary = useMemo(() => {
    const order = ['Draft', 'Review', 'Last Call', 'Final', 'Living', 'Stagnant', 'Withdrawn'];
    return order
      .map((s) => {
        const match = statusDist.find((d) => d.status === s);
        return { status: s, count: match?.count || 0 };
      })
      .filter((s) => s.count > 0);
  }, [statusDist]);

  const pageRange = useMemo(() => {
    const range: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }, [page, totalPages]);

  // ─── EIP table columns ────────────────────────────────────
  const eipColumns = [
    { key: 'number', label: '#', width: 'w-20' },
    { key: 'title', label: 'Title', width: 'min-w-[240px]' },
    { key: 'author', label: 'Author', width: 'w-40' },
    { key: 'type', label: 'Type', width: 'w-28' },
    { key: 'category', label: 'Category', width: 'w-28' },
    { key: 'status', label: 'Status', width: 'w-28' },
  ];

  // ─── RIP table columns ────────────────────────────────────
  const ripColumns = [
    { key: 'number', label: '#', width: 'w-20' },
    { key: 'title', label: 'Title', width: 'min-w-[240px]' },
    { key: 'author', label: 'Author', width: 'w-36' },
    { key: 'status', label: 'Status', width: 'w-28' },
    { key: 'created_at', label: 'Created', width: 'w-28' },
    { key: 'last_commit', label: 'Last Commit', width: 'w-28' },
    { key: 'commits', label: 'Commits', width: 'w-20' },
  ];

  const columns = isRipMode ? ripColumns : eipColumns;

  // ─── View mode change handler ─────────────────────────────
  const handleViewModeChange = useCallback((newMode: ViewMode) => {
    setViewMode(newMode);
  }, []);

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.06),transparent_60%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* ─── Header ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-500/10">
              <ScrollText className="h-4 w-4 text-cyan-400" />
            </div>
            <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
              EIPsInsight
            </span>
          </div>
          <h1 className="dec-title text-balance bg-linear-to-br from-emerald-300 via-slate-100 to-cyan-200 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl md:text-5xl">
            Ethereum Improvement Proposals
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400 sm:text-base">
            EIPs describe standards for the Ethereum platform, including core protocol
            specifications, client APIs, and contract standards. Network upgrades are discussed
            separately in the{' '}
            <a
              href="https://github.com/ethereum/pm/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 underline decoration-cyan-400/30 underline-offset-2 transition-colors hover:text-cyan-300"
            >
              Ethereum Project Management
            </a>{' '}
            repository.
          </p>
        </motion.div>

        {/* ─── Status Summary Bar ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8 overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-900/50 px-4 py-3 backdrop-blur-sm sm:px-6"
        >
          <div className="flex items-center justify-between gap-6 min-w-max">
            <StatCard label="Total" value={kpis?.total || 0} color="text-cyan-300" />
            <div className="h-8 w-px bg-slate-800" />
            {statusSummary.map((s) => (
              <StatCard
                key={s.status}
                label={s.status}
                value={s.count}
                color={STATUS_STAT_COLORS[s.status] || 'text-slate-300'}
              />
            ))}
            <div className="h-8 w-px bg-slate-800" />
            <StatCard label="RIPs" value={ripKpis?.total || 0} color="text-violet-300" />
            <div className="h-8 w-px bg-slate-800" />
            <StatCard
              label={'New in ' + new Date().getFullYear()}
              value={kpis?.newThisYear || 0}
              color="text-emerald-300"
            />
          </div>
        </motion.div>

        {/* ─── View Mode Switch + Tab Navigation ──────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-6"
        >
          {/* View mode switch */}
          <div className="mb-3 flex items-center justify-between">
            <ViewModeSwitch mode={viewMode} onChange={handleViewModeChange} />
            <span className="text-xs text-slate-600">
              {viewMode === 'type' ? 'Organized by type & category' : 'Organized by lifecycle status'}
            </span>
          </div>

          {/* Tab bar */}
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1 overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-900/40 p-1.5 backdrop-blur-sm scrollbar-thin"
            >
              {currentTabs.map((tab) => {
                const count = getTabCount(tab.id, currentTabs);
                const isActive = activeTab === tab.id;
                const isRip = tab.isRip;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? isRip
                          ? 'bg-violet-500/15 text-white shadow-sm'
                          : 'bg-slate-800 text-white shadow-sm shadow-cyan-500/5'
                        : isRip
                          ? 'text-violet-400/60 hover:bg-violet-500/10 hover:text-violet-300'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                  >
                    <span
                      className={
                        isActive
                          ? isRip
                            ? 'text-violet-400'
                            : 'text-cyan-400'
                          : isRip
                            ? 'text-violet-500/50 group-hover:text-violet-400'
                            : 'text-slate-500 group-hover:text-slate-400'
                      }
                    >
                      {tab.icon}
                    </span>
                    {tab.label}
                    {count > 0 && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums leading-none ${
                          isActive
                            ? isRip
                              ? 'bg-violet-500/20 text-violet-300'
                              : 'bg-cyan-500/15 text-cyan-300'
                            : 'bg-slate-800 text-slate-500 group-hover:text-slate-400'
                        }`}
                      >
                        {count.toLocaleString()}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className={`absolute inset-x-0 -bottom-1.5 mx-auto h-0.5 w-8 rounded-full ${
                          isRip ? 'bg-violet-400' : 'bg-cyan-400'
                        }`}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Tab description */}
          <AnimatePresence mode="wait">
            <motion.p
              key={`${viewMode}-${activeTab}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="mt-3 text-sm text-slate-500"
            >
              {activeTabDef?.description}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* ─── Export Bar ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="tabular-nums">
              {hasColumnFilter
                ? `Showing ${filteredCount} of ${pageRowCount} on this page`
                : `${totalRows.toLocaleString()} ${isRipMode ? 'RIPs' : 'proposals'}`}
            </span>
            {hasColumnFilter && (
              <button
                onClick={() => setColumnSearch({})}
                className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500 transition-colors hover:border-cyan-500/30 hover:text-cyan-300"
              >
                Clear filters
              </button>
            )}
          </div>
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-cyan-500/30 hover:text-cyan-300 disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            Export CSV
          </button>
        </motion.div>

        {/* ─── Proposals Table ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mb-6 overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/80">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-4 py-2 text-left ${col.width}`}
                    >
                      <div
                        className="flex cursor-pointer select-none items-center text-xs font-semibold tracking-wider text-slate-500 uppercase transition-colors hover:text-slate-300"
                        onClick={() => handleSort(col.key)}
                      >
                        {col.label}
                        <SortIcon column={col.key} current={sortBy} dir={sortDir} />
                      </div>
                      <div className="relative mt-1.5">
                        <Search className="pointer-events-none absolute left-1.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-slate-700" />
                        <input
                          type="text"
                          value={columnSearch[col.key] || ''}
                          onChange={(e) =>
                            setColumnSearch((prev) => ({
                              ...prev,
                              [col.key]: e.target.value,
                            }))
                          }
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Filter..."
                          className="w-full rounded border border-slate-800/60 bg-slate-900/40 py-1 pl-5 pr-2 text-[11px] font-normal normal-case tracking-normal text-slate-300 placeholder-slate-700 outline-none transition-colors focus:border-cyan-500/40 focus:bg-slate-900/60"
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableLoading ? (
                  <tr>
                    <td colSpan={columns.length} className="p-6">
                      <TableSkeleton cols={columns.length} />
                    </td>
                  </tr>
                ) : isRipMode ? (
                  /* ─── RIP Rows ───────────────────────── */
                  !filteredRipRows.length ? (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-slate-700" />
                          <p className="text-sm text-slate-500">No RIPs found</p>
                          <p className="text-xs text-slate-600">Try adjusting your search</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRipRows.map((row, idx) => (
                      <motion.tr
                        key={`rip-${row.number}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="group border-b border-slate-800/40 transition-colors hover:bg-slate-800/30"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/rip/${row.number}`}
                            className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-violet-400 transition-colors hover:text-violet-300"
                          >
                            RIP-{row.number}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/rip/${row.number}`}
                            className="line-clamp-1 text-sm text-slate-200 transition-colors hover:text-white"
                          >
                            {row.title || 'Untitled'}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className="line-clamp-1 text-xs text-slate-500">
                            {row.author
                              ? row.author.split(',')[0].trim().replace(/^"|"$/g, '')
                              : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={row.status || 'Draft'} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs tabular-nums text-slate-500">
                            {row.createdAt || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs tabular-nums text-slate-500">
                            {row.lastCommit || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs tabular-nums text-slate-400">
                            {row.commits}
                          </span>
                        </td>
                      </motion.tr>
                    ))
                  )
                ) : (
                  /* ─── EIP/ERC Rows ──────────────────── */
                  !filteredEipRows.length ? (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-slate-700" />
                          <p className="text-sm text-slate-500">No proposals found</p>
                          <p className="text-xs text-slate-600">
                            Try adjusting your search or filter
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredEipRows.map((row, idx) => {
                      const prefix = getProposalPrefix(row.repo);
                      const url = getProposalUrl(row.repo, row.number);
                      return (
                        <motion.tr
                          key={`${row.repo}-${row.number}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.02 }}
                          className="group border-b border-slate-800/40 transition-colors hover:bg-slate-800/30"
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={url}
                              className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-cyan-400 transition-colors hover:text-cyan-300"
                            >
                              {prefix}-{row.number}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={url}
                              className="line-clamp-1 text-sm text-slate-200 transition-colors hover:text-white"
                            >
                              {row.title || 'Untitled'}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <span className="line-clamp-1 text-xs text-slate-500">
                              {row.author
                                ? row.author.split(',')[0].trim().replace(/^"|"$/g, '')
                                : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-500">{row.type || '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-500">{row.category || '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={row.status} />
                          </td>
                        </motion.tr>
                      );
                    })
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* ─── Pagination ───────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800/60 px-4 py-3">
              <span className="text-xs tabular-nums text-slate-600">
                Page {page} of {totalPages.toLocaleString()}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 text-slate-400 transition-colors hover:border-slate-700 hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {pageRange[0] > 1 && (
                  <>
                    <button
                      onClick={() => setPage(1)}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-xs text-slate-500 transition-colors hover:text-white"
                    >
                      1
                    </button>
                    {pageRange[0] > 2 && (
                      <span className="px-1 text-xs text-slate-600">...</span>
                    )}
                  </>
                )}
                {pageRange.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                      p === page
                        ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                        : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                {pageRange[pageRange.length - 1] < totalPages && (
                  <>
                    {pageRange[pageRange.length - 1] < totalPages - 1 && (
                      <span className="px-1 text-xs text-slate-600">...</span>
                    )}
                    <button
                      onClick={() => setPage(totalPages)}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-xs text-slate-500 transition-colors hover:text-white"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 text-slate-400 transition-colors hover:border-slate-700 hover:text-white disabled:opacity-30"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* ─── Separator ──────────────────────────────────── */}
        <div className="my-12 h-px bg-linear-to-r from-transparent via-cyan-400/20 to-transparent" />

        {/* ─── EIP Types Section ──────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="dec-title mb-6 bg-linear-to-br from-emerald-300 via-slate-100 to-cyan-200 bg-clip-text text-2xl font-semibold tracking-tight text-transparent sm:text-3xl">
            EIP Types
          </h2>
          <p className="mb-8 max-w-3xl text-sm leading-relaxed text-slate-400">
            EIPs are separated into a number of types, and each has its own list of EIPs.
          </p>

          <div className="space-y-4">
            {TYPE_INFO.map((type) => (
              <div
                key={type.name}
                className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-5 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-slate-100">{type.name}</h3>
                  <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-cyan-300">
                    {type.name === 'Standards Track'
                      ? standardsTrackTotal.toLocaleString()
                      : getCatCount(type.name).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-slate-400">{type.description}</p>
                {'subcategories' in type && type.subcategories && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {type.subcategories.map((sub) => (
                      <button
                        key={sub.name}
                        onClick={() => {
                          setViewMode('type');
                          setActiveTab(sub.name.toLowerCase());
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="group rounded-lg border border-slate-800/60 bg-slate-800/20 p-3 text-left transition-all hover:border-cyan-500/30 hover:bg-slate-800/40"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-slate-200 transition-colors group-hover:text-cyan-300">
                            {sub.name}
                          </span>
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-400">
                            {getCatCount(sub.name).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-500">{sub.description}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* RIPs section */}
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-slate-100">
                  Rollup Improvement Proposals (RIPs)
                </h3>
                <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-violet-300">
                  {(ripKpis?.total || 0).toLocaleString()}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                RIPs describe standards and improvements for the Ethereum rollup ecosystem.
                They follow a similar process to EIPs but are focused on Layer 2 scaling
                solutions and rollup-specific concerns.
              </p>
              <button
                onClick={() => {
                  setActiveTab('rips');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 transition-colors hover:bg-violet-500/20 hover:text-violet-200"
              >
                <GitCommitHorizontal className="h-3 w-3" />
                View all RIPs
              </button>
            </div>
          </div>
        </motion.section>

        {/* ─── Separator ──────────────────────────────────── */}
        <div className="my-12 h-px bg-linear-to-r from-transparent via-cyan-400/20 to-transparent" />

        {/* ─── Status Terms Section ───────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="dec-title mb-6 bg-linear-to-br from-emerald-300 via-slate-100 to-cyan-200 bg-clip-text text-2xl font-semibold tracking-tight text-transparent sm:text-3xl">
            EIP Status Terms
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {STATUS_TERMS.map((term) => (
              <button
                key={term.name}
                onClick={() => {
                  if (term.name !== 'Idea') {
                    setViewMode('status');
                    const statusTab = STATUS_TABS.find(
                      (t) => t.filter?.status?.[0] === term.name
                    );
                    if (statusTab) {
                      setActiveTab(statusTab.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }
                }}
                className="group rounded-xl border border-slate-800/80 bg-slate-900/30 p-4 text-left backdrop-blur-sm transition-all hover:border-cyan-500/20 hover:bg-slate-800/30"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${STATUS_DOT_COLORS[term.name] || 'bg-purple-400'}`}
                  />
                  <span className={`text-sm font-semibold ${term.color}`}>{term.name}</span>
                  {term.name !== 'Idea' && (
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500">
                      {(statusDist.find((d) => d.status === term.name)?.count || 0).toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-slate-500">{term.description}</p>
              </button>
            ))}
          </div>
        </motion.section>

        {/* ─── Separator ──────────────────────────────────── */}
        <div className="my-12 h-px bg-linear-to-r from-transparent via-cyan-400/20 to-transparent" />

        {/* ─── Contributing Section ───────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <h2 className="dec-title mb-4 bg-linear-to-br from-emerald-300 via-slate-100 to-cyan-200 bg-clip-text text-2xl font-semibold tracking-tight text-transparent sm:text-3xl">
            Contributing
          </h2>
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-5 backdrop-blur-sm">
            <p className="text-sm leading-relaxed text-slate-400">
              First review{' '}
              <Link
                href="/eip/1"
                className="text-cyan-400 underline decoration-cyan-400/30 underline-offset-2 hover:text-cyan-300"
              >
                EIP-1
              </Link>
              . Then clone the repository and add your EIP to it. There is a{' '}
              <a
                href="https://github.com/ethereum/EIPs/blob/master/eip-template.md?plain=1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 underline decoration-cyan-400/30 underline-offset-2 hover:text-cyan-300"
              >
                template EIP here
              </a>
              . Then submit a Pull Request to Ethereum&apos;s{' '}
              <a
                href="https://github.com/ethereum/EIPs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 underline decoration-cyan-400/30 underline-offset-2 hover:text-cyan-300"
              >
                EIPs repository
              </a>
              .
            </p>
          </div>
        </motion.section>

        {/* ─── Footer Note ────────────────────────────────── */}
        <div className="mb-8 text-center">
          <p className="text-xs text-slate-600">
            Data sourced from live GitHub repositories and indexed by{' '}
            <span className="text-slate-500">EIPsInsight</span>. Numbers may differ slightly
            from ethereum.org due to real-time processing.
          </p>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// UTILITY
// ────────────────────────────────────────────────────────────────

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
