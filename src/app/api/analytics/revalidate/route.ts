import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * Route handler for on-demand cache invalidation of analytics data
 * 
 * Usage:
 * POST /api/analytics/revalidate?tag=analytics-eips-hero
 * POST /api/analytics/revalidate?tag=analytics-prs-monthly
 * POST /api/analytics/revalidate (invalidates all analytics tags)
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');

    if (tag) {
      // Invalidate specific tag
      revalidateTag(tag, 'max');
      return NextResponse.json({ 
        revalidated: true, 
        tag,
        message: `Cache invalidated for tag: ${tag}` 
      });
    } else {
      // Invalidate all analytics tags
      const analyticsTags = [
        'analytics-eips-hero',
        'analytics-eips-lifecycle',
        'analytics-eips-composition',
        'analytics-eips-transitions',
        'analytics-eips-throughput',
        'analytics-prs-monthly',
        'analytics-prs-governance',
        'analytics-prs-staleness',
        'analytics-prs-time-to-outcome',
        'analytics-contributors-kpis',
        'analytics-contributors-activity-type',
        'analytics-contributors-activity-repo',
        'analytics-editors-leaderboard',
        'analytics-reviewers-leaderboard',
        'analytics-editors-by-category',
        'analytics-editors-repo-distribution',
        'analytics-reviewers-repo-distribution',
      ];

      analyticsTags.forEach(t => revalidateTag(t, 'max'));

      return NextResponse.json({ 
        revalidated: true, 
        tags: analyticsTags,
        message: `Cache invalidated for all analytics tags` 
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Error revalidating cache', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
