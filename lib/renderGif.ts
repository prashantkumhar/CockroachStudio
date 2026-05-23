import type { RenderConfig } from "./renderMeme";
import { drawTextSlot } from "./renderMeme";

const GIF_MAX_WIDTH = 420;
const FRAMES_PER_SLOT = 10;
const HOLD_FRAMES = 6;
const FRAME_DELAY = 80;
const HOLD_DELAY = 1800;

export async function renderMemeGif(config: RenderConfig): Promise<Blob> {
  const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
  const { template, imageDataUrl, texts, cartoonize } = config;

  const scale = Math.min(GIF_MAX_WIDTH / template.canvasWidth, 1);
  const W = Math.round(template.canvasWidth * scale);
  const H = Math.round(template.canvasHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, W, H);

  // Draw base image
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = imageDataUrl;
  });

  const { x, y, width, height, fit } = template.imageLayout;
  const dx = x * W, dy = y * H, dw = width * W, dh = height * H;
  if (fit === "cover") {
    const s = Math.max(dw / img.width, dh / img.height);
    const sw = dw / s, sh = dh / s;
    ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, dx, dy, dw, dh);
  } else {
    const s = Math.min(dw / img.width, dh / img.height);
    const sw = img.width * s, sh = img.height * s;
    ctx.drawImage(img, dx + (dw - sw) / 2, dy + (dh - sh) / 2, sw, sh);
  }

  // Apply cartoon filter ON the already-drawn pixels — no second image load
  if (cartoonize) {
    const { cartoonizePixels } = await import("./cartoonize");
    const raw = ctx.getImageData(0, 0, W, H);
    const filtered = cartoonizePixels(raw.data, W, H);
    ctx.putImageData(new ImageData(new Uint8ClampedArray(filtered.buffer as ArrayBuffer), W, H), 0, 0);
  }

  const basePixels = ctx.getImageData(0, 0, W, H);

  const numSlots = template.slots.length;
  const animFrames = numSlots * FRAMES_PER_SLOT;
  const totalFrames = animFrames + HOLD_FRAMES;
  const holdFrameDelay = Math.round(HOLD_DELAY / HOLD_FRAMES);

  const gif = GIFEncoder();

  for (let frame = 0; frame < totalFrames; frame++) {
    ctx.putImageData(basePixels, 0, 0);

    for (let si = 0; si < numSlots; si++) {
      const slot = template.slots[si];
      const text = texts[si] ?? slot.placeholder;
      const slotStart = si * FRAMES_PER_SLOT;
      const slotEnd = slotStart + FRAMES_PER_SLOT;

      let ratio: number;
      if (frame >= animFrames || frame >= slotEnd) {
        ratio = 1;
      } else if (frame < slotStart) {
        ratio = 0;
      } else {
        ratio = (frame - slotStart + 1) / FRAMES_PER_SLOT;
      }

      if (ratio > 0) {
        const scaledSlot = {
          ...slot,
          fontSize: Math.round(slot.fontSize * scale),
          strokeWidth: slot.strokeWidth * scale,
        };
        drawTextSlot(ctx, scaledSlot, text.slice(0, Math.ceil(text.length * ratio)), W, H);
      }
    }

    const pixels = ctx.getImageData(0, 0, W, H);
    const palette = quantize(pixels.data, 256);
    const index = applyPalette(pixels.data, palette);
    gif.writeFrame(index, W, H, {
      palette,
      delay: frame >= animFrames ? holdFrameDelay : FRAME_DELAY,
    });
  }

  gif.finish();
  const bytes = gif.bytes();
  const plain = new Uint8Array(bytes).buffer as ArrayBuffer;
  return new Blob([plain], { type: "image/gif" });
}
