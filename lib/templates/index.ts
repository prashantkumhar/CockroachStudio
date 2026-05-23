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

const impactSlot = (overrides: Partial<TextSlot> & { id: string; placeholder: string }): TextSlot => ({
  anchorX: 0.5,
  anchorY: 0.5,
  width: 0.9,
  align: "center",
  fontFamily: "Impact, Arial Black, sans-serif",
  fontSize: 42,
  fill: "#ffffff",
  stroke: "#000000",
  strokeWidth: 2,
  maxLines: 3,
  ...overrides,
});

export const templates: MemeTemplate[] = [
  {
    id: "top-bottom",
    name: "Classic Top/Bottom",
    canvasWidth: 600,
    canvasHeight: 600,
    imageLayout: { fit: "cover", x: 0, y: 0, width: 1, height: 1 },
    slots: [
      impactSlot({ id: "top", anchorX: 0.5, anchorY: 0.08, placeholder: "TOP TEXT" }),
      impactSlot({ id: "bottom", anchorX: 0.5, anchorY: 0.92, placeholder: "BOTTOM TEXT" }),
    ],
  },
  {
    id: "bottom-only",
    name: "Bottom Caption",
    canvasWidth: 600,
    canvasHeight: 650,
    imageLayout: { fit: "cover", x: 0, y: 0, width: 1, height: 0.85 },
    slots: [
      {
        id: "caption",
        anchorX: 0.5,
        anchorY: 0.93,
        width: 0.95,
        align: "center",
        fontFamily: "Inter, sans-serif",
        fontSize: 24,
        fill: "#0f1729",
        stroke: "transparent",
        strokeWidth: 0,
        maxLines: 3,
        placeholder: "caption text here",
      },
    ],
  },
  {
    id: "pov",
    name: "POV:",
    canvasWidth: 600,
    canvasHeight: 700,
    imageLayout: { fit: "cover", x: 0, y: 0.15, width: 1, height: 0.85 },
    slots: [
      {
        id: "pov-text",
        anchorX: 0.5,
        anchorY: 0.08,
        width: 0.9,
        align: "center",
        fontFamily: "Inter, sans-serif",
        fontSize: 28,
        fill: "#ffffff",
        stroke: "#000000",
        strokeWidth: 1,
        maxLines: 2,
        placeholder: "POV: you just opened Slack on a Sunday",
      },
    ],
  },
  {
    id: "when-you",
    name: "When You...",
    canvasWidth: 600,
    canvasHeight: 680,
    imageLayout: { fit: "cover", x: 0, y: 0, width: 1, height: 0.82 },
    slots: [
      {
        id: "setup",
        anchorX: 0.5,
        anchorY: 0.86,
        width: 0.95,
        align: "center",
        fontFamily: "Inter, sans-serif",
        fontSize: 22,
        fill: "#0f1729",
        stroke: "transparent",
        strokeWidth: 0,
        maxLines: 2,
        placeholder: "when you finally close 47 browser tabs",
      },
      {
        id: "punchline",
        anchorX: 0.5,
        anchorY: 0.95,
        width: 0.95,
        align: "center",
        fontFamily: "Inter, sans-serif",
        fontSize: 18,
        fill: "#44474e",
        stroke: "transparent",
        strokeWidth: 0,
        maxLines: 1,
        placeholder: "and immediately open 53 new ones",
      },
    ],
  },
  {
    id: "caption-above",
    name: "Caption Above",
    canvasWidth: 600,
    canvasHeight: 700,
    imageLayout: { fit: "cover", x: 0, y: 0.25, width: 1, height: 0.75 },
    slots: [
      {
        id: "caption",
        anchorX: 0.5,
        anchorY: 0.13,
        width: 0.92,
        align: "center",
        fontFamily: "Inter, sans-serif",
        fontSize: 26,
        fill: "#0f1729",
        stroke: "transparent",
        strokeWidth: 0,
        maxLines: 3,
        placeholder: "Text above the photo goes here",
      },
    ],
  },
  {
    id: "panel-zoom",
    name: "3-Panel Zoom",
    canvasWidth: 600,
    canvasHeight: 220,
    imageLayout: { fit: "cover", x: 0, y: 0, width: 1, height: 0.62 },
    slots: [
      impactSlot({ id: "p1", anchorX: 0.17, anchorY: 0.82, width: 0.28, fontSize: 20, placeholder: "Panel 1" }),
      impactSlot({ id: "p2", anchorX: 0.5, anchorY: 0.82, width: 0.28, fontSize: 20, placeholder: "Panel 2" }),
      impactSlot({ id: "p3", anchorX: 0.83, anchorY: 0.82, width: 0.28, fontSize: 20, placeholder: "Panel 3" }),
    ],
  },
  {
    id: "nobody-nobody",
    name: "Nobody: / Absolutely nobody:",
    canvasWidth: 600,
    canvasHeight: 720,
    imageLayout: { fit: "cover", x: 0, y: 0.35, width: 1, height: 0.65 },
    slots: [
      {
        id: "nobody",
        anchorX: 0.5,
        anchorY: 0.08,
        width: 0.9,
        align: "left",
        fontFamily: "Inter, sans-serif",
        fontSize: 24,
        fill: "#0f1729",
        stroke: "transparent",
        strokeWidth: 0,
        maxLines: 1,
        placeholder: "Nobody:",
      },
      {
        id: "absolutely-nobody",
        anchorX: 0.5,
        anchorY: 0.16,
        width: 0.9,
        align: "left",
        fontFamily: "Inter, sans-serif",
        fontSize: 24,
        fill: "#0f1729",
        stroke: "transparent",
        strokeWidth: 0,
        maxLines: 1,
        placeholder: "Absolutely nobody:",
      },
      {
        id: "punchline",
        anchorX: 0.5,
        anchorY: 0.26,
        width: 0.9,
        align: "left",
        fontFamily: "Inter, sans-serif",
        fontSize: 26,
        fill: "#0f1729",
        stroke: "transparent",
        strokeWidth: 0,
        maxLines: 2,
        placeholder: "Me at 3am:",
      },
    ],
  },
];

export const templateMap = Object.fromEntries(templates.map((t) => [t.id, t]));
export const templateIds = templates.map((t) => t.id);
