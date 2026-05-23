"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Stage, Layer, Rect, Image as KonvaImage, Text as KonvaText } from "react-konva";
import type { Node as KonvaNode } from "konva/lib/Node";
import { useStore } from "@/lib/store";
import { templateMap, templates } from "@/lib/templates";
import AppNav from "@/components/ui/AppNav";
import BrandButton from "@/components/ui/BrandButton";

const FONTS = [
  { label: "IMPACT", value: "Impact, Arial Black, sans-serif" },
  { label: "Clean",  value: "Inter, sans-serif" },
  { label: "Comic",  value: "'Comic Sans MS', Comic Neue, cursive" },
];

const COLORS = [
  { label: "White",  value: "#ffffff" },
  { label: "Black",  value: "#0f1729" },
  { label: "Yellow", value: "#ffff00" },
  { label: "Amber",  value: "#ffb783" },
];

const STICKER_EMOJIS = ["😂", "💀", "🔥", "👀", "💯", "🤡", "🪳", "✨", "😭", "🫡"];

type Sticker = { id: string; emoji: string; x: number; y: number; size: number };

export default function MemeEditor() {
  const imageDataUrl = useStore((s) => s.imageDataUrl);
  const suggestions  = useStore((s) => s.suggestions);
  const selectedIdx  = useStore((s) => s.selectedIndex);
  const setPhase     = useStore((s) => s.setPhase);
  const setShared    = useStore((s) => s.setShared);
  const [shareError, setShareError] = useState<string | null>(null);

  const initial = suggestions[selectedIdx];

  const [templateId, setTemplateId] = useState(initial?.templateId ?? "top-bottom");
  const template = templateMap[templateId]!;

  const [texts, setTexts] = useState<string[]>(() =>
    template.slots.map((s, i) => initial?.texts[i] ?? s.placeholder)
  );

  const [stickers, setStickers] = useState<Sticker[]>([]);
  const stickerIdRef = useRef(0);

  const changeTemplate = useCallback((newId: string) => {
    const t = templateMap[newId]!;
    setTemplateId(newId);
    setTexts((prev) => t.slots.map((s, i) => prev[i] ?? s.placeholder));
    setDragPos({});
    setStickers([]);
  }, []);

  const addSticker = useCallback(
    (emoji: string) => {
      const id = String(stickerIdRef.current++);
      setStickers((prev) => [
        ...prev,
        {
          id,
          emoji,
          x: template.canvasWidth * 0.35 + prev.length * 12,
          y: template.canvasHeight * 0.35,
          size: 52,
        },
      ]);
    },
    [template.canvasWidth, template.canvasHeight]
  );

  // Background image
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!imageDataUrl) return;
    const img = new window.Image();
    img.onload = () => setBgImage(img);
    img.src = imageDataUrl;
  }, [imageDataUrl]);

  // Scale stage to container width
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      setScale(Math.min(1, containerRef.current.offsetWidth / template.canvasWidth));
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [template.canvasWidth]);

  // Selected slot
  const [selectedSlot, setSelectedSlot] = useState<number | null>(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Drag positions
  const [dragPos, setDragPos] = useState<Record<number, { x: number; y: number }>>({});

  // Global font + color
  const [fontIdx, setFontIdx] = useState(0);
  const [colorIdx, setColorIdx] = useState(() =>
    (template.slots[0]?.fill ?? "#fff") === "#ffffff" ? 0 : 1
  );

  // Callback ref — set when Stage mounts, null when it unmounts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stage, setStage] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  // Cover crop for background image
  const crop = (() => {
    if (!bgImage) return null;
    const { x, y, width, height, fit } = template.imageLayout;
    const dw = width  * template.canvasWidth;
    const dh = height * template.canvasHeight;
    if (fit === "cover") {
      const s  = Math.max(dw / bgImage.width, dh / bgImage.height);
      const cw = dw / s, ch = dh / s;
      return { x: (bgImage.width - cw) / 2, y: (bgImage.height - ch) / 2, width: cw, height: ch };
    }
    const s = Math.min(dw / bgImage.width, dh / bgImage.height);
    return { x: 0, y: 0, width: bgImage.width / s, height: bgImage.height / s };
  })();

  const exportDataUrl = useCallback(async (): Promise<string> => {
    if (!stage) throw new Error("Canvas not ready");
    if (!bgImage) throw new Error("Image not loaded yet");
    // Give Konva one full frame to flush the image onto the canvas before capture.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    stage.draw();
    return stage.toDataURL({ pixelRatio: 2 });
  }, [stage, bgImage]);

  const handleDownload = async () => {
    setBusy(true);
    const uri = await exportDataUrl();
    const a = document.createElement("a");
    a.download = "memeroach.png";
    a.href = uri;
    a.click();
    setBusy(false);
  };

  const handleCopy = async () => {
    setBusy(true);
    const uri = await exportDataUrl();
    try {
      const blob = await (await fetch(uri)).blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    } catch {
      const a = document.createElement("a");
      a.download = "memeroach.png";
      a.href = uri;
      a.click();
    }
    setBusy(false);
  };

  const handleShare = async () => {
    setBusy(true);
    setShareError(null);
    try {
      // Capture the canvas BEFORE setPhase("exporting") — changing the phase
      // unmounts MemeEditor which destroys the Konva Stage, producing a black export.
      const uri = await exportDataUrl();
      setPhase("exporting");
      const res = await fetch("/api/memes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pngDataUrl: uri, templateId, texts }),
      });
      if (!res.ok) throw new Error("Upload failed");
      const { id, creatorToken } = await res.json();
      setShared(id, creatorToken);
    } catch (err) {
      console.error("[share]", err);
      setPhase("editing");
      setShareError("Failed to share. Check your connection and try again.");
    }
    setBusy(false);
  };

  const font  = FONTS[fontIdx].value;
  const fill  = COLORS[colorIdx].value;
  const W     = template.canvasWidth;
  const H     = template.canvasHeight;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <AppNav
        showThemeToggle={false}
        right={
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setPhase("picking")}
              className="min-h-11 text-sm text-on-surface-variant transition-colors hover:text-secondary"
            >
              ← Back
            </button>
            <p className="text-label-sm text-secondary">Step 3 of 4 — Edit</p>
          </div>
        }
      />

      {/* Template switcher */}
      <div className="flex gap-2 overflow-x-auto px-4 py-2.5 border-b border-outline-variant">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => changeTemplate(t.id)}
            className={[
              "shrink-0 text-xs px-3 py-1.5 rounded-pill border transition-all whitespace-nowrap",
              t.id === templateId
                ? "bg-secondary text-on-secondary border-secondary"
                : "bg-surface-container text-on-surface-variant border-outline-variant hover:border-outline",
            ].join(" ")}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Canvas stage */}
      <div className="flex-1 flex items-start justify-center bg-surface-container-low py-4 px-4">
        <div ref={containerRef} className="w-full max-w-lg">
          <div
            style={{
              width:  W * scale,
              height: H * scale,
              position: "relative",
              overflow: "hidden",
              borderRadius: "var(--radius-bento)",
              boxShadow: "var(--shadow-float)",
            }}
          >
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                width: W,
                height: H,
              }}
            >
              <Stage
                width={W}
                height={H}
                ref={setStage}
                onPointerDown={(e) => { if (e.target === (e.target as KonvaNode).getStage()) setSelectedSlot(null); }}
              >
                <Layer clipX={0} clipY={0} clipWidth={W} clipHeight={H}>
                  {/* Base background (light for text-outside-photo templates) */}
                  <Rect x={0} y={0} width={W} height={H} fill="#f8fafc" />

                  {/* Photo */}
                  {bgImage && crop && (
                    <KonvaImage
                      image={bgImage}
                      x={template.imageLayout.x * W}
                      y={template.imageLayout.y * H}
                      width={template.imageLayout.width  * W}
                      height={template.imageLayout.height * H}
                      crop={crop}
                    />
                  )}

                  {/* Text slots */}
                  {template.slots.map((slot, i) => {
                    const tw    = slot.width * W;
                    const baseX = slot.anchorX * W - tw / 2;
                    // Centre the text block around the anchor point (same logic as renderMeme).
                    // Estimate max wrapped height using maxLines so the block stays in-canvas.
                    const lineH  = slot.fontSize * 1.2;
                    const estH   = slot.maxLines * lineH;
                    const MARGIN = 6;
                    const rawY   = slot.anchorY * H - estH / 2;
                    const baseY  = Math.min(
                      Math.max(rawY, MARGIN),
                      H - estH - MARGIN,
                    );
                    const p     = dragPos[i];
                    const isSelected = selectedSlot === i;

                    return [
                      isSelected && (
                        <Rect
                          key={`sel-${i}`}
                          x={(p?.x ?? baseX) - 6}
                          y={(p?.y ?? baseY) - 6}
                          width={tw + 12}
                          height={slot.fontSize * 2 + 12}
                          stroke="#ffb783"
                          strokeWidth={2}
                          dash={[6, 3]}
                          fill="transparent"
                          listening={false}
                        />
                      ),
                      <KonvaText
                        key={`txt-${templateId}-${i}`}
                        x={p?.x ?? baseX}
                        y={p?.y ?? baseY}
                        width={tw}
                        text={texts[i] ?? slot.placeholder}
                        fontFamily={font}
                        fontSize={slot.fontSize}
                        fontStyle="bold"
                        fill={fill}
                        stroke={fill === "#ffffff" ? "#000000" : (fill === "#ffff00" ? "#000000" : undefined)}
                        strokeWidth={fill === "#ffffff" || fill === "#ffff00" ? 2 : 0}
                        shadowColor="rgba(0,0,0,0.65)"
                        shadowBlur={4}
                        shadowOffsetX={2}
                        shadowOffsetY={2}
                        shadowEnabled={true}
                        align={slot.align}
                        lineHeight={1.2}
                        wrap="word"
                        draggable
                        onDragEnd={(e) =>
                          setDragPos((prev) => ({ ...prev, [i]: { x: e.target.x(), y: e.target.y() } }))
                        }
                        onClick={() => { setSelectedSlot(i); setTimeout(() => inputRef.current?.focus(), 50); }}
                        onTap={() => { setSelectedSlot(i); setTimeout(() => inputRef.current?.focus(), 50); }}
                        perfectDrawEnabled={false}
                      />,
                    ];
                  })}

                  {stickers.map((st) => (
                    <KonvaText
                      key={st.id}
                      text={st.emoji}
                      x={st.x}
                      y={st.y}
                      fontSize={st.size}
                      draggable
                      onDragEnd={(e) =>
                        setStickers((prev) =>
                          prev.map((s) =>
                            s.id === st.id ? { ...s, x: e.target.x(), y: e.target.y() } : s
                          )
                        )
                      }
                    />
                  ))}
                </Layer>
              </Stage>
            </div>
          </div>
        </div>
      </div>

      {/* Edit panel */}
      <div className="border-t border-outline-variant bg-surface-container px-4 pt-3 pb-2 space-y-3">
        {selectedSlot !== null ? (
          <div>
            <label className="text-label-sm uppercase tracking-widest text-on-surface-variant mb-1.5 block">
              Editing text {selectedSlot + 1} / {template.slots.length} — drag to reposition
            </label>
            <textarea
              ref={inputRef}
              rows={2}
              value={texts[selectedSlot] ?? ""}
              placeholder={template.slots[selectedSlot]?.placeholder}
              onChange={(e) =>
                setTexts((prev) => {
                  const n = [...prev];
                  n[selectedSlot] = e.target.value;
                  return n;
                })
              }
              className="w-full bg-surface-container-high border border-outline-variant rounded-btn
                         px-3 py-2 text-on-surface text-sm resize-none
                         focus:outline-none focus:border-secondary transition-colors"
            />
          </div>
        ) : (
          <p className="text-on-surface-variant text-xs text-center py-1">
            Tap any text on the canvas to edit it
          </p>
        )}

        <div className="pb-2">
          <p className="text-label-sm text-on-surface-variant mb-2">Stickers</p>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {STICKER_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => addSticker(emoji)}
                className="flex h-11 min-w-11 shrink-0 items-center justify-center rounded-btn border border-outline-variant
                           bg-surface-container-high text-xl transition-all hover:border-secondary active:scale-95"
                aria-label={`Add ${emoji} sticker`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap pb-1">
          <div className="flex gap-1">
            {FONTS.map((f, i) => (
              <button
                key={f.label}
                onClick={() => setFontIdx(i)}
                style={{ fontFamily: f.value }}
                className={[
                  "px-2.5 py-1 text-xs rounded-btn border transition-all",
                  i === fontIdx
                    ? "bg-secondary text-on-secondary border-secondary"
                    : "bg-surface-container-high text-on-surface-variant border-outline-variant hover:border-outline",
                ].join(" ")}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 ml-auto items-center">
            <span className="text-on-surface-variant text-xs">Color:</span>
            {COLORS.map((c, i) => (
              <button
                key={c.value}
                onClick={() => setColorIdx(i)}
                title={c.label}
                style={{ backgroundColor: c.value }}
                className={[
                  "w-6 h-6 rounded-full border-2 transition-all",
                  i === colorIdx
                    ? "border-secondary scale-125"
                    : "border-outline-variant hover:scale-110",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
      </div>

      {shareError && (
        <p className="border-t border-error/20 bg-error-container/20 px-4 py-2 text-center text-sm text-error">
          {shareError}
        </p>
      )}

      <div className="flex gap-2 border-t border-outline-variant bg-surface px-4 py-3">
        <BrandButton
          variant="ghost"
          className="flex-1"
          onClick={handleDownload}
          disabled={busy || !stage}
        >
          ⬇ Save
        </BrandButton>
        <BrandButton
          variant="ghost"
          className="flex-1"
          onClick={handleCopy}
          disabled={busy || !stage}
        >
          📋 Copy
        </BrandButton>
        <BrandButton
          variant="primary"
          className="flex-1"
          onClick={handleShare}
          disabled={busy || !stage}
        >
          {busy ? "..." : !stage ? "Loading..." : "🔗 Share"}
        </BrandButton>
      </div>
    </div>
  );
}
