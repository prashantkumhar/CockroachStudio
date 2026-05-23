"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BrandButton from "@/components/ui/BrandButton";

type Props = {
  open: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
};

export default function WebcamCapture({ open, onClose, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setReady(false);
  }, []);

  useEffect(() => {
    if (!open) {
      stopStream();
      return;
    }

    let cancelled = false;
    setError(null);

    async function start() {
      stopStream();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        setError("Camera access denied or unavailable. Try uploading a photo instead.");
      }
    }

    start();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, facingMode, stopStream]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !ready) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    stopStream();
    onCapture(dataUrl);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-surface/90 p-4 backdrop-blur-lg"
      role="dialog"
      aria-modal="true"
      aria-label="Webcam capture"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-bento border border-outline-variant bg-surface-container shadow-float">
        <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
          <p className="font-display font-semibold text-on-surface">Take a photo</p>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-11 text-on-surface-variant hover:text-secondary"
            aria-label="Close camera"
          >
            ✕
          </button>
        </div>

        <div className="relative aspect-[4/3] bg-surface-container-lowest">
          {error ? (
            <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-error">
              {error}
            </p>
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-outline-variant p-4">
          <BrandButton
            variant="ghost"
            onClick={() => setFacingMode((m) => (m === "user" ? "environment" : "user"))}
            disabled={!!error}
          >
            🔄 Flip
          </BrandButton>
          <BrandButton variant="primary" onClick={capture} disabled={!!error || !ready}>
            📸 Capture
          </BrandButton>
        </div>
      </div>
    </div>
  );
}
