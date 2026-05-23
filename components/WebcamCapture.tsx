"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BrandButton from "@/components/ui/BrandButton";

type Props = {
  open: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
};

async function openCamera(facingMode: "user" | "environment"): Promise<MediaStream> {
  const constraints: MediaStreamConstraints = {
    video: {
      facingMode,
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  };

  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch {
    // Laptops often lack "environment" — fall back to any camera
    return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  }
}

export default function WebcamCapture({ open, onClose, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
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

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera not supported in this browser. Use Gallery or paste instead.");
      return;
    }

    let cancelled = false;
    setError(null);
    setReady(false);

    async function start() {
      stopStream();
      try {
        const stream = await openCamera(facingMode);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();

        if (video.videoWidth > 0 && video.videoHeight > 0) {
          setReady(true);
        } else {
          video.onloadedmetadata = () => {
            if (!cancelled && video.videoWidth > 0) setReady(true);
          };
        }
      } catch (err) {
        console.error("[webcam]", err);
        setError(
          "Camera access denied or unavailable. Allow camera permission, or use Gallery upload."
        );
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

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      setError("Camera not ready yet — wait a second and try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (facingMode === "user") {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
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
              autoPlay
              className={[
                "h-full w-full object-cover",
                facingMode === "user" ? "scale-x-[-1]" : "",
              ].join(" ")}
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
            {ready ? "📸 Capture" : "Starting camera…"}
          </BrandButton>
        </div>
      </div>
    </div>
  );
}
