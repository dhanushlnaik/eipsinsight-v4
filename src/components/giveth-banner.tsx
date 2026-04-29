"use client";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { StickyBanner } from "@/components/ui/sticky-banner";

const carouselMessages = [
  {
    text: "Public goods infrastructure for Ethereum governance. Support us on",
    link: "Giveth QF",
    href: "https://giveth.io/project/eipsinsight",
    emoji: "💜",
  },
  {
    text: "Explore detailed EIP insights and upgrade timelines at",
    link: "Insights",
    href: "/insights",
    emoji: "📊",
  },
  {
    text: "Stay updated with Ethereum governance discussions on",
    link: "Twitter",
    href: "https://twitter.com",
    emoji: "𝕏",
  },
];

export function GivethBanner() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % carouselMessages.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [paused]);

  const current = carouselMessages[index];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <StickyBanner className="border-b border-border/40 bg-linear-to-r from-primary/5 via-primary/3 to-cyan-500/5 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8 py-0.5">
          <div className="flex flex-1 items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center text-[13px] font-medium text-foreground sm:text-sm"
              >
                {current.text}{" "}
                <a
                  href={current.href}
                  target={current.href.startsWith("http") ? "_blank" : undefined}
                  rel={current.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="font-semibold text-primary underline transition-colors duration-200 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {current.link}
                </a>
                <span className="text-primary font-semibold"> {current.emoji}</span>
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Indicator Dots */}
          <div className="ml-4 flex items-center gap-1.5">
            {carouselMessages.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setIndex(i);
                  setPaused(true);
                  setTimeout(() => setPaused(false), 3000);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "bg-primary w-3" : "bg-primary/30 w-1.5 hover:bg-primary/50"
                }`}
                aria-label={`Go to message ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </StickyBanner>
    </div>
  );
}
