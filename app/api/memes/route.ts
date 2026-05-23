import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { logInfo, logError } from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { pngDataUrl, templateId, texts } = await req.json();

    if (!pngDataUrl || !templateId) {
      return NextResponse.json({ error: "pngDataUrl and templateId required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const id = nanoid(8);
    const creatorToken = nanoid(16);

    // Convert data URL to Buffer
    const base64 = pngDataUrl.split(";base64,")[1];
    const buffer = Buffer.from(base64, "base64");
    const fileName = `${id}.png`;

    // Upload PNG to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("memes")
      .upload(fileName, buffer, { contentType: "image/png", upsert: false });

    if (uploadError) {
      logError("api.memes.upload", uploadError, { fileName });
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("memes").getPublicUrl(fileName);
    const imageUrl = urlData.publicUrl;

    // Insert memes row
    const { error: insertError } = await supabase.from("memes").insert({
      id,
      image_path: fileName,
      image_url: imageUrl,
      template_id: templateId,
      layers: JSON.stringify(texts),
      creator_token: creatorToken,
    });

    if (insertError) {
      logError("api.memes.insert", insertError, { id });
      return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
    }

    logInfo("api.memes", "created", { id, templateId });
    return NextResponse.json({ id, imageUrl, creatorToken });
  } catch (err) {
    logError("api.memes", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
