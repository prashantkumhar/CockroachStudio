import type { ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";

type Props = {
  right?: ReactNode;
  showWallLink?: boolean;
  showThemeToggle?: boolean;
  sticky?: boolean;
  step?: number;
  totalSteps?: number;
};

export default function AppNav({
  right,
  showWallLink = true,
  showThemeToggle = true,
  sticky = true,
  step,
  totalSteps = 4,
}: Props) {
  const showMobileWallLink = showWallLink && !step;
  const showCompactMobileWallLink = showWallLink && !!step;

  return (
    <nav
      className={[
        "w-full border-b border-outline-variant backdrop-blur-lg",
        sticky ? "sticky top-0 z-50" : "relative",
      ].join(" ")}
      style={{ background: "var(--glass-bg)" }}
    >
      <div className="mx-auto max-w-page px-4 sm:px-8">
        <div className="hidden h-14 items-center justify-between gap-4 sm:flex">
          <div className="flex min-w-0 items-center gap-4">
            <a href="/" className="flex min-h-11 shrink-0 items-center gap-2">
              <span className="font-display text-lg font-bold leading-none text-secondary">
                MR
              </span>
              <span className="font-display text-base font-semibold leading-none text-on-surface">
                Memeroach
              </span>
            </a>
            <span className="h-4 w-px bg-outline-variant" aria-hidden />
            {showWallLink ? (
              <a
                href="/wall"
                className="flex min-h-11 items-center gap-1.5 rounded-pill px-3 text-sm font-medium text-on-surface-variant transition-all hover:bg-surface-container hover:text-secondary"
              >
                🏆 <span>Meme Wall</span>
              </a>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            {right}
            {showThemeToggle && <ThemeToggle />}
          </div>
        </div>

        <div
          className={["sm:hidden", showMobileWallLink ? "py-3" : "py-2"].join(
            " ",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <a href="/" className="flex min-h-11 min-w-0 items-center gap-2">
              <span className="font-display text-lg font-bold leading-none text-secondary">
                MR
              </span>
              <span className="truncate font-display text-base font-semibold leading-none text-on-surface">
                Memeroach
              </span>
            </a>

            <div className="flex shrink-0 items-center gap-2">
              {showCompactMobileWallLink ? (
                <a
                  href="/wall"
                  className="inline-flex min-h-10 items-center gap-1 rounded-pill border border-outline-variant bg-surface-container px-2.5 text-xs font-medium text-on-surface-variant transition-all hover:border-outline hover:text-secondary"
                >
                  <span aria-hidden>🏆</span>
                  <span>Wall</span>
                </a>
              ) : null}
              {right}
              {showThemeToggle && <ThemeToggle />}
            </div>
          </div>

          {showMobileWallLink ? (
            <a
              href="/wall"
              className="mt-2 flex min-h-11 items-center justify-center gap-1.5 rounded-pill border border-outline-variant bg-surface-container px-3 text-sm font-medium text-on-surface-variant transition-all hover:border-outline hover:text-secondary"
            >
              🏆 <span>Meme Wall</span>
            </a>
          ) : null}
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
