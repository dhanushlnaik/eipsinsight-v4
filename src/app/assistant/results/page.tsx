'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarClock, Check, Copy, Database, Download } from 'lucide-react';

type AssistantDataQuery = {
  title: string;
  description: string;
  sql?: string;
  columns: string[];
  rows: Array<Record<string, string | number | boolean | null>>;
  rowCount: number;
  savedAt?: string;
  question?: string;
};

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : label}
    </button>
  );
}

function exportCsv(columns: string[], rows: Array<Record<string, string | number | boolean | null>>, filename: string) {
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map(escape).join(',');
  const body = rows.map((row) => columns.map((col) => escape(row[col])).join(',')).join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AssistantResultsPage() {
  const [result, setResult] = useState<AssistantDataQuery | null>(null);
  const [sqlOpen, setSqlOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('assistant:last-data-query');
      if (!raw) return;
      const parsed = JSON.parse(raw) as AssistantDataQuery;
      setResult(parsed);
    } catch {
      setResult(null);
    }
  }, []);

  const savedAt = useMemo(() => {
    if (!result?.savedAt) return null;
    const date = new Date(result.savedAt);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString();
  }, [result?.savedAt]);

  const csvFilename = useMemo(() => {
    if (!result?.title) return 'assistant-result.csv';
    return `${result.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.csv`;
  }, [result?.title]);

  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-8 md:px-8 xl:px-10">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        {result && result.columns.length > 0 && (
          <button
            type="button"
            onClick={() => exportCsv(result.columns, result.rows, csvFilename)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* Header card */}
      <section className="mt-5 rounded-2xl border border-border bg-card/60 p-5 shadow-[0_14px_40px_rgb(var(--persona-accent-rgb)/0.12)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Assistant Result
            </p>
            <h1 className="dec-title mt-1 text-2xl font-semibold tracking-tight text-foreground">
              {result?.title ?? 'Detailed Analysis'}
            </h1>
            {result?.description && (
              <p className="mt-1 text-sm text-muted-foreground">{result.description}</p>
            )}
            {result?.question && (
              <p className="mt-2 text-xs text-muted-foreground">
                Question:{' '}
                <span className="text-foreground/90">&ldquo;{result.question}&rdquo;</span>
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {result && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs text-primary">
                <Database className="h-3.5 w-3.5" />
                {result.rowCount} rows
              </span>
            )}
            {savedAt && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" />
                {savedAt}
              </span>
            )}
          </div>
        </div>

        {/* SQL block */}
        {result?.sql && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setSqlOpen((v) => !v)}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {sqlOpen ? '▲ Hide SQL' : '▼ View generated SQL'}
            </button>
            {sqlOpen && (
              <div className="mt-2 rounded-xl border border-border bg-muted/30 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                    Generated SQL
                  </span>
                  <CopyButton text={result.sql} />
                </div>
                <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap break-all">
                  {result.sql}
                </pre>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Result table */}
      {!result ? (
        <section className="mt-5 rounded-2xl border border-border bg-card/50 p-10 text-center">
          <Database className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-base font-medium text-foreground">No result yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask a data question in the assistant, then open this page.
          </p>
        </section>
      ) : result.columns.length === 0 ? (
        <section className="mt-5 rounded-2xl border border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">No rows were returned for this query.</p>
        </section>
      ) : (
        <section className="mt-5 rounded-2xl border border-border bg-card/50 p-5">
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="border-b border-border px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-10">
                    #
                  </th>
                  {result.columns.map((column) => (
                    <th
                      key={column}
                      className="border-b border-border px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, index) => (
                  <tr
                    key={`result-row-${index}`}
                    className="border-b border-border/60 last:border-b-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-xs text-muted-foreground/60 tabular-nums">
                      {index + 1}
                    </td>
                    {result.columns.map((column) => (
                      <td key={`${index}-${column}`} className="px-3 py-2.5 text-foreground/90">
                        {row[column] == null ? (
                          <span className="text-muted-foreground/40">—</span>
                        ) : (
                          String(row[column])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-right text-xs text-muted-foreground">
            {result.rowCount} row{result.rowCount === 1 ? '' : 's'} · Capped at 200 by the query engine
          </p>
        </section>
      )}
    </main>
  );
}
