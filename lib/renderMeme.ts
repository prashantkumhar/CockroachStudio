import { MemeTemplate, TextSlot } from "./templates";

export type RenderTextStyle = {
  fontFamily?: string;
  fontSize?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

export type RenderConfig = {
  template: MemeTemplate;
  imageDataUrl: string;
  texts: string[];
  textStyles?: RenderTextStyle[];
  cartoonize?: boolean;
};

export function resolveTextSlot(
  slot: TextSlot,
  style?: RenderTextStyle,
  scale = 1,
): TextSlot {
  return {
    ...slot,
    fontFamily: style?.fontFamily ?? slot.fontFamily,
    fontSize: Math.round((style?.fontSize ?? slot.fontSize) * scale),
    fill: style?.fill ?? slot.fill,
    stroke: style?.stroke ?? slot.stroke,
    strokeWidth: (style?.strokeWidth ?? slot.strokeWidth) * scale,
  };
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    } else {
      current = test;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

export function drawTextSlot(
  ctx: CanvasRenderingContext2D,
  slot: TextSlot,
  text: string,
  canvasWidth: number,
  canvasHeight: number,
) {
  ctx.save();
  ctx.font = `${slot.fontSize}px ${slot.fontFamily}`;
  ctx.textAlign = slot.align;
  ctx.textBaseline = "middle";

  const maxPx = slot.width * canvasWidth;
  const lines = wrapText(ctx, text, maxPx, slot.maxLines);
  const lineHeight = slot.fontSize * 1.2;
  const totalHeight = lines.length * lineHeight;
  // Match MemeEditor's baseX logic: anchor is the centre of the text box.
  // ctx.textAlign "left" draws from cx, "right" draws back from cx, "center" centres on cx.
  const cx =
    slot.align === "left"
      ? slot.anchorX * canvasWidth - maxPx / 2
      : slot.align === "right"
        ? slot.anchorX * canvasWidth + maxPx / 2
        : slot.anchorX * canvasWidth;
  const MARGIN = 6;
  // Clamp so the text block never spills past either canvas edge.
  const cy = Math.min(
    Math.max(
      slot.anchorY * canvasHeight - totalHeight / 2 + lineHeight / 2,
      MARGIN + lineHeight / 2, // top bound
    ),
    canvasHeight - totalHeight + lineHeight / 2 - MARGIN, // bottom bound
  );

  ctx.shadowColor = "rgba(0,0,0,0.65)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  lines.forEach((line, i) => {
    const y = cy + i * lineHeight;
    if (slot.stroke && slot.stroke !== "transparent" && slot.strokeWidth > 0) {
      ctx.shadowColor = "transparent"; // stroke draws its own depth via strokeText
      ctx.strokeStyle = slot.stroke;
      ctx.lineWidth = slot.strokeWidth * 2;
      ctx.lineJoin = "round";
      ctx.strokeText(line, cx, y);
      ctx.shadowColor = "rgba(0,0,0,0.65)";
    }
    ctx.fillStyle = slot.fill;
    ctx.fillText(line, cx, y);
  });

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  ctx.restore();
}

export async function renderMeme(
  canvas: HTMLCanvasElement,
  config: RenderConfig,
): Promise<void> {
  const { template, imageDataUrl, texts, textStyles } = config;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = template.canvasWidth;
  canvas.height = template.canvasHeight;

  // Background for bottom-only / caption-above (light card)
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw image
  await new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { x, y, width, height } = template.imageLayout;
      const dx = x * canvas.width;
      const dy = y * canvas.height;
      const dw = width * canvas.width;
      const dh = height * canvas.height;

      if (template.imageLayout.fit === "cover") {
        const scale = Math.max(dw / img.width, dh / img.height);
        const sw = dw / scale;
        const sh = dh / scale;
        const sx = (img.width - sw) / 2;
        const sy = (img.height - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
      } else {
        const scale = Math.min(dw / img.width, dh / img.height);
        const sw = img.width * scale;
        const sh = img.height * scale;
        ctx.drawImage(img, dx + (dw - sw) / 2, dy + (dh - sh) / 2, sw, sh);
      }
      resolve();
    };
    img.src = imageDataUrl;
  });

  // Draw text slots
  template.slots.forEach((slot, i) => {
    const text = texts[i] ?? slot.placeholder;
    drawTextSlot(
      ctx,
      resolveTextSlot(slot, textStyles?.[i]),
      text,
      canvas.width,
      canvas.height,
    );
  });
}
