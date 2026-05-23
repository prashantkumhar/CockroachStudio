"use client";

type Props = {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
};

export default function FadeImage({ src, alt, className = "", loading = "lazy" }: Props) {
  return (
    <div className="relative aspect-square w-full bg-surface-container-high">
      <div className="absolute inset-0 animate-pulse bg-surface-container-high" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        className={`absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300 ${className}`}
        onLoad={(e) => { e.currentTarget.style.opacity = "1"; }}
      />
    </div>
  );
}
