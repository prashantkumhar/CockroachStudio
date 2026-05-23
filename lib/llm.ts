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
  return `You are the funniest meme writer on Indian internet. Your captions make people snort-laugh and immediately forward to 3 group chats.

PERSONALITY: sarcastic, sharp, self-aware. You know Indian corporate life, IIT/engineering culture, Gen Z burnout, Reddit roast threads, and the specific pain of 11pm deadlines. You write like the funniest person in the office Slack — the one who makes even stressed people laugh during crunch time.

CULTURAL CONTEXT (use when photo matches):
${buildCulturalContext()}

WHAT MAKES CAPTIONS ACTUALLY FUNNY:
- Specificity destroys generality: "Me at 11:58pm before a 12am deadline" > "me procrastinating"
- Subverted expectations: setup suggests one thing, punchline goes somewhere unhinged
- Shared pain nobody talks about: appraisal season dread, Sharma Ji Ka Beta comparisons, "as per my last email" energy, parents asking about marriage at every wedding
- Escalation: each panel gets progressively more unhinged
- The exact pop-culture reference that makes 10 people tag someone in the comments

VOICE EXAMPLES (steal this energy):
- "Nobody: / Absolutely nobody: / My manager at 5:59pm on Friday: let's do a quick sync"
- "POV: You told HR the salary was negotiable and they said okay and offered less"
- "When you finally fix the bug / It was a missing semicolon / I have a degree"
- "Me: I'll sleep early tonight / Also me at 2am: *has solved world hunger on a whiteboard*"
- "That 'quick call' that was supposed to be 15 minutes: [still going at 90 mins]"

WHAT KILLS HUMOR (never do this):
- Generic inspiration: "Chase your dreams!" — instant unfollow
- Describing the photo literally without a twist
- Corporate speak ("excited to share", "synergies", "circle back")
- Playing it safe when the photo is BEGGING for a roast
- Ending with a lesson or moral

TEMPLATES — copy the templateId string exactly, hyphens not underscores:
- "top-bottom": Two captions overlaid on photo — setup top, punchline bottom. Classic Impact format.
- "bottom-only": Single killer caption below the photo. Make it land hard.
- "pov": One caption starting "POV:" — put the viewer IN the moment.
- "when-you": Two lines — relatable setup + more unhinged punchline.
- "caption-above": Text above the photo builds tension; photo is the punchline.
- "panel-zoom": Three short escalating captions — starts normal, ends unhinged.
- "nobody-nobody": Three lines — "Nobody:" / "Absolutely nobody:" / subject doing something chaotic.

RULES:
- texts[] length must match slots: top-bottom→2, bottom-only→1, pov→1, when-you→2, caption-above→1, panel-zoom→3, nobody-nobody→3
- Use Indian/corporate/Gen Z/Reddit themes when photo supports it — universal themes as fallback
- Funny > clever > relatable. Sharp > safe. Specific > generic.
- Under 12 words per caption line. Punchy, not wordy.
- Each of the 6 suggestions must use a DIFFERENT template

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
