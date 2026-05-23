import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { memeImageApiPath } from "@/lib/memeImageUrl";
import AppNav from "@/components/ui/AppNav";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Meme Wall — Memeroach",
  description: "Today's freshest memes, ranked by reactions.",
};

type MemeRow = {
  id: string;
  template_id: string;
  created_at: string;
};

type ReactionRow = {
  meme_id: string;
  emoji: string;
};

export default async function WallPage() {
  const supabase = await createClient();

  const { data: memes } = await supabase
    .from("memes")
    .select("id, template_id, created_at")
    .order("created_at", { ascending: false })
    .limit(24);

  const rows = (memes ?? []) as MemeRow[];

  const memeIds = rows.map((m) => m.id);

  let reactions: ReactionRow[] = [];
  if (memeIds.length > 0) {
    const { data } = await supabase
      .from("reactions")
      .select("meme_id, emoji")
      .in("meme_id", memeIds);
    reactions = (data ?? []) as ReactionRow[];
  }

  const reactionCounts: Record<string, number> = {};
  for (const r of reactions) {
    reactionCounts[r.meme_id] = (reactionCounts[r.meme_id] ?? 0) + 1;
  }

  const sorted = [...rows].sort((a, b) => {
    const diff = (reactionCounts[b.id] ?? 0) - (reactionCounts[a.id] ?? 0);
    if (diff !== 0) return diff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      <AppNav
        right={
          <a
            href="/"
            className="inline-flex min-h-[44px] items-center rounded-full bg-secondary px-4 text-sm font-semibold text-on-secondary transition-opacity hover:opacity-90"
          >
            Make your own →
          </a>
        }
      />

      <main className="mx-auto max-w-page px-4 py-10 sm:px-8">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold text-on-surface sm:text-4xl">
            Meme Wall
          </h1>
          <p className="mt-2 text-on-surface-variant">
            Today&apos;s freshest memes, ranked by reactions.
          </p>
        </header>

        {sorted.length === 0 ? (
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
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {sorted.map((meme) => {
                const count = reactionCounts[meme.id] ?? 0;
                return (
                  <li key={meme.id}>
                    <a
                      href={`/m/${meme.id}`}
                      className="group block bg-surface-container border border-outline-variant rounded-bento overflow-hidden transition-shadow hover:shadow-float"
                    >
                      <div className="relative aspect-square w-full bg-surface-container-high">
                        {/* skeleton shimmer — sits behind the image */}
                        <div className="absolute inset-0 animate-pulse bg-surface-container-high" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={memeImageApiPath(meme.id)}
                          alt="Meme"
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-contain opacity-0 transition-opacity duration-300"
                          onLoad={(e) => { e.currentTarget.style.opacity = "1"; }}
                        />
                      </div>
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-label-sm text-on-surface-variant uppercase tracking-wide">
                          reactions
                        </span>
                        <span className="font-display text-sm font-bold text-secondary">
                          {count}
                        </span>
                      </div>
                    </a>
                  </li>
                );
              })}
            </ul>

            <div className="mt-12 flex justify-center">
              <a
                href="/"
                className="inline-flex min-h-[44px] items-center rounded-full bg-secondary px-6 text-sm font-semibold text-on-secondary transition-opacity hover:opacity-90"
              >
                Make your own meme →
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
