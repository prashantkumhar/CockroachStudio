"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";
import UploadZone from "@/components/UploadZone";
import LoadingScreen from "@/components/LoadingScreen";
import PickScreen from "@/components/PickScreen";
import SharedScreen from "@/components/SharedScreen";
import type { Suggestion } from "@/lib/llm";

// Konva must never run on the server
const MemeEditor = dynamic(() => import("@/components/MemeEditor"), { ssr: false });

export default function Home() {
  const phase        = useStore((s) => s.phase);
  const imageDataUrl = useStore((s) => s.imageDataUrl);
  const setSuggestions = useStore((s) => s.setSuggestions);
  const setPhase     = useStore((s) => s.setPhase);
  const setError     = useStore((s) => s.setError);

  const suggestingFor = useRef<string | null>(null);

  useEffect(() => {
    if (phase !== "suggesting" || !imageDataUrl) return;
    if (suggestingFor.current === imageDataUrl) return;
    suggestingFor.current = imageDataUrl;

    const [meta, base64] = imageDataUrl.split(";base64,");
    const mimeType = meta.split(":")[1];

    fetch("/api/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: base64, mimeType }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const err = new Error(data.error ?? `HTTP ${res.status}`) as Error & { code?: string };
          err.code = data.code;
          throw err;
        }
        return data as { suggestions: Suggestion[] };
      })
      .then((data) => setSuggestions(data.suggestions))
      .catch((err: Error & { code?: string }) => {
        console.error("[suggest]", err.message, err.code);
        suggestingFor.current = null;
        if (err.code === "CONFIG") {
          setError("AI is not configured on the server. Contact the site owner.");
        } else if (err.code === "PAYLOAD_TOO_LARGE") {
          setError("Photo is too large. Try a smaller image or retake with webcam.");
        } else {
          setError("Couldn't generate meme ideas. Try again in a moment.");
        }
        setPhase("upload");
      });
  }, [phase, imageDataUrl, setSuggestions, setPhase, setError]);

  if (phase === "upload")    return <UploadZone />;
  if (phase === "suggesting") return <LoadingScreen />;
  if (phase === "picking")   return <PickScreen />;
  if (phase === "editing")   return <MemeEditor />;
  if (phase === "shared")    return <SharedScreen />;

  // exporting — brief loading while uploading to Supabase
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-outline-variant border-t-secondary" />
        <p className="font-display font-semibold text-on-surface">Uploading your masterpiece...</p>
        <p className="text-sm text-on-surface-variant">Spreading to the internet...</p>
      </div>
    </div>
  );
}
