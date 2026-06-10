"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Search,
  ChevronRight,
  TrendingUp,
  Clock,
  User,
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
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card/40 transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
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
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {post.author.name}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {estimateReadTime(post)} min read
          </span>
        </div>
        <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-[10px] font-medium text-muted-foreground">
            {new Date(post.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1 text-xs font-bold text-primary opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
            Read More <ChevronRight className="h-3 w-3" />
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

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((post) => {
      const slug = post.category?.slug;
      if (!slug) return;
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    });
    return counts;
  }, [posts]);

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
      {/* Hero Section */}
      <section className="relative border-b border-border bg-card/40 py-12 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="page-shell relative z-10">
          <Link
            href="/resources"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Resources
          </Link>

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
              Insights & Commentary
            </span>
            <h1 className="mt-6 dec-title text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              EIPsInsight <span className="text-primary">Blog</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              In-depth analysis of Ethereum standards, protocol evolution, and the future of decentralized coordination.
            </p>
          </div>
        </div>
      </section>

      <div className="page-shell py-12">
        {/* Toolbar */}
        <div className="sticky top-20 z-30 mb-12 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/resources/blogs"
              className={cn(
                "inline-flex h-9 items-center rounded-full border px-4 text-xs font-bold transition-all",
                !categorySlug
                  ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "border-border bg-card/60 text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
            >
              All Categories
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/resources/blogs?category=${cat.slug}`}
                className={cn(
                  "inline-flex h-9 items-center rounded-full border px-4 text-xs font-bold transition-all",
                  categorySlug === cat.slug
                    ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "border-border bg-card/60 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                )}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-card/60 pl-10 pr-4 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="h-10 rounded-xl border border-border bg-card/60 px-3 text-xs font-bold focus:outline-none"
            >
              <option value="newest">Newest</option>
              <option value="featured">Featured First</option>
              <option value="oldest">Oldest</option>
            </select>
            {isAdmin && (
              <Link
                href="/admin/blogs/new"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Write
              </Link>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[16/14] animate-pulse rounded-2xl bg-muted/20" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 rounded-full bg-muted/20 p-6">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold">No results found</h2>
            <p className="mt-2 text-muted-foreground">Try adjusting your search or category filters.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                window.history.pushState({}, "", "/resources/blogs");
              }}
              className="mt-6 text-sm font-bold text-primary hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Featured Post */}
            {!searchQuery && !categorySlug && leadPost && (
              <section>
                <Link
                  href={`/resources/blogs/${leadPost.slug}`}
                  className="group relative grid grid-cols-1 overflow-hidden rounded-3xl border border-border bg-card/40 lg:grid-cols-12 transition-all hover:border-primary/50 hover:shadow-2xl"
                >
                  <div className="relative aspect-video w-full lg:col-span-7 lg:aspect-auto">
                    {leadPost.coverImage ? (
                      <Image
                        src={leadPost.coverImage}
                        alt={leadPost.title}
                        fill
                        priority
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <FileText className="h-20 w-20 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-r from-black/60 via-transparent to-transparent lg:hidden" />
                  </div>
                  <div className="flex flex-col justify-center p-8 lg:col-span-5 lg:p-12">
                    <div className="mb-6 flex items-center gap-3">
                      <span className="inline-flex rounded-full bg-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                        Featured Story
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {estimateReadTime(leadPost)} min read
                      </span>
                    </div>
                    <h2 className="mb-4 text-3xl font-bold leading-tight text-foreground lg:text-5xl group-hover:text-primary transition-colors">
                      {leadPost.title}
                    </h2>
                    <p className="mb-8 text-lg leading-relaxed text-muted-foreground line-clamp-3">
                      {leadPost.excerpt}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full border border-border">
                        {leadPost.author.image ? (
                          <Image src={leadPost.author.image} alt={leadPost.author.name} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted text-xs font-bold">
                            {leadPost.author.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">{leadPost.author.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(leadPost.createdAt).toLocaleDateString(undefined, {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </section>
            )}

            {/* Grid Posts */}
            <section className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {remainingPosts.map((post) => (
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
