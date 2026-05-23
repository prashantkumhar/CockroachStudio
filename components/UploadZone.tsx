"use client";

import { useCallback, useRef, useState } from "react";
import { useStore } from "@/lib/store";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 10;

export default function UploadZone() {
  const setImage = useStore((s) => s.setImage);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Only JPG, PNG, WEBP, or GIF images are supported.");
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`Image must be under ${MAX_SIZE_MB}MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setImage(dataUrl);
      };
      reader.readAsDataURL(file);
    },
    [setImage]
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
    },
    [processFile]
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-surface">
      {/* Header */}
      <div className="mb-10 text-center">
        <p className="text-label-sm uppercase tracking-widest text-secondary mb-3">Memeroach</p>
        <h1 className="font-display text-4xl font-bold text-on-surface mb-3">
          The meme maker that{" "}
          <span className="text-secondary">doesn&apos;t suck.</span>
        </h1>
        <p className="text-on-surface-variant text-base max-w-sm mx-auto">
          Drop your photo. AI picks 6 formats. You pick one. Chaos ensues.
        </p>
      </div>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload image"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={[
          "w-full max-w-lg rounded-bento border-2 border-dashed p-12",
          "flex flex-col items-center justify-center gap-4 cursor-pointer",
          "transition-all duration-200 select-none",
          dragging
            ? "border-secondary bg-surface-container-high scale-[1.01]"
            : "border-outline-variant bg-surface-container hover:border-outline hover:bg-surface-container-high",
        ].join(" ")}
      >
        {/* Icon */}
        <div className={[
          "w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-colors",
          dragging ? "bg-secondary-container text-secondary" : "bg-surface-container-high text-on-surface-variant",
        ].join(" ")}>
          {dragging ? "🪲" : "📤"}
        </div>

        <div className="text-center">
          <p className="font-display font-semibold text-on-surface text-lg">
            {dragging ? "Drop it like it's hot" : "Drop your photo here"}
          </p>
          <p className="text-on-surface-variant text-sm mt-1">
            or tap to choose from gallery
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
          className="mt-2 bg-secondary text-on-secondary font-semibold px-6 py-2.5 rounded-btn text-sm
                     hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
        >
          Choose Photo
        </button>

        <p className="text-on-surface-variant text-xs">JPG, PNG, WEBP · Max {MAX_SIZE_MB}MB</p>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-4 text-sm text-error bg-error-container/20 border border-error/30 rounded-btn px-4 py-2">
          {error}
        </p>
      )}

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={onFileChange}
        capture="environment"
      />

      {/* Footer hint */}
      <p className="mt-8 text-on-surface-variant text-xs text-center max-w-xs">
        Works best with photos of people, situations, or anything with a story.<br />
        Cats optional but highly recommended.
      </p>
    </div>
  );
}
