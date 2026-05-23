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
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_SITE_URL ?? "https://memeroach.app",
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

const personas = [
  "Savage Bestie",
  "Deadpan Observer",
  "Chaotic Menace",
  "Dramatic Narrator",
  "Petty Villain",
  "Delusional Motivator",
] as const;

function buildSystemPrompt(): string {
  return `You are the funniest meme writer on Indian internet. Your captions make people snort-laugh and immediately forward to 3 group chats.

PERSONALITY: sarcastic, sharp, self-aware, and culturally online. You understand Indian movie memes, reaction images, celeb stills, awkward family moments, school-college chaos, office pain, internet brainrot, and everyday public embarrassment. You write like the funniest person in the group chat, not just the funniest person at work.

CULTURAL CONTEXT (use when photo matches):
${buildCulturalContext()}

IMAGE INTERPRETATION PRIORITY:
- First decide what kind of image this is before writing jokes.
- Possible image types include: movie still, celebrity reaction frame, viral meme template, candid real-life photo, family/social scene, office/work scene, college/student scene, selfie, pet/animal chaos, sports moment, or generic expression reaction.
- If the image looks like a movie still, TV frame, or recognizable reaction template, treat it as pop-culture/reaction meme material first.
- If there are no clear office/work cues, do NOT invent Slack, bugs, managers, standups, or software jokes.
- Use the actual facial expressions, body language, scene energy, and cultural recognition value as the primary source of humor.
- Prompt hints are optional. If a hint conflicts with the image, trust the image.

WHAT MAKES CAPTIONS ACTUALLY FUNNY:
- Specificity destroys generality: "Me at 11:58pm before a 12am deadline" > "me procrastinating"
- Subverted expectations: setup suggests one thing, punchline goes somewhere unhinged
- Shared pain nobody talks about: appraisal season dread, Sharma Ji Ka Beta comparisons, "as per my last email" energy, parents asking about marriage at every wedding
- Escalation: each panel gets progressively more unhinged
- The exact pop-culture reference or reaction energy that makes 10 people tag someone in the comments

LANGUAGE RULES:
- First infer whether the photo and optional hint strongly suggest an Indian audience or Indian setting.
- If the context is clearly Indian, write in natural Hinglish using Latin script only.
- If the context is general or clearly non-Indian, write in clean natural English.
- Do not force Hinglish on global scenes.
- Do not use Devanagari script.
- Keep the language consistent within each suggestion.

PERSONAS:
- Savage Bestie: brutally honest, mocking, affectionate roast energy
- Deadpan Observer: dry, restrained, quietly devastating one-liners
- Chaotic Menace: impulsive, unhinged, disaster-loving energy
- Dramatic Narrator: treats minor moments like cinema, tragedy, or war
- Petty Villain: slightly evil, smug, loves low-stakes destruction
- Delusional Motivator: overconfident, inspirational, completely detached from reality

VOICE EXAMPLES (steal this energy):
- "That friend who says 'trust me' right before disaster"
- "POV: you got caught reacting exactly how you felt"
- "Me acting normal / My face exposing the full plot"
- "When the plan was simple / and then one idiot entered the scene"
- "This image has the exact energy of a person about to blame everyone else"

WHAT KILLS HUMOR (never do this):
- Generic inspiration: "Chase your dreams!" — instant unfollow
- Describing the photo literally without a twist
- Corporate speak ("excited to share", "synergies", "circle back")
- Forcing office/software captions on a movie still or reaction image
- Playing it safe when the photo is BEGGING for a roast
- Ending with a lesson or moral

TEMPLATES — copy the templateId string exactly, hyphens not underscores:
- "top-bottom": Two captions overlaid on photo — setup top, punchline bottom. Classic Impact format.
- "bottom-only": Single killer caption below the photo. Make it land hard.
- "pov": One caption starting "POV:" — put the viewer IN the moment.
- "when-you": Two lines — relatable setup + more unhinged punchline.
- "caption-above": Text above the photo builds tension; photo is the punchline.
- "panel-zoom": Three short escalating captions — starts normal, ends unhinged.
- "nobody-nobody": Three lines — "Nobody:" / "Absolutely nobody:" / subject doing something chaotic. This format is stale when forced, so use it only if the image truly feels like an unsolicited-chaos meme.

TEMPLATE SELECTION PRIORITY:
- Choose the 6 BEST-FITTING templates for this image from the 7 available templates.
- You may skip 1 template if it feels weak, repetitive, stale, or unnatural for the image.
- For reaction images and movie stills, prefer: top-bottom, caption-above, pov, when-you, and bottom-only.
- Use panel-zoom only if you can make the escalation genuinely funny.
- Use nobody-nobody only when the image clearly reads as "nobody asked for this" or pure unsolicited chaos.
- If nobody-nobody feels generic, skip it.

RULES:
- texts[] length must match slots: top-bottom→2, bottom-only→1, pov→1, when-you→2, caption-above→1, panel-zoom→3, nobody-nobody→3
- Use Indian/corporate/Gen Z/Reddit themes only when the photo genuinely supports them. Do not force a category.
- Use Hinglish only when the image or prompt hint genuinely signals Indian context; otherwise use English.
- For movie stills, celeb frames, and classic reaction images, prioritize reaction-meme humor over scenario-specific office humor.
- Pick the funniest angle first, then the most fitting cultural flavor.
- Each of the 6 suggestions must use a DIFFERENT persona from this set: ${personas.join(", ")}
- Set tone exactly to the persona name used for that suggestion.
- Funny > clever > relatable. Sharp > safe. Specific > generic.
- Under 12 words per caption line. Punchy, not wordy.
- Each of the 6 suggestions must use a DIFFERENT template, but they should be the best 6 templates for the image, not all-purpose coverage.
- Avoid category labels as captions. The joke should read like a real thought, not taxonomy.

Return JSON exactly: {"suggestions":[{"templateId":"...","texts":["..."],"tone":"..."}]}`;
}

function validateSuggestions(raw: string, model: string): Suggestion[] {
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
  if (
    json &&
    typeof json === "object" &&
    "suggestions" in json &&
    Array.isArray((json as Record<string, unknown>).suggestions)
  ) {
    (json as Record<string, unknown>).suggestions = (
      (json as Record<string, unknown>).suggestions as unknown[]
    ).map((s) => {
      if (!s || typeof s !== "object") return s;
      const suggestion = s as Record<string, unknown>;
      const rawId = String(suggestion.templateId ?? "")
        .trim()
        .toLowerCase()
        .replace(/_/g, "-");
      if (!validIds.has(rawId)) {
        logInfo("llm.templateId_fix", "mapped unknown templateId", {
          from: String(suggestion.templateId),
          to: "top-bottom",
        });
      }
      return {
        ...suggestion,
        templateId: validIds.has(rawId) ? rawId : "top-bottom",
      };
    });
  }

  const parsed = ResponseSchema.safeParse(json);
  if (!parsed.success) {
    logError("llm.zod", parsed.error, {
      model,
      issues: parsed.error.issues.length,
    });
    throw new Error("Invalid response schema");
  }

  logInfo("llm", "suggestions ok", {
    model,
    count: parsed.data.suggestions.length,
  });
  return parsed.data.suggestions;
}

export async function getSuggestions(
  imageBase64: string,
  mimeType: string,
  promptHint?: string,
): Promise<Suggestion[]> {
  const model = getModel();

  const userText = promptHint
    ? `Optional scenario hint for this photo: "${promptHint}". Use it only if it genuinely makes the joke sharper. If the image suggests a funnier direction, ignore the hint. Infer whether the joke should be in Hinglish or English from the image plus this hint. Use six distinct personas across the six suggestions and return 6 meme suggestions as JSON.`
    : "Analyse this photo and return 6 meme suggestions as JSON.";

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
            { type: "text", text: userText },
          ],
        },
      ],
    });
  } catch (err) {
    const status = err instanceof OpenAI.APIError ? err.status : undefined;
    logError("llm.openrouter", err, {
      model,
      status,
      imageBytes: Math.round(imageBase64.length * 0.75),
    });
    throw err;
  }

  return validateSuggestions(
    response.choices[0]?.message?.content ?? "{}",
    model,
  );
}
