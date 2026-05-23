import OpenAI from "openai";
import { z } from "zod";
import { buildCulturalContext } from "./meme-themes";
import { templateIds } from "./templates";

// Model to use — swap freely without touching anything else
const MODEL = "google/gemini-2.0-flash-001";

function getClient() {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY ?? "missing",
    defaultHeaders: { "X-Title": "Memeroach" },
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

TEMPLATES (use templateId exactly as written):
- top-bottom: Two captions overlaid — top text + bottom text. Classic Impact format.
- bottom-only: Single caption below the photo.
- pov: One caption starting "POV:" framing the viewer's perspective.
- when-you: Two lines — "when you..." setup + punchline.
- caption-above: Caption text above the photo (good for setup/reveal).
- panel-zoom: Three short escalating captions.
- nobody-nobody: Three lines — "Nobody:" / "Absolutely nobody:" / subject + punchline.

RULES:
- texts[] length must match template slots: top-bottom→2, bottom-only→1, pov→1, when-you→2, caption-above→1, panel-zoom→3, nobody-nobody→3
- Prefer Indian/corporate/Gen Z/Reddit themes when the photo supports it
- Funny > clever > relatable
- Under 12 words per caption line

Return JSON exactly: {"suggestions":[{"templateId":"...","texts":["..."],"tone":"..."}]}`;
}

export async function getSuggestions(imageBase64: string, mimeType: string): Promise<Suggestion[]> {
  const response = await getClient().chat.completions.create({
    model: MODEL,
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

  const raw = response.choices[0]?.message?.content ?? "{}";
  const parsed = ResponseSchema.safeParse(JSON.parse(raw));

  if (!parsed.success) {
    console.error("[llm] Zod validation failed:", parsed.error.issues);
    throw new Error("Invalid response schema");
  }

  return parsed.data.suggestions;
}
