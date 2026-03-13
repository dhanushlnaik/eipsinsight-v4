import { NextResponse } from 'next/server';
import { getGhostClient } from '@/lib/ghost';
import { getUpgradeGhostFilter, type UpgradeArticle } from '@/lib/upgrade-articles';

export const revalidate = 1800;

interface GhostTag {
  slug?: string;
}

interface GhostPost {
  title?: string;
  excerpt?: string | null;
  plaintext?: string | null;
  url?: string;
  feature_image?: string | null;
  published_at?: string | null;
  tags?: GhostTag[];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const client = getGhostClient();

  if (!client) {
    return NextResponse.json<UpgradeArticle[]>([]);
  }

  try {
    const posts = (await client.posts.browse({
      limit: 12,
      include: 'tags,authors',
      order: 'published_at DESC',
      filter: getUpgradeGhostFilter(slug),
    })) as GhostPost[];

    const seenLinks = new Set<string>();
    const articles = posts
      .filter((post) => Boolean(post.url && post.title))
      .filter((post) => {
        const link = post.url!;
        if (seenLinks.has(link)) return false;
        seenLinks.add(link);
        return true;
      })
      .map((post) => ({
        image: post.feature_image ?? '',
        title: post.title ?? '',
        content: post.excerpt ?? post.plaintext?.slice(0, 180) ?? '',
        link: post.url ?? '#',
        publishedAt: post.published_at ?? new Date().toISOString(),
      }));

    return NextResponse.json<UpgradeArticle[]>(articles);
  } catch (error) {
    console.error('Upgrade Ghost fetch failed:', error);
    return NextResponse.json<UpgradeArticle[]>([]);
  }
}
