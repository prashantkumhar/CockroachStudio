import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/ui/AppNav";
import WallGrid from "@/components/WallGrid";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Meme Wall — Memeroach",
  description: "Today's freshest memes, ranked by reactions.",
};

const PAGE_SIZE = 12;

type MemeRow = { id: string; created_at: string };
type ReactionRow = { meme_id: string; emoji: string };

export default async function WallPage() {
  const supabase = await createClient();

  // Fetch first page — only rows with a successfully uploaded image
  const { data: memes } = await supabase
    .from("memes")
    .select("id, created_at")
    .not("image_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1); // +1 to detect if there's a next page

  const rows = (memes ?? []) as MemeRow[];
  const hasMore = rows.length > PAGE_SIZE;
  const firstPage = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  // Reaction counts for first page
  const memeIds = firstPage.map((m) => m.id);
  let reactions: Record<string, number> = {};

  if (memeIds.length > 0) {
    const { data: rxData } = await supabase
      .from("reactions")
      .select("meme_id, emoji")
      .in("meme_id", memeIds);

    for (const r of (rxData ?? []) as ReactionRow[]) {
      reactions[r.meme_id] = (reactions[r.meme_id] ?? 0) + 1;
    }
  }

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
            The freshest memes — make one, it shows up here.
          </p>
        </header>

        <WallGrid
          initialMemes={firstPage}
          initialReactions={reactions}
          initialHasMore={hasMore}
        />
      </main>
    </div>
  );
}
