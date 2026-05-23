"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  memeId: string;
  imageUrl: string;
  initialCounts: Record<string, number>;
};

const EMOJIS = ["😂", "💀", "🔥"] as const;

type FloatingEmoji = { id: number; emoji: string; x: number };

export default function MemePageClient({ memeId, imageUrl, initialCounts }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [reacted, setReacted] = useState<Set<string>>(new Set());
  const [floating, setFloating] = useState<FloatingEmoji[]>([]);
  const [isCreator, setIsCreator] = useState(false);
  const [totalLive, setTotalLive] = useState(Object.values(initialCounts).reduce((a, b) => a + b, 0));
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
    <div className="min-h-screen bg-surface flex flex-col items-center">
      {/* Nav */}
      <nav className="w-full sticky top-0 z-10 bg-surface/80 backdrop-blur-glass border-b border-outline-variant">
        <div className="max-w-page mx-auto px-4 h-12 flex items-center justify-between">
          <a href="/" className="font-display font-bold text-secondary text-sm">🪲 Memeroach</a>
          <a href="/" className="text-xs text-on-surface-variant hover:text-secondary transition-colors">
            Make your own →
          </a>
        </div>
      </nav>

      {/* Meme image */}
      <div className="w-full max-w-lg px-4 pt-6 pb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Meme"
          className="w-full rounded-bento shadow-float"
        />
      </div>

      {/* Reaction bar */}
      <div className="w-full max-w-lg px-4 py-4">
        <div className="bg-surface-container border border-outline-variant rounded-bento p-4">
          <p className="text-label-sm uppercase tracking-widest text-on-surface-variant mb-3">React</p>
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
        </div>
      </div>

      {/* Creator panel */}
      {isCreator && (
        <div className="w-full max-w-lg px-4 pb-4">
          <div className="bg-surface-container border border-secondary/30 rounded-bento p-4 relative overflow-hidden">
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
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="w-full max-w-lg px-4 pb-10">
        <a
          href="/"
          className="block w-full text-center bg-secondary text-on-secondary font-semibold py-3 rounded-btn
                     hover:-translate-y-0.5 transition-all active:scale-95"
        >
          Make your own meme →
        </a>
      </div>
    </div>
  );
}
