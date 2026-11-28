import { NextRequest, NextResponse } from 'next/server';
import { getGhostClient } from '@/lib/ghost';
import { prisma } from '@/lib/prisma';
import { env } from '@/env';

interface ResourceArticle {
  title: string;
  url: string;
  excerpt: string;
  publishedAt: string;
  featureImage?: string | null;
  readingTime?: number | null;
  authorName?: string | null;
  tags?: string[];
  source: 'etherworld';
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

function extractJsonArray(text: string): unknown[] {
  const trimmed = text.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return JSON.parse(trimmed);
  }
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start >= 0 && end > start) {
    return JSON.parse(text.slice(start, end + 1));
  }
  return [];
}

function buildSearchUrl(kind: AiResourceRecommendation['kind'], query: string, eipNumber: number): string {
  if (kind === 'discussion') {
    return `https://ethereum-magicians.org/search?q=${encodeURIComponent(query)}`;
  }
  if (kind === 'video') {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  }
  if (kind === 'audio') {
    return `https://www.google.com/search?q=${encodeURIComponent(`${query} podcast`)}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(query || `EIP-${eipNumber} Ethereum`)}`;
}

function decodeDuckDuckGoRedirect(url: string): string {
  if (!url.startsWith('/l/?')) return url;
  try {
    const query = new URLSearchParams(url.split('?')[1] ?? '');
    const target = query.get('uddg');
    return target ? decodeURIComponent(target) : url;
  } catch {
    return url;
  }
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchDuckDuckGoResults(query: string, limit = 5): Promise<LiveSearchResult[]> {
  try {
    const response = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EIPsInsightBot/1.0; +https://eipsinsight.com)',
      },
    });
    if (!response.ok) return [];
    const html = await response.text();

    const blocks = html.match(/<div class="result(?:.|\n)*?<\/div>\s*<\/div>/g) ?? [];
    const parsed = blocks
      .map((block) => {
        const titleMatch = block.match(/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
        if (!titleMatch) return null;
        const snippetMatch = block.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i)
          || block.match(/<div[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/div>/i);
        const url = decodeDuckDuckGoRedirect(titleMatch[1]);
        return {
          title: stripHtml(titleMatch[2]),
          url,
          snippet: stripHtml(snippetMatch?.[1] ?? ''),
        };
      })
      .filter((item): item is LiveSearchResult => Boolean(item && item.url && item.title))
      .filter((item) => /^https?:\/\//.test(item.url))
      .slice(0, limit);

    return parsed;
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const number = Number(body?.number);
    const title = String(body?.title ?? '');
    const repoPrefix = String(body?.repo ?? 'eip').toLowerCase().replace(/s$/, '');
    if (!Number.isFinite(number)) {
      return NextResponse.json({ error: 'Invalid proposal number' }, { status: 400 });
    }

    const eipLabel = `${repoPrefix}-${number}`.toLowerCase();
    const altLabel = `eip-${number}`.toLowerCase();
    const titleTerms = title
      .toLowerCase()
      .split(/\s+/)
      .filter((term: string) => term.length > 3)
      .slice(0, 5);

    const ghostClient = getGhostClient();
    let articles: ResourceArticle[] = [];
    if (ghostClient) {
      type GhostPost = {
        id?: string;
        title?: string;
        excerpt?: string | null;
        custom_excerpt?: string | null;
        plaintext?: string | null;
        url?: string;
        published_at?: string | null;
        feature_image?: string | null;
        reading_time?: number | null;
        authors?: Array<{ name?: string }>;
        tags?: Array<{ slug?: string; name?: string }>;
      };

      const [taggedRes, recentRes] = await Promise.allSettled([
        ghostClient.posts.browse({
          filter: `tag:${eipLabel},tag:${altLabel}`,
          limit: 20,
          include: 'tags,authors',
          order: 'published_at DESC',
        }) as Promise<GhostPost[]>,
        ghostClient.posts.browse({
          limit: 80,
          include: 'tags,authors',
          order: 'published_at DESC',
        }) as Promise<GhostPost[]>,
      ]);

      const mergedMap = new Map<string, GhostPost>();
      for (const res of [taggedRes, recentRes]) {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          for (const post of res.value) {
            const key = post.id || post.url;
            if (key && !mergedMap.has(key)) {
              mergedMap.set(key, post);
            }
          }
        }
      }

      const posts = Array.from(mergedMap.values());

      const scoreText = (text: string, hasTagMatch: boolean) => {
        const value = text.toLowerCase();
        let score = hasTagMatch ? 10 : 0;
        if (value.includes(eipLabel) || value.includes(altLabel)) score += 6;
        titleTerms.forEach((term) => {
          if (value.includes(term)) score += 1;
        });
        return score;
      };

      articles = posts
        .map((post) => {
          const tagSlugs = (post.tags || []).map((t) => (t.slug || t.name || '').toLowerCase());
          const hasTagMatch = tagSlugs.some((t) => t === eipLabel || t === altLabel);
          const tagText = tagSlugs.join(' ');
          const haystack = [post.title, post.custom_excerpt, post.excerpt, post.plaintext, tagText]
            .filter(Boolean)
            .join(' ');
          const normalizedHaystack = haystack.toLowerCase();
          const hasDirectEip = hasTagMatch || normalizedHaystack.includes(eipLabel) || normalizedHaystack.includes(altLabel);
          const matchedTerms = titleTerms.reduce((count, term) => (normalizedHaystack.includes(term) ? count + 1 : count), 0);
          const score = scoreText(haystack, hasTagMatch);
          return { post, score, hasDirectEip, matchedTerms };
        })
        .filter((item) => (item.hasDirectEip || item.matchedTerms >= 2) && item.score > 0 && item.post.url && item.post.title)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((item) => ({
          title: item.post.title || '',
          url: item.post.url || '#',
          excerpt: item.post.custom_excerpt || item.post.excerpt || item.post.plaintext?.slice(0, 180) || '',
          publishedAt: item.post.published_at || '',
          featureImage: item.post.feature_image ?? null,
          readingTime: item.post.reading_time ?? null,
          authorName: item.post.authors?.[0]?.name ?? 'EtherWorld',
          tags: (item.post.tags || [])
            .map((t) => t.name)
            .filter((n): n is string => Boolean(n && !n.startsWith('#')))
            .slice(0, 3),
          source: 'etherworld' as const,
        }));
    }

    const videosRaw = await prisma.video.findMany({
      where: { published: true },
      orderBy: { displayOrder: 'asc' },
      take: 60,
      select: {
        title: true,
        description: true,
        youtubeUrl: true,
        tags: true,
      },
    });

    const scoreVideo = (video: { title: string; description: string | null; tags: string[] }) => {
      const text = `${video.title} ${video.description || ''} ${video.tags.join(' ')}`.toLowerCase();
      let score = text.includes(eipLabel) ? 6 : 0;
      titleTerms.forEach((term) => {
        if (text.includes(term)) score += 1;
      });
      return score;
    };

    const videos: ResourceVideo[] = videosRaw
      .map((video) => ({ video, score: scoreVideo(video) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((item) => ({
        title: item.video.title,
        url: item.video.youtubeUrl,
        description: item.video.description || '',
      }));

    let aiRecommendations: AiResourceRecommendation[] = [];
    if (env.COHERE_API_KEY) {
      try {
        const response = await fetch('https://api.cohere.ai/v1/chat', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.COHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'command-a-03-2025',
            temperature: 0.3,
            message: `Create 4 educational resource recommendations for EIP-${number} (${title}).
Return ONLY JSON array with objects:
[{ "kind": "text|audio|video|discussion", "label": "short title", "query": "search query", "reason": "one short reason" }]
Keep each label under 6 words.
`,
          }),
        });
        const data = (await response.json()) as { text?: string };
        if (response.ok && data.text) {
          const parsed = extractJsonArray(data.text) as Array<{
            kind?: string;
            label?: string;
            query?: string;
            reason?: string;
          }>;
          aiRecommendations = parsed
            .filter((item) => Boolean(item.kind && item.label))
            .slice(0, 4)
            .map((item) => {
              const kind = (item.kind === 'audio' || item.kind === 'video' || item.kind === 'discussion' || item.kind === 'text')
                ? item.kind
                : 'text';
              const query = item.query?.trim() || `EIP-${number} ${title}`;
              return {
                kind,
                label: item.label!.trim(),
                url: buildSearchUrl(kind, query, number),
                reason: item.reason?.trim() || 'AI-suggested learning entry point.',
              };
            });
        }
      } catch {
        aiRecommendations = [];
      }
    }

    if (aiRecommendations.length === 0) {
      aiRecommendations = [
        {
          kind: 'text',
          label: 'Technical writeups',
          url: buildSearchUrl('text', `EIP-${number} ${title} technical analysis`, number),
          reason: 'Deep dives from research and dev blogs.',
        },
        {
          kind: 'discussion',
          label: 'Community threads',
          url: buildSearchUrl('discussion', `EIP-${number}`, number),
          reason: 'Active discussions and implementation tradeoffs.',
        },
        {
          kind: 'video',
          label: 'Talks and explainers',
          url: buildSearchUrl('video', `EIP-${number} ${title}`, number),
          reason: 'Conference talks and explainer videos.',
        },
        {
          kind: 'audio',
          label: 'Podcast coverage',
          url: buildSearchUrl('audio', `EIP-${number} Ethereum`, number),
          reason: 'Long-form interviews and commentary.',
        },
      ];
    }

    const webSuggestions = await fetchDuckDuckGoResults(`EIP-${number} ${title} Ethereum`, 5);
    const videoSuggestions = await fetchDuckDuckGoResults(`site:youtube.com EIP-${number} ${title}`, 5);

    return NextResponse.json({
      articles,
      videos,
      aiRecommendations,
      webSuggestions,
      videoSuggestions,
    });
  } catch (error) {
    console.error('proposal-resources error', error);
    return NextResponse.json(
      { articles: [], videos: [], aiRecommendations: [], webSuggestions: [], videoSuggestions: [] },
      { status: 200 }
    );
  }
}
