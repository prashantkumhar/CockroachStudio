import { NextRequest, NextResponse } from "next/server";
import { getSuggestions } from "@/lib/llm";

export const maxDuration = 25;

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: "imageBase64 and mimeType required" }, { status: 400 });
    }

    let suggestions;
    try {
      suggestions = await getSuggestions(imageBase64, mimeType);
    } catch {
      // Retry once on schema/parse failure
      suggestions = await getSuggestions(imageBase64, mimeType);
    }

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("[/api/suggest]", err);
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
  }
}
