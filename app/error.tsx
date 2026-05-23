"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <p className="text-6xl">🪲</p>
      <h1 className="mt-6 font-display text-2xl font-bold text-on-surface">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-xs text-sm text-on-surface-variant">
        {error.message || "An unexpected error occurred."}
      </p>
      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          onClick={reset}
          className="flex min-h-11 items-center rounded-btn bg-secondary px-6 font-semibold
                     text-on-secondary transition-all hover:-translate-y-0.5 active:scale-95"
        >
          Try again
        </button>
        <a
          href="/"
          className="text-sm text-on-surface-variant transition-colors hover:text-secondary"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
