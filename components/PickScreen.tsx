"use client";

import { useStore } from "@/lib/store";
import MemePreview from "./MemePreview";
import { templateMap } from "@/lib/templates";
import AppNav from "@/components/ui/AppNav";
import BrandButton from "@/components/ui/BrandButton";
import PageHeader from "@/components/ui/PageHeader";

export default function PickScreen() {
  const imageDataUrl = useStore((s) => s.imageDataUrl);
  const suggestions = useStore((s) => s.suggestions);
  const selectedIndex = useStore((s) => s.selectedIndex);
  const selectSuggestion = useStore((s) => s.selectSuggestion);
  const setPhase = useStore((s) => s.setPhase);

  if (!imageDataUrl) return null;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <AppNav
        step={2}
        right={
          <button
            type="button"
            onClick={() => setPhase("upload")}
            className="min-h-11 text-sm text-on-surface-variant transition-colors hover:text-secondary"
          >
            ← New photo
          </button>
        }
      />

      <main className="mx-auto w-full max-w-page px-4 py-8 sm:px-8">
        <PageHeader
          eyebrow="Step 2 of 4"
          title="Pick your meme"
          description="AI picked these based on your photo. Choose one to edit."
        />

        <div className="mt-8 grid grid-cols-1 gap-bento-gap sm:grid-cols-2 lg:grid-cols-12">
          {suggestions.map((suggestion, i) => {
            const template = templateMap[suggestion.templateId];
            return (
              <div key={i} className="flex flex-col gap-2 lg:col-span-4 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                <MemePreview
                  templateId={suggestion.templateId}
                  imageDataUrl={imageDataUrl}
                  texts={suggestion.texts}
                  selected={selectedIndex === i}
                  onClick={() => selectSuggestion(i)}
                />
                <div className="px-1">
                  <p className="truncate text-xs font-semibold leading-tight text-on-surface">
                    {template?.name ?? suggestion.templateId}
                  </p>
                  <p className="mt-0.5 truncate text-xs leading-tight text-on-surface-variant">
                    {suggestion.tone}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <BrandButton
            fullWidth
            className="max-w-xs"
            onClick={() => selectSuggestion(selectedIndex)}
          >
            Edit this meme →
          </BrandButton>
          <BrandButton
            variant="ghost"
            className="max-w-xs"
            onClick={() => selectSuggestion(0)}
          >
            🎰 I&apos;m feeling lucky
          </BrandButton>
          <p className="text-xs text-on-surface-variant">
            Lucky picks the first suggestion · swap templates in the editor
          </p>
        </div>
      </main>
    </div>
  );
}
