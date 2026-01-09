"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Menu, X, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSidebarStore } from "@/stores/sidebarStore";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isOpen } = useSidebarStore();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-cyan-300/20 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Collapse Button - Show only when sidebar is open */}
          {isOpen && (
            <button
              onClick={() => {
                const event = new CustomEvent('toggle-sidebar');
                window.dispatchEvent(event);
              }}
              className={cn(
                "mr-2 group rounded-lg p-2 transition-all duration-300",
                "hover:bg-gradient-to-r hover:from-emerald-500/15 hover:via-cyan-500/15 hover:to-blue-500/15",
                "hover:shadow-[0_0_12px_rgba(34,211,238,0.15)] border border-transparent hover:border-cyan-400/30"
              )}
            >
              <PanelLeft className="h-5 w-5 text-cyan-300 transition-colors group-hover:text-emerald-300" />
            </button>
          )}

          {/* LEFT: Logo - Show when sidebar is closed on desktop */}
          <Link href="/" className={cn(
            "group shrink-0 transition-all duration-300",
            isOpen && "md:opacity-0 md:pointer-events-none md:w-0"
          )}>
            <div className="relative flex items-center gap-2 overflow-hidden rounded-xl p-1.5">
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-cyan-400/20 to-emerald-400/20 opacity-0 group-hover:opacity-100 transition-all duration-300 blur-md scale-110" />
                
                {/* Logo with hover effects */}
                <div className="relative z-10">
                  <Image
                    src="/brand/logo/EIPsInsightsDark.gif"
                    alt="EIPsInsight"
                    width={28}
                    height={28}
                    className="dark:hidden"
                  />
                  <Image
                    src="/brand/logo/EIPsInsights.gif"
                    alt="EIPsInsight"
                    width={28}
                    height={28}
                    className="hidden dark:block"
                  />
                </div>
                
                <span className="dec-title relative z-10 hidden sm:inline font-semibold tracking-tight text-slate-900 dark:text-white">
                  EIPsInsight
                </span>
                
                {/* Animated border on hover */}
                <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-emerald-400/50 transition-all duration-300">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400/10 via-cyan-400/10 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                </div>
            </div>
          </Link>

          {/* CENTER: Search (Desktop) */}
          <div className="hidden md:flex flex-1 justify-center px-6">
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400/80" />
              <input
                type="search"
                placeholder="Search EIPs, ERCs, RIPs, authors, status…"
                className={cn(
                  "w-full rounded-full border border-cyan-300/30 bg-black/40",
                  "pl-10 pr-4 py-2.5 text-sm text-slate-200",
                  "placeholder:text-slate-400",
                  "focus:outline-none focus:ring-2 focus:ring-emerald-400/40",
                  "transition"
                )}
              />
            </div>
          </div>

          {/* RIGHT: Auth (Desktop) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button
              size="sm"
              className="rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-black hover:from-emerald-400 hover:to-cyan-400"
              asChild
            >
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>

          {/* MOBILE: Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-slate-200 hover:bg-white/10"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE PANEL */}
      {mobileOpen && (
        <div className="md:hidden border-t border-cyan-300/20 bg-background/95 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-4">

            {/* Mobile Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400/80" />
              <input
                type="search"
                placeholder="Search EIPs, ERCs, authors…"
                className={cn(
                  "w-full rounded-lg border border-cyan-300/30 bg-black/40",
                  "pl-10 pr-4 py-3 text-sm text-slate-200",
                  "placeholder:text-slate-400",
                  "focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                )}
              />
            </div>

            {/* Mobile Auth */}
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button
                className="flex-1 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-black"
                asChild
              >
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
