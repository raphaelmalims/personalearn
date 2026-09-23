"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

type TooltipProps = {
  label: string;
  kbd?: string;
  children: React.ReactNode;
  className?: string;
};

export function Tooltip({ label, kbd, children, className }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      {open ? (
        <span
          id={id}
          role="tooltip"
          className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-50 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-sm"
        >
          {label}
          {kbd ? (
            <kbd className="rounded-sm border border-border px-1 font-mono text-[10px]">
              {kbd}
            </kbd>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
