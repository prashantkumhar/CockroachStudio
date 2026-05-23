import { NextRequest, NextResponse } from "next/server";
import { getSuggestions, type Suggestion } from "@/lib/llm";
import { logError, logInfo } from "@/lib/logger";

export const maxDuration = 25;

/** ~3MB base64 keeps JSON body under Vercel's 4.5MB limit */
const MAX_BASE64_LENGTH = 3_000_000;

function looksIndianContext(promptContext?: string): boolean {
  if (!promptContext) return false;

  return /(india|indian|desi|shaadi|shadi|yaar|bhai|scene|jugaad|parents|relatives|aunty|uncle|sharma|chai|auto|rickshaw|bollywood|cricket|hinglish|hindi)/i.test(
    promptContext,
  );
}

function buildFallbackSuggestions(promptContext?: string): Suggestion[] {
  if (looksIndianContext(promptContext)) {
    return [
      {
        templateId: "top-bottom",
        texts: ["ME: bas 2 minute lagenge", "2 ghante baad bhi same scene"],
        tone: "Dramatic Narrator",
      },
      {
        templateId: "bottom-only",
        texts: ["Ye face tab aata hai jab simple plan full bakchodi ban jaye"],
        tone: "Deadpan Observer",
      },
      {
        templateId: "pov",
        texts: [
          "POV: tum bas normal rehna chahte the aur scene awkward ho gaya",
        ],
        tone: "Savage Bestie",
      },
      {
        templateId: "when-you",
        texts: [
          "when you act oversmart",
          "aur universe turant insult kar deta hai",
        ],
        tone: "Petty Villain",
      },
      {
        templateId: "caption-above",
        texts: ["Confidence full tha, outcome ne seedha aukaat dikha di"],
        tone: "Delusional Motivator",
      },
      {
        templateId: "panel-zoom",
        texts: [
          "sab control mein hai",
          "thoda issue hai",
          "ab toh satyanash hai",
        ],
        tone: "Chaotic Menace",
      },
    ];
  }

  return [
    {
      templateId: "top-bottom",
      texts: [
        "ME: this will be simple",
        "REALITY: immediate public embarrassment",
      ],
      tone: "Dramatic Narrator",
    },
    {
      templateId: "bottom-only",
      texts: ["That face when your great idea backfires instantly"],
      tone: "Deadpan Observer",
    },
    {
      templateId: "pov",
      texts: ["POV: you were trying to act normal and failed immediately"],
      tone: "Savage Bestie",
    },
    {
      templateId: "when-you",
      texts: [
        "when you act a little too confident",
        "and life humbles you on the spot",
      ],
      tone: "Petty Villain",
    },
    {
      templateId: "caption-above",
      texts: ["The exact moment the situation stopped being under control"],
      tone: "Delusional Motivator",
    },
    {
      templateId: "panel-zoom",
      texts: ["still fine", "slightly worse", "full disaster"],
      tone: "Chaotic Menace",
    },
  ];
}

export async function POST(req: NextRequest) {
  const started = Date.now();

  try {
    const { imageBase64, mimeType, promptContext } = (await req.json()) as {
      imageBase64: string;
      mimeType: string;
      promptContext?: string;
    };

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: "imageBase64 and mimeType required", code: "BAD_REQUEST" },
        { status: 400 },
      );
    }

    if (
      !process.env.OPENROUTER_API_KEY ||
      process.env.OPENROUTER_API_KEY === "missing"
    ) {
      logInfo("api.suggest", "using fallback suggestions", {
        reason: "missing_openrouter_key",
        hasPromptContext: !!promptContext,
      });
      return NextResponse.json({
        suggestions: buildFallbackSuggestions(promptContext),
        fallback: true,
        fallbackReason: "missing_openrouter_key",
      });
    }

    if (imageBase64.length > MAX_BASE64_LENGTH) {
      logInfo("api.suggest", "payload too large", {
        base64Length: imageBase64.length,
      });
      return NextResponse.json(
        {
          error: "Image too large — try a smaller photo",
          code: "PAYLOAD_TOO_LARGE",
        },
        { status: 413 },
      );
    }

    logInfo("api.suggest", "request", {
      mimeType,
      base64Length: imageBase64.length,
      approxKb: Math.round((imageBase64.length * 0.75) / 1024),
      hasPromptContext: !!promptContext,
    });

    let suggestions;
    try {
      suggestions = await getSuggestions(imageBase64, mimeType, promptContext);
    } catch (firstErr) {
      logError("api.suggest", firstErr, { attempt: 1 });
      try {
        suggestions = await getSuggestions(
          imageBase64,
          mimeType,
          promptContext,
        );
      } catch (retryErr) {
        logError("api.suggest", retryErr, { attempt: 2 });
        logInfo("api.suggest", "using fallback suggestions", {
          reason: "llm_failure",
          hasPromptContext: !!promptContext,
        });
        return NextResponse.json({
          suggestions: buildFallbackSuggestions(promptContext),
          fallback: true,
          fallbackReason: "llm_failure",
        });
      }
    }

    logInfo("api.suggest", "success", {
      ms: Date.now() - started,
      count: suggestions.length,
    });

    return NextResponse.json({ suggestions });
  } catch (err) {
    logError("api.suggest", err, { ms: Date.now() - started });

    const message =
      err instanceof Error && err.message.includes("environment variable")
        ? "Server configuration error"
        : "Failed to generate suggestions";

    return NextResponse.json(
      { error: message, code: "SUGGEST_FAILED" },
      { status: 500 },
    );
  }
}
