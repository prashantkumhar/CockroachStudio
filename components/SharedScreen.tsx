"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import AppNav from "@/components/ui/AppNav";
import BrandButton from "@/components/ui/BrandButton";
import BentoCard from "@/components/ui/BentoCard";
import PageHeader from "@/components/ui/PageHeader";

export default function SharedScreen() {
  const sharedMemeId = useStore((s) => s.sharedMemeId);
  const creatorToken = useStore((s) => s.creatorToken);
  const reset = useStore((s) => s.reset);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (sharedMemeId && creatorToken) {
      localStorage.setItem(`memeroach-creator-${sharedMemeId}`, creatorToken);
    }
  }, [sharedMemeId, creatorToken]);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/m/${sharedMemeId}`
      : `/m/${sharedMemeId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: "Check out my meme!",
        text: "Made with Memeroach 🪲",
        url: shareUrl,
      });
    } catch {
      // user cancelled — no-op
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <AppNav step={4} />

      <main className="mx-auto flex w-full max-w-page flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm space-y-6 text-center animate-slide-up">
          <div className="text-6xl animate-pop">🪲</div>

          <PageHeader
            align="center"
            eyebrow="Your meme is live"
            title="Share it before it spreads on its own"
          />

          <BentoCard className="text-left">
            <p className="text-label-sm text-on-surface-variant mb-2">Share link</p>
            <p className="break-all font-mono text-sm text-on-surface">{shareUrl}</p>
          </BentoCard>

          <div className="flex flex-col gap-3">
            {canNativeShare && (
              <BrandButton fullWidth onClick={handleNativeShare}>
                📤 Share via...
              </BrandButton>
            )}

            <BrandButton
              fullWidth
              variant={canNativeShare ? "outline" : "primary"}
              onClick={handleCopy}
            >
              {copied ? "✓ Copied!" : "📋 Copy link"}
            </BrandButton>

            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 w-full items-center justify-center rounded-btn border border-outline-variant
                         font-semibold text-on-surface transition-all hover:border-secondary hover:text-secondary"
            >
              👀 View meme page
            </a>

            <button
              type="button"
              onClick={reset}
              className="min-h-11 text-sm text-on-surface-variant transition-colors hover:text-secondary"
            >
              🔁 Make another meme
            </button>

            <a
              href="/wall"
              className="min-h-11 flex items-center justify-center text-sm text-on-surface-variant transition-colors hover:text-secondary"
            >
              🏆 See today&apos;s meme wall →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
