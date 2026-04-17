import { useEffect } from "react";

/**
 * Hook that handles smooth scrolling to hash anchors when page loads or hash changes.
 * Useful for pages with lazy-loaded content where hash scrolling needs to wait for DOM to be ready.
 * 
 * @param isReady - Boolean indicating if the page content is ready (e.g., !loading)
 */
export function useHashScroll(isReady: boolean = true) {
  useEffect(() => {
    if (!isReady) return;

    const scrollToHash = () => {
      const hash = window.location.hash.slice(1); // Remove the '#'
      if (!hash) return;

      const element = document.getElementById(hash);
      if (element) {
        // Use setTimeout to ensure DOM is fully rendered
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 0);
      }
    };

    scrollToHash();

    // Also listen for hash change events (e.g., when user clicks a link with hash)
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, [isReady]);
}
