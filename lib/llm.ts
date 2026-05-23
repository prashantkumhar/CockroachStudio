import OpenAI from "openai";
import { z } from "zod";
import { buildCulturalContext } from "./meme-themes";
import { logInfo, logError, requireServerEnv } from "./logger";
import { templateIds } from "./templates";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

function getModel(): string {
  return process.env.OPENROUTER_MODEL ?? "google/gemini-2.0-flash-001";
}

function getClient() {
  return new OpenAI({
    baseURL: OPENROUTER_BASE_URL,
    apiKey: requireServerEnv("OPENROUTER_API_KEY"),
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://memeroach.app",
      "X-Title": "Memeroach",
    },
  });
}

const SuggestionSchema = z.object({
  templateId: z.enum(templateIds as [string, ...string[]]),
  texts: z.array(z.string()).min(1).max(4),
  tone: z.string(),
});

const ResponseSchema = z.object({
  suggestions: z.array(SuggestionSchema).length(6),
});

export type Suggestion = z.infer<typeof SuggestionSchema>;

function buildSystemPrompt(): string {
  return `You are Memeroach — a meme generator specialising in Indian life, corporate India, Gen Z culture, and Reddit humour.

When you see a photo:
1. Identify what's in it (people, setting, expression, objects, mood)
2. Match to the most culturally relevant themes below
3. Return EXACTLY 6 suggestions — each a DIFFERENT template and cultural angle
4. Write captions sharp and specific to THIS photo, not generic filler

CULTURAL THEMES:
${buildCulturalContext()}

TEMPLATES — copy the templateId string exactly, hyphens not underscores:
- "top-bottom": Two captions overlaid — top text + bottom text. Classic Impact format.
- "bottom-only": Single caption below the photo.
- "pov": One caption starting "POV:" framing the viewer's perspective.
- "when-you": Two lines — "when you..." setup + punchline.
- "caption-above": Caption text above the photo (good for setup/reveal).
- "panel-zoom": Three short escalating captions.
- "nobody-nobody": Three lines — "Nobody:" / "Absolutely nobody:" / subject + punchline.

RULES:
- texts[] length must match template slots: top-bottom→2, bottom-only→1, pov→1, when-you→2, caption-above→1, panel-zoom→3, nobody-nobody→3
- Prefer Indian/corporate/Gen Z/Reddit themes when the photo supports it
- Funny > clever > relatable
- Under 12 words per caption line

Return JSON exactly: {"suggestions":[{"templateId":"...","texts":["..."],"tone":"..."}]}`;
}

export async function getSuggestions(imageBase64: string, mimeType: string): Promise<Suggestion[]> {
  const model = getModel();

  let response;
  try {
    response = await getClient().chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt() },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
            { type: "text", text: "Analyse this photo and return 6 meme suggestions as JSON." },
          ],
        },
      ],
    });
  } catch (err) {
    const status = err instanceof OpenAI.APIError ? err.status : undefined;
    logError("llm.openrouter", err, { model, status, imageBytes: Math.round(imageBase64.length * 0.75) });
    throw err;
  }

  const raw = response.choices[0]?.message?.content ?? "{}";

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (parseErr) {
    logError("llm.json_parse", parseErr, { model, rawLength: raw.length });
    throw new Error("LLM returned invalid JSON");
  }

  // Normalise templateId before strict validation — the model sometimes returns
  // underscored variants (e.g. "top_bottom") or unexpected casing.
  const validIds = new Set<string>(templateIds);
  if (json && typeof json === "object" && "suggestions" in json && Array.isArray((json as Record<string, unknown>).suggestions)) {
    (json as Record<string, unknown>).suggestions = ((json as Record<string, unknown>).suggestions as unknown[]).map((s) => {
      if (!s || typeof s !== "object") return s;
      const suggestion = s as Record<string, unknown>;
      const raw = String(suggestion.templateId ?? "").trim().toLowerCase().replace(/_/g, "-");
      if (!validIds.has(raw)) {
        logInfo("llm.templateId_fix", "mapped unknown templateId", { from: String(suggestion.templateId), to: "top-bottom" });
      }
      return { ...suggestion, templateId: validIds.has(raw) ? raw : "top-bottom" };
    });
  }

  const parsed = ResponseSchema.safeParse(json);
  if (!parsed.success) {
    logError("llm.zod", parsed.error, { model, issues: parsed.error.issues.length });
    throw new Error("Invalid response schema");
  }

  logInfo("llm", "suggestions ok", { model, count: parsed.data.suggestions.length });
  return parsed.data.suggestions;
}
