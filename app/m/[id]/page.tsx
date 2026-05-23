import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import MemePageClient from "./MemePageClient";

type Props = { params: Promise<{ id: string }> };

async function getMeme(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("memes").select("*").eq("id", id).single();
  return data;
}

async function getCounts(id: string): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reactions")
    .select("emoji")
    .eq("meme_id", id);

  const counts: Record<string, number> = { "😂": 0, "💀": 0, "🔥": 0 };
  (data ?? []).forEach(({ emoji }) => {
    if (emoji in counts) counts[emoji]++;
  });
  return counts;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const meme = await getMeme(id);

  return {
    title: "Check out this meme — Memeroach",
    description: "Made with Memeroach. The meme maker that doesn't suck.",
    openGraph: {
      title: "Check out this meme — Memeroach",
      description: "Made with Memeroach. The meme maker that doesn't suck.",
      images: meme?.image_url ? [{ url: meme.image_url, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: "Check out this meme — Memeroach",
      images: meme?.image_url ? [meme.image_url] : [],
    },
  };
}

export default async function MemePage({ params }: Props) {
  const { id } = await params;
  const [meme, counts] = await Promise.all([getMeme(id), getCounts(id)]);

  if (!meme) notFound();

  return (
    <MemePageClient
      memeId={meme.id}
      imageUrl={meme.image_url}
      initialCounts={counts}
    />
  );
}
