"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AppNav from "@/components/ui/AppNav";
import BrandButton from "@/components/ui/BrandButton";
import BentoCard from "@/components/ui/BentoCard";
import { stashRemixPreset } from "@/lib/remix";

type Props = {
  memeId: string;
  imageUrl: string;
  initialCounts: Record<string, number>;
  remixTemplateId: string;
  remixTexts: string[];
};

const EMOJIS = ["😂", "💀", "🔥"] as const;

type FloatingEmoji = { id: number; emoji: string; x: number };

export default function MemePageClient({
  memeId,
  imageUrl,
  initialCounts,
  remixTemplateId,
  remixTexts,
}: Props) {
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [reacted, setReacted] = useState<Set<string>>(new Set());
  const [floating, setFloating] = useState<FloatingEmoji[]>([]);
  const [isCreator, setIsCreator] = useState(false);
  const [totalLive, setTotalLive] = useState(Object.values(initialCounts).reduce((a, b) => a + b, 0));
  const [imgError, setImgError] = useState(false);
  const floatIdRef = useRef(0);

  // Check if creator via localStorage
  useEffect(() => {
    const token = localStorage.getItem(`memeroach-creator-${memeId}`);
    if (token) setIsCreator(true);
  }, [memeId]);

  // Supabase Realtime — subscribe to new reactions
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`reactions-${memeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reactions", filter: `meme_id=eq.${memeId}` },
        (payload) => {
          const emoji = payload.new.emoji as string;
          setCounts((prev) => ({ ...prev, [emoji]: (prev[emoji] ?? 0) + 1 }));
          setTotalLive((t) => t + 1);

          // Float emoji up the screen
          const id = floatIdRef.current++;
          const x = 20 + Math.random() * 60; // random horizontal %
          setFloating((prev) => [...prev, { id, emoji, x }]);
          setTimeout(() => setFloating((prev) => prev.filter((f) => f.id !== id)), 1800);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [memeId]);

  const handleReact = async (emoji: string) => {
    if (reacted.has(emoji)) return;
    setReacted((prev) => new Set([...prev, emoji]));
    setCounts((prev) => ({ ...prev, [emoji]: (prev[emoji] ?? 0) + 1 }));
    setTotalLive((t) => t + 1);

    // Optimistic float
    const id = floatIdRef.current++;
    const x = 20 + Math.random() * 60;
    setFloating((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => setFloating((prev) => prev.filter((f) => f.id !== id)), 1800);

    try {
      await fetch(`/api/memes/${memeId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
    } catch {
      // Rollback on failure
      setReacted((prev) => { const n = new Set(prev); n.delete(emoji); return n; });
      setCounts((prev) => ({ ...prev, [emoji]: Math.max(0, (prev[emoji] ?? 1) - 1) }));
      setTotalLive((t) => Math.max(0, t - 1));
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <AppNav
        right={
          <a
            href="/"
            className="min-h-11 text-sm text-on-surface-variant transition-colors hover:text-secondary"
          >
            Make your own →
          </a>
        }
      />

      <div className="w-full max-w-lg px-4 pt-6 pb-2">
        {imgError || !imageUrl ? (
          <div className="flex w-full items-center justify-center rounded-bento border border-outline-variant bg-surface-container p-12 text-center">
            <div>
              <p className="text-2xl mb-2">🪲</p>
              <p className="text-sm text-on-surface-variant">Image failed to load.</p>
              <p className="mt-1 text-xs text-on-surface-variant break-all opacity-60">{imageUrl ?? "no URL"}</p>
            </div>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Meme"
            className="w-full rounded-bento shadow-float"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      <div className="w-full max-w-lg px-4 py-4">
        <BentoCard>
          <p className="text-label-sm text-on-surface-variant mb-3">React</p>
          <div className="flex gap-3">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                disabled={reacted.has(emoji)}
                className={[
                  "flex-1 flex flex-col items-center gap-1 py-3 rounded-btn border transition-all",
                  reacted.has(emoji)
                    ? "bg-secondary/10 border-secondary text-on-surface"
                    : "bg-surface-container-high border-outline-variant hover:border-secondary hover:bg-surface-container-high active:scale-95",
                ].join(" ")}
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-xs font-semibold text-on-surface-variant tabular-nums">
                  {counts[emoji] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </BentoCard>
      </div>

      {isCreator && (
        <div className="w-full max-w-lg px-4 pb-4">
          <BentoCard className="relative overflow-hidden border-secondary/30">
            {/* Floating emojis */}
            {floating.map((f) => (
              <span
                key={f.id}
                className="animate-float-up absolute bottom-4 text-2xl pointer-events-none select-none"
                style={{ left: `${f.x}%` }}
              >
                {f.emoji}
              </span>
            ))}

            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse inline-block" />
              <p className="text-label-sm uppercase tracking-widest text-secondary">Your meme is live</p>
            </div>
            <p className="font-display font-bold text-on-surface text-2xl">{totalLive}</p>
            <p className="text-on-surface-variant text-xs mt-0.5">reactions and counting</p>
          </BentoCard>
        </div>
      )}

      <div className="w-full max-w-lg space-y-3 px-4 pb-10">
        {remixTemplateId && remixTexts.length > 0 && (
          <BrandButton
            fullWidth
            variant="outline"
            onClick={() => {
              stashRemixPreset({ templateId: remixTemplateId, texts: remixTexts });
              window.location.href = "/";
            }}
          >
            ♻️ Remix with your photo
          </BrandButton>
        )}
        <a
          href="/"
          className="flex min-h-11 w-full items-center justify-center rounded-btn bg-secondary font-semibold
                     text-on-secondary transition-all hover:-translate-y-0.5 active:scale-95"
        >
          Make your own meme →
        </a>
      </div>

      {/* Floating emoji overlay — visible for all users */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {floating.map((f) => (
          <span
            key={f.id}
            className="animate-float-up absolute bottom-24 text-3xl select-none"
            style={{ left: `${f.x}%` }}
          >
            {f.emoji}
          </span>
        ))}
      </div>
    </div>
  );
}
