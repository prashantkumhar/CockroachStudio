export type TextSlot = {
  id: string;
  anchorX: number;
  anchorY: number;
  width: number;
  align: "left" | "center" | "right";
  fontFamily: string;
  fontSize: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  maxLines: number;
  placeholder: string;
};

export type MemeTemplate = {
  id: string;
  name: string;
  slots: TextSlot[];
  imageLayout: {
    fit: "cover" | "contain";
    x: number;
    y: number;
    width: number;
    height: number;
  };
  canvasWidth: number;
  canvasHeight: number;
};

// White Impact text with thick black stroke — classic meme overlay style
const impactOverlay = (overrides: Partial<TextSlot> & { id: string; placeholder: string }): TextSlot => ({
  anchorX: 0.5,
  anchorY: 0.5,
  width: 0.9,
  align: "center",
  fontFamily: "Impact, Arial Black, sans-serif",
  fontSize: 48,
  fill: "#ffffff",
  stroke: "#000000",
  strokeWidth: 2.5,
  maxLines: 3,
  ...overrides,
});

// Dark Impact text for light-background strips
const impactDark = (overrides: Partial<TextSlot> & { id: string; placeholder: string }): TextSlot => ({
  anchorX: 0.5,
  anchorY: 0.5,
  width: 0.88,
  align: "center",
  fontFamily: "Impact, Arial Black, sans-serif",
  fontSize: 26,
  fill: "#0f1729",
  stroke: "transparent",
  strokeWidth: 0,
  maxLines: 2,
  ...overrides,
});

export const templates: MemeTemplate[] = [
  // ── 1. Classic Top/Bottom ──────────────────────────────────────────────────
  // Full-bleed cover image; Impact text overlaid top & bottom.
  {
    id: "top-bottom",
    name: "Classic Top/Bottom",
    canvasWidth: 600,
    canvasHeight: 600,
    imageLayout: { fit: "contain", x: 0, y: 0, width: 1, height: 1 },
    slots: [
      impactOverlay({ id: "top",    anchorY: 0.07, fontSize: 52, placeholder: "TOP TEXT" }),
      impactOverlay({ id: "bottom", anchorY: 0.93, fontSize: 52, placeholder: "BOTTOM TEXT" }),
    ],
  },

  // ── 2. Modern Bottom Caption ───────────────────────────────────────────────
  // Cover image fills top 82 %; readable white strip below for the caption.
  {
    id: "bottom-only",
    name: "Bottom Caption",
    canvasWidth: 600,
    canvasHeight: 700,
    imageLayout: { fit: "contain", x: 0, y: 0, width: 1, height: 0.82 },
    slots: [
      {
        id: "caption",
        anchorX: 0.5,
        anchorY: 0.91,
        width: 0.92,
        align: "center",
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: 30,
        fill: "#0f1729",
        stroke: "transparent",
        strokeWidth: 0,
        maxLines: 3,
        placeholder: "caption text here",
      },
    ],
  },

  // ── 3. POV: ────────────────────────────────────────────────────────────────
  // Dark Impact header in a light strip; cover image fills the rest.
  {
    id: "pov",
    name: "POV:",
    canvasWidth: 600,
    canvasHeight: 700,
    imageLayout: { fit: "contain", x: 0, y: 0.175, width: 1, height: 0.825 },
    slots: [
      impactDark({
        id: "pov-text",
        anchorY: 0.088,
        width: 0.92,
        fontSize: 36,
        maxLines: 2,
        placeholder: "POV: you opened Slack on a Sunday",
      }),
    ],
  },

  // ── 4. When You… ──────────────────────────────────────────────────────────
  // Cover image fills top 78 %; two-line setup + punchline in white strip.
  {
    id: "when-you",
    name: "When You...",
    canvasWidth: 600,
    canvasHeight: 700,
    imageLayout: { fit: "contain", x: 0, y: 0, width: 1, height: 0.78 },
    slots: [
      {
        id: "setup",
        anchorX: 0.5,
        anchorY: 0.86,
        width: 0.92,
        align: "center",
        fontFamily: "Inter, sans-serif",
        fontSize: 28,
        fill: "#0f1729",
        stroke: "transparent",
        strokeWidth: 0,
        maxLines: 2,
        placeholder: "when you finally close 47 browser tabs",
      },
      {
        id: "punchline",
        anchorX: 0.5,
        anchorY: 0.965,
        width: 0.92,
        align: "center",
        fontFamily: "Inter, sans-serif",
        fontSize: 20,
        fill: "#44474e",
        stroke: "transparent",
        strokeWidth: 0,
        maxLines: 1,
        placeholder: "and immediately open 53 new ones",
      },
    ],
  },

  // ── 5. Caption Above ──────────────────────────────────────────────────────
  // Bold text in light top strip builds tension; cover image is the punchline.
  {
    id: "caption-above",
    name: "Caption Above",
    canvasWidth: 600,
    canvasHeight: 720,
    imageLayout: { fit: "contain", x: 0, y: 0.24, width: 1, height: 0.76 },
    slots: [
      {
        id: "caption",
        anchorX: 0.5,
        anchorY: 0.12,
        width: 0.90,
        align: "center",
        fontFamily: "Inter, sans-serif",
        fontSize: 32,
        fill: "#0f1729",
        stroke: "transparent",
        strokeWidth: 0,
        maxLines: 3,
        placeholder: "That face when prod breaks right after your 'small refactor'",
      },
    ],
  },

  // ── 6. 3-Panel Escalate ───────────────────────────────────────────────────
  // Cover image fills top 70 %; three escalating captions in the strip below.
  {
    id: "panel-zoom",
    name: "3-Beat Crash",
    canvasWidth: 600,
    canvasHeight: 580,
    imageLayout: { fit: "contain", x: 0, y: 0, width: 1, height: 0.70 },
    slots: [
      impactDark({ id: "p1", anchorX: 0.17, anchorY: 0.845, width: 0.30, fontSize: 22, placeholder: "this is calm" }),
      impactDark({ id: "p2", anchorX: 0.50, anchorY: 0.845, width: 0.30, fontSize: 22, placeholder: "this is weird" }),
      impactDark({ id: "p3", anchorX: 0.83, anchorY: 0.845, width: 0.30, fontSize: 26, placeholder: "this is a disaster" }),
    ],
  },

  // ── 7. Nobody: / Absolutely nobody: ──────────────────────────────────────
  // Classic format: grey labels in top strip → cover photo → bold punchline
  // in bottom strip. The two "nobody" lines are close together and small;
  // the punchline gets the visual weight.
  {
    id: "nobody-nobody",
    name: "Silence... Then Me",
    canvasWidth: 600,
    canvasHeight: 740,
    imageLayout: { fit: "contain", x: 0, y: 0.26, width: 1, height: 0.58 },
    slots: [
      {
        id: "nobody",
        anchorX: 0.5,
        anchorY: 0.075,
        width: 0.9,
        align: "left",
        fontFamily: "Inter, sans-serif",
        fontSize: 26,
        fill: "#5f6368",
        stroke: "transparent",
        strokeWidth: 0,
        maxLines: 1,
        placeholder: "Nobody:",
      },
      {
        id: "absolutely-nobody",
        anchorX: 0.5,
        anchorY: 0.155,
        width: 0.9,
        align: "left",
        fontFamily: "Inter, sans-serif",
        fontSize: 26,
        fill: "#5f6368",
        stroke: "transparent",
        strokeWidth: 0,
        maxLines: 1,
        placeholder: "Absolutely nobody:",
      },
      {
        id: "punchline",
        anchorX: 0.5,
        anchorY: 0.905,
        width: 0.9,
        align: "center",
        fontFamily: "Inter, sans-serif",
        fontSize: 32,
        fill: "#0f1729",
        stroke: "transparent",
        strokeWidth: 0,
        maxLines: 2,
        placeholder: "Me solving world hunger at 3am:",
      },
    ],
  },
];

export const templateMap = Object.fromEntries(templates.map((t) => [t.id, t]));
export const templateIds = templates.map((t) => t.id);
