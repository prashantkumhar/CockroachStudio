"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import AppNav from "@/components/ui/AppNav";
import BrandButton from "@/components/ui/BrandButton";
import PageHeader from "@/components/ui/PageHeader";
import BentoCard from "@/components/ui/BentoCard";
import WebcamCapture from "@/components/WebcamCapture";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_MB,
  fileFromClipboardItem,
  readFileAsDataUrl,
  validateImageFile,
} from "@/lib/processImageFile";

export default function UploadZone() {
  const setImage = useStore((s) => s.setImage);
  const remixPreset = useStore((s) => s.remixPreset);
  const storeError = useStore((s) => s.error);
  const setStoreError = useStore((s) => s.setError);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasteHint, setPasteHint] = useState<string | null>(null);
  const [webcamOpen, setWebcamOpen] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const applyDataUrl = useCallback(
    (dataUrl: string) => {
      setError(null);
      setStoreError(null);
      setImage(dataUrl);
    },
    [setImage, setStoreError]
  );

  const processFile = useCallback(
    async (file: File) => {
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        applyDataUrl(dataUrl);
      } catch {
        setError("Could not read that image. Try another file.");
      }
    },
    [applyDataUrl]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile]
  );

  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items?.length) return;

      for (const item of items) {
        if (item.kind !== "file") continue;
        const file = item.getAsFile();
        if (file?.type.startsWith("image/")) {
          e.preventDefault();
          await processFile(file);
          setPasteHint("Pasted from clipboard!");
          setTimeout(() => setPasteHint(null), 2500);
          return;
        }
      }

      if (navigator.clipboard?.read) {
        try {
          const clipboardItems = await navigator.clipboard.read();
          for (const clipItem of clipboardItems) {
            const file = await fileFromClipboardItem(clipItem);
            if (file) {
              e.preventDefault();
              await processFile(file);
              setPasteHint("Pasted from clipboard!");
              setTimeout(() => setPasteHint(null), 2500);
              return;
            }
          }
        } catch {
          /* clipboard.read may require permission */
        }
      }
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [processFile]);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <AppNav />

      <main className="mx-auto flex w-full max-w-page flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
        <PageHeader
          align="center"
          eyebrow="Memeroach"
          title={
            <>
              The meme maker that{" "}
              <span className="text-secondary">doesn&apos;t suck.</span>
            </>
          }
          description={
            remixPreset
              ? "Remix mode — add your photo and we’ll reuse the same template & captions."
              : "Drop, paste, or snap a photo. AI picks 6 formats. You pick one."
          }
        />

        {remixPreset && (
          <p className="mt-4 rounded-bento border border-tertiary/40 bg-tertiary-container/30 px-4 py-2 text-center text-sm text-tertiary">
            ♻️ Remixing: <span className="font-semibold">{remixPreset.templateId}</span> template
          </p>
        )}

        <BentoCard
          as="article"
          className={[
            "mt-8 w-full max-w-lg cursor-pointer select-none overflow-hidden p-0",
            "border-2 border-dashed transition-all duration-200",
            dragging
              ? "scale-[1.01] border-secondary bg-surface-container-high"
              : "border-outline-variant hover:border-outline hover:bg-surface-container-high",
          ].join(" ")}
        >
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload image"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => galleryRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && galleryRef.current?.click()}
            className="flex flex-col items-center justify-center gap-4 p-8 sm:p-12"
          >
            <div
              className={[
                "flex h-16 w-16 items-center justify-center rounded-full text-3xl transition-colors",
                dragging
                  ? "bg-secondary-container text-secondary"
                  : "bg-surface-container-high text-on-surface-variant",
              ].join(" ")}
            >
              {dragging ? "🪲" : "📤"}
            </div>

            <div className="text-center">
              <p className="font-display text-lg font-semibold text-on-surface">
                {dragging ? "Drop it like it's hot" : "Drop your photo here"}
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                or tap to choose · paste with Ctrl+V / ⌘V
              </p>
            </div>

            <div className="flex w-full max-w-xs flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
              <BrandButton
                variant="primary"
                className="sm:flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  galleryRef.current?.click();
                }}
              >
                📁 Gallery
              </BrandButton>
              <BrandButton
                variant="outline"
                className="sm:flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setWebcamOpen(true);
                }}
              >
                📷 Webcam
              </BrandButton>
              <BrandButton
                variant="ghost"
                className="sm:flex-1 md:hidden"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraRef.current?.click();
                }}
              >
                🤳 Camera
              </BrandButton>
            </div>

            <p className="text-xs text-on-surface-variant">
              JPG, PNG, WEBP, GIF · Max {MAX_IMAGE_SIZE_MB}MB
            </p>
          </div>
        </BentoCard>

        {(error || storeError || pasteHint) && (
          <p
            className={[
              "mt-4 rounded-btn border px-4 py-2 text-sm text-center max-w-sm",
              error || storeError
                ? "border-error/30 bg-error-container/20 text-error"
                : "border-secondary/30 bg-secondary-container/20 text-secondary",
            ].join(" ")}
          >
            {error ?? storeError ?? pasteHint}
          </p>
        )}

        <input
          ref={galleryRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          className="hidden"
          onChange={onFileChange}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onFileChange}
        />

        <p className="mt-8 max-w-sm text-center text-xs text-on-surface-variant">
          Works best with photos of people, situations, or anything with a story.
          Desktop: drag a file or paste a screenshot. Phone: use Camera for the native lens.
        </p>
      </main>

      <WebcamCapture
        open={webcamOpen}
        onClose={() => setWebcamOpen(false)}
        onCapture={applyDataUrl}
      />
    </div>
  );
}
