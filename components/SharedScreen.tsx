"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

export default function SharedScreen() {
  const sharedMemeId = useStore((s) => s.sharedMemeId);
  const creatorToken  = useStore((s) => s.creatorToken);
  const reset = useStore((s) => s.reset);
  const [copied, setCopied] = useState(false);

  // Persist creator token so /m/[id] can recognise the creator on revisit
  useEffect(() => {
    if (sharedMemeId && creatorToken) {
      localStorage.setItem(`memeroach-creator-${sharedMemeId}`, creatorToken);
    }
  }, [sharedMemeId, creatorToken]);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/m/${sharedMemeId}`
    : `/m/${sharedMemeId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-surface">
      <div className="w-full max-w-sm text-center space-y-6">
        {/* Icon */}
        <div className="text-6xl">🪲</div>

        {/* Heading */}
        <div>
          <p className="text-label-sm uppercase tracking-widest text-secondary mb-2">Your meme is live</p>
          <h1 className="font-display text-2xl font-bold text-on-surface">
            Share it before it spreads on its own
          </h1>
        </div>

        {/* Link box */}
        <div className="bg-surface-container border border-outline-variant rounded-bento p-4 text-left">
          <p className="text-on-surface-variant text-xs mb-2">Share link</p>
          <p className="text-on-surface text-sm font-mono break-all">{shareUrl}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleCopy}
            className="w-full bg-secondary text-on-secondary font-semibold py-3 rounded-btn
                       hover:-translate-y-0.5 transition-all active:scale-95"
          >
            {copied ? "✓ Copied!" : "📋 Copy link"}
          </button>

          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full border border-outline-variant text-on-surface font-semibold py-3 rounded-btn
                       text-center hover:border-secondary hover:text-secondary transition-all"
          >
            👀 View meme page
          </a>

          <button
            onClick={reset}
            className="text-on-surface-variant text-sm hover:text-secondary transition-colors"
          >
            🔁 Make another meme
          </button>
        </div>
      </div>
    </div>
  );
}
