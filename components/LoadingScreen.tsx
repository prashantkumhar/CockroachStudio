"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 bg-surface">
      {/* Spinner */}
      <div className="mb-8 relative">
        <div className="w-16 h-16 rounded-full border-4 border-outline-variant border-t-secondary animate-spin" />
        <span className="absolute inset-0 flex items-center justify-center text-2xl">🪲</span>
      </div>

      {/* Rotating message */}
      <p
        key={msgIndex}
        className="font-display font-semibold text-on-surface text-lg text-center max-w-xs
                   animate-in fade-in duration-300"
      >
        {MESSAGES[msgIndex]}
      </p>
      <p className="text-on-surface-variant text-sm mt-2">This takes about 5 seconds</p>

      {/* Skeleton grid */}
      <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-2xl px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-bento border border-outline-variant bg-surface-container overflow-hidden"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="aspect-square bg-surface-container-high animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-3 rounded-pill bg-surface-container-high animate-pulse w-3/4" />
              <div className="h-2.5 rounded-pill bg-surface-container-high animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
