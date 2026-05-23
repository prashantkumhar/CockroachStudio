"use client";

import { useState, useEffect, useRef } from "react";

const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 1500;

type Props = {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
};

export default function FadeImage({ src, alt, className = "", loading = "lazy" }: Props) {
  const [imgSrc, setImgSrc] = useState(src);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imgRef   = useRef<HTMLImageElement>(null);
  const retryRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset retries/failed when the src prop changes
  useEffect(() => {
    retryRef.current = 0;
    setFailed(false);
    setImgSrc(src);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [src]);

  // After every imgSrc change (initial mount + retries):
  // check if the browser already loaded the image before onLoad was attached.
  // Also handles SSR hydration race where the image completes before React mounts.
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    } else {
      setLoaded(false);
    }
  }, [imgSrc]);

  const handleError = () => {
    if (retryRef.current < MAX_RETRIES) {
      retryRef.current += 1;
      timerRef.current = setTimeout(() => {
        setImgSrc(`${src}${src.includes("?") ? "&" : "?"}_r=${retryRef.current}`);
      }, RETRY_DELAY_MS * retryRef.current);
    } else {
      setFailed(true);
    }
  };

  if (failed) {
    return (
      <div className="relative aspect-square w-full bg-surface-container-high flex flex-col items-center justify-center gap-1">
        <span className="text-3xl opacity-20">🪲</span>
        <span className="text-xs text-on-surface-variant opacity-40">unavailable</span>
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden bg-surface-container-high">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-outline-variant border-t-secondary animate-spin" />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        key={imgSrc}
        src={imgSrc}
        alt={alt}
        loading={loading}
        className={`absolute inset-0 h-full w-full ${className} ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        onError={handleError}
      />
    </div>
  );
}
