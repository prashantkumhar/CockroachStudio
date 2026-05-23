// Client-side cartoon filter — no API, no cost.
// Pipeline: box-blur (removes texture) → posterize + saturate (flat cel colors) → Sobel edge overlay (dark outlines)

// ─── Color helpers ───────────────────────────────────────────────────────────

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

// ─── Separable box blur O(n·r) ────────────────────────────────────────────────

function boxBlurH(src: Uint8ClampedArray, dst: Uint8ClampedArray, W: number, H: number, r: number) {
  for (let y = 0; y < H; y++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0;
      for (let x = -r; x <= r; x++) sum += src[(y * W + Math.max(x, 0)) * 4 + c];
      const inv = 1 / (2 * r + 1);
      for (let x = 0; x < W; x++) {
        dst[(y * W + x) * 4 + c] = sum * inv;
        const lo = Math.max(x - r, 0), hi = Math.min(x + r + 1, W - 1);
        sum += src[(y * W + hi) * 4 + c] - src[(y * W + lo) * 4 + c];
      }
    }
    for (let x = 0; x < W; x++) dst[(y * W + x) * 4 + 3] = src[(y * W + x) * 4 + 3];
  }
}

function boxBlurV(src: Uint8ClampedArray, dst: Uint8ClampedArray, W: number, H: number, r: number) {
  for (let x = 0; x < W; x++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0;
      for (let y = -r; y <= r; y++) sum += src[(Math.max(y, 0) * W + x) * 4 + c];
      const inv = 1 / (2 * r + 1);
      for (let y = 0; y < H; y++) {
        dst[(y * W + x) * 4 + c] = sum * inv;
        const lo = Math.max(y - r, 0), hi = Math.min(y + r + 1, H - 1);
        sum += src[(hi * W + x) * 4 + c] - src[(lo * W + x) * 4 + c];
      }
    }
  }
}

function blurPass(data: Uint8ClampedArray, W: number, H: number, r: number): Uint8ClampedArray {
  const tmp = new Uint8ClampedArray(data.length);
  const out = new Uint8ClampedArray(data.length);
  boxBlurH(data, tmp, W, H, r);
  boxBlurV(tmp, out, W, H, r);
  return out;
}

// ─── Core filter — takes raw RGBA pixels, returns cartoonized RGBA pixels ────

export function cartoonizePixels(src: Uint8ClampedArray, W: number, H: number): Uint8ClampedArray {
  // 1. Smooth twice — kills texture, preserves shapes
  const smooth = blurPass(blurPass(src, W, H, 3), W, H, 2);

  // 2. Posterize to 6 light levels + boost saturation
  const COLOR_LEVELS = 6;
  const SAT_BOOST = 1.65;
  const cel = new Uint8ClampedArray(smooth.length);
  for (let i = 0; i < smooth.length; i += 4) {
    const [h, s, l] = rgbToHsl(smooth[i], smooth[i + 1], smooth[i + 2]);
    const [r, g, b] = hslToRgb(h, Math.min(1, s * SAT_BOOST), Math.round(l * COLOR_LEVELS) / COLOR_LEVELS);
    cel[i] = r; cel[i + 1] = g; cel[i + 2] = b; cel[i + 3] = smooth[i + 3];
  }

  // 3. Sobel edge detection on original grayscale → dark outlines
  const gray = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    gray[i] = 0.299 * src[i * 4] + 0.587 * src[i * 4 + 1] + 0.114 * src[i * 4 + 2];
  }

  const EDGE_THRESH = 60;
  const out = new Uint8ClampedArray(cel);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const gx =
        -gray[(y - 1) * W + (x - 1)] + gray[(y - 1) * W + (x + 1)]
        - 2 * gray[y * W + (x - 1)] + 2 * gray[y * W + (x + 1)]
        - gray[(y + 1) * W + (x - 1)] + gray[(y + 1) * W + (x + 1)];
      const gy =
        -gray[(y - 1) * W + (x - 1)] - 2 * gray[(y - 1) * W + x] - gray[(y - 1) * W + (x + 1)]
        + gray[(y + 1) * W + (x - 1)] + 2 * gray[(y + 1) * W + x] + gray[(y + 1) * W + (x + 1)];
      if (Math.sqrt(gx * gx + gy * gy) > EDGE_THRESH) {
        const idx = (y * W + x) * 4;
        out[idx] = 18; out[idx + 1] = 18; out[idx + 2] = 28;
      }
    }
  }
  return out;
}
