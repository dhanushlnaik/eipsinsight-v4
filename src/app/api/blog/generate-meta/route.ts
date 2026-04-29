import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { env } from "@/env";

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function estimateReadingTimeMinutes(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function fallbackExcerpt(title: string, content: string): string {
  const plain = stripMarkdown(content);
  if (!plain) return title.slice(0, 160);
  return plain.slice(0, 200).trim();
}

async function requireEditor(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || (user.role !== "admin" && user.role !== "editor")) return null;
  return session.user;
}

export async function POST(request: Request) {
  const user = await requireEditor(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as { title?: string; content?: string };
    const title = (body.title ?? "").trim();
    const content = (body.content ?? "").trim();

    if (!title && !content) {
      return NextResponse.json({ excerpt: "", readingTimeMinutes: 1, source: "fallback" });
    }

    const plain = stripMarkdown(content);
    const readingTimeMinutes = estimateReadingTimeMinutes(`${title} ${plain}`);

    if (!env.COHERE_API_KEY) {
      return NextResponse.json({
        excerpt: fallbackExcerpt(title, content),
        readingTimeMinutes,
        source: "fallback",
      });
    }

    const prompt = `Generate a concise blog excerpt (max 180 chars) for this title/content.
Return JSON only with key "excerpt".
Title: ${title}
Content: ${plain.slice(0, 4000)}`;

    const response = await fetch("https://api.cohere.ai/v1/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.COHERE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "command-r-plus",
        message: prompt,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({
        excerpt: fallbackExcerpt(title, content),
        readingTimeMinutes,
        source: "fallback",
      });
    }

    const data = (await response.json()) as { text?: string };
    const text = data.text ?? "";
    let excerpt = fallbackExcerpt(title, content);
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]) as { excerpt?: string };
        if (parsed.excerpt?.trim()) excerpt = parsed.excerpt.trim().slice(0, 220);
      } catch {}
    }

    return NextResponse.json({ excerpt, readingTimeMinutes, source: "cohere" });
  } catch (error) {
    console.error("generate-meta route error:", error);
    return NextResponse.json({ error: "Failed to generate metadata" }, { status: 500 });
  }
}

