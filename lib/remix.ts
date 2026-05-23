import type { RemixPreset } from "@/lib/store";

const STORAGE_KEY = "memeroach-remix";

export function stashRemixPreset(preset: RemixPreset) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(preset));
}

export function consumeRemixPreset(): RemixPreset | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(STORAGE_KEY);
  try {
    const preset = JSON.parse(raw) as RemixPreset;
    if (preset.templateId && Array.isArray(preset.texts)) return preset;
  } catch {
    /* ignore */
  }
  return null;
}
