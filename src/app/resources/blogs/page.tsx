"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Plus,
  Search,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { client } from "@/lib/orpc";
import { cn } from "@/lib/utils";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  published: boolean;
  createdAt: Date | string;
  featured?: boolean;
  category?: { id: string; slug: string; name: string } | null;
  author: { id: string; name: string; image: string | null };
};

type BlogCategory = { id: string; slug: string; name: string };
type SortMode = "newest" | "featured" | "oldest";

function estimateReadTime(post: Pick<BlogPost, "title" | "excerpt">) {
  const wordCount = `${post.title} ${post.excerpt ?? ""}`
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(3, Math.ceil(wordCount / 225)); // Standard reading speed
}

function BlogCard({ post, priority = false }: { post: BlogPost; priority?: boolean }) {
  return (
    <Link
      href={`/resources/blogs/${post.slug}`}
      className="group relative flex flex-col transition-all duration-300"
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            priority={priority}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-muted/50 to-muted">
            <FileText className="h-10 w-10 text-muted-foreground/50" />
          </div>
        )}
        {post.category && (
          <div className="absolute left-4 top-4">
            <span className="inline-flex rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
              {post.category.name}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col pt-5">
        <div className="mb-3 flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <span>{post.author.name}</span>
          <span className="opacity-30">•</span>
          <span>{estimateReadTime(post)} min read</span>
        </div>
        <h3 className="mb-3 line-clamp-2 text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            {new Date(post.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
            Read Story <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function BlogsContent() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category");

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      client.blog.list({
        publishedOnly: true,
        limit: 100,
      }),
      client.account
        .getMe()
        .then((u) => u.role === "admin" || u.role === "editor")
        .catch(() => false),
      client.blog.listCategories(),
    ])
      .then(([res, canManage, cats]) => {
        if (cancelled) return;
        setPosts(res.posts);
        setIsAdmin(canManage);
        setCategories(cats);
      })
      .catch(() => {
        if (!cancelled) setPosts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPosts = useMemo(() => {
    let result = categorySlug
      ? posts.filter((post) => post.category?.slug === categorySlug)
      : posts;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.excerpt && p.excerpt.toLowerCase().includes(q))
      );
    }

    const sorted = [...result];
    sorted.sort((a, b) => {
      if (sortMode === "featured") {
        const featuredDelta = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
        if (featuredDelta !== 0) return featuredDelta;
      }
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortMode === "oldest" ? aTime - bTime : bTime - aTime;
    });
    return sorted;
  }, [posts, categorySlug, sortMode, searchQuery]);

  const featuredPosts = useMemo(
    () => filteredPosts.filter((post) => post.featured),
    [filteredPosts]
  );

  const leadPost = featuredPosts[0] || filteredPosts[0];
  const remainingPosts = filteredPosts.filter(p => p.id !== leadPost?.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Featured/Hero Section */}
      <section className="relative border-b border-border bg-card/20 py-12 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="page-shell relative z-10">
          <Link
            href="/resources"
            className="mb-12 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Hub
          </Link>

          {!searchQuery && !categorySlug && leadPost ? (
            <Link
              href={`/resources/blogs/${leadPost.slug}`}
              className="group relative grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center"
            >
              <div className="flex flex-col">
                <div className="mb-6 flex items-center gap-3">
                  <span className="inline-flex rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                    Featured Story
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {estimateReadTime(leadPost)} min read
                  </span>
                </div>
                <h1 className="mb-6 font-libre-baskerville text-4xl font-bold leading-[1.1] text-foreground transition-colors group-hover:text-primary lg:text-6xl xl:text-7xl">
                  {leadPost.title}
                </h1>
                <p className="mb-10 line-clamp-3 text-lg leading-relaxed text-muted-foreground lg:text-xl">
                  {leadPost.excerpt}
                </p>
                <div className="flex items-center gap-4">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full border border-border">
                    {leadPost.author.image ? (
                      <Image src={leadPost.author.image} alt={leadPost.author.name} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted text-sm font-bold">
                        {leadPost.author.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">{leadPost.author.name}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {new Date(leadPost.createdAt).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-border bg-muted shadow-2xl lg:aspect-square">
                {leadPost.coverImage ? (
                  <Image
                    src={leadPost.coverImage}
                    alt={leadPost.title}
                    fill
                    priority
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <FileText className="h-24 w-24 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </Link>
          ) : (
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
                <TrendingUp className="h-3.5 w-3.5" />
                Editorial Archive
              </span>
              <h1 className="mt-8 font-libre-baskerville text-5xl font-bold tracking-tight text-foreground lg:text-7xl">
                The <span className="text-primary">Journal</span>
              </h1>
              <p className="mt-6 text-xl leading-relaxed text-muted-foreground">
                {categorySlug 
                  ? `Exploring the latest in ${categories.find(c => c.slug === categorySlug)?.name || 'the ecosystem'}.`
                  : "In-depth analysis of Ethereum standards and decentralized coordination."}
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="page-shell py-16">
        {/* Navigation & Toolbar */}
        <div className="sticky top-20 z-30 mb-16 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between border-b border-border bg-background/80 pb-6 backdrop-blur-md">
          <nav className="flex flex-wrap items-center gap-8">
            <Link
              href="/resources/blogs"
              className={cn(
                "relative py-1 text-xs font-bold uppercase tracking-widest transition-colors",
                !categorySlug
                  ? "text-primary after:absolute after:bottom-[-25px] after:left-0 after:h-[2px] after:w-full after:bg-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All Stories
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/resources/blogs?category=${cat.slug}`}
                className={cn(
                  "relative py-1 text-xs font-bold uppercase tracking-widest transition-colors",
                  categorySlug === cat.slug
                    ? "text-primary after:absolute after:bottom-[-25px] after:left-0 after:h-[2px] after:w-full after:bg-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 lg:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search archive..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-card/60 pl-10 pr-4 text-sm transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/5"
              />
            </div>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="h-11 rounded-xl border border-border bg-card/60 px-4 text-xs font-bold uppercase tracking-widest focus:outline-none"
            >
              <option value="newest">Newest</option>
              <option value="featured">Featured</option>
              <option value="oldest">Oldest</option>
            </select>
            {isAdmin && (
              <Link
                href="/admin/blogs/new"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-xl shadow-primary/20 transition hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Write
              </Link>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[16/14] animate-pulse rounded-2xl bg-muted/20" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-8 rounded-full bg-muted/20 p-8 text-muted-foreground">
              <Search className="h-12 w-12" />
            </div>
            <h2 className="text-3xl font-bold">No stories found</h2>
            <p className="mt-4 text-lg text-muted-foreground">Try adjusting your search or category filters.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                window.history.pushState({}, "", "/resources/blogs");
              }}
              className="mt-8 text-sm font-bold uppercase tracking-widest text-primary hover:underline"
            >
              Reset Archive
            </button>
          </div>
        ) : (
          <div className="space-y-24">
            {/* Grid Posts */}
            <section className="grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
              {(!searchQuery && !categorySlug ? remainingPosts : filteredPosts).map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BlogsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <BlogsContent />
    </Suspense>
  );
}
