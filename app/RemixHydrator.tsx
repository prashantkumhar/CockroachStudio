"use client";

import { useEffect } from "react";
import { consumeRemixPreset } from "@/lib/remix";
import { useStore } from "@/lib/store";

export default function RemixHydrator() {
  const setRemixPreset = useStore((s) => s.setRemixPreset);

  useEffect(() => {
    const preset = consumeRemixPreset();
    if (preset) setRemixPreset(preset);
  }, [setRemixPreset]);

  return null;
}
