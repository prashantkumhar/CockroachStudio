import type { ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";

type Props = {
  right?: ReactNode;
  showThemeToggle?: boolean;
};

export default function AppNav({ right, showThemeToggle = true }: Props) {
  return (
    <nav
      className="sticky top-0 z-50 w-full border-b border-outline-variant backdrop-blur-lg"
      style={{ background: "var(--glass-bg)" }}
    >
      <div className="mx-auto flex h-14 max-w-page items-center justify-between gap-4 px-4 sm:px-8">
        <a href="/" className="flex min-h-11 items-center gap-2 shrink-0">
          <span className="font-display text-lg font-bold leading-none text-secondary">MR</span>
          <span className="font-display text-base font-semibold leading-none text-on-surface">
            Memeroach
          </span>
        </a>

        <div className="flex items-center gap-3">
          {right}
          {showThemeToggle && <ThemeToggle />}
        </div>
      </div>
    </nav>
  );
}
