import type { ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";

type Props = {
  right?: ReactNode;
  showThemeToggle?: boolean;
  step?: number;
  totalSteps?: number;
};

export default function AppNav({ right, showThemeToggle = true, step, totalSteps = 4 }: Props) {
  return (
    <nav
      className="sticky top-0 z-50 w-full border-b border-outline-variant backdrop-blur-lg"
      style={{ background: "var(--glass-bg)" }}
    >
      <div className="mx-auto flex h-14 max-w-page items-center justify-between gap-4 px-4 sm:px-8">
        <div className="flex items-center gap-4">
          <a href="/" className="flex min-h-11 items-center gap-2 shrink-0">
            <span className="font-display text-lg font-bold leading-none text-secondary">MR</span>
            <span className="font-display text-base font-semibold leading-none text-on-surface">
              Memeroach
            </span>
          </a>
          <span className="h-4 w-px bg-outline-variant" aria-hidden />
          <a
            href="/wall"
            className="flex min-h-11 items-center gap-1.5 rounded-pill px-3 text-sm font-medium text-on-surface-variant transition-all hover:bg-surface-container hover:text-secondary"
          >
            🏆 <span>Meme Wall</span>
          </a>
        </div>

        <div className="flex items-center gap-3">
          {right}
          {showThemeToggle && <ThemeToggle />}
        </div>
      </div>

      {step && (
        <div className="h-0.5 w-full bg-outline-variant">
          <div
            className="h-full bg-secondary transition-all duration-500 ease-out"
            style={{ width: `${Math.round((step / totalSteps) * 100)}%` }}
          />
        </div>
      )}
    </nav>
  );
}
