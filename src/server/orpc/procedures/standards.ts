import { optionalAuthProcedure, publicProcedure, checkAPIToken } from './types'
import { prisma } from '@/lib/prisma'
import * as z from 'zod'
import { unstable_cache } from 'next/cache'

const CACHE_REVALIDATE = 300

const getRIPKPIsCached = unstable_cache(
  async () => {
    const results = await prisma.$queryRawUnsafe<Array<{
      total: bigint; active: bigint; recent_commits: bigint;
      most_active_rip: number | null; most_active_title: string | null; most_active_commits: bigint;
    }>>(`
      WITH rip_stats AS (
        SELECT r.rip_number, r.title, COUNT(rc.id)::bigint AS commit_count
        FROM rips r LEFT JOIN rip_commits rc ON rc.rip_id = r.id
        GROUP BY r.rip_number, r.title
      ),
      recent AS (
        SELECT COUNT(*)::bigint AS cnt FROM rip_commits
        WHERE commit_date >= NOW() - INTERVAL '30 days'
      )
      SELECT
        (SELECT COUNT(*)::bigint FROM rips) AS total,
        (SELECT COUNT(*)::bigint FROM rips WHERE status NOT IN ('Withdrawn', 'Stagnant') OR status IS NULL) AS active,
        (SELECT cnt FROM recent) AS recent_commits,
        (SELECT rip_number FROM rip_stats ORDER BY commit_count DESC LIMIT 1) AS most_active_rip,
        (SELECT title FROM rip_stats ORDER BY commit_count DESC LIMIT 1) AS most_active_title,
        (SELECT commit_count FROM rip_stats ORDER BY commit_count DESC LIMIT 1) AS most_active_commits
    `);
    const row = results[0];
    return {
      total: Number(row?.total ?? 0),
      active: Number(row?.active ?? 0),
      recentCommits: Number(row?.recent_commits ?? 0),
      mostActiveRip: row?.most_active_rip ?? null,
      mostActiveTitle: row?.most_active_title ?? null,
      mostActiveCommits: Number(row?.most_active_commits ?? 0),
    };
  },
  ['standards-getRIPKPIs'],
  { revalidate: CACHE_REVALIDATE }
);

function getStatusDistributionCached(repo: string | null) {
  return unstable_cache(
    async () => {
      const results = await prisma.$queryRawUnsafe<Array<{ status: string; repo_short: string; count: bigint }>>(
        `SELECT s.status, LOWER(SPLIT_PART(r.name, '/', 2)) AS repo_short, COUNT(*)::bigint AS count
         FROM eip_snapshots s LEFT JOIN repositories r ON s.repository_id = r.id
         WHERE ($1::text IS NULL OR LOWER(SPLIT_PART(r.name, '/', 2)) = LOWER($1))
         GROUP BY s.status, LOWER(SPLIT_PART(r.name, '/', 2)) ORDER BY count DESC`,
        repo
      );
      return results.map(r => ({ status: r.status, repo: r.repo_short || 'unknown', count: Number(r.count) }));
    },
    ['standards-getStatusDistribution', repo ?? 'all'],
    { revalidate: CACHE_REVALIDATE }
  )();
}

function getCategoryBreakdownCached(repo: string | null) {
  return unstable_cache(
    async () => {
      const results = await prisma.$queryRawUnsafe<Array<{ category: string; count: bigint }>>(
        `SELECT
           CASE WHEN s.category IS NOT NULL AND TRIM(s.category) <> '' THEN s.category
                WHEN TRIM(COALESCE(s.type, '')) <> '' THEN s.type ELSE 'Other' END AS category,
           COUNT(*)::bigint AS count
         FROM eip_snapshots s LEFT JOIN repositories r ON s.repository_id = r.id
         WHERE ($1::text IS NULL OR LOWER(SPLIT_PART(r.name, '/', 2)) = LOWER($1))
         GROUP BY 1 ORDER BY count DESC`,
        repo
      );
      return results.map(r => ({ category: r.category, count: Number(r.count) }));
    },
    ['standards-getCategoryBreakdown', repo ?? 'all'],
    { revalidate: CACHE_REVALIDATE }
  )();
}

const getStatusMatrixCached = unstable_cache(
  async () => {
    const results = await prisma.$queryRawUnsafe<Array<{ status: string; group_name: string; count: bigint }>>(
      `SELECT s.status,
         CASE WHEN s.category = 'ERC' OR LOWER(SPLIT_PART(r.name, '/', 2)) = 'ercs' THEN 'ERCs' ELSE 'EIPs' END AS group_name,
         COUNT(*)::bigint AS count
       FROM eip_snapshots s LEFT JOIN repositories r ON s.repository_id = r.id
       GROUP BY 1, 2 ORDER BY count DESC`
    );
    return results.map(r => ({ status: r.status, group: r.group_name, count: Number(r.count) }));
  },
  ['standards-getStatusMatrix'],
  { revalidate: CACHE_REVALIDATE }
);

const repoFilterSchema = z.object({
  repo: z.enum(['eips', 'ercs', 'rips']).optional(),
})

const tableInputSchema = z.object({
  repo: z.enum(['eips', 'ercs', 'rips']).optional(),
  status: z.array(z.string()).optional(),
  type: z.array(z.string()).optional(),
  category: z.array(z.string()).optional(),
  yearFrom: z.number().optional(),
  yearTo: z.number().optional(),
  search: z.string().optional(),
  sortBy: z.enum([
    'number', 'title', 'status', 'type', 'category',
    'created_at', 'updated_at', 'days_in_status', 'linked_prs',
  ]).optional().default('number'),
  sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.number().optional().default(1),
  pageSize: z.number().optional().default(50),
})

const unifiedDistributionInputSchema = z.object({
  dimension: z.enum(['status', 'category', 'repo']).default('status'),
})

const unifiedTableInputSchema = z.object({
  sortBy: z.enum(['github', 'eip', 'title', 'author', 'type', 'category', 'status', 'updated_at']).optional().default('updated_at'),
  sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.number().optional().default(1),
  pageSize: z.number().optional().default(25),
  search: z.string().optional(),
  dimension: z.enum(['status', 'category', 'repo']).optional(),
  bucket: z.string().optional(),
  columnSearch: z.object({
    eip: z.string().optional(),
    github: z.string().optional(),
    title: z.string().optional(),
    author: z.string().optional(),
    type: z.string().optional(),
    status: z.string().optional(),
    category: z.string().optional(),
    updatedAt: z.string().optional(),
  }).optional(),
})

export const standardsProcedures = {
  // ——— KPIs ———
  getKPIs: optionalAuthProcedure
    .input(repoFilterSchema)
    .handler(async ({ input }) => {
const results = await prisma.$queryRawUnsafe<Array<{
        total: bigint;
        in_review: bigint;
        finalized: bigint;
        new_this_year: bigint;
      }>>(
        `
        SELECT
          COUNT(*)::bigint AS total,
          COUNT(*) FILTER (WHERE s.status IN ('Draft', 'Review', 'Last Call'))::bigint AS in_review,
          COUNT(*) FILTER (WHERE s.status = 'Final')::bigint AS finalized,
          COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM e.created_at) = EXTRACT(YEAR FROM CURRENT_DATE))::bigint AS new_this_year
        FROM eip_snapshots s
        JOIN eips e ON s.eip_id = e.id
        LEFT JOIN repositories r ON s.repository_id = r.id
        WHERE ($1::text IS NULL OR LOWER(SPLIT_PART(r.name, '/', 2)) = LOWER($1))
      `,
        input.repo ?? null
      );

      const row = results[0];
      return {
        total: Number(row?.total ?? 0),
        inReview: Number(row?.in_review ?? 0),
        finalized: Number(row?.finalized ?? 0),
        newThisYear: Number(row?.new_this_year ?? 0),
      };
    }),

// ——— RIP-specific KPIs ———
getRIPKPIs: publicProcedure
  .handler(async ({ context }) => {
    await checkAPIToken(context.headers);
    return getRIPKPIsCached();
  }),

// ——— Status Distribution (stacked by repo) ———
getStatusDistribution: publicProcedure
  .input(repoFilterSchema)
  .handler(async ({ context, input }) => {
    await checkAPIToken(context.headers);
    return getStatusDistributionCached(input.repo ?? null);
  }),

  // ——— Trends Over Time (standards created per year, by repo) ———
  getCreationTrends: optionalAuthProcedure
    .input(repoFilterSchema)
    .handler(async ({ input }) => {
const results = await prisma.$queryRawUnsafe<Array<{
        year: number;
        repo_short: string;
        count: bigint;
      }>>(
        `
        SELECT
          EXTRACT(YEAR FROM e.created_at)::int AS year,
          LOWER(SPLIT_PART(r.name, '/', 2)) AS repo_short,
          COUNT(*)::bigint AS count
        FROM eips e
        JOIN eip_snapshots s ON s.eip_id = e.id
        LEFT JOIN repositories r ON s.repository_id = r.id
        WHERE e.created_at IS NOT NULL
          AND ($1::text IS NULL OR LOWER(SPLIT_PART(r.name, '/', 2)) = LOWER($1))
        GROUP BY EXTRACT(YEAR FROM e.created_at), LOWER(SPLIT_PART(r.name, '/', 2))
        ORDER BY year ASC
      `,
        input.repo ?? null
      );

      return results.map(r => ({
        year: r.year,
        repo: r.repo_short || 'unknown',
        count: Number(r.count),
      }));
    }),

// ——— Category Breakdown ———
getCategoryBreakdown: publicProcedure
  .input(repoFilterSchema)
  .handler(async ({ context, input }) => {
    await checkAPIToken(context.headers);
    return getCategoryBreakdownCached(input.repo ?? null);
  }),

  // ——— Filter Options (for populating multi-selects) ———
  getFilterOptions: optionalAuthProcedure
    .input(repoFilterSchema)
    .handler(async ({ input }) => {
const [statuses, types, categories] = await Promise.all([
        prisma.$queryRawUnsafe<Array<{ value: string }>>(
          `SELECT DISTINCT s.status AS value FROM eip_snapshots s
           LEFT JOIN repositories r ON s.repository_id = r.id
           WHERE ($1::text IS NULL OR LOWER(SPLIT_PART(r.name, '/', 2)) = LOWER($1))
             AND s.status IS NOT NULL
           ORDER BY value`,
          input.repo ?? null
        ),
        prisma.$queryRawUnsafe<Array<{ value: string }>>(
          `SELECT DISTINCT s.type AS value FROM eip_snapshots s
           LEFT JOIN repositories r ON s.repository_id = r.id
           WHERE ($1::text IS NULL OR LOWER(SPLIT_PART(r.name, '/', 2)) = LOWER($1))
             AND s.type IS NOT NULL
           ORDER BY value`,
          input.repo ?? null
        ),
        prisma.$queryRawUnsafe<Array<{ value: string }>>(
          `SELECT DISTINCT s.category AS value FROM eip_snapshots s
           LEFT JOIN repositories r ON s.repository_id = r.id
           WHERE ($1::text IS NULL OR LOWER(SPLIT_PART(r.name, '/', 2)) = LOWER($1))
             AND s.category IS NOT NULL
           ORDER BY value`,
          input.repo ?? null
        ),
      ]);

      return {
        statuses: statuses.map(s => s.value),
        types: types.map(t => t.value),
        categories: categories.map(c => c.value),
      };
    }),

  // ——— Main Table (EIPs/ERCs) ———
  getTable: optionalAuthProcedure
    .input(tableInputSchema)
    .handler(async ({ input }) => {
const {
        repo, status, type, category, yearFrom, yearTo,
        search, sortBy, sortDir, page, pageSize,
      } = input;
      const offset = ((page ?? 1) - 1) * (pageSize ?? 50);

      // Build WHERE conditions
      const conditions: string[] = ['1=1'];
      const params: unknown[] = [];
      let paramIdx = 1;

      if (repo) {
        conditions.push(`LOWER(SPLIT_PART(r.name, '/', 2)) = LOWER($${paramIdx})`);
        params.push(repo);
        paramIdx++;
      }

      if (status && status.length > 0) {
        conditions.push(`s.status = ANY($${paramIdx}::text[])`);
        params.push(status);
        paramIdx++;
      }

      if (type && type.length > 0) {
        conditions.push(`s.type = ANY($${paramIdx}::text[])`);
        params.push(type);
        paramIdx++;
      }

      if (category && category.length > 0) {
        conditions.push(`s.category = ANY($${paramIdx}::text[])`);
        params.push(category);
        paramIdx++;
      }

      if (yearFrom) {
        conditions.push(`EXTRACT(YEAR FROM e.created_at) >= $${paramIdx}`);
        params.push(yearFrom);
        paramIdx++;
      }

      if (yearTo) {
        conditions.push(`EXTRACT(YEAR FROM e.created_at) <= $${paramIdx}`);
        params.push(yearTo);
        paramIdx++;
      }

      if (search && search.trim()) {
        conditions.push(`(
          e.eip_number::text ILIKE '%' || $${paramIdx} || '%'
          OR e.title ILIKE '%' || $${paramIdx} || '%'
          OR e.author ILIKE '%' || $${paramIdx} || '%'
        )`);
        params.push(search.trim());
        paramIdx++;
      }

      const whereClause = conditions.join(' AND ');

      // Sort mapping
      const sortMap: Record<string, string> = {
        number: 'e.eip_number',
        title: 'e.title',
        status: 's.status',
        type: 's.type',
        category: 's.category',
        created_at: 'e.created_at',
        updated_at: 's.updated_at',
        days_in_status: 'days_in_status',
        linked_prs: 'linked_pr_count',
      };
      const orderCol = sortMap[sortBy ?? 'number'] ?? 'e.eip_number';
      const orderDir = sortDir === 'asc' ? 'ASC' : 'DESC';

      // Count query
      const countResult = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
        `SELECT COUNT(*)::bigint AS total
         FROM eip_snapshots s
         JOIN eips e ON s.eip_id = e.id
         LEFT JOIN repositories r ON s.repository_id = r.id
         WHERE ${whereClause}`,
        ...params
      );

      const total = Number(countResult[0]?.total ?? 0);

      // Data query
      const limitParam = paramIdx;
      params.push(pageSize ?? 50);
      paramIdx++;
      const offsetParam = paramIdx;
      params.push(offset);

      const rows = await prisma.$queryRawUnsafe<Array<{
        repo_name: string;
        eip_number: number;
        title: string | null;
        author: string | null;
        status: string;
        type: string | null;
        category: string | null;
        created_at: string | null;
        updated_at: string;
        days_in_status: number;
        linked_pr_count: bigint;
      }>>(
        `SELECT
          COALESCE(r.name, 'unknown') AS repo_name,
          e.eip_number,
          e.title,
          e.author,
          s.status,
          s.type,
          s.category,
          TO_CHAR(e.created_at, 'YYYY-MM-DD') AS created_at,
          TO_CHAR(s.updated_at, 'YYYY-MM-DD') AS updated_at,
          COALESCE(
            EXTRACT(DAY FROM (NOW() - s.updated_at))::int,
            0
          ) AS days_in_status,
          (SELECT COUNT(*)::bigint FROM pull_request_eips pre WHERE pre.eip_number = e.eip_number AND pre.repository_id = COALESCE(s.repository_id, r.id)) AS linked_pr_count
        FROM eip_snapshots s
        JOIN eips e ON s.eip_id = e.id
        LEFT JOIN repositories r ON s.repository_id = r.id
        WHERE ${whereClause}
        ORDER BY ${orderCol} ${orderDir} NULLS LAST
        LIMIT $${limitParam} OFFSET $${offsetParam}`,
        ...params
      );

      return {
        total,
        page: page ?? 1,
        pageSize: pageSize ?? 50,
        totalPages: Math.ceil(total / (pageSize ?? 50)),
        rows: rows.map(r => ({
          repo: r.repo_name,
          number: r.eip_number,
          title: r.title,
          author: r.author,
          status: r.status,
          type: r.type,
          category: r.category,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          daysInStatus: r.days_in_status,
          linkedPRs: Number(r.linked_pr_count),
        })),
      };
    }),

  // ——— RIPs Table ———
  getRIPsTable: optionalAuthProcedure
    .input(z.object({
      search: z.string().optional(),
      sortBy: z.enum(['number', 'title', 'status', 'author', 'created_at', 'last_commit', 'commits']).optional().default('number'),
      sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
      page: z.number().optional().default(1),
      pageSize: z.number().optional().default(50),
    }))
    .handler(async ({ input }) => {
const { search, sortBy, sortDir, page, pageSize } = input;
      const offset = ((page ?? 1) - 1) * (pageSize ?? 50);

      const conditions: string[] = ['1=1'];
      const params: unknown[] = [];
      let paramIdx = 1;

      if (search && search.trim()) {
        conditions.push(`(
          r.rip_number::text ILIKE '%' || $${paramIdx} || '%'
          OR r.title ILIKE '%' || $${paramIdx} || '%'
          OR r.author ILIKE '%' || $${paramIdx} || '%'
        )`);
        params.push(search.trim());
        paramIdx++;
      }

      const whereClause = conditions.join(' AND ');

      const sortMap: Record<string, string> = {
        number: 'r.rip_number',
        title: 'r.title',
        status: 'r.status',
        author: 'r.author',
        created_at: 'r.created_at',
        last_commit: 'last_commit',
        commits: 'commit_count',
      };
      const orderCol = sortMap[sortBy ?? 'number'] ?? 'r.rip_number';
      const orderDir = sortDir === 'asc' ? 'ASC' : 'DESC';

      const countResult = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
        `SELECT COUNT(*)::bigint AS total FROM rips r WHERE ${whereClause}`,
        ...params
      );
      const total = Number(countResult[0]?.total ?? 0);

      const limitParam = paramIdx;
      params.push(pageSize ?? 50);
      paramIdx++;
      const offsetParam = paramIdx;
      params.push(offset);

      const rows = await prisma.$queryRawUnsafe<Array<{
        rip_number: number;
        title: string | null;
        status: string | null;
        author: string | null;
        created_at: string | null;
        last_commit: string | null;
        commit_count: bigint;
      }>>(
        `SELECT
          r.rip_number,
          r.title,
          r.status,
          r.author,
          TO_CHAR(r.created_at, 'YYYY-MM-DD') AS created_at,
          TO_CHAR(MAX(rc.commit_date), 'YYYY-MM-DD') AS last_commit,
          COUNT(rc.id)::bigint AS commit_count
        FROM rips r
        LEFT JOIN rip_commits rc ON rc.rip_id = r.id
        WHERE ${whereClause}
        GROUP BY r.rip_number, r.title, r.status, r.author, r.created_at
        ORDER BY ${orderCol} ${orderDir} NULLS LAST
        LIMIT $${limitParam} OFFSET $${offsetParam}`,
        ...params
      );

      return {
        total,
        page: page ?? 1,
        pageSize: pageSize ?? 50,
        totalPages: Math.ceil(total / (pageSize ?? 50)),
        rows: rows.map(r => ({
          number: r.rip_number,
          title: r.title,
          status: r.status,
          author: r.author,
          createdAt: r.created_at,
          lastCommit: r.last_commit,
          commits: Number(r.commit_count),
        })),
      };
    }),

  // ——— RIP Creation Trends (by year, for analytics charts) ———
   getRIPCreationTrends: optionalAuthProcedure
    .handler(async () => {
      const results = await prisma.$queryRawUnsafe<Array<{
        year: number;
        count: bigint;
      }>>(
        `SELECT 
          EXTRACT(YEAR FROM created_at)::int AS year,
          COUNT(*)::bigint AS count
        FROM rips
        WHERE created_at IS NOT NULL
        GROUP BY EXTRACT(YEAR FROM created_at)
        ORDER BY year ASC`
      );

      return results.map(r => ({
        year: r.year,
        repo: 'rips',
        count: Number(r.count),
      }));
    }),


  // ——— RIP Activity Over Time ———
  getRIPActivity: optionalAuthProcedure
    .handler(async () => {
const results = await prisma.$queryRawUnsafe<Array<{
        month: string;
        count: bigint;
      }>>(
        `SELECT
          TO_CHAR(date_trunc('month', commit_date), 'YYYY-MM') AS month,
          COUNT(*)::bigint AS count
        FROM rip_commits
        WHERE commit_date >= '2020-01-01'
        GROUP BY date_trunc('month', commit_date)
        ORDER BY month ASC`
      );

      return results.map(r => ({
        month: r.month,
        count: Number(r.count),
      }));
    }),

// ——— Status × Group Matrix (for homepage) ———
getStatusMatrix: optionalAuthProcedure
  .handler(async ({ context }) => {
    await checkAPIToken(context.headers);
    return getStatusMatrixCached();
  }),

  // ——— Upgrade Impact Snapshot (for homepage) ———
  getUpgradeImpact: optionalAuthProcedure
    .handler(async () => {
const results = await prisma.$queryRawUnsafe<Array<{
        upgrade_name: string;
        slug: string;
        total: bigint;
        finalized: bigint;
        in_review: bigint;
        draft: bigint;
        last_call: bigint;
      }>>(
        `SELECT
          u.name AS upgrade_name,
          u.slug,
          COUNT(*)::bigint AS total,
          COUNT(*) FILTER (WHERE s.status = 'Final')::bigint AS finalized,
          COUNT(*) FILTER (WHERE s.status = 'Review')::bigint AS in_review,
          COUNT(*) FILTER (WHERE s.status = 'Draft')::bigint AS draft,
          COUNT(*) FILTER (WHERE s.status = 'Last Call')::bigint AS last_call
        FROM upgrades u
        JOIN upgrade_composition_current ucc ON ucc.upgrade_id = u.id
        JOIN eips e ON e.eip_number = ucc.eip_number
        JOIN eip_snapshots s ON s.eip_id = e.id
        GROUP BY u.id, u.name, u.slug
        ORDER BY u.id DESC
        LIMIT 6`
      );

      return results.map(r => ({
        name: r.upgrade_name || r.slug,
        slug: r.slug,
        total: Number(r.total),
        finalized: Number(r.finalized),
        inReview: Number(r.in_review),
        draft: Number(r.draft),
        lastCall: Number(r.last_call),
      }));
    }),

  // ——— Monthly Governance Delta (for homepage) ———
  getMonthlyDelta: optionalAuthProcedure
    .input(z.object({
      monthYear: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    }))
    .handler(async ({ input }) => {
      const now = new Date();
      const monthYear = input.monthYear
        ?? `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
      const monthStart = `${monthYear}-01`;
      const monthStartDate = new Date(`${monthStart}T00:00:00.000Z`);
      const nextMonthDate = new Date(Date.UTC(monthStartDate.getUTCFullYear(), monthStartDate.getUTCMonth() + 1, 1));
      const nextMonth = `${nextMonthDate.getUTCFullYear()}-${String(nextMonthDate.getUTCMonth() + 1).padStart(2, '0')}-01`;

      const results = await prisma.$queryRawUnsafe<Array<{
        to_status: string;
        count: bigint;
        latest_changed_at: Date | null;
      }>>(
        `SELECT
          se.to_status,
          COUNT(*)::bigint AS count,
          MAX(se.changed_at) AS latest_changed_at
        FROM eip_status_events se
        WHERE se.changed_at >= $1::date
          AND se.changed_at < $2::date
        GROUP BY se.to_status
        ORDER BY count DESC`,
        monthStart,
        nextMonth
      );

      const items = results.map(r => ({
        status: r.to_status,
        count: Number(r.count),
      }));
      const updatedAt = results.reduce<Date | null>((latest, row) => {
        if (!row.latest_changed_at) return latest;
        if (!latest || row.latest_changed_at > latest) return row.latest_changed_at;
        return latest;
      }, null);

      return {
        items,
        updatedAt: updatedAt?.toISOString() ?? null,
      };
    }),

  // ——— Repo Distribution (for homepage) ———
  // Aligns with Category Breakdown: ethereum/EIPs = by repo, ethereum/ERCs = by category (ERC), ethereum/RIPs = rips table
  getRepoDistribution: optionalAuthProcedure
    .handler(async () => {
// ethereum/EIPs: count by repository (EIPs repo only)
      const eipsResults = await prisma.$queryRawUnsafe<Array<{
        proposals: bigint;
        active_prs: bigint;
        finals: bigint;
      }>>(
        `SELECT
          COUNT(DISTINCT s.eip_id)::bigint AS proposals,
          (SELECT COUNT(*)::bigint FROM pull_requests pr
           JOIN repositories r2 ON pr.repository_id = r2.id
           WHERE pr.state = 'open' AND LOWER(SPLIT_PART(r2.name, '/', 2)) = 'eips')::bigint AS active_prs,
          COUNT(DISTINCT s.eip_id) FILTER (WHERE s.status = 'Final')::bigint AS finals
        FROM eip_snapshots s
        LEFT JOIN repositories r ON s.repository_id = r.id
        WHERE LOWER(SPLIT_PART(r.name, '/', 2)) = 'eips'
          AND r.active = true`
      );

      // ethereum/ERCs: count by category (matches Category Breakdown ERC = 577)
      const ercsResults = await prisma.$queryRawUnsafe<Array<{
        proposals: bigint;
        active_prs: bigint;
        finals: bigint;
      }>>(
        `SELECT
          COUNT(DISTINCT s.eip_id)::bigint AS proposals,
          (SELECT COUNT(*)::bigint FROM pull_requests pr
           JOIN repositories r2 ON pr.repository_id = r2.id
           WHERE pr.state = 'open' AND LOWER(SPLIT_PART(r2.name, '/', 2)) = 'ercs')::bigint AS active_prs,
          COUNT(DISTINCT s.eip_id) FILTER (WHERE s.status = 'Final')::bigint AS finals
        FROM eip_snapshots s
        LEFT JOIN repositories r ON s.repository_id = r.id
        WHERE s.category = 'ERC' AND r.id IS NOT NULL`
      );

      // RIPs: from rips table + open PRs from pull_requests (if ethereum/RIPs exists in repositories)
      const ripResults = await prisma.$queryRawUnsafe<Array<{
        proposals: bigint;
        finals: bigint;
        active_prs: bigint;
      }>>(
        `SELECT
          (SELECT COUNT(*)::bigint FROM rips)::bigint AS proposals,
          (SELECT COUNT(*) FILTER (WHERE status = 'Final')::bigint FROM rips)::bigint AS finals,
          (SELECT COUNT(*)::bigint FROM pull_requests pr
           JOIN repositories r2 ON pr.repository_id = r2.id
           WHERE pr.state = 'open' AND LOWER(SPLIT_PART(r2.name, '/', 2)) = 'rips')::bigint AS active_prs`
      );

      const eips = eipsResults[0];
      const ercs = ercsResults[0];
      const ripRow = ripResults[0];

      const rows: Array<{ repo: string; proposals: number; activePRs: number; finals: number }> = [
        {
          repo: 'ethereum/EIPs',
          proposals: Number(eips?.proposals ?? 0),
          activePRs: Number(eips?.active_prs ?? 0),
          finals: Number(eips?.finals ?? 0),
        },
        {
          repo: 'ethereum/ERCs',
          proposals: Number(ercs?.proposals ?? 0),
          activePRs: Number(ercs?.active_prs ?? 0),
          finals: Number(ercs?.finals ?? 0),
        },
      ];

      const ripProposals = Number(ripRow?.proposals ?? 0);
      if (ripProposals > 0) {
        rows.push({
          repo: 'ethereum/RIPs',
          proposals: ripProposals,
          activePRs: Number(ripRow?.active_prs ?? 0),
          finals: Number(ripRow?.finals ?? 0),
        });
      }

      return rows;
    }),

  // ——— Unified Distribution (EIPs/ERCs + RIPs including RRC) ———
  getUnifiedDistribution: optionalAuthProcedure
    .input(unifiedDistributionInputSchema)
    .handler(async ({ input }) => {
      const field = input.dimension === 'category'
        ? 'category'
        : input.dimension === 'repo'
          ? 'repo_group'
          : 'status';
      const results = await prisma.$queryRawUnsafe<Array<{ bucket: string; count: bigint }>>(
        `
        WITH unified AS (
          SELECT
            COALESCE(NULLIF(s.status, ''), 'Unknown') AS status,
            COALESCE(NULLIF(s.category, ''), NULLIF(s.type, ''), 'Other') AS category,
            CASE
              WHEN LOWER(SPLIT_PART(COALESCE(r.name, ''), '/', 2)) = 'ercs' OR s.category = 'ERC' THEN 'ERCs'
              ELSE 'EIPs'
            END AS repo_group
          FROM eip_snapshots s
          JOIN eips e ON e.id = s.eip_id
          LEFT JOIN repositories r ON r.id = s.repository_id
          WHERE e.eip_number NOT IN (7212, 3297, 2512)
          UNION ALL
          SELECT
            COALESCE(NULLIF(r.status, ''), 'Unknown') AS status,
            CASE
              WHEN COALESCE(r.title, '') ~* '\\mRRC[-\\s]?[0-9]+' OR COALESCE(r.title, '') ~* '^RRC\\M'
                THEN 'RRC'
              ELSE 'RIP'
            END AS category,
            'RIPs'::text AS repo_group
          FROM rips r
          WHERE r.rip_number <> 0
        )
        SELECT ${field} AS bucket, COUNT(*)::bigint AS count
        FROM unified
        GROUP BY ${field}
        ORDER BY count DESC, bucket ASC
        `
      );

      return results.map((r) => ({
        bucket: r.bucket,
        count: Number(r.count),
      }));
    }),

  // ——— Unified Proposals Table (EIPs/ERCs + RIPs including RRC) ———
  getUnifiedProposals: optionalAuthProcedure
    .input(unifiedTableInputSchema)
    .handler(async ({ input }) => {
      const offset = ((input.page ?? 1) - 1) * (input.pageSize ?? 25);
      const search = input.search?.trim() ?? '';
      const hasSearch = search.length > 0;
      const hasBucket = Boolean(input.dimension && input.bucket);
      const bucketField = input.dimension === 'category'
        ? 'category'
        : input.dimension === 'repo'
          ? 'repo_group'
          : 'status';
      const columnSearch = input.columnSearch ?? {};
      const eipSearch = columnSearch.eip?.trim() ?? '';
      const githubSearch = columnSearch.github?.trim() ?? '';
      const titleSearch = columnSearch.title?.trim() ?? '';
      const authorSearch = columnSearch.author?.trim() ?? '';
      const typeSearch = columnSearch.type?.trim() ?? '';
      const statusSearch = columnSearch.status?.trim() ?? '';
      const categorySearch = columnSearch.category?.trim() ?? '';
      const updatedAtSearch = columnSearch.updatedAt?.trim() ?? '';
      const hasEipSearch = eipSearch.length > 0;
      const hasGithubSearch = githubSearch.length > 0;
      const hasTitleSearch = titleSearch.length > 0;
      const hasAuthorSearch = authorSearch.length > 0;
      const hasTypeSearch = typeSearch.length > 0;
      const hasStatusSearch = statusSearch.length > 0;
      const hasCategorySearch = categorySearch.length > 0;
      const hasUpdatedAtSearch = updatedAtSearch.length > 0;

      const sortMap: Record<string, string> = {
        github: 'repo',
        eip: 'number',
        title: 'title',
        author: 'author',
        type: 'type',
        status: 'status',
        category: 'category',
        updated_at: 'updated_at',
      };
      const orderCol = sortMap[input.sortBy ?? 'updated_at'] ?? 'updated_at';
      const orderDir = input.sortDir === 'asc' ? 'ASC' : 'DESC';

      const countResults = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
        `
        WITH rip_rows AS (
          SELECT
            r.rip_number AS number,
            r.title,
            r.author,
            'RIP'::text AS type,
            COALESCE(NULLIF(r.status, ''), 'Unknown') AS status,
            CASE
              WHEN COALESCE(r.title, '') ~* '\\mRRC[-\\s]?[0-9]+' OR COALESCE(r.title, '') ~* '^RRC\\M'
                THEN 'RRC'
              ELSE 'RIP'
            END AS category,
            'RIPs'::text AS repo_group,
            'ethereum/RIPs'::text AS repo,
            'RIP'::text AS kind,
            COALESCE(MAX(rc.commit_date), r.created_at, NOW()) AS updated_at
          FROM rips r
          LEFT JOIN rip_commits rc ON rc.rip_id = r.id
          WHERE r.rip_number <> 0
          GROUP BY r.rip_number, r.title, r.author, r.status, r.created_at
        ),
        eip_rows AS (
          SELECT
            e.eip_number AS number,
            e.title,
            e.author,
            COALESCE(NULLIF(s.type, ''), 'Unknown') AS type,
            COALESCE(NULLIF(s.status, ''), 'Unknown') AS status,
            COALESCE(NULLIF(s.category, ''), NULLIF(s.type, ''), 'Other') AS category,
            CASE
              WHEN LOWER(SPLIT_PART(COALESCE(r.name, ''), '/', 2)) = 'ercs' OR s.category = 'ERC' THEN 'ERCs'
              ELSE 'EIPs'
            END AS repo_group,
            COALESCE(r.name, 'ethereum/EIPs') AS repo,
            CASE
              WHEN LOWER(SPLIT_PART(COALESCE(r.name, ''), '/', 2)) = 'ercs' OR s.category = 'ERC' THEN 'ERC'
              WHEN LOWER(SPLIT_PART(COALESCE(r.name, ''), '/', 2)) = 'rips' THEN 'RIP'
              ELSE 'EIP'
            END AS kind,
            COALESCE(s.updated_at, e.created_at, NOW()) AS updated_at
          FROM eip_snapshots s
          JOIN eips e ON e.id = s.eip_id
          LEFT JOIN repositories r ON r.id = s.repository_id
          WHERE e.eip_number NOT IN (7212, 3297, 2512)
        ),
        unified AS (
          SELECT * FROM eip_rows
          UNION ALL
          SELECT * FROM rip_rows
        )
        SELECT COUNT(*)::bigint AS total
        FROM unified
        WHERE (($1::boolean = false)
           OR (
             number::text ILIKE '%' || $2 || '%'
             OR COALESCE(title, '') ILIKE '%' || $2 || '%'
             OR COALESCE(author, '') ILIKE '%' || $2 || '%'
             OR COALESCE(type, '') ILIKE '%' || $2 || '%'
             OR status ILIKE '%' || $2 || '%'
             OR category ILIKE '%' || $2 || '%'
             OR repo ILIKE '%' || $2 || '%'
           ))
          AND (($3::boolean = false) OR ${bucketField} = $4::text)
          AND (($5::boolean = false) OR number::text ILIKE '%' || $6 || '%')
          AND (($7::boolean = false) OR repo ILIKE '%' || $8 || '%')
          AND (($9::boolean = false) OR COALESCE(title, '') ILIKE '%' || $10 || '%')
          AND (($11::boolean = false) OR COALESCE(author, '') ILIKE '%' || $12 || '%')
          AND (($13::boolean = false) OR COALESCE(type, '') ILIKE '%' || $14 || '%')
          AND (($15::boolean = false) OR status ILIKE '%' || $16 || '%')
          AND (($17::boolean = false) OR category ILIKE '%' || $18 || '%')
          AND (($19::boolean = false) OR TO_CHAR(updated_at, 'YYYY-MM-DD') ILIKE '%' || $20 || '%')
        `,
        hasSearch,
        search,
        hasBucket,
        input.bucket ?? null,
        hasEipSearch,
        eipSearch,
        hasGithubSearch,
        githubSearch,
        hasTitleSearch,
        titleSearch,
        hasAuthorSearch,
        authorSearch,
        hasTypeSearch,
        typeSearch,
        hasStatusSearch,
        statusSearch,
        hasCategorySearch,
        categorySearch,
        hasUpdatedAtSearch,
        updatedAtSearch
      );

      const total = Number(countResults[0]?.total ?? 0);

      const rows = await prisma.$queryRawUnsafe<Array<{
        number: number;
        title: string | null;
        author: string | null;
        type: string;
        status: string;
        category: string;
        repo: string;
        kind: string;
        updated_at: Date;
      }>>(
        `
        WITH rip_rows AS (
          SELECT
            r.rip_number AS number,
            r.title,
            r.author,
            'RIP'::text AS type,
            COALESCE(NULLIF(r.status, ''), 'Unknown') AS status,
            CASE
              WHEN COALESCE(r.title, '') ~* '\\mRRC[-\\s]?[0-9]+' OR COALESCE(r.title, '') ~* '^RRC\\M'
                THEN 'RRC'
              ELSE 'RIP'
            END AS category,
            'RIPs'::text AS repo_group,
            'ethereum/RIPs'::text AS repo,
            'RIP'::text AS kind,
            COALESCE(MAX(rc.commit_date), r.created_at, NOW()) AS updated_at
          FROM rips r
          LEFT JOIN rip_commits rc ON rc.rip_id = r.id
          WHERE r.rip_number <> 0
          GROUP BY r.rip_number, r.title, r.author, r.status, r.created_at
        ),
        eip_rows AS (
          SELECT
            e.eip_number AS number,
            e.title,
            e.author,
            COALESCE(NULLIF(s.type, ''), 'Unknown') AS type,
            COALESCE(NULLIF(s.status, ''), 'Unknown') AS status,
            COALESCE(NULLIF(s.category, ''), NULLIF(s.type, ''), 'Other') AS category,
            CASE
              WHEN LOWER(SPLIT_PART(COALESCE(r.name, ''), '/', 2)) = 'ercs' OR s.category = 'ERC' THEN 'ERCs'
              ELSE 'EIPs'
            END AS repo_group,
            COALESCE(r.name, 'ethereum/EIPs') AS repo,
            CASE
              WHEN LOWER(SPLIT_PART(COALESCE(r.name, ''), '/', 2)) = 'ercs' OR s.category = 'ERC' THEN 'ERC'
              WHEN LOWER(SPLIT_PART(COALESCE(r.name, ''), '/', 2)) = 'rips' THEN 'RIP'
              ELSE 'EIP'
            END AS kind,
            COALESCE(s.updated_at, e.created_at, NOW()) AS updated_at
          FROM eip_snapshots s
          JOIN eips e ON e.id = s.eip_id
          LEFT JOIN repositories r ON r.id = s.repository_id
          WHERE e.eip_number NOT IN (7212, 3297, 2512)
        ),
        unified AS (
          SELECT * FROM eip_rows
          UNION ALL
          SELECT * FROM rip_rows
        )
        SELECT number, title, author, type, status, category, repo, kind, updated_at
        FROM unified
        WHERE (($1::boolean = false)
           OR (
             number::text ILIKE '%' || $2 || '%'
             OR COALESCE(title, '') ILIKE '%' || $2 || '%'
             OR COALESCE(author, '') ILIKE '%' || $2 || '%'
             OR COALESCE(type, '') ILIKE '%' || $2 || '%'
             OR status ILIKE '%' || $2 || '%'
             OR category ILIKE '%' || $2 || '%'
             OR repo ILIKE '%' || $2 || '%'
           ))
          AND (($3::boolean = false) OR ${bucketField} = $4::text)
          AND (($5::boolean = false) OR number::text ILIKE '%' || $6 || '%')
          AND (($7::boolean = false) OR repo ILIKE '%' || $8 || '%')
          AND (($9::boolean = false) OR COALESCE(title, '') ILIKE '%' || $10 || '%')
          AND (($11::boolean = false) OR COALESCE(author, '') ILIKE '%' || $12 || '%')
          AND (($13::boolean = false) OR COALESCE(type, '') ILIKE '%' || $14 || '%')
          AND (($15::boolean = false) OR status ILIKE '%' || $16 || '%')
          AND (($17::boolean = false) OR category ILIKE '%' || $18 || '%')
          AND (($19::boolean = false) OR TO_CHAR(updated_at, 'YYYY-MM-DD') ILIKE '%' || $20 || '%')
        ORDER BY ${orderCol} ${orderDir} NULLS LAST, number DESC
        LIMIT $21 OFFSET $22
        `,
        hasSearch,
        search,
        hasBucket,
        input.bucket ?? null,
        hasEipSearch,
        eipSearch,
        hasGithubSearch,
        githubSearch,
        hasTitleSearch,
        titleSearch,
        hasAuthorSearch,
        authorSearch,
        hasTypeSearch,
        typeSearch,
        hasStatusSearch,
        statusSearch,
        hasCategorySearch,
        categorySearch,
        hasUpdatedAtSearch,
        updatedAtSearch,
        input.pageSize ?? 25,
        offset
      );

      return {
        total,
        page: input.page ?? 1,
        pageSize: input.pageSize ?? 25,
        totalPages: Math.ceil(total / (input.pageSize ?? 25)),
        rows: rows.map((r) => ({
          number: r.number,
          title: r.title,
          author: r.author,
          type: r.type,
          status: r.status,
          category: r.category,
          repo: r.repo,
          kind: r.kind,
          updatedAt: r.updated_at.toISOString(),
        })),
      };
    }),

  // ——— Detailed Unified CSV (distribution metadata + proposal rows) ———
  exportUnifiedDetailedCSV: optionalAuthProcedure
    .input(z.object({
      dimension: z.enum(['status', 'category', 'repo']).default('status'),
      bucket: z.string().optional(),
      search: z.string().optional(),
      columnSearch: z.object({
        eip: z.string().optional(),
        github: z.string().optional(),
        title: z.string().optional(),
        author: z.string().optional(),
        type: z.string().optional(),
        status: z.string().optional(),
        category: z.string().optional(),
        updatedAt: z.string().optional(),
      }).optional(),
    }))
    .handler(async ({ input }) => {
      const search = input.search?.trim() ?? '';
      const hasSearch = search.length > 0;
      const hasBucket = Boolean(input.bucket);
      const columnSearch = input.columnSearch ?? {};
      const eipSearch = columnSearch.eip?.trim() ?? '';
      const githubSearch = columnSearch.github?.trim() ?? '';
      const titleSearch = columnSearch.title?.trim() ?? '';
      const authorSearch = columnSearch.author?.trim() ?? '';
      const typeSearch = columnSearch.type?.trim() ?? '';
      const statusSearch = columnSearch.status?.trim() ?? '';
      const categorySearch = columnSearch.category?.trim() ?? '';
      const updatedAtSearch = columnSearch.updatedAt?.trim() ?? '';
      const hasEipSearch = eipSearch.length > 0;
      const hasGithubSearch = githubSearch.length > 0;
      const hasTitleSearch = titleSearch.length > 0;
      const hasAuthorSearch = authorSearch.length > 0;
      const hasTypeSearch = typeSearch.length > 0;
      const hasStatusSearch = statusSearch.length > 0;
      const hasCategorySearch = categorySearch.length > 0;
      const hasUpdatedAtSearch = updatedAtSearch.length > 0;
      const bucketField = input.dimension === 'category'
        ? 'category'
        : input.dimension === 'repo'
          ? 'repo_group'
          : 'status';

      const summary = await prisma.$queryRawUnsafe<Array<{ bucket: string; count: bigint }>>(
        `
        WITH unified AS (
          SELECT
            e.eip_number AS number,
            e.title,
            e.author,
            COALESCE(NULLIF(s.type, ''), 'Unknown') AS type,
            COALESCE(NULLIF(s.status, ''), 'Unknown') AS status,
            COALESCE(NULLIF(s.category, ''), NULLIF(s.type, ''), 'Other') AS category,
            CASE
              WHEN LOWER(SPLIT_PART(COALESCE(r.name, ''), '/', 2)) = 'ercs' OR s.category = 'ERC' THEN 'ERCs'
              ELSE 'EIPs'
            END AS repo_group,
            COALESCE(r.name, 'ethereum/EIPs') AS repo,
            COALESCE(s.updated_at, e.created_at, NOW()) AS updated_at
          FROM eip_snapshots s
          JOIN eips e ON e.id = s.eip_id
          LEFT JOIN repositories r ON r.id = s.repository_id
          WHERE e.eip_number NOT IN (7212, 3297, 2512)
          UNION ALL
          SELECT
            r.rip_number AS number,
            r.title,
            r.author,
            'RIP'::text AS type,
            COALESCE(NULLIF(r.status, ''), 'Unknown') AS status,
            CASE
              WHEN COALESCE(r.title, '') ~* '\\mRRC[-\\s]?[0-9]+' OR COALESCE(r.title, '') ~* '^RRC\\M'
                THEN 'RRC'
              ELSE 'RIP'
            END AS category,
            'RIPs'::text AS repo_group,
            'ethereum/RIPs'::text AS repo,
            COALESCE(MAX(rc.commit_date), r.created_at, NOW()) AS updated_at
          FROM rips r
          LEFT JOIN rip_commits rc ON rc.rip_id = r.id
          WHERE r.rip_number <> 0
          GROUP BY r.rip_number, r.title, r.author, r.status, r.created_at
        )
        SELECT ${bucketField} AS bucket, COUNT(*)::bigint AS count
        FROM unified
        WHERE (($1::boolean = false)
          OR (
            number::text ILIKE '%' || $2 || '%'
            OR COALESCE(title, '') ILIKE '%' || $2 || '%'
            OR COALESCE(author, '') ILIKE '%' || $2 || '%'
            OR COALESCE(type, '') ILIKE '%' || $2 || '%'
            OR status ILIKE '%' || $2 || '%'
            OR category ILIKE '%' || $2 || '%'
            OR repo ILIKE '%' || $2 || '%'
          ))
          AND (($3::boolean = false) OR ${bucketField} = $4::text)
          AND (($5::boolean = false) OR number::text ILIKE '%' || $6 || '%')
          AND (($7::boolean = false) OR repo ILIKE '%' || $8 || '%')
          AND (($9::boolean = false) OR COALESCE(title, '') ILIKE '%' || $10 || '%')
          AND (($11::boolean = false) OR COALESCE(author, '') ILIKE '%' || $12 || '%')
          AND (($13::boolean = false) OR COALESCE(type, '') ILIKE '%' || $14 || '%')
          AND (($15::boolean = false) OR status ILIKE '%' || $16 || '%')
          AND (($17::boolean = false) OR category ILIKE '%' || $18 || '%')
          AND (($19::boolean = false) OR TO_CHAR(updated_at, 'YYYY-MM-DD') ILIKE '%' || $20 || '%')
        GROUP BY ${bucketField}
        ORDER BY count DESC, bucket ASC
        `,
        hasSearch,
        search,
        hasBucket,
        input.bucket ?? null,
        hasEipSearch,
        eipSearch,
        hasGithubSearch,
        githubSearch,
        hasTitleSearch,
        titleSearch,
        hasAuthorSearch,
        authorSearch,
        hasTypeSearch,
        typeSearch,
        hasStatusSearch,
        statusSearch,
        hasCategorySearch,
        categorySearch,
        hasUpdatedAtSearch,
        updatedAtSearch
      );

      const details = await prisma.$queryRawUnsafe<Array<{
        number: number;
        title: string | null;
        author: string | null;
        type: string;
        status: string;
        category: string;
        repo: string;
        kind: string;
        updated_at: Date;
      }>>(
        `
        WITH rip_rows AS (
          SELECT
            r.rip_number AS number,
            r.title,
            r.author,
            'RIP'::text AS type,
            COALESCE(NULLIF(r.status, ''), 'Unknown') AS status,
            CASE
              WHEN COALESCE(r.title, '') ~* '\\mRRC[-\\s]?[0-9]+' OR COALESCE(r.title, '') ~* '^RRC\\M'
                THEN 'RRC'
              ELSE 'RIP'
            END AS category,
            'ethereum/RIPs'::text AS repo,
            'RIP'::text AS kind,
            COALESCE(MAX(rc.commit_date), r.created_at, NOW()) AS updated_at
          FROM rips r
          LEFT JOIN rip_commits rc ON rc.rip_id = r.id
          WHERE r.rip_number <> 0
          GROUP BY r.rip_number, r.title, r.author, r.status, r.created_at
        ),
        eip_rows AS (
          SELECT
            e.eip_number AS number,
            e.title,
            e.author,
            COALESCE(NULLIF(s.type, ''), 'Unknown') AS type,
            COALESCE(NULLIF(s.status, ''), 'Unknown') AS status,
            COALESCE(NULLIF(s.category, ''), NULLIF(s.type, ''), 'Other') AS category,
            COALESCE(r.name, 'ethereum/EIPs') AS repo,
            CASE
              WHEN LOWER(SPLIT_PART(COALESCE(r.name, ''), '/', 2)) = 'ercs' OR s.category = 'ERC' THEN 'ERC'
              WHEN LOWER(SPLIT_PART(COALESCE(r.name, ''), '/', 2)) = 'rips' THEN 'RIP'
              ELSE 'EIP'
            END AS kind,
            COALESCE(s.updated_at, e.created_at, NOW()) AS updated_at
          FROM eip_snapshots s
          JOIN eips e ON e.id = s.eip_id
          LEFT JOIN repositories r ON r.id = s.repository_id
          WHERE e.eip_number NOT IN (7212, 3297, 2512)
        ),
        unified AS (
          SELECT * FROM eip_rows
          UNION ALL
          SELECT * FROM rip_rows
        )
        SELECT number, title, author, type, status, category, repo, kind, updated_at
        FROM unified
        WHERE (($1::boolean = false)
          OR (
            number::text ILIKE '%' || $2 || '%'
            OR COALESCE(title, '') ILIKE '%' || $2 || '%'
            OR status ILIKE '%' || $2 || '%'
            OR category ILIKE '%' || $2 || '%'
            OR repo ILIKE '%' || $2 || '%'
            OR kind ILIKE '%' || $2 || '%'
          ))
          AND (($3::boolean = false) OR ${bucketField} = $4::text)
          AND (($5::boolean = false) OR number::text ILIKE '%' || $6 || '%')
          AND (($7::boolean = false) OR repo ILIKE '%' || $8 || '%')
          AND (($9::boolean = false) OR COALESCE(title, '') ILIKE '%' || $10 || '%')
          AND (($11::boolean = false) OR COALESCE(author, '') ILIKE '%' || $12 || '%')
          AND (($13::boolean = false) OR COALESCE(type, '') ILIKE '%' || $14 || '%')
          AND (($15::boolean = false) OR status ILIKE '%' || $16 || '%')
          AND (($17::boolean = false) OR category ILIKE '%' || $18 || '%')
          AND (($19::boolean = false) OR TO_CHAR(updated_at, 'YYYY-MM-DD') ILIKE '%' || $20 || '%')
        ORDER BY updated_at DESC NULLS LAST, number DESC
        `,
        hasSearch,
        search,
        hasBucket,
        input.bucket ?? null,
        hasEipSearch,
        eipSearch,
        hasGithubSearch,
        githubSearch,
        hasTitleSearch,
        titleSearch,
        hasAuthorSearch,
        authorSearch,
        hasTypeSearch,
        typeSearch,
        hasStatusSearch,
        statusSearch,
        hasCategorySearch,
        categorySearch,
        hasUpdatedAtSearch,
        updatedAtSearch
      );

      const total = summary.reduce((acc, row) => acc + Number(row.count), 0);
      const safe = (v: string | null | undefined) => `"${(v ?? '').replace(/"/g, '""')}"`;

      const lines: string[] = [];
      lines.push('record_type,dimension,bucket,count,percentage,metric_description');
      for (const row of summary) {
        const count = Number(row.count);
        const pct = total > 0 ? ((count * 100) / total).toFixed(2) : '0.00';
        lines.push([
          'summary',
          input.dimension,
          safe(row.bucket),
          count,
          pct,
          safe(`Count of proposals grouped by ${input.dimension}`),
        ].join(','));
      }

      lines.push('');
      lines.push('record_type,proposal_number,title,author,type,status,category,kind,repo,updated_at,metadata_note');
      for (const row of details) {
        lines.push([
          'detail',
          row.number,
          safe(row.title),
          safe(row.author),
          safe(row.type),
          safe(row.status),
          safe(row.category),
          safe(row.kind),
          safe(row.repo),
          safe(row.updated_at.toISOString()),
          safe('Row-level proposal metadata aligned with selected filters'),
        ].join(','));
      }

      const stamp = new Date().toISOString().slice(0, 10);
      return {
        csv: lines.join('\n'),
        filename: `unified-standards-${input.dimension}-${input.bucket ? input.bucket.replace(/\s+/g, '-').toLowerCase() : 'all'}-${stamp}.csv`,
      };
    }),

  // ——— CSV Export (EIPs/ERCs) ———
  exportCSV: optionalAuthProcedure
    .input(z.object({
      repo: z.enum(['eips', 'ercs', 'rips']).optional(),
      status: z.array(z.string()).optional(),
      type: z.array(z.string()).optional(),
      category: z.array(z.string()).optional(),
    }))
    .handler(async ({ input }) => {
if (input.repo === 'rips') {
        const rows = await prisma.$queryRawUnsafe<Array<{
          rip_number: number;
          title: string | null;
          status: string | null;
          created_at: string | null;
          last_commit_at: string | null;
          commit_count: bigint;
        }>>(
          `SELECT
            r.rip_number,
            r.title,
            r.status,
            TO_CHAR(r.created_at, 'YYYY-MM-DD') AS created_at,
            TO_CHAR(MAX(rc.commit_date), 'YYYY-MM-DD') AS last_commit_at,
            COUNT(rc.id)::bigint AS commit_count
          FROM rips r
          LEFT JOIN rip_commits rc ON rc.rip_id = r.id
          GROUP BY r.rip_number, r.title, r.status, r.created_at
          ORDER BY r.rip_number ASC`
        );

        const header = 'rip_number,title,status,created_at,last_commit_at,commit_count';
        const csvRows = rows.map(r =>
          [r.rip_number, `"${(r.title ?? '').replace(/"/g, '""')}"`, r.status ?? '', r.created_at ?? '', r.last_commit_at ?? '', Number(r.commit_count)].join(',')
        );
        return { csv: [header, ...csvRows].join('\n'), filename: 'rips-standards.csv' };
      }

      // EIPs/ERCs export
      const conditions: string[] = ['1=1'];
      const params: unknown[] = [];
      let paramIdx = 1;

      if (input.repo) {
        conditions.push(`LOWER(SPLIT_PART(r.name, '/', 2)) = LOWER($${paramIdx})`);
        params.push(input.repo);
        paramIdx++;
      }
      if (input.status && input.status.length > 0) {
        conditions.push(`s.status = ANY($${paramIdx}::text[])`);
        params.push(input.status);
        paramIdx++;
      }
      if (input.type && input.type.length > 0) {
        conditions.push(`s.type = ANY($${paramIdx}::text[])`);
        params.push(input.type);
        paramIdx++;
      }
      if (input.category && input.category.length > 0) {
        conditions.push(`s.category = ANY($${paramIdx}::text[])`);
        params.push(input.category);
        paramIdx++;
      }

      const whereClause = conditions.join(' AND ');

      const rows = await prisma.$queryRawUnsafe<Array<{
        repo: string;
        eip_number: number;
        title: string | null;
        status: string;
        type: string | null;
        category: string | null;
        created_at: string | null;
        updated_at: string;
        linked_prs: bigint;
      }>>(
        `SELECT
          COALESCE(SPLIT_PART(r.name, '/', 2), 'unknown') AS repo,
          e.eip_number,
          e.title,
          s.status,
          s.type,
          s.category,
          TO_CHAR(e.created_at, 'YYYY-MM-DD') AS created_at,
          TO_CHAR(s.updated_at, 'YYYY-MM-DD') AS updated_at,
          (SELECT COUNT(*)::bigint FROM pull_request_eips pre WHERE pre.eip_number = e.eip_number AND pre.repository_id = COALESCE(s.repository_id, r.id)) AS linked_prs
        FROM eip_snapshots s
        JOIN eips e ON s.eip_id = e.id
        LEFT JOIN repositories r ON s.repository_id = r.id
        WHERE ${whereClause}
        ORDER BY e.eip_number ASC`,
        ...params
      );

      const header = 'repo,number,title,status,type,category,created_at,last_updated_at,linked_prs';
      const csvRows = rows.map(r =>
        [r.repo, r.eip_number, `"${(r.title ?? '').replace(/"/g, '""')}"`, r.status, r.type ?? '', r.category ?? '', r.created_at ?? '', r.updated_at, Number(r.linked_prs)].join(',')
      );

      const repoLabel = input.repo ?? 'all';
      return { csv: [header, ...csvRows].join('\n'), filename: `${repoLabel}-standards.csv` };
    }),

  // ——— Category × Status cross-tab (for dashboard) ———
  getCategoryStatusCrosstab: optionalAuthProcedure
    .handler(async () => {
const results = await prisma.$queryRawUnsafe<Array<{
        category: string; status: string; repo_group: string; count: bigint;
      }>>(`
        SELECT
          COALESCE(NULLIF(s.category, ''), s.type, 'Unknown') AS category,
          s.status,
          CASE
            WHEN s.category = 'ERC' OR LOWER(SPLIT_PART(r.name, '/', 2)) = 'ercs' THEN 'ERCs'
            WHEN LOWER(SPLIT_PART(r.name, '/', 2)) = 'rips' THEN 'RIPs'
            ELSE 'EIPs'
          END AS repo_group,
          COUNT(*)::bigint AS count
        FROM eip_snapshots s
        LEFT JOIN repositories r ON s.repository_id = r.id
        GROUP BY COALESCE(NULLIF(s.category, ''), s.type, 'Unknown'), s.status,
          CASE
            WHEN s.category = 'ERC' OR LOWER(SPLIT_PART(r.name, '/', 2)) = 'ercs' THEN 'ERCs'
            WHEN LOWER(SPLIT_PART(r.name, '/', 2)) = 'rips' THEN 'RIPs'
            ELSE 'EIPs'
          END
        ORDER BY 1, 2
      `);
      return results.map(r => ({
        category: r.category,
        status: r.status,
        repo: r.repo_group,
        count: Number(r.count),
      }));
    }),
};
