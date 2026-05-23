"use client";

import { useStore } from "@/lib/store";
import MemePreview from "./MemePreview";
import { templateMap } from "@/lib/templates";

const CATEGORY_LABELS: Record<string, string> = {
  indian: "🇮🇳 Indian",
  corporate: "💼 Corporate",
  genz: "✨ Gen Z",
  reddit: "👽 Reddit",
  universal: "🌍 Universal",
};

export default function PickScreen() {
  const imageDataUrl = useStore((s) => s.imageDataUrl);
  const suggestions = useStore((s) => s.suggestions);
  const selectedIndex = useStore((s) => s.selectedIndex);
  const selectSuggestion = useStore((s) => s.selectSuggestion);
  const setPhase = useStore((s) => s.setPhase);

  if (!imageDataUrl) return null;

  return (
    <div className="min-h-screen bg-surface px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => setPhase("upload")}
            className="text-on-surface-variant hover:text-secondary text-sm flex items-center gap-1 mb-4 transition-colors"
          >
            ← New photo
          </button>
          <p className="text-label-sm uppercase tracking-widest text-secondary mb-1">Step 2 of 4</p>
          <h1 className="font-display text-2xl font-bold text-on-surface">
            Pick your meme
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            AI picked these based on your photo. Choose one to edit.
          </p>
        </div>

        {/* Preview grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {suggestions.map((suggestion, i) => {
            const template = templateMap[suggestion.templateId];
            return (
              <div key={i} className="flex flex-col gap-2">
                <MemePreview
                  templateId={suggestion.templateId}
                  imageDataUrl={imageDataUrl}
                  texts={suggestion.texts}
                  selected={selectedIndex === i}
                  onClick={() => selectSuggestion(i)}
                />
                {/* Labels */}
                <div className="px-1">
                  <p className="text-on-surface text-xs font-semibold truncate leading-tight">
                    {template?.name ?? suggestion.templateId}
                  </p>
                  <p className="text-on-surface-variant text-xs truncate leading-tight mt-0.5">
                    {suggestion.tone}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={() => selectSuggestion(selectedIndex)}
            className="w-full max-w-xs bg-secondary text-on-secondary font-semibold py-3 rounded-btn
                       hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
          >
            Edit this meme →
          </button>
          <p className="text-on-surface-variant text-xs">
            You can swap templates and edit text in the next step
          </p>
        </div>
      </div>
    </div>
  );
}
