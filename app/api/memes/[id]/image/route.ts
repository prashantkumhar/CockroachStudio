import { NextRequest, NextResponse } from "next/server";
import { logInfo, logError } from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: meme, error: memeError } = await supabase
    .from("memes")
    .select("image_path")
    .eq("id", id)
    .single();

  if (memeError || !meme?.image_path) {
    logInfo("api.memes.image", "not_found", { id });
    return NextResponse.json({ error: "Meme not found" }, { status: 404 });
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from("memes")
    .download(meme.image_path);

  if (downloadError || !file) {
    logError("api.memes.image", downloadError, { id, path: meme.image_path });
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
