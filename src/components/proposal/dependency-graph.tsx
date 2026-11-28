import React from "react";
import Link from "next/link";

export interface DepNode {
  kind: string;
  number: number;
  title?: string;
}

const W = 780;
const NODE_W = 96;
const NODE_H = 30;

function colY(count: number, i: number, height: number, pad = 28): number {
  if (count <= 1) return height / 2;
  const usable = height - pad * 2;
  return pad + (usable * i) / (count - 1);
}

function repoSegment(kind: string): string {
  const k = kind.toLowerCase();
  if (k === "erc") return "ercs";
  if (k === "rip") return "rips";
  return "eips";
}

/** requires -> (this proposal) -> required-by, as a clickable SVG fan graph. */
export function DependencyGraph({
  label,
  requires,
  requiredBy,
}: {
  label: string;
  requires: DepNode[];
  requiredBy: DepNode[];
}) {
  const reqShown = requires.slice(0, 8);
  const byShown = requiredBy.slice(0, 10);
  const rows = Math.max(reqShown.length, byShown.length, 1);
  const H = Math.max(210, rows * 48 + 26);
  const hubX = W / 2;
  const hubY = H / 2;
  const leftX = 100;
  const rightX = W - 100;

  const edge = (x1: number, y1: number, x2: number, y2: number) => {
    const mx = (x1 + x2) / 2;
    return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
  };

  const nodeRect = (x: number, y: number, kind: string, num: number, incoming: boolean) => (
    <a href={`/${repoSegment(kind)}/${num}`} className="dep-node">
      <rect
        x={x - NODE_W / 2}
        y={y - NODE_H / 2}
        width={NODE_W}
        height={NODE_H}
        rx="8"
        fill={incoming ? "color-mix(in oklch, var(--brand) 7%, var(--surface))" : "var(--surface)"}
        stroke={incoming ? "color-mix(in oklch, var(--brand) 42%, var(--border))" : "var(--border-strong)"}
        strokeWidth="1.2"
      />
      <text
        x={x}
        y={y + 4.5}
        textAnchor="middle"
        fontSize="13"
        fontWeight="500"
        fontFamily="var(--font-geist-mono), monospace"
        fill={incoming ? "var(--brand-strong)" : "var(--ink)"}
      >
        {kind.toUpperCase()}-{num}
      </text>
    </a>
  );

  return (
    <>
      <div className="space-y-5 sm:hidden">
        {requires.length > 0 && (
          <div>
            <p className="eyebrow mb-2.5">Requires</p>
            <div className="flex flex-wrap gap-2">
              {requires.map((n) => (
                <Link
                  key={`mr-${n.kind}-${n.number}`}
                  href={`/${repoSegment(n.kind)}/${n.number}`}
                  className="rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 font-mono text-xs text-[var(--ink)] transition-colors hover:border-[var(--ink)]"
                >
                  {n.kind.toUpperCase()}-{n.number}
                </Link>
              ))}
            </div>
          </div>
        )}
        {requiredBy.length > 0 && (
          <div>
            <p className="eyebrow mb-2.5">Required by</p>
            <div className="flex flex-wrap gap-2">
              {requiredBy.map((n) => (
                <Link
                  key={`mb-${n.kind}-${n.number}`}
                  href={`/${repoSegment(n.kind)}/${n.number}`}
                  className="rounded-md border border-[var(--brand)]/40 bg-[var(--brand-soft)] px-2.5 py-1.5 font-mono text-xs text-[var(--brand-strong)] transition-colors hover:border-[var(--brand-strong)]"
                >
                  {n.kind.toUpperCase()}-{n.number}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[640px]" style={{ height: H * 0.62 }} role="img" aria-label="Dependency graph">
          {reqShown.map((_, i) => (
            <path
              key={`re-${i}`}
              d={edge(leftX + NODE_W / 2, colY(reqShown.length, i, H), hubX - 78, hubY)}
              fill="none"
              stroke="var(--border-strong)"
              strokeWidth="1.4"
            />
          ))}
          {byShown.map((_, i) => (
            <path
              key={`be-${i}`}
              d={edge(hubX + 78, hubY, rightX - NODE_W / 2, colY(byShown.length, i, H))}
              fill="none"
              stroke="color-mix(in oklch, var(--brand) 50%, transparent)"
              strokeWidth="1.4"
            />
          ))}

          {reqShown.map((n, i) => (
            <g key={`rn-${i}`}>{nodeRect(leftX, colY(reqShown.length, i, H), n.kind, n.number, false)}</g>
          ))}

          <rect x={hubX - 78} y={hubY - 22} width="156" height="44" rx="11" fill="var(--brand)" />
          <text
            x={hubX}
            y={hubY + 5}
            textAnchor="middle"
            fontSize="14.5"
            fontWeight="600"
            fontFamily="var(--font-geist-mono), monospace"
            fill="var(--brand-ink)"
          >
            {label}
          </text>

          {byShown.map((n, i) => (
            <g key={`bn-${i}`}>{nodeRect(rightX, colY(byShown.length, i, H), n.kind, n.number, true)}</g>
          ))}

          <text x={leftX} y={16} textAnchor="middle" fontSize="10" fontWeight="500" letterSpacing="1.4" fontFamily="var(--font-geist-mono), monospace" fill="var(--ink-faint)">
            REQUIRES
          </text>
          <text x={rightX} y={16} textAnchor="middle" fontSize="10" fontWeight="500" letterSpacing="1.4" fontFamily="var(--font-geist-mono), monospace" fill="var(--ink-faint)">
            REQUIRED BY
          </text>
        </svg>
      </div>
    </>
  );
}
