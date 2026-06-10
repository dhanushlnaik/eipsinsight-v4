"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Loader2,
  Save,
  Upload,
  User,
  Tag,
  Clock,
  Calendar,
  Star,
  Settings,
  ChevronRight,
  ChevronLeft,
  X,
  Globe,
  FileText,
} from "lucide-react";
import { client } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface BlogEditorProps {
  mode: "create" | "edit";
  postId?: string;
  initialData: {
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    coverImage: string | null;
    published: boolean;
    categoryId?: string | null;
    readingTimeMinutes?: number | null;
    tags?: string[];
    featured?: boolean;
    publicationDate?: string;
  };
}

type AuthorProfile = {
  linkedin: string | null;
  x: string | null;
  facebook: string | null;
  telegram: string | null;
  bio: string | null;
};

export function BlogEditor({ mode, postId, initialData }: BlogEditorProps) {
  const formatDateInput = (value?: string) => {
    if (!value) return new Date().toISOString().slice(0, 10);
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    return d.toISOString().slice(0, 10);
  };

  const [slug, setSlug] = useState(initialData.slug);
  const [title, setTitle] = useState(initialData.title);
  const [excerpt, setExcerpt] = useState(initialData.excerpt);
  const [content, setContent] = useState(initialData.content);
  const [coverImage, setCoverImage] = useState<string | null>(initialData.coverImage);
  const [published, setPublished] = useState(initialData.published);
  const [categoryId, setCategoryId] = useState<string | null>(initialData.categoryId ?? null);
  const [readingTimeMinutes, setReadingTimeMinutes] = useState<number | null>(initialData.readingTimeMinutes ?? null);
  const [tags, setTags] = useState<string[]>(initialData.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [featured, setFeatured] = useState(initialData.featured ?? false);
  const [publicationDate, setPublicationDate] = useState<string>(formatDateInput(initialData.publicationDate));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatingMeta, setGeneratingMeta] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; slug: string; name: string }>>([]);
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(null);
  const [profileForm, setProfileForm] = useState<Partial<AuthorProfile>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fieldClass =
    "w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all";
  const labelClass = "mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

  useEffect(() => {
    client.blog.listCategories().then(setCategories).catch(() => setCategories([]));
    client.blog.getMyEditorProfile().then((p) => {
      setAuthorProfile(p);
      if (p) setProfileForm(p);
    }).catch(() => {});
  }, []);

  const missingProfileFields = authorProfile
    ? (["linkedin", "x", "facebook", "telegram"] as const).filter((k) => !authorProfile[k] || authorProfile[k] === "")
    : [];

  const handleSlugFromTitle = () => {
    const s = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setSlug(s);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);
      const response = await fetch("/api/blog/upload-cover", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = (await response.json()) as { url?: string };
      if (!data.url) throw new Error("Missing URL");
      setCoverImage(data.url);
    } catch {
      setError("Upload failed. Try a smaller image.");
    } finally {
      setUploading(false);
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const handleGenerateMeta = async () => {
    setGeneratingMeta(true);
    setError(null);
    try {
      const response = await fetch("/api/blog/generate-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!response.ok) throw new Error("Failed");
      const data = (await response.json()) as { excerpt?: string; readingTimeMinutes?: number };
      if (data.excerpt) setExcerpt(data.excerpt.trim());
      if (data.readingTimeMinutes) setReadingTimeMinutes(data.readingTimeMinutes);
    } catch {
      setError("Could not auto-generate metadata.");
    } finally {
      setGeneratingMeta(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const form = profileForm ?? {};
      if (Object.keys(form).length > 0) {
        await client.blog.updateMyEditorProfile({
          linkedin: form.linkedin ?? undefined,
          x: form.x ?? undefined,
          facebook: form.facebook ?? undefined,
          telegram: form.telegram ?? undefined,
          bio: form.bio ?? undefined,
        });
      }
      const data = {
        slug,
        title,
        excerpt: excerpt || undefined,
        content,
        coverImage: coverImage ?? undefined,
        published,
        categoryId: categoryId || undefined,
        readingTimeMinutes: readingTimeMinutes ?? undefined,
        tags,
        featured,
        publicationDate: publicationDate || undefined,
      };

      if (mode === "create") {
        await client.blog.create(data);
      } else if (postId) {
        await client.blog.update({ id: postId, ...data });
      }
      window.location.href = "/admin?tab=blogs";
    } catch (err: any) {
      setError(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Link
              href="/admin?tab=blogs"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {mode === "create" ? "Drafting" : "Editing"}
              </span>
              <h1 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-md">
                {title || "Untitled Post"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !slug || !title || !content}
              className={cn(
                "inline-flex h-9 items-center gap-2 px-4 rounded-lg text-sm font-medium transition-all shadow-sm",
                "bg-foreground text-background hover:bg-foreground/90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Post"}
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted",
                sidebarOpen ? "bg-muted text-foreground" : "text-muted-foreground"
              )}
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 p-6 md:p-12">
          {error && (
            <div className="mb-8 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              <X className="h-4 w-4 shrink-0" onClick={() => setError(null)} />
              {error}
            </div>
          )}

          <div className="space-y-8">
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post Title"
              rows={1}
              className="w-full resize-none border-none bg-transparent text-4xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 sm:text-5xl"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${target.scrollHeight}px`;
              }}
            />

            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Tell your story..."
              className="text-lg leading-relaxed"
            />
          </div>
        </main>
      </div>

      {/* Sidebar Settings */}
      <aside
        className={cn(
          "z-30 h-screen border-l border-border bg-card/40 backdrop-blur-md transition-all duration-300",
          sidebarOpen ? "w-[320px]" : "w-0"
        )}
      >
        <div className={cn("flex h-full flex-col overflow-y-auto p-6", !sidebarOpen && "hidden")}>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-foreground">Post Settings</h2>
            <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Cover Image */}
            <div>
              <label className={labelClass}>Cover Image</label>
              <div className="group relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-dashed border-border bg-muted/20 transition-all hover:border-primary/50">
                {coverImage ? (
                  <>
                    <Image src={coverImage} alt="Cover" fill className="object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => setCoverImage(null)}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white shadow-lg hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 p-4 text-center">
                    <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                    <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
                      {uploading ? "Uploading..." : "Upload Cover Image"}
                    </span>
                    <input type="file" accept="image/*" onChange={handleCoverUpload} disabled={uploading} className="sr-only" />
                  </label>
                )}
              </div>
            </div>

            {/* Slug */}
            <div>
              <label className={labelClass}>URL Slug</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="post-slug"
                  className={fieldClass}
                />
                <button
                  onClick={handleSlugFromTitle}
                  title="Generate from title"
                  className="rounded-lg border border-border bg-muted/40 px-2.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Globe className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground truncate">
                <Globe className="h-3 w-3" />
                /resources/blogs/{slug || "..." }
              </p>
            </div>

            {/* Excerpt */}
            <div>
              <div className="flex items-center justify-between">
                <label className={labelClass}>Excerpt</label>
                <button
                  onClick={handleGenerateMeta}
                  disabled={generatingMeta || (!title.trim() && !content.trim())}
                  className="text-[10px] font-medium text-primary hover:underline disabled:opacity-50"
                >
                  Auto-gen
                </button>
              </div>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary..."
                rows={3}
                className={cn(fieldClass, "resize-none")}
              />
            </div>

            {/* Publication details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Category</label>
                <select
                  value={categoryId ?? ""}
                  onChange={(e) => setCategoryId(e.target.value || null)}
                  className={fieldClass}
                >
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Reading Time</label>
                <div className="relative">
                  <Clock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="number"
                    value={readingTimeMinutes ?? ""}
                    onChange={(e) => setReadingTimeMinutes(e.target.value ? parseInt(e.target.value, 10) : null)}
                    className={cn(fieldClass, "pl-8")}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Publish Date</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="date"
                  value={publicationDate}
                  onChange={(e) => setPublicationDate(e.target.value)}
                  className={cn(fieldClass, "pl-8")}
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className={labelClass}>Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-foreground border border-border">
                    {t}
                    <button onClick={() => removeTag(t)} className="text-muted-foreground hover:text-red-500">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Add tag..."
                  className={fieldClass}
                />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between group cursor-pointer">
                <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">Featured Post</span>
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded border-border bg-muted/40 text-primary focus:ring-primary/30 h-4 w-4"
                />
              </label>
              <label className="flex items-center justify-between group cursor-pointer">
                <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">Publish Locally</span>
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="rounded border-border bg-muted/40 text-primary focus:ring-primary/30 h-4 w-4"
                />
              </label>
            </div>

            {/* Author Profile Quick-Link */}
            {missingProfileFields.length > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mt-8">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 mb-1">
                  <User className="h-3.5 w-3.5" />
                  Profile Incomplete
                </div>
                <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">
                  Your author profile is missing {missingProfileFields.length} social links. Complete it to show social buttons on your posts.
                </p>
                <div className="space-y-2">
                   {missingProfileFields.includes("x") && (
                     <input
                       type="url"
                       placeholder="X (Twitter) URL"
                       className="w-full bg-background/50 border border-border rounded-md px-2 py-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                       value={profileForm.x || ""}
                       onChange={(e) => setProfileForm(p => ({ ...p, x: e.target.value }))}
                     />
                   )}
                   {missingProfileFields.includes("linkedin") && (
                     <input
                       type="url"
                       placeholder="LinkedIn URL"
                       className="w-full bg-background/50 border border-border rounded-md px-2 py-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                       value={profileForm.linkedin || ""}
                       onChange={(e) => setProfileForm(p => ({ ...p, linkedin: e.target.value }))}
                     />
                   )}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
