import { NextRequest, NextResponse } from "next/server";
import { getSuggestions, type Suggestion } from "@/lib/llm";
import { logError, logInfo } from "@/lib/logger";

export const maxDuration = 25;

/** ~3MB base64 keeps JSON body under Vercel's 4.5MB limit */
const MAX_BASE64_LENGTH = 3_000_000;

function buildFallbackSuggestions(): Suggestion[] {
  return [
    {
      templateId: "top-bottom",
      texts: ["ME OPENING ONE QUICK TAB", "BROWSER: 37 TABS IS SELF CARE"],
      tone: "chaotic",
    },
    {
      templateId: "bottom-only",
      texts: ["when the '2 minute task' becomes your full personality"],
      tone: "dry",
    },
    {
      templateId: "pov",
      texts: ["POV: you said 'let me just check Slack once'"],
      tone: "relatable",
    },
    {
      templateId: "when-you",
      texts: ["when you finally fix the bug", "and it was one missing character"],
      tone: "self-roast",
    },
    {
      templateId: "caption-above",
      texts: ["That face when prod breaks right after your 'small refactor'"],
      tone: "office humor",
    },
    {
      templateId: "panel-zoom",
      texts: ["looks fine", "ships anyway", "opens hotfix tab"],
      tone: "escalating",
    },
  ];
}

export async function POST(req: NextRequest) {
  const started = Date.now();
  const useFallback = process.env.NODE_ENV !== "production";

  try {
    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === "missing") {
      if (useFallback) {
        logInfo("api.suggest", "using local fallback suggestions", { reason: "missing_openrouter_key" });
        return NextResponse.json({ suggestions: buildFallbackSuggestions(), fallback: true });
      }

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
        if (useFallback) {
          logInfo("api.suggest", "using local fallback suggestions", { reason: "llm_failure" });
          suggestions = buildFallbackSuggestions();
        } else {
        logError("api.suggest", retryErr, { attempt: 2 });
          throw retryErr;
        }
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
