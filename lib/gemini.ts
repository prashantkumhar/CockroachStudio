import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { buildCulturalContext } from "./meme-themes";
import { templateIds } from "./templates";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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
  return `You are Memeroach — a meme generator that specialises in Indian life, corporate India, Gen Z culture, and Reddit humour.

When you see a photo, you must:
1. Identify what's in it (people, setting, expression, objects, mood, context clues)
2. Match it to the most culturally relevant themes below
3. Return EXACTLY 6 suggestions — each using a DIFFERENT template and cultural angle
4. Write captions that feel sharp and specific to THIS photo, not generic placeholder text

CULTURAL THEMES AVAILABLE:
${buildCulturalContext()}

TEMPLATES AVAILABLE (use each templateId exactly as written):
- top-bottom: Two captions — top text and bottom text. Classic Impact font format.
- bottom-only: Single caption below the photo. Clean, modern.
- pov: One caption starting with "POV:" framing the viewer's perspective.
- when-you: Two lines — setup ("when you...") + punchline.
- caption-above: Caption text above the photo. Good for setup/reveal format.
- panel-zoom: Three short captions (escalating). Use for progression/stages.
- nobody-nobody: Three lines — "Nobody:" / "Absolutely nobody:" / subject + punchline.

RULES:
- Prefer Indian/corporate/Gen Z/Reddit themes when the photo supports it
- NEVER write generic placeholder captions like "when you're tired" without cultural specificity
- Captions must feel like they were written by someone who lives this culture
- texts array must match the number of slots for the template (top-bottom → 2, bottom-only → 1, pov → 1, when-you → 2, caption-above → 1, panel-zoom → 3, nobody-nobody → 3)
- Funny > clever > relatable, in that order
- Keep captions punchy — under 12 words per line

Return a JSON object with this exact shape:
{"suggestions": [{"templateId": "...", "texts": ["...", "..."], "tone": "..."}, ...]}`;
}

export async function getSuggestions(imageBase64: string, mimeType: string): Promise<Suggestion[]> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
    systemInstruction: buildSystemPrompt(),
  });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp",
        data: imageBase64,
      },
    },
    "Analyse this photo and return 6 meme suggestions as JSON.",
  ]);

  const text = result.response.text();
  const parsed = ResponseSchema.safeParse(JSON.parse(text));

  if (!parsed.success) {
    throw new Error("Invalid response schema from Gemini");
  }

  return parsed.data.suggestions;
}
