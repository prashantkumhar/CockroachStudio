"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";
import UploadZone from "@/components/UploadZone";
import LoadingScreen from "@/components/LoadingScreen";
import PickScreen from "@/components/PickScreen";
import SharedScreen from "@/components/SharedScreen";
import type { Suggestion } from "@/lib/gemini";

// Konva must never run on the server
const MemeEditor = dynamic(() => import("@/components/MemeEditor"), { ssr: false });

export default function Home() {
  const phase        = useStore((s) => s.phase);
  const imageDataUrl = useStore((s) => s.imageDataUrl);
  const setSuggestions = useStore((s) => s.setSuggestions);
  const setPhase     = useStore((s) => s.setPhase);

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
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { suggestions: Suggestion[] }) => setSuggestions(data.suggestions))
      .catch((err) => {
        console.error("[suggest]", err);
        suggestingFor.current = null;
        setPhase("upload");
      });
  }, [phase, imageDataUrl, setSuggestions, setPhase]);

  if (phase === "upload")    return <UploadZone />;
  if (phase === "suggesting") return <LoadingScreen />;
  if (phase === "picking")   return <PickScreen />;
  if (phase === "editing")   return <MemeEditor />;
  if (phase === "shared")    return <SharedScreen />;

  // exporting — brief loading while uploading to Supabase
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 rounded-full border-4 border-outline-variant border-t-secondary animate-spin mx-auto" />
        <p className="text-on-surface font-semibold">Uploading your masterpiece...</p>
      </div>
    </div>
  );
}
