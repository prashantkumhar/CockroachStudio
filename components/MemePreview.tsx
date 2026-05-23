"use client";

import { useEffect, useRef } from "react";
import { renderMeme } from "@/lib/renderMeme";
import { templateMap } from "@/lib/templates";

type Props = {
  templateId: string;
  imageDataUrl: string;
  texts: string[];
  onClick?: () => void;
  selected?: boolean;
};

export default function MemePreview({ templateId, imageDataUrl, texts, onClick, selected }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const template = templateMap[templateId];

  useEffect(() => {
    if (!canvasRef.current || !template) return;
    renderMeme(canvasRef.current, { template, imageDataUrl, texts }).catch(console.error);
  }, [template, imageDataUrl, texts]);

  if (!template) {
    return (
      <div className="aspect-square bg-surface-container-high rounded-bento flex items-center justify-center">
        <span className="text-on-surface-variant text-xs">Unknown template</span>
      </div>
    );
  }

  const aspectRatio = template.canvasWidth / template.canvasHeight;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group w-full rounded-bento border-2 overflow-hidden transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary",
        "hover:-translate-y-0.5 active:scale-[0.98]",
        selected
          ? "border-secondary shadow-[0_0_0_3px_rgb(var(--secondary)/0.3)]"
          : "border-outline-variant hover:border-outline",
      ].join(" ")}
      style={{ aspectRatio }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-auto block"
        width={template.canvasWidth}
        height={template.canvasHeight}
      />
    </button>
  );
}
