import { NextRequest, NextResponse } from "next/server";
import { getSuggestions } from "@/lib/llm";
import { logError, logInfo } from "@/lib/logger";

export const maxDuration = 25;

/** ~3MB base64 keeps JSON body under Vercel's 4.5MB limit */
const MAX_BASE64_LENGTH = 3_000_000;

export async function POST(req: NextRequest) {
  const started = Date.now();

  try {
    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === "missing") {
      logError("api.suggest", new Error("OPENROUTER_API_KEY not configured"));
      return NextResponse.json(
        { error: "AI service not configured", code: "CONFIG" },
        { status: 503 }
      );
    }

    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: "imageBase64 and mimeType required", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    if (imageBase64.length > MAX_BASE64_LENGTH) {
      logInfo("api.suggest", "payload too large", { base64Length: imageBase64.length });
      return NextResponse.json(
        { error: "Image too large — try a smaller photo", code: "PAYLOAD_TOO_LARGE" },
        { status: 413 }
      );
    }

    logInfo("api.suggest", "request", {
      mimeType,
      base64Length: imageBase64.length,
      approxKb: Math.round((imageBase64.length * 0.75) / 1024),
    });

    let suggestions;
    try {
      suggestions = await getSuggestions(imageBase64, mimeType);
    } catch (firstErr) {
      logError("api.suggest", firstErr, { attempt: 1 });
      try {
        suggestions = await getSuggestions(imageBase64, mimeType);
      } catch (retryErr) {
        logError("api.suggest", retryErr, { attempt: 2 });
        throw retryErr;
      }
    }

    logInfo("api.suggest", "success", { ms: Date.now() - started, count: suggestions.length });

    return NextResponse.json({ suggestions });
  } catch (err) {
    logError("api.suggest", err, { ms: Date.now() - started });

    const message =
      err instanceof Error && err.message.includes("environment variable")
        ? "Server configuration error"
        : "Failed to generate suggestions";

    return NextResponse.json({ error: message, code: "SUGGEST_FAILED" }, { status: 500 });
  }
}
