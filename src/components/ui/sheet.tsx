"use client";

import { X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { fadeTransition, presets } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  className?: string;
};

/** Full-height sheet. On small screens it covers the viewport; close returns to the surface under it. */
export function Sheet({
  open,
  onOpenChange,
  title,
  children,
  className,
}: SheetProps) {
  const reduce = useReducedMotion();
  if (!open) return null;
  const motionProps = reduce ? presets.crossfade : presets.sheet;

  return (
    <div className="fixed inset-0 z-50 flex h-dvh flex-col" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close"
        onClick={() => onOpenChange(false)}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative mt-auto flex h-dvh w-full flex-col bg-background pb-[env(safe-area-inset-bottom)]",
          className
        )}
        initial={motionProps.initial}
        animate={motionProps.animate}
        transition={reduce ? fadeTransition : motionProps.transition}
      >
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-2 pt-[env(safe-area-inset-top)]">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </Button>
          <h2 className="truncate text-sm font-medium">{title}</h2>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </motion.div>
    </div>
  );
}
