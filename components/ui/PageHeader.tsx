import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  align = "left",
}: Props) {
  const alignClass = align === "center" ? "text-center" : "text-left";

  return (
    <header className={alignClass}>
      {eyebrow && (
        <p className="text-label-sm text-secondary mb-2 tracking-widest">{eyebrow}</p>
      )}
      <h1 className="font-display text-headline-lg font-bold tracking-tight text-on-surface">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-base text-on-surface-variant max-w-md">{description}</p>
      )}
    </header>
  );
}
