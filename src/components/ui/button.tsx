"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { motion, useReducedMotion } from "motion/react";
import { presets } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "border border-border bg-secondary text-secondary-foreground hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        outline: "border border-input bg-transparent text-foreground hover:bg-muted",
        link: "h-auto rounded-none px-0 text-foreground underline-offset-4 hover:underline",
        accent: "bg-foreground text-background hover:bg-foreground/90",
        hero: "border border-white/25 bg-white/10 text-white hover:bg-white/20",
        "hero-primary":
          "bg-primary text-primary-foreground hover:bg-primary/90",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

type ButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  const reduce = useReducedMotion();
  const press = reduce ? presets.pressReduced : presets.press;

  return (
    <motion.button
      whileTap={props.disabled ? undefined : press.whileTap}
      transition={press.transition}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
