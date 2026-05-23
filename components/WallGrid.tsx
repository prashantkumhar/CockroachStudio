"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { memeImageApiPath } from "@/lib/memeImageUrl";
import FadeImage from "@/components/ui/FadeImage";

const PAGE_SIZE = 12;

type MemeRow = { id: string; created_at: string };
type ReactionMap = Record<string, number>;

type Props = {
  initialMemes: MemeRow[];
  initialReactions: ReactionMap;
  initialHasMore: boolean;
};

export default function WallGrid({ initialMemes, initialReactions, initialHasMore }: Props) {
  const [memes, setMemes] = useState<MemeRow[]>(initialMemes);
  const [reactions, setReactions] = useState<ReactionMap>(initialReactions);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const supabase = createClient();
    const oldest = memes[memes.length - 1]?.created_at;

    const { data: newMemes } = await supabase
      .from("memes")
      .select("id, created_at")
      .not("image_url", "is", null)
      .lt("created_at", oldest)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    const rows = (newMemes ?? []) as MemeRow[];

    if (rows.length > 0) {
      const { data: rxData } = await supabase
        .from("reactions")
        .select("meme_id, emoji")
        .in("meme_id", rows.map((m) => m.id));

      const newRx: ReactionMap = {};
      for (const r of rxData ?? []) {
        newRx[(r as { meme_id: string }).meme_id] =
          (newRx[(r as { meme_id: string }).meme_id] ?? 0) + 1;
      }

      setMemes((prev) => [...prev, ...rows]);
      setReactions((prev) => ({ ...prev, ...newRx }));
    }

    setHasMore(rows.length === PAGE_SIZE);
    setLoading(false);
  }, [memes, loading, hasMore]);

  if (memes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-24 text-center">
        <p className="font-display text-xl font-semibold text-on-surface-variant">
          No memes yet. Be the first.
        </p>
        <a
          href="/"
          className="inline-flex min-h-[44px] items-center rounded-full bg-secondary px-6 text-sm font-semibold text-on-secondary transition-opacity hover:opacity-90"
        >
          Make a meme →
        </a>
      </div>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {memes.map((meme) => (
          <li key={meme.id}>
            <a
              href={`/m/${meme.id}`}
              className="group block overflow-hidden rounded-bento border border-outline-variant bg-surface-container transition-shadow hover:shadow-float"
            >
              <FadeImage
                src={memeImageApiPath(meme.id)}
                alt="Meme"
                className="object-contain"
              />
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs uppercase tracking-wide text-on-surface-variant">
                  reactions
                </span>
                <span className="font-display text-sm font-bold text-secondary">
                  {reactions[meme.id] ?? 0}
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-outline-variant bg-surface-container px-8 text-sm font-semibold text-on-surface transition-all hover:border-secondary hover:text-secondary disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-outline-variant border-t-secondary" />
                Loading…
              </>
            ) : (
              "Load more memes"
            )}
          </button>
        </div>
      )}

      {!hasMore && memes.length > PAGE_SIZE && (
        <p className="mt-10 text-center text-sm text-on-surface-variant">
          You&apos;ve seen all {memes.length} memes 🎉
        </p>
      )}
    </>
  );
}
