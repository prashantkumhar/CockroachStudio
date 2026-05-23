import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "outline";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
  fullWidth?: boolean;
};

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-secondary text-on-secondary border border-secondary hover:-translate-y-0.5",
  ghost:
    "bg-transparent text-on-surface border border-outline-variant hover:border-outline hover:text-secondary",
  outline:
    "bg-surface-container text-on-surface border border-outline-variant hover:border-secondary hover:text-secondary",
};

export default function BrandButton({
  variant = "primary",
  children,
  fullWidth,
  className = "",
  ...props
}: Props) {
  return (
    <button
      type="button"
      className={[
        "inline-flex min-h-11 items-center justify-center rounded-btn px-6 py-2.5",
        "text-sm font-semibold transition-all duration-200 active:scale-95",
        "disabled:pointer-events-none disabled:opacity-40",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
        VARIANTS[variant],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
