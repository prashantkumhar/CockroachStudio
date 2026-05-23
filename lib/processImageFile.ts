export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const MAX_IMAGE_SIZE_MB = 10;

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return "Only JPG, PNG, WEBP, or GIF images are supported.";
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return `Image must be under ${MAX_IMAGE_SIZE_MB}MB.`;
  }
  return null;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function fileFromClipboardItem(item: ClipboardItem): Promise<File | null> {
  for (const type of ACCEPTED_IMAGE_TYPES) {
    if (item.types.includes(type)) {
      const blob = await item.getType(type);
      const ext = type.split("/")[1] ?? "png";
      return new File([blob], `pasted.${ext}`, { type });
    }
  }
  return null;
}
