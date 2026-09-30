"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export type ClassMetaRevealClass = {
  name: string;
  grade_level: number;
  subject: string;
  term: number;
  section: string | null;
};

type ClassMetaRevealProps = {
  cls: ClassMetaRevealClass;
  /** Rendered next to the name — typically the edit pencil. */
  action?: React.ReactNode;
  className?: string;
  nameClassName?: string;
};

export function formatClassMeta(cls: ClassMetaRevealClass) {
  const base = `Grade ${cls.grade_level} · ${cls.subject} · Term ${cls.term}`;
  return cls.section ? `${base} · Section ${cls.section}` : base;
}

/**
 * Class name stays primary; the rest of the metadata is revealed on hover,
 * keyboard focus, or tap (PSL-114). There is no hover-card primitive in the
 * repo, so this is a button plus an aria-describedby region that stays in the
 * accessibility tree even while it is visually hidden.
 */
export function ClassMetaReveal({
  cls,
  action,
  className,
  nameClassName,
}: ClassMetaRevealProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const revealed = hovered || focused || pinned;
  const metaId = useId();

  return (
    <div
      className={cn("flex flex-col items-center gap-1", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-expanded={revealed}
          aria-describedby={metaId}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onClick={() => setPinned((current) => !current)}
          className={cn(
            "rounded-lg px-1 text-left font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            nameClassName ?? "text-3xl"
          )}
        >
          {cls.name}
        </button>
        {action}
      </div>
      <p
        id={metaId}
        className={cn(
          "text-sm text-muted-foreground",
          revealed ? "opacity-100" : "sr-only"
        )}
      >
        {formatClassMeta(cls)}
      </p>
    </div>
  );
}
