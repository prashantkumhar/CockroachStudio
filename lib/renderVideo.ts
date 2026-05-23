import { drawTextSlot } from "./renderMeme";
import type { RenderConfig } from "./renderMeme";

const FPS = 30;
const PRE_FRAMES  = 10; // image zoom-punch before any text
const SLOT_FRAMES = 20; // frames per text slot (drop → squash → stretch → settle)
const HOLD_FRAMES = 46; // hold completed meme

// ─── Easing helpers ──────────────────────────────────────────────────────────

function easeInQuad(t: number) { return t * t; }

function easeOutBack(t: number) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// ─── Cartoon squash-and-stretch per slot ─────────────────────────────────────
//
// t = 0→1 across the slot's SLOT_FRAMES window
// Returns { sx, sy, oy } where oy is a Y-offset in canvas pixels

const FALL_END    = 0.40; // fraction: gravity drop
const SQUASH_END  = 0.58; // fraction: flatten on landing
const STRETCH_END = 0.76; // fraction: spring back up
// 0.76→1.0 : damped wobble settling

function cartoonAnim(t: number): { sx: number; sy: number; oy: number } {
  const DROP_PX = 300; // starts this many px above anchor

  if (t <= 0) return { sx: 1, sy: 1, oy: -DROP_PX };

  if (t < FALL_END) {
    const p = t / FALL_END;
    return { sx: 1, sy: 1, oy: -(1 - easeInQuad(p)) * DROP_PX };
  }

  if (t < SQUASH_END) {
    const p = (t - FALL_END) / (SQUASH_END - FALL_END);
    const q = Math.sin(p * Math.PI); // arc 0→1→0
    return { sx: 1 + q * 0.42, sy: 1 - q * 0.42, oy: q * 8 };
  }

  if (t < STRETCH_END) {
    const p = (t - SQUASH_END) / (STRETCH_END - SQUASH_END);
    const q = Math.sin(p * Math.PI);
    return { sx: 1 - q * 0.2, sy: 1 + q * 0.26, oy: -q * 12 };
  }

  // Damped oscillation settling
  const p = (t - STRETCH_END) / (1 - STRETCH_END);
  const osc = Math.sin(p * Math.PI * 3.5) * Math.pow(1 - p, 1.5) * 0.07;
  return { sx: 1 + osc, sy: 1 - osc, oy: 0 };
}

// ─── Impact burst (8 lines radiate out when text lands) ──────────────────────

function drawImpact(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  progress: number   // 0=just landed, 1=gone
) {
  if (progress >= 1) return;
  const count   = 8;
  const maxLen  = 36;
  const inner   = 14;
  const alpha   = Math.max(0, 1 - progress * 1.6);
  const len     = maxLen * progress;

  ctx.save();
  ctx.strokeStyle = `rgba(255,220,30,${alpha})`;
  ctx.lineWidth   = 3.5;
  ctx.lineCap     = "round";
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.PI / count;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner,       cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * (inner + len), cy + Math.sin(angle) * (inner + len));
    ctx.stroke();
  }
  ctx.restore();
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export function isVideoSupported(): boolean {
  return (
    typeof HTMLCanvasElement !== "undefined" &&
    typeof (HTMLCanvasElement.prototype as unknown as { captureStream?: unknown }).captureStream === "function" &&
    typeof MediaRecorder !== "undefined"
  );
}

export async function renderMemeVideo(config: RenderConfig): Promise<Blob> {
  const { template, imageDataUrl, texts } = config;
  const W = template.canvasWidth;
  const H = template.canvasHeight;

  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload  = () => resolve(image);
    image.onerror = reject;
    image.src = imageDataUrl;
  });

  const mimeType =
    ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find(
      (m) => MediaRecorder.isTypeSupported(m)
    ) ?? "video/webm";

  const stream = (canvas as unknown as { captureStream: (fps: number) => MediaStream }).captureStream(FPS);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.start(50);

  const numSlots   = template.slots.length;
  const totalFrames = PRE_FRAMES + numSlots * SLOT_FRAMES + HOLD_FRAMES;

  // Draw the base image with an optional zoom scale
  function drawBase(zoom = 1) {
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, W, H);

    const { x, y, width, height, fit } = template.imageLayout;
    const dx = x * W, dy = y * H, dw = width * W, dh = height * H;

    ctx.save();
    // Zoom around the centre of the image region
    const imgCx = dx + dw / 2;
    const imgCy = dy + dh / 2;
    ctx.translate(imgCx, imgCy);
    ctx.scale(zoom, zoom);
    ctx.translate(-imgCx, -imgCy);

    if (fit === "cover") {
      const s = Math.max(dw / img.width, dh / img.height);
      const sw = dw / s, sh = dh / s;
      ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, dx, dy, dw, dh);
    } else {
      const s  = Math.min(dw / img.width, dh / img.height);
      const sw = img.width * s, sh = img.height * s;
      ctx.drawImage(img, dx + (dw - sw) / 2, dy + (dh - sh) / 2, sw, sh);
    }

    ctx.restore();
  }

  await new Promise<void>((resolve) => {
    let frame = 0;

    const id = setInterval(() => {
      // ── PRE_FRAMES: image punches in from 1.25× to 1.0 ──
      const imageZoom = frame < PRE_FRAMES
        ? 1.25 - 0.25 * easeOutBack(frame / PRE_FRAMES)
        : 1;

      drawBase(imageZoom);

      // ── Text slots (staggered, start after PRE_FRAMES) ──
      for (let si = 0; si < numSlots; si++) {
        const slot      = template.slots[si];
        const text      = texts[si] ?? slot.placeholder;
        const slotStart = PRE_FRAMES + si * SLOT_FRAMES;
        const slotEnd   = slotStart + SLOT_FRAMES;

        // Normalised 0→1 progress within this slot's window
        let rawT: number;
        if (frame >= PRE_FRAMES + numSlots * SLOT_FRAMES || frame >= slotEnd) {
          rawT = 1;
        } else if (frame < slotStart) {
          continue; // not yet
        } else {
          rawT = (frame - slotStart + 1) / SLOT_FRAMES;
        }

        const { sx, sy, oy } = cartoonAnim(rawT);

        const anchorCx = slot.anchorX * W;
        const anchorCy = slot.anchorY * H;

        ctx.save();
        ctx.translate(anchorCx, anchorCy + oy);
        ctx.scale(sx, sy);
        ctx.translate(-anchorCx, -anchorCy);
        drawTextSlot(ctx, slot, text, W, H);
        ctx.restore();

        // Impact burst fires around the squash phase
        if (rawT >= FALL_END && rawT < SQUASH_END + 0.05) {
          const burstT = (rawT - FALL_END) / (SQUASH_END - FALL_END + 0.05);
          drawImpact(ctx, anchorCx, anchorCy, burstT);
        }
      }

      frame++;
      if (frame >= totalFrames) {
        clearInterval(id);
        resolve();
      }
    }, 1000 / FPS);
  });

  await new Promise((r) => setTimeout(r, 300));
  recorder.stop();

  return new Promise((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
  });
}
