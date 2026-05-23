"use client";

import { useEffect, useState } from "react";
import AppNav from "@/components/ui/AppNav";
import { useStore } from "@/lib/store";

const MESSAGES = [
  "Reading reaction energy...",
  "Matching the strongest meme formats...",
  "Writing sharper caption angles...",
  "Trying not to make it cringe...",
  "Testing whether this deserves group chat forwarding...",
  "Turning expressions into punchlines...",
];

const PROGRESS_STEPS = [
  "Analyzing the image",
  "Picking the best meme formats",
  "Writing caption options",
] as const;

export default function LoadingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);
  const setPhase = useStore((s) => s.setPhase);
  const imageDataUrl = useStore((s) => s.imageDataUrl);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 1600);
    return () => clearInterval(id);
  }, []);

  const activeStep = Math.min(
    PROGRESS_STEPS.length - 1,
    msgIndex % (PROGRESS_STEPS.length + 1),
  );

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="sticky top-0 z-50 bg-surface">
        <AppNav step={2} sticky={false} />
        <div className="border-b border-outline-variant/70 bg-surface/95 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-page justify-start px-4 py-2 sm:px-8 sm:py-3">
            <button
              type="button"
              onClick={() => setPhase("upload")}
              className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-on-surface-variant transition-colors hover:text-secondary"
            >
              <span aria-hidden>←</span>
              <span>Back to upload</span>
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-page flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
        {/* Photo preview with scanning overlay */}
        {imageDataUrl ? (
          <div className="relative mb-8 w-48 overflow-hidden rounded-bento border-2 border-secondary/40 shadow-float sm:w-56">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageDataUrl}
              alt="Your photo"
              className="w-full object-contain"
            />
            {/* Animated scan line */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="scan-line absolute left-0 right-0 h-0.5 bg-secondary/70 shadow-[0_0_8px_2px_rgba(255,183,131,0.6)]" />
            </div>
            {/* Amber corner brackets */}
            <span className="absolute left-1.5 top-1.5 h-4 w-4 border-l-2 border-t-2 border-secondary" />
            <span className="absolute right-1.5 top-1.5 h-4 w-4 border-r-2 border-t-2 border-secondary" />
            <span className="absolute bottom-1.5 left-1.5 h-4 w-4 border-b-2 border-l-2 border-secondary" />
            <span className="absolute bottom-1.5 right-1.5 h-4 w-4 border-b-2 border-r-2 border-secondary" />
          </div>
        ) : (
          <div className="relative mb-8">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-outline-variant border-t-secondary" />
            <span className="absolute inset-0 flex items-center justify-center text-2xl">
              🪲
            </span>
          </div>
        )}

        <div className="max-w-md rounded-bento border border-outline-variant bg-surface-container px-5 py-4 text-center shadow-float">
          <p className="font-display text-xl font-semibold text-on-surface">
            Generating meme directions...
          </p>
          <p className="mt-1 text-sm text-on-surface-variant">
            We&apos;re reading the image, choosing formats, and writing
            captions.
          </p>

          <div className="mt-4 space-y-2 text-left">
            {PROGRESS_STEPS.map((step, index) => {
              const isDone = index < activeStep;
              const isActive = index === activeStep;
              return (
                <div
                  key={step}
                  className={[
                    "flex items-center gap-3 rounded-btn border px-3 py-2 transition-colors",
                    isActive
                      ? "border-secondary/50 bg-secondary-container/15"
                      : isDone
                        ? "border-tertiary/30 bg-tertiary-container/10"
                        : "border-outline-variant bg-surface-container-high/50",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                      isDone
                        ? "bg-tertiary text-on-tertiary"
                        : isActive
                          ? "bg-secondary text-on-secondary"
                          : "bg-surface-container-highest text-on-surface-variant",
                    ].join(" ")}
                  >
                    {isDone ? "✓" : index + 1}
                  </span>
                  <span
                    className={[
                      "text-sm",
                      isActive || isDone
                        ? "text-on-surface"
                        : "text-on-surface-variant",
                    ].join(" ")}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          <p
            key={msgIndex}
            className="mt-4 animate-fade-in text-xs text-on-surface-variant"
          >
            {MESSAGES[msgIndex]}
          </p>
        </div>

        {/* Skeleton suggestion cards */}
        <div className="mt-12 grid w-full max-w-2xl grid-cols-1 gap-bento-gap px-4 sm:grid-cols-2 lg:grid-cols-12">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-bento border border-outline-variant bg-surface-container lg:col-span-4"
            >
              <div className="relative aspect-square animate-pulse bg-surface-container-high">
                <div className="absolute inset-x-3 top-3 h-4 rounded-pill bg-surface-container-highest/80" />
                <div className="absolute inset-x-6 bottom-4 h-4 rounded-pill bg-surface-container-highest/80" />
              </div>
              <div className="space-y-2 p-3">
                <div className="h-3 w-3/4 animate-pulse rounded-pill bg-surface-container-high" />
                <div className="h-2.5 w-1/2 animate-pulse rounded-pill bg-surface-container-high" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
