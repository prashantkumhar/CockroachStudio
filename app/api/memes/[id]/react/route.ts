import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { logInfo, logError } from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/server";

const VALID_EMOJIS = ["😂", "💀", "🔥"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memeId } = await params;
    const { emoji } = await req.json();

    if (!VALID_EMOJIS.includes(emoji)) {
      return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
    }

    // Hash IP for rate limiting — never store raw IPs
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ipHash = createHash("sha256").update(ip + memeId).digest("hex").slice(0, 16);

    const supabase = createServiceClient();

    // Rate limit: one reaction per emoji per IP per meme per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("reactions")
      .select("*", { count: "exact", head: true })
      .eq("meme_id", memeId)
      .eq("emoji", emoji)
      .eq("ip_hash", ipHash)
      .gte("created_at", oneHourAgo);

    if ((count ?? 0) > 0) {
      logInfo("api.react", "rate_limited", { memeId, emoji });
      return NextResponse.json({ error: "Already reacted" }, { status: 429 });
    }

    const { error } = await supabase.from("reactions").insert({
      meme_id: memeId,
      emoji,
      ip_hash: ipHash,
    });

    if (error) throw error;

    logInfo("api.react", "ok", { memeId, emoji });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logError("api.react", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
