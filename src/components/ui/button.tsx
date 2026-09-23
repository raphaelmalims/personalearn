"use client";

import { motion, useReducedMotion } from "motion/react";
import { presets } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { buttonVariants, type ButtonVariantProps } from "@/components/ui/button-variants";

type ButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
> &
  ButtonVariantProps;

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
