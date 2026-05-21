import type { CSSProperties } from "react";

type SkeletonProps = {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "full" | "none";
  soft?: boolean;
  style?: CSSProperties;
};

const ROUNDED_CLASS: Record<NonNullable<SkeletonProps["rounded"]>, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

export function Skeleton({
  className = "",
  rounded = "md",
  soft = false,
  style,
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton ${soft ? "skeleton-soft" : ""} ${ROUNDED_CLASS[rounded]} ${className}`}
      style={style}
    />
  );
}

export default Skeleton;
