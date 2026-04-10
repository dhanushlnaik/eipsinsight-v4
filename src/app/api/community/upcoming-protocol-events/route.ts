import { NextResponse } from "next/server";

export const revalidate = 300;

type EventType = "Execution" | "Consensus" | "Testing" | "Protocol";

function parseMeetingDate(raw: string): Date | null {
  const monthPattern =
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/i;
  const isoPattern = /\b(\d{4})-(\d{2})-(\d{2})\b/;
  const monthMatch = raw.match(monthPattern);
  if (monthMatch) {
    const d = new Date(`${monthMatch[1]} ${monthMatch[2]}, ${monthMatch[3]} UTC`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const isoMatch = raw.match(isoPattern);
  if (isoMatch) {
    const d = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function parseTimeLabel(raw: string) {
  const match = raw.match(/\b(\d{1,2}:\d{2})\s*(UTC|GMT)\b/i);
  if (!match) return "Agenda open";
  return `${match[1]} ${match[2].toUpperCase()}`;
}

function resolveType(title: string): EventType {
  const t = title.toLowerCase();
  if (t.includes("acde") || t.includes("execution")) return "Execution";
  if (t.includes("acdc") || t.includes("consensus")) return "Consensus";
  if (t.includes("acdt") || t.includes("testing")) return "Testing";
  return "Protocol";
}

export async function GET() {
  try {
    const res = await fetch("https://api.github.com/repos/ethereum/pm/issues?state=open&per_page=40&sort=updated&direction=desc", {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "eipsinsight-v4",
      },
      next: { revalidate },
    });
    if (!res.ok) {
      return NextResponse.json({ events: [], syncedAt: new Date().toISOString() }, { status: 200 });
    }

    const data: Array<{
      number: number;
      title: string;
      body: string | null;
      html_url: string;
      updated_at: string;
      pull_request?: unknown;
    }> = await res.json();

    const now = new Date();
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const events = data
      .filter((row) => !row.pull_request)
      .filter((row) => /(acd|all core devs|protocol|breakout|interop|allwalletdevs|eipip)/i.test(row.title))
      .map((row) => {
        const combined = `${row.title}\n${row.body ?? ""}`;
        const parsedDate = parseMeetingDate(combined);
        const sortTs = parsedDate?.getTime() ?? new Date(row.updated_at).getTime();
        return {
          id: row.number,
          title: row.title,
          date: parsedDate
            ? parsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "TBD",
          time: parseTimeLabel(combined),
          url: row.html_url,
          type: resolveType(row.title),
          sortTs,
          hasFutureDate: parsedDate ? parsedDate.getTime() >= todayUtc.getTime() : false,
        };
      })
      .filter((item) => item.hasFutureDate || item.date === "TBD")
      .sort((a, b) => a.sortTs - b.sortTs)
      .slice(0, 6)
      .map(({ hasFutureDate: _drop, ...rest }) => rest);

    return NextResponse.json({ events, syncedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ events: [], syncedAt: new Date().toISOString() }, { status: 200 });
  }
}

