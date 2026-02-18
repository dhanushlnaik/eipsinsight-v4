# News Feature — Ghost CMS Integration

Implementation guide for powering `/resources/news` with content from Ghost (e.g. EtherWorld at `https://etherworld.co`).

---

## Overview

| Item | Value |
|------|-------|
| **Source** | Ghost Content API |
| **Target** | `/resources/news` |
| **Env vars** | `GHOST_API_URL`, `GHOST_CONTENT_API_KEY` |
| **Package** | `@tryghost/content-api` |

---

## 1. Setup

### 1.1 Install the Ghost Content API client

```bash
npm install @tryghost/content-api
```

### 1.2 Environment variables

Ensure these are in `.env` and `env.ts`:

```
GHOST_API_URL=https://etherworld.co
GHOST_CONTENT_API_KEY=your-content-api-key
```

**Getting the Content API key:**

1. Log in to Ghost Admin (e.g. `https://etherworld.co/ghost`)
2. Go to **Settings → Integrations**
3. Create a **Custom Integration**
4. Copy the **Content API key** (hex string)

---

## 2. Ghost API client

### 2.1 Create a shared client

**File:** `src/lib/ghost.ts`

```ts
import GhostContentAPI from "@tryghost/content-api";
import { env } from "@/env";

let api: InstanceType<typeof GhostContentAPI> | null = null;

export function getGhostClient() {
  if (!env.GHOST_API_URL || !env.GHOST_CONTENT_API_KEY) {
    return null;
  }
  if (!api) {
    api = new GhostContentAPI({
      url: env.GHOST_API_URL,
      key: env.GHOST_CONTENT_API_KEY,
      version: "v5.0",
    });
  }
  return api;
}
```

### 2.2 Update `env.ts`

Add to server schema (if not already present):

```ts
GHOST_API_URL: z.string().url().optional(),
GHOST_CONTENT_API_KEY: z.string().optional(),
```

---

## 3. Fetching posts

### 3.1 Browse posts (list)

```ts
const client = getGhostClient();
if (!client) return [];

const posts = await client.posts.browse({
  limit: 20,
  page: 1,
  include: "tags,authors",
  order: "published_at DESC",
  filter: "tag:eips",  // optional: filter by tag
});
```

### 3.2 Read single post by slug

```ts
const post = await client.posts.read(
  { slug: "ethereum-fusaka-devnet-0-coming-soon" },
  { formats: ["html", "plaintext"] }
);
```

### 3.3 Post object shape

```ts
interface GhostPost {
  id: string;
  uuid: string;
  title: string;
  slug: string;
  html: string;
  plaintext?: string;
  feature_image: string | null;
  featured: boolean;
  created_at: string;
  updated_at: string;
  published_at: string;
  excerpt: string | null;
  custom_excerpt: string | null;
  reading_time: number;
  tags: Array<{ id: string; name: string; slug: string }>;
  authors: Array<{ id: string; name: string; slug: string; profile_image?: string }>;
  url: string;
}
```

---

## 4. Implementation options

### Option A: Server Component + fetch (recommended)

Fetch in a Server Component and pass to client for interactivity if needed.

**File:** `src/app/resources/news/page.tsx`

```tsx
import { getGhostClient } from "@/lib/ghost";
import { NewsList } from "./_components/news-list";

export default async function NewsPage() {
  const client = getGhostClient();
  let posts: Awaited<ReturnType<typeof client.posts.browse>> = [];

  if (client) {
    try {
      posts = await client.posts.browse({
        limit: 30,
        include: "tags,authors",
        order: "published_at DESC",
      });
    } catch (err) {
      console.error("Ghost API error:", err);
    }
  }

  return (
    <div className="min-h-screen ...">
      <section>...</section>
      <NewsList posts={posts} />
    </div>
  );
}
```

### Option B: oRPC procedure

Expose Ghost posts via oRPC for client-side fetching and caching.

**File:** `src/server/orpc/procedures/news.ts`

```ts
import { os, type Ctx } from "./types";
import { getGhostClient } from "@/lib/ghost";
import * as z from "zod";

export const newsProcedures = {
  list: os
    .$context<Ctx>()
    .input(
      z.object({
        limit: z.number().min(1).max(50).optional().default(20),
        page: z.number().min(1).optional().default(1),
        tag: z.string().optional(),
      })
    )
    .handler(async ({ input }) => {
      const client = getGhostClient();
      if (!client) return { posts: [], meta: null };

      const filter = input.tag ? `tag:${input.tag}` : undefined;
      const result = await client.posts.browse({
        limit: input.limit,
        page: input.page,
        include: "tags,authors",
        order: "published_at DESC",
        filter,
      });

      const meta = (result as { meta?: { pagination?: object } }).meta;
      return { posts: result, meta: meta?.pagination ?? null };
    }),

  getBySlug: os
    .$context<Ctx>()
    .input(z.object({ slug: z.string() }))
    .handler(async ({ input }) => {
      const client = getGhostClient();
      if (!client) return null;

      return client.posts.read(
        { slug: input.slug },
        { formats: ["html", "plaintext"] }
      );
    }),
};
```

### Option C: Route handler (API route)

**File:** `src/app/api/news/route.ts`

```ts
import { NextResponse } from "next/server";
import { getGhostClient } from "@/lib/ghost";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);

  const client = getGhostClient();
  if (!client) {
    return NextResponse.json({ posts: [], meta: null }, { status: 200 });
  }

  try {
    const posts = await client.posts.browse({
      limit,
      page,
      include: "tags,authors",
      order: "published_at DESC",
    });
    const meta = (posts as { meta?: object }).meta;
    return NextResponse.json({ posts, meta });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
```

---

## 5. Filtering for EIP ecosystem content

Use Ghost tags to surface only EIP-related posts.

### 5.1 Suggested tags (create in Ghost)

- `eips` — EIP-related
- `ethereum-upgrades` — Network upgrades
- `governance` — Governance news

### 5.2 Filter by tag

```ts
// Only posts with tag "eips"
filter: "tag:eips"

// Exclude a tag
filter: "tag:-fables"

// Multiple tags (OR)
filter: "tag:[eips,ethereum-upgrades,governance]"

// Primary author
filter: "primary_author:author-slug"
```

### 5.3 Date filter

```ts
// Posts after a date
filter: "published_at:>'2024-01-01'"
```

---

## 6. Caching

Ghost Content API is public and rate-limited. Cache responses to reduce calls.

### 6.1 Next.js `fetch` cache

```ts
const res = await fetch(
  `${env.GHOST_API_URL}/ghost/api/content/posts/?key=${env.GHOST_CONTENT_API_KEY}&limit=20`,
  { next: { revalidate: 3600 } }  // 1 hour
);
```

### 6.2 Unstable_cache (for non-fetch)

```ts
import { unstable_cache } from "next/cache";

const getCachedPosts = unstable_cache(
  async () => {
    const client = getGhostClient();
    if (!client) return [];
    return client.posts.browse({ limit: 20, include: "tags,authors" });
  },
  ["ghost-news"],
  { revalidate: 3600 }
);
```

---

## 7. UI components

### 7.1 News card

```tsx
interface NewsCardProps {
  post: {
    title: string;
    slug: string;
    excerpt: string | null;
    feature_image: string | null;
    published_at: string;
    authors?: Array<{ name: string }>;
    url?: string;
  };
}

export function NewsCard({ post }: NewsCardProps) {
  const link = post.url ?? `https://etherworld.co/${post.slug}/`;
  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className="...">
      {post.feature_image && <img src={post.feature_image} alt="" />}
      <h3>{post.title}</h3>
      {post.excerpt && <p>{post.excerpt}</p>}
      <span>{new Date(post.published_at).toLocaleDateString()}</span>
      {post.authors?.[0] && <span>{post.authors[0].name}</span>}
    </a>
  );
}
```

### 7.2 Individual post page (optional)

If you want `/resources/news/[slug]` to render Ghost content on your site:

```tsx
// src/app/resources/news/[slug]/page.tsx
export default async function NewsPostPage({ params }: { params: { slug: string } }) {
  const client = getGhostClient();
  if (!client) notFound();

  const post = await client.posts.read(
    { slug: params.slug },
    { formats: ["html"] }
  );

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.html }} />
    </article>
  );
}
```

Or **redirect** to the source site:

```ts
redirect(post.url ?? `https://etherworld.co/${post.slug}/`);
```

---

## 8. Error handling

```ts
try {
  const posts = await client.posts.browse({ limit: 20 });
  return posts;
} catch (err) {
  if (err instanceof Error) {
    if (err.message.includes("404")) return [];
    if (err.message.includes("429")) {
      // Rate limited — use cached/fallback data
    }
  }
  throw err;
}
```

---

## 9. Checklist

- [ ] Install `@tryghost/content-api`
- [ ] Add `GHOST_API_URL`, `GHOST_CONTENT_API_KEY` to `env.ts`
- [ ] Create `src/lib/ghost.ts` client
- [ ] Implement fetch (Server Component, oRPC, or API route)
- [ ] Add caching (e.g. `revalidate: 3600`)
- [ ] Build `NewsList` / `NewsCard` components
- [ ] Replace placeholder in `src/app/resources/news/page.tsx`
- [ ] (Optional) Add `/resources/news/[slug]` for single post
- [ ] (Optional) Filter by tag for EIP-specific content

---

## 10. Reference

- [Ghost Content API (JavaScript)](https://ghost.org/docs/content-api/javascript/)
- [Posts endpoint](https://ghost.org/docs/content-api/#posts)
- [Filtering (NQL)](https://ghost.org/docs/content-api/#filtering)
