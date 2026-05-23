"use client";

import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
};

export default function FadeImage({ src, alt, className = "", loading = "lazy" }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="relative aspect-square w-full bg-surface-container-high flex flex-col items-center justify-center gap-1">
        <span className="text-3xl opacity-20">🪲</span>
        <span className="text-xs text-on-surface-variant opacity-40">unavailable</span>
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full bg-surface-container-high">
      <div className="absolute inset-0 animate-pulse bg-surface-container-high" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        className={`absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300 ${className}`}
        onLoad={(e) => {
          (e.currentTarget.previousElementSibling as HTMLElement | null)?.remove();
          e.currentTarget.style.opacity = "1";
        }}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
