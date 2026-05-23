import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { memeImageAbsoluteUrl, memeImageApiPath } from "@/lib/memeImageUrl";
import MemePageClient from "./MemePageClient";

type Props = { params: Promise<{ id: string }> };

async function getMeme(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("memes").select("*").eq("id", id).single();
  if (error || !data) return null;
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
  if (!meme) return { title: "Meme not found — Memeroach" };

  const headersList = await headers();
  const host = headersList.get("host");
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${proto}://${host}` : undefined;
  const ogImage = memeImageAbsoluteUrl(id, origin);

  return {
    title: "Check out this meme — Memeroach",
    description: "Made with Memeroach. The meme maker that doesn't suck.",
    openGraph: {
      title: "Check out this meme — Memeroach",
      description: "Made with Memeroach. The meme maker that doesn't suck.",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Check out this meme — Memeroach",
      images: [ogImage],
    },
  };
}

export default async function MemePage({ params }: Props) {
  const { id } = await params;
  const [meme, counts] = await Promise.all([getMeme(id), getCounts(id)]);

  if (!meme) notFound();

  let remixTexts: string[] = [];
  try {
    remixTexts =
      typeof meme.layers === "string"
        ? JSON.parse(meme.layers)
        : Array.isArray(meme.layers)
          ? meme.layers
          : [];
  } catch {
    remixTexts = [];
  }

  return (
    <MemePageClient
      memeId={meme.id}
      imageUrl={memeImageApiPath(meme.id)}
      initialCounts={counts}
      remixTemplateId={meme.template_id}
      remixTexts={remixTexts}
    />
  );
}
