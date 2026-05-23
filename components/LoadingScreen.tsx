"use client";

import { useEffect, useState } from "react";
import AppNav from "@/components/ui/AppNav";
import { useStore } from "@/lib/store";

const MESSAGES = [
  "Consulting the council of memes...",
  "Loading Indian internet culture...",
  "Cross-referencing 47 subreddits...",
  "Analyzing your photo's cringe potential...",
  "Asking Sharma Ji Ka Beta for ideas...",
  "Summoning the roach gods...",
  "Translating feelings into Impact font...",
  "Bribing the algorithm...",
  "Running vibes check on your photo...",
  "Checking if this is LinkedIn-post-worthy...",
];

export default function LoadingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);
  const setPhase = useStore((s) => s.setPhase);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <AppNav
        step={2}
        right={
          <button
            type="button"
            onClick={() => setPhase("upload")}
            className="min-h-11 text-sm text-on-surface-variant transition-colors hover:text-secondary"
          >
            ✕ Cancel
          </button>
        }
      />

      <main className="mx-auto flex w-full max-w-page flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="relative mb-8">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-outline-variant border-t-secondary" />
          <span className="absolute inset-0 flex items-center justify-center text-2xl">🪲</span>
        </div>

        <p
          key={msgIndex}
          className="animate-fade-in max-w-xs text-center font-display text-lg font-semibold text-on-surface"
        >
          {MESSAGES[msgIndex]}
        </p>
        <p className="mt-2 text-sm text-on-surface-variant">This takes about 5 seconds</p>

        <div className="mt-12 grid w-full max-w-2xl grid-cols-1 gap-bento-gap px-4 sm:grid-cols-2 lg:grid-cols-12">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-bento border border-outline-variant bg-surface-container lg:col-span-4"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="aspect-square animate-pulse bg-surface-container-high" />
              <div className="space-y-2 p-3">
                <div className="h-3 w-3/4 animate-pulse rounded-pill bg-surface-container-high" />
                <div className="h-2.5 w-1/2 animate-pulse rounded-pill bg-surface-container-high" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
