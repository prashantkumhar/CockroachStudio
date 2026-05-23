import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  as?: "div" | "article";
};

export default function BentoCard({ children, className = "", as: Tag = "div" }: Props) {
  return (
    <Tag
      className={[
        "rounded-bento border border-outline-variant bg-surface-container p-card-pad",
        "transition-colors duration-200 hover:border-outline hover:bg-surface-container-high",
        className,
      ].join(" ")}
    >
      {children}
    </Tag>
  );
}
