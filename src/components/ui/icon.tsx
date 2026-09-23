import type { LucideIcon, LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

const sizes = {
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
} as const;

export type IconSize = keyof typeof sizes;

type IconProps = {
  icon: LucideIcon;
  size?: IconSize;
} & Omit<LucideProps, "size">;

/** Thin-line lucide icon. Feature code should use this instead of importing lucide directly. */
export function Icon({
  icon: Glyph,
  size = "md",
  strokeWidth = 1.5,
  className,
  ...props
}: IconProps) {
  return (
    <Glyph
      size={sizes[size]}
      strokeWidth={strokeWidth}
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}
