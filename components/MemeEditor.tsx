"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Stage,
  Layer,
  Rect,
  Image as KonvaImage,
  Text as KonvaText,
} from "react-konva";
import type { Node as KonvaNode } from "konva/lib/Node";
import { useStore } from "@/lib/store";
import { templateMap, templates } from "@/lib/templates";
import AppNav from "@/components/ui/AppNav";
import BrandButton from "@/components/ui/BrandButton";
import type { RenderTextStyle } from "@/lib/renderMeme";

const FONTS = [
  { label: "IMPACT", value: "Impact, Arial Black, sans-serif" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Manrope", value: "Manrope, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Trebuchet", value: "'Trebuchet MS', sans-serif" },
  { label: "Comic", value: "'Comic Sans MS', Comic Neue, cursive" },
  { label: "Courier", value: "'Courier New', monospace" },
];

const COLORS = [
  { label: "White", value: "#ffffff" },
  { label: "Ink", value: "#0f1729" },
  { label: "Yellow", value: "#ffff00" },
  { label: "Amber", value: "#ffb783" },
  { label: "Pink", value: "#ff8fb8" },
  { label: "Mint", value: "#b8ffd7" },
  { label: "Sky", value: "#99e6ff" },
  { label: "Violet", value: "#ddb7ff" },
];

const LIGHT_STROKE = "#f8fafc";
const DARK_STROKE = "#0a0a0b";

const STYLE_PRESETS = [
  { label: "Auto", style: null },
  {
    label: "Classic",
    style: { fill: "#ffffff", stroke: DARK_STROKE, strokeWidth: 3 },
  },
  {
    label: "Clean",
    style: { fill: "#0f1729", stroke: "transparent", strokeWidth: 0 },
  },
  {
    label: "Amber Pop",
    style: { fill: "#ffb783", stroke: DARK_STROKE, strokeWidth: 2.5 },
  },
  {
    label: "Neon",
    style: { fill: "#ddb7ff", stroke: DARK_STROKE, strokeWidth: 2.5 },
  },
] as const;

const STICKER_EMOJIS = [
  "😂",
  "💀",
  "🔥",
  "👀",
  "💯",
  "🤡",
  "🪳",
  "✨",
  "😭",
  "🫡",
];

type Sticker = {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
};
type EditorTextStyle = Required<RenderTextStyle>;

function buildDefaultStyle(
  fontFamily: string,
  fontSize: number,
  fill: string,
  stroke: string,
  strokeWidth: number,
): EditorTextStyle {
  return { fontFamily, fontSize, fill, stroke, strokeWidth };
}

function buildTextStyles(
  templateId: string,
  previous: EditorTextStyle[] | undefined,
) {
  const template = templateMap[templateId]!;
  return template.slots.map((slot, index) => {
    const prev = previous?.[index];
    return buildDefaultStyle(
      prev?.fontFamily ?? slot.fontFamily,
      prev?.fontSize ?? slot.fontSize,
      prev?.fill ?? slot.fill,
      prev?.stroke ?? slot.stroke,
      prev?.strokeWidth ?? slot.strokeWidth,
    );
  });
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "").trim();
  if (normalized.length !== 6) return null;
  const value = Number.parseInt(normalized, 16);
  if (Number.isNaN(value)) return null;
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function channelToLinear(channel: number) {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function getHexLuminance(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  const r = channelToLinear(rgb.r);
  const g = channelToLinear(rgb.g);
  const b = channelToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export default function MemeEditor() {
  const imageDataUrl = useStore((s) => s.imageDataUrl);
  const suggestions = useStore((s) => s.suggestions);
  const selectedIdx = useStore((s) => s.selectedIndex);
  const setPhase = useStore((s) => s.setPhase);
  const setShared = useStore((s) => s.setShared);
  const [shareError, setShareError] = useState<string | null>(null);
  const [gifBusy, setGifBusy] = useState(false);
  const [cartoonStatus, setCartoonStatus] = useState<string | null>(null);

  const initial = suggestions[selectedIdx];

  const [templateId, setTemplateId] = useState(
    initial?.templateId ?? "top-bottom",
  );
  const template = templateMap[templateId]!;

  const [texts, setTexts] = useState<string[]>(() =>
    template.slots.map((s, i) => initial?.texts[i] ?? s.placeholder),
  );
  const [textStyles, setTextStyles] = useState<EditorTextStyle[]>(() =>
    buildTextStyles(templateId, undefined),
  );

  const [stickers, setStickers] = useState<Sticker[]>([]);
  const stickerIdRef = useRef(0);

  const changeTemplate = useCallback((newId: string) => {
    const t = templateMap[newId]!;
    setTemplateId(newId);
    setTexts((prev) => t.slots.map((s, i) => prev[i] ?? s.placeholder));
    setTextStyles((prev) => buildTextStyles(newId, prev));
    setSelectedSlot(t.slots.length ? 0 : null);
    setDragPos({});
    setStickers([]);
    setSelectedSticker(null);
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
    [template.canvasWidth, template.canvasHeight],
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
      setScale(
        Math.min(1, containerRef.current.offsetWidth / template.canvasWidth),
      );
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
  const [dragPos, setDragPos] = useState<
    Record<number, { x: number; y: number }>
  >({});
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Callback ref — set when Stage mounts, null when it unmounts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stage, setStage] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const W = template.canvasWidth;
  const H = template.canvasHeight;

  // Compute image position and optional crop for the Konva stage.
  const imagePos = (() => {
    if (!bgImage) return null;
    const { x, y, width, height, fit } = template.imageLayout;
    const dw = width * W;
    const dh = height * H;
    const dx = x * W;
    const dy = y * H;
    if (fit === "cover") {
      const s = Math.max(dw / bgImage.width, dh / bgImage.height);
      const cw = dw / s,
        ch = dh / s;
      return {
        x: dx,
        y: dy,
        width: dw,
        height: dh,
        crop: {
          x: (bgImage.width - cw) / 2,
          y: (bgImage.height - ch) / 2,
          width: cw,
          height: ch,
        },
      };
    }
    // contain: scale to fit, letterbox, no source crop
    const s = Math.min(dw / bgImage.width, dh / bgImage.height);
    const sw = bgImage.width * s;
    const sh = bgImage.height * s;
    return {
      x: dx + (dw - sw) / 2,
      y: dy + (dh - sh) / 2,
      width: sw,
      height: sh,
      crop: undefined,
    };
  })();

  const exportDataUrl = useCallback(
    async (opts?: { forUpload?: boolean }): Promise<string> => {
      if (!stage) throw new Error("Canvas not ready");
      if (!bgImage) throw new Error("Image not loaded yet");
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r)),
      );
      stage.draw();
      if (opts?.forUpload) {
        // Compressed JPEG for upload — ~10× smaller than full-res PNG
        return stage.toDataURL({
          pixelRatio: 1,
          mimeType: "image/jpeg",
          quality: 0.82,
        });
      }
      return stage.toDataURL({ pixelRatio: 2 });
    },
    [stage, bgImage],
  );

  const handleDownload = async () => {
    setBusy(true);
    setSelectedSlot(null);
    setSelectedSticker(null);
    const uri = await exportDataUrl();
    const a = document.createElement("a");
    a.download = "memeroach.png";
    a.href = uri;
    a.click();
    setBusy(false);
  };

  const handleCopy = async () => {
    setBusy(true);
    setSelectedSlot(null);
    setSelectedSticker(null);
    const uri = await exportDataUrl();
    try {
      const blob = await (await fetch(uri)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
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
      setSelectedSlot(null);
      setSelectedSticker(null);
      const uri = await exportDataUrl({ forUpload: true });
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

  const handleDownloadVideo = async () => {
    if (!imageDataUrl) return;
    setGifBusy(true);
    try {
      const renderConfig = {
        template,
        imageDataUrl,
        texts: texts.map((t, i) => t || template.slots[i].placeholder),
        textStyles,
      };
      const { isVideoSupported, renderMemeVideo } =
        await import("@/lib/renderVideo");
      if (isVideoSupported()) {
        const blob = await renderMemeVideo(renderConfig);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "memeroach.webm";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } else {
        // Fallback to GIF on browsers without captureStream/MediaRecorder
        const { renderMemeGif } = await import("@/lib/renderGif");
        const blob = await renderMemeGif(renderConfig);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "memeroach.gif";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
    } catch (err) {
      console.error("[video]", err);
    } finally {
      setGifBusy(false);
    }
  };

  const handleCartoonGif = async () => {
    if (!imageDataUrl) return;
    setCartoonStatus("Generating cartoon GIF...");
    try {
      const { renderMemeGif } = await import("@/lib/renderGif");
      const gifBlob = await renderMemeGif({
        template,
        imageDataUrl,
        texts: texts.map((t, i) => t || template.slots[i].placeholder),
        textStyles,
        cartoonize: true,
      });

      const url = URL.createObjectURL(gifBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "memeroach-cartoon.gif";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.error("[cartoon-gif]", err);
    } finally {
      setCartoonStatus(null);
    }
  };

  useEffect(() => {
    if (!bgImage || !imagePos) {
      backgroundCanvasRef.current = null;
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(
      bgImage,
      imagePos.crop?.x ?? 0,
      imagePos.crop?.y ?? 0,
      imagePos.crop?.width ?? bgImage.width,
      imagePos.crop?.height ?? bgImage.height,
      imagePos.x,
      imagePos.y,
      imagePos.width,
      imagePos.height,
    );
    backgroundCanvasRef.current = canvas;
  }, [
    bgImage,
    W,
    H,
    imagePos?.x,
    imagePos?.y,
    imagePos?.width,
    imagePos?.height,
    imagePos?.crop?.x,
    imagePos?.crop?.y,
    imagePos?.crop?.width,
    imagePos?.crop?.height,
  ]);

  const sampleBackgroundLuminance = useCallback(
    (slotIndex: number) => {
      const canvas = backgroundCanvasRef.current;
      if (!canvas) return 0.5;

      const ctx = canvas.getContext("2d");
      if (!ctx) return 0.5;

      const slot = template.slots[slotIndex];
  if (!slot) return 0.5;
      const centerX = Math.round(slot.anchorX * W);
      const centerY = Math.round(slot.anchorY * H);
      const sampleSize = 28;
      const sx = Math.max(
        0,
        Math.min(W - sampleSize, centerX - Math.floor(sampleSize / 2)),
      );
      const sy = Math.max(
        0,
        Math.min(H - sampleSize, centerY - Math.floor(sampleSize / 2)),
      );
      const { data } = ctx.getImageData(sx, sy, sampleSize, sampleSize);

      let total = 0;
      let pixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = channelToLinear(data[i]!);
        const g = channelToLinear(data[i + 1]!);
        const b = channelToLinear(data[i + 2]!);
        total += 0.2126 * r + 0.7152 * g + 0.0722 * b;
        pixels += 1;
      }

      return pixels ? total / pixels : 0.5;
    },
    [template.slots, W, H],
  );

  useEffect(() => {
    if (selectedSlot === null) return;
    if (template.slots[selectedSlot]) return;
    setSelectedSlot(template.slots.length ? 0 : null);
  }, [selectedSlot, template.slots]);

  const normalizeStyleForContrast = useCallback(
    (slotIndex: number, style: EditorTextStyle) => {
      const backgroundLuminance = sampleBackgroundLuminance(slotIndex);
      const fillLuminance = getHexLuminance(style.fill);
      const contrastGap = Math.abs(fillLuminance - backgroundLuminance);

      if (contrastGap < 0.38) {
        return {
          ...style,
          stroke: backgroundLuminance > 0.58 ? DARK_STROKE : LIGHT_STROKE,
          strokeWidth: Math.max(style.strokeWidth, 3),
        };
      }

      if (backgroundLuminance > 0.7 && fillLuminance < 0.25) {
        return { ...style, stroke: "transparent", strokeWidth: 0 };
      }

      if (backgroundLuminance < 0.35 && fillLuminance > 0.72) {
        return {
          ...style,
          stroke: DARK_STROKE,
          strokeWidth: Math.max(style.strokeWidth, 2.5),
        };
      }

      return style;
    },
    [sampleBackgroundLuminance],
  );

  const updateTextStyle = useCallback(
    (slotIndex: number, updates: Partial<EditorTextStyle>) => {
      setTextStyles((prev) =>
        prev.map((style, index) =>
          index === slotIndex
            ? normalizeStyleForContrast(slotIndex, { ...style, ...updates })
            : style,
        ),
      );
    },
    [normalizeStyleForContrast],
  );

  const applyStylePreset = useCallback(
    (slotIndex: number, presetLabel: string) => {
      const base =
        textStyles[slotIndex] ??
        buildTextStyles(templateId, undefined)[slotIndex]!;
      const preset = STYLE_PRESETS.find((item) => item.label === presetLabel);
      if (!preset) return;

      if (!preset.style) {
        updateTextStyle(slotIndex, {
          stroke:
            sampleBackgroundLuminance(slotIndex) > 0.58
              ? DARK_STROKE
              : LIGHT_STROKE,
          strokeWidth: 3,
        });
        return;
      }

      updateTextStyle(slotIndex, { ...base, ...preset.style });
    },
    [sampleBackgroundLuminance, templateId, textStyles, updateTextStyle],
  );

  const selectedStyle =
    selectedSlot !== null && template.slots[selectedSlot]
      ? textStyles[selectedSlot] ?? null
      : null;
  const selectedBackgroundTone =
    selectedSlot !== null && template.slots[selectedSlot]
      ? sampleBackgroundLuminance(selectedSlot) > 0.58
        ? "light"
        : "dark"
      : null;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <AppNav
        step={3}
        right={
          <button
            type="button"
            onClick={() => setPhase("picking")}
            className="min-h-11 text-sm text-on-surface-variant transition-colors hover:text-secondary"
          >
            ← Back
          </button>
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
              width: W * scale,
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
                onPointerDown={(e) => {
                  if (e.target === (e.target as KonvaNode).getStage())
                    setSelectedSlot(null);
                }}
              >
                <Layer clipX={0} clipY={0} clipWidth={W} clipHeight={H}>
                  {/* Base background (light for text-outside-photo templates) */}
                  <Rect x={0} y={0} width={W} height={H} fill="#f8fafc" />

                  {/* Photo */}
                  {bgImage && imagePos && (
                    <KonvaImage
                      image={bgImage}
                      x={imagePos.x}
                      y={imagePos.y}
                      width={imagePos.width}
                      height={imagePos.height}
                      crop={imagePos.crop}
                    />
                  )}

                  {/* Text slots */}
                  {template.slots.map((slot, i) => {
                    const style =
                      textStyles[i] ??
                      buildTextStyles(templateId, undefined)[i]!;
                    const tw = slot.width * W;
                    const baseX = slot.anchorX * W - tw / 2;
                    // Centre the text block around the anchor point (same logic as renderMeme).
                    // Estimate max wrapped height using maxLines so the block stays in-canvas.
                    const lineH = style.fontSize * 1.2;
                    const estH = slot.maxLines * lineH;
                    const MARGIN = 6;
                    const rawY = slot.anchorY * H - estH / 2;
                    const baseY = Math.min(
                      Math.max(rawY, MARGIN),
                      H - estH - MARGIN,
                    );
                    const p = dragPos[i];
                    const isSelected = selectedSlot === i;

                    return [
                      isSelected && (
                        <Rect
                          key={`sel-${i}`}
                          x={(p?.x ?? baseX) - 6}
                          y={(p?.y ?? baseY) - 6}
                          width={tw + 12}
                          height={
                            Math.max(
                              style.fontSize * Math.max(slot.maxLines, 1),
                              42,
                            ) + 12
                          }
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
                        fontFamily={style.fontFamily}
                        fontSize={style.fontSize}
                        fontStyle="bold"
                        fill={style.fill}
                        stroke={
                          style.stroke === "transparent"
                            ? undefined
                            : style.stroke
                        }
                        strokeWidth={
                          style.stroke === "transparent" ? 0 : style.strokeWidth
                        }
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
                          setDragPos((prev) => ({
                            ...prev,
                            [i]: { x: e.target.x(), y: e.target.y() },
                          }))
                        }
                        onClick={() => {
                          setSelectedSlot(i);
                          setTimeout(() => inputRef.current?.focus(), 50);
                        }}
                        onTap={() => {
                          setSelectedSlot(i);
                          setTimeout(() => inputRef.current?.focus(), 50);
                        }}
                        perfectDrawEnabled={false}
                      />,
                    ];
                  })}

                  {stickers.map((st) => [
                    selectedSticker === st.id && (
                      <Rect
                        key={`stsel-${st.id}`}
                        x={st.x - 6}
                        y={st.y - 6}
                        width={st.size + 12}
                        height={st.size + 12}
                        stroke="#ffb783"
                        strokeWidth={2}
                        dash={[4, 2]}
                        fill="transparent"
                        listening={false}
                      />
                    ),
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
                            s.id === st.id
                              ? { ...s, x: e.target.x(), y: e.target.y() }
                              : s,
                          ),
                        )
                      }
                      onClick={() => {
                        setSelectedSlot(null);
                        setSelectedSticker(st.id);
                      }}
                      onTap={() => {
                        setSelectedSlot(null);
                        setSelectedSticker(st.id);
                      }}
                    />,
                  ])}
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
              Editing text {selectedSlot + 1} / {template.slots.length} — drag
              to reposition
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
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-label-sm text-on-surface-variant">
                Size
              </span>
              <button
                type="button"
                onClick={() =>
                  updateTextStyle(selectedSlot, {
                    fontSize: Math.max(12, selectedStyle!.fontSize - 4),
                  })
                }
                className="flex h-8 w-8 items-center justify-center rounded-btn border border-outline-variant bg-surface-container-high text-on-surface hover:border-secondary text-sm font-bold"
              >
                −
              </button>
              <span className="w-10 text-center text-sm tabular-nums text-on-surface">
                {selectedStyle?.fontSize}px
              </span>
              <button
                type="button"
                onClick={() =>
                  updateTextStyle(selectedSlot, {
                    fontSize: Math.min(92, selectedStyle!.fontSize + 4),
                  })
                }
                className="flex h-8 w-8 items-center justify-center rounded-btn border border-outline-variant bg-surface-container-high text-on-surface hover:border-secondary text-sm font-bold"
              >
                +
              </button>
              <span className="ml-auto rounded-pill border border-outline-variant px-2 py-1 text-[11px] text-on-surface-variant">
                Smart contrast sees a {selectedBackgroundTone} background here
              </span>
            </div>

            <div className="mt-3 space-y-3 rounded-bento border border-outline-variant bg-surface-container-high p-3">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-label-sm text-on-surface-variant">
                    Style presets
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      updateTextStyle(selectedSlot, selectedStyle!)
                    }
                    className="text-xs text-secondary hover:underline"
                  >
                    Recheck contrast
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {STYLE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        applyStylePreset(selectedSlot, preset.label)
                      }
                      className="rounded-pill border border-outline-variant bg-surface px-3 py-1.5 text-xs text-on-surface-variant transition-colors hover:border-secondary hover:text-on-surface"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-label-sm text-on-surface-variant">
                  Fonts
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {FONTS.map((font) => (
                    <button
                      key={font.label}
                      type="button"
                      onClick={() =>
                        updateTextStyle(selectedSlot, {
                          fontFamily: font.value,
                        })
                      }
                      style={{ fontFamily: font.value }}
                      className={[
                        "rounded-btn border px-2.5 py-1.5 text-xs transition-all",
                        selectedStyle?.fontFamily === font.value
                          ? "border-secondary bg-secondary text-on-secondary"
                          : "border-outline-variant bg-surface text-on-surface-variant hover:border-secondary",
                      ].join(" ")}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-label-sm text-on-surface-variant">
                    Colors
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setTextStyles((prev) =>
                        prev.map((style, index) =>
                          normalizeStyleForContrast(index, {
                            ...style,
                            ...selectedStyle!,
                          }),
                        ),
                      )
                    }
                    className="text-xs text-on-surface-variant hover:text-secondary"
                  >
                    Apply style to all text
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() =>
                        updateTextStyle(selectedSlot, { fill: color.value })
                      }
                      title={color.label}
                      style={{ backgroundColor: color.value }}
                      className={[
                        "h-8 w-8 rounded-full border-2 transition-all",
                        selectedStyle?.fill === color.value
                          ? "scale-110 border-secondary"
                          : "border-outline-variant hover:scale-105",
                      ].join(" ")}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <p className="text-label-sm text-on-surface-variant">Outline</p>
                <button
                  type="button"
                  onClick={() =>
                    updateTextStyle(selectedSlot, {
                      stroke: "transparent",
                      strokeWidth: 0,
                    })
                  }
                  className={[
                    "rounded-pill border px-3 py-1.5 text-xs transition-colors",
                    selectedStyle?.stroke === "transparent"
                      ? "border-secondary bg-secondary text-on-secondary"
                      : "border-outline-variant bg-surface text-on-surface-variant hover:border-secondary",
                  ].join(" ")}
                >
                  None
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateTextStyle(selectedSlot, {
                      stroke:
                        selectedBackgroundTone === "light"
                          ? DARK_STROKE
                          : LIGHT_STROKE,
                      strokeWidth: 2,
                    })
                  }
                  className="rounded-pill border border-outline-variant bg-surface px-3 py-1.5 text-xs text-on-surface-variant transition-colors hover:border-secondary"
                >
                  Soft
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateTextStyle(selectedSlot, {
                      stroke:
                        selectedBackgroundTone === "light"
                          ? DARK_STROKE
                          : LIGHT_STROKE,
                      strokeWidth: 4,
                    })
                  }
                  className="rounded-pill border border-outline-variant bg-surface px-3 py-1.5 text-xs text-on-surface-variant transition-colors hover:border-secondary"
                >
                  Strong
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-on-surface-variant text-xs text-center py-1">
            Tap any text on the canvas to edit it
          </p>
        )}

        <div className="pb-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-label-sm text-on-surface-variant">Stickers</p>
            {stickers.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setStickers([]);
                  setSelectedSticker(null);
                }}
                className="text-xs text-error hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {selectedSticker ? (
            <div className="flex items-center gap-2">
              <span className="text-on-surface-variant text-sm flex-1">
                {stickers.find((s) => s.id === selectedSticker)?.emoji} selected
              </span>
              <button
                type="button"
                onClick={() =>
                  setStickers((prev) =>
                    prev.map((s) =>
                      s.id === selectedSticker
                        ? { ...s, size: Math.max(20, s.size - 10) }
                        : s,
                    ),
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-btn border border-outline-variant bg-surface-container-high text-on-surface text-sm font-bold hover:border-secondary"
              >
                −
              </button>
              <button
                type="button"
                onClick={() =>
                  setStickers((prev) =>
                    prev.map((s) =>
                      s.id === selectedSticker
                        ? { ...s, size: Math.min(120, s.size + 10) }
                        : s,
                    ),
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-btn border border-outline-variant bg-surface-container-high text-on-surface text-sm font-bold hover:border-secondary"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => {
                  setStickers((prev) =>
                    prev.filter((s) => s.id !== selectedSticker),
                  );
                  setSelectedSticker(null);
                }}
                className="flex h-9 items-center gap-1 rounded-btn border border-error/40 bg-error-container/20 px-3 text-xs font-semibold text-error hover:bg-error-container/40"
              >
                🗑 Remove
              </button>
              <button
                type="button"
                onClick={() => setSelectedSticker(null)}
                className="text-xs text-on-surface-variant hover:text-secondary"
              >
                Done
              </button>
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {shareError && (
        <p className="border-t border-error/20 bg-error-container/20 px-4 py-2 text-center text-sm text-error">
          {shareError}
        </p>
      )}

      <div className="flex flex-col gap-2 border-t border-outline-variant bg-surface px-4 py-3">
        <BrandButton
          variant="ghost"
          fullWidth
          onClick={handleCartoonGif}
          disabled={!!cartoonStatus || !stage}
        >
          {cartoonStatus ?? "🎨 AI Cartoon GIF"}
        </BrandButton>
        <BrandButton
          variant="ghost"
          fullWidth
          onClick={handleDownloadVideo}
          disabled={gifBusy || !stage}
        >
          {gifBusy ? "⏳ Rendering video…" : "🎬 Download as video"}
        </BrandButton>
        <div className="flex gap-2">
          <BrandButton
            variant="ghost"
            className="flex-1"
            onClick={handleDownload}
            disabled={busy || !stage}
          >
            ⬇ PNG
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
    </div>
  );
}
