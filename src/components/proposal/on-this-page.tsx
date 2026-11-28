"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export interface RailItem {
  id: string;
  label: string;
  sub?: boolean;
}

/**
 * Sticky "On this page" scrollspy rail for proposal detail pages.
 */
export function OnThisPage({ items }: { items: RailItem[] }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [bar, setBar] = useState<{ top: number; height: number; show: boolean }>({
    top: 0,
    height: 0,
    show: false,
  });

  useEffect(() => {
    const ids = items.map((i) => i.id);
    if (ids.length === 0) return;
    let raf = 0;
    const compute = () => {
      raf = 0;
      const line = 140;
      let current = ids[0] ?? "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - line <= 0) current = id;
        else break;
      }
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
        current = ids[ids.length - 1] ?? current;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    compute();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [items]);

  useLayoutEffect(() => {
    const el = linkRefs.current[active];
    if (el) setBar({ top: el.offsetTop, height: el.offsetHeight, show: true });
  }, [active, items]);

  return (
    <nav
      ref={navRef}
      className="scroll-quiet relative mt-4 max-h-[70vh] overflow-y-auto border-l border-[var(--border)]"
      aria-label="On this page"
    >
      <span
        aria-hidden
        className="absolute left-0 w-0.5 rounded-full bg-[var(--ink)] transition-all duration-300 ease-out motion-reduce:transition-none"
        style={{ top: bar.top, height: bar.height, opacity: bar.show ? 1 : 0 }}
      />
      {items.map((n) => (
        <a
          key={n.id}
          ref={(el) => {
            linkRefs.current[n.id] = el;
          }}
          href={`#${n.id}`}
          aria-current={active === n.id ? "location" : undefined}
          className={`-ml-px block border-l border-transparent transition-colors ${
            n.sub ? "truncate py-1 pl-7 text-[0.8rem]" : "py-1.5 pl-4 text-sm"
          } ${
            active === n.id
              ? "font-medium text-[var(--ink)]"
              : n.sub
                ? "text-[var(--ink-faint)] hover:text-[var(--ink)]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
          }`}
        >
          {n.label}
        </a>
      ))}
    </nav>
  );
}
