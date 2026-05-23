/** Resize/compress before API upload — avoids Vercel body limits & LLM timeouts from huge webcam shots. */

const DEFAULT_MAX_EDGE = 1280;
const DEFAULT_QUALITY = 0.82;

export type CompressedImage = {
  dataUrl: string;
  mimeType: string;
  base64: string;
  width: number;
  height: number;
};

export function compressImageDataUrl(
  dataUrl: string,
  options?: { maxEdge?: number; quality?: number }
): Promise<CompressedImage> {
  const maxEdge = options?.maxEdge ?? DEFAULT_MAX_EDGE;
  const quality = options?.quality ?? DEFAULT_QUALITY;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (!width || !height) {
        reject(new Error("Invalid image dimensions"));
        return;
      }

      const scale = Math.min(1, maxEdge / Math.max(width, height));
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      const out = canvas.toDataURL("image/jpeg", quality);
      const comma = out.indexOf(";base64,");
      if (comma === -1) {
        reject(new Error("Invalid data URL"));
        return;
      }

      const mimeType = out.slice(5, comma); // strip "data:"
      const base64 = out.slice(comma + 8);

      resolve({ dataUrl: out, mimeType, base64, width, height });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}
