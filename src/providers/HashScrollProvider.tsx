"use client";

import { useHashScroll } from "@/hooks/useHashScroll";

/**
 * Provider component that enables hash scroll functionality globally for all pages.
 * Wraps the application and enables smooth scrolling to anchor links.
 */
export function HashScrollProvider({ children }: { children: React.ReactNode }) {
  // Enable hash scrolling globally (always ready for client-side pages)
  useHashScroll(true);

  return children;
}
