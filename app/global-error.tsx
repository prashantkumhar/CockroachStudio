"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#001427] px-4 text-center font-sans text-[#d0e4ff]">
        <p className="text-6xl">🪲</p>
        <h1 className="mt-6 text-2xl font-bold">Critical error</h1>
        <p className="mt-2 max-w-xs text-sm opacity-70">
          {error.message || "Something went seriously wrong."}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-[#ffb783] px-6 py-3 font-semibold text-[#4f2500]"
          >
            Try again
          </button>
          <a href="/" className="text-sm opacity-60 hover:opacity-100">
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}
