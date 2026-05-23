"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
  }, []);

  const toggle = () => {
    const html = document.documentElement;
    const next = !html.classList.contains("light");
    html.classList.toggle("light", next);
    html.classList.toggle("dark", !next);
    localStorage.setItem("memeroach-theme", next ? "light" : "dark");
    setLight(next);
  };

  useEffect(() => {
    const saved = localStorage.getItem("memeroach-theme");
    if (saved === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
      setLight(true);
    }
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      className="flex h-11 w-11 items-center justify-center rounded-btn border border-outline-variant
                 bg-surface-container text-on-surface-variant transition-colors
                 hover:border-outline hover:text-secondary"
    >
      {light ? "🌙" : "☀️"}
    </button>
  );
}
