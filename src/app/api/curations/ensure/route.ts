import { NextRequest, NextResponse } from 'next/server';
import { ensureProposalCuration } from '@/lib/curate-proposal';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/curations/ensure
 * Lazily generates & persists `layman_summary` + `enterprise_impact` in `eip_curations`
 * for any proposal (e.g., brand-new EIPs) that doesn't have them yet.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const number = Number(body?.number);
    if (!Number.isInteger(number) || number <= 0) {
      return NextResponse.json({ error: 'Invalid proposal number' }, { status: 400 });
    }
    const repo = typeof body?.repo === 'string' ? body.repo : undefined;
    const title = typeof body?.title === 'string' ? body.title : undefined;

    const result = await ensureProposalCuration({ number, repo, title });
    return NextResponse.json({
      saved: result.saved,
      curation: result.row
        ? {
            layman_summary: result.row.layman_summary,
            benefits: result.row.benefits,
            tradeoffs: result.row.tradeoffs,
            stakeholder_impacts: result.row.stakeholder_impacts,
            enterprise_impact: result.row.enterprise_impact,
            faq: result.row.faq,
            headliner_of: result.row.headliner_of,
            headliner_note: result.row.headliner_note,
          }
        : null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to ensure curation';
    return NextResponse.json({ error: msg, curation: null }, { status: 200 });
  }
}

/**
 * GET /api/curations/ensure?limit=10
 * Cron-friendly endpoint to batch-curate newly synced proposals missing summaries/enterprise impact.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const limitParam = Number(req.nextUrl.searchParams.get('limit') ?? 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(1, limitParam), 25) : 10;

  const missing = await prisma.$queryRawUnsafe<Array<{ eip_number: number; title: string; repo_name: string }>>(
    `SELECT e.eip_number, e.title, r.name AS repo_name
     FROM eip_snapshots s
     JOIN eips e ON e.id = s.eip_id
     JOIN repositories r ON r.id = s.repository_id
     LEFT JOIN eip_curations c ON c.eip_number = e.eip_number
     WHERE c.layman_summary IS NULL OR c.layman_summary = '' OR c.enterprise_impact IS NULL
     ORDER BY CASE s.status
       WHEN 'Living' THEN 0
       WHEN 'Final' THEN 1
       WHEN 'Last Call' THEN 2
       WHEN 'Review' THEN 3
       ELSE 4
     END, e.eip_number DESC
     LIMIT $1`,
    limit,
  );

  const results: Array<{ number: number; saved: boolean; error?: string }> = [];
  for (const row of missing) {
    try {
      const res = await ensureProposalCuration({
        number: row.eip_number,
        repo: row.repo_name,
        title: row.title,
      });
      results.push({ number: row.eip_number, saved: res.saved });
    } catch (err) {
      results.push({
        number: row.eip_number,
        saved: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
