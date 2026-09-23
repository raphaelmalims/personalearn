import { cn } from "@/lib/utils";

/**
 * Converge — the PersonaLearn mark. One vertical stem and two paths that
 * join it: many personas meeting one learner. Single stroke on a 24 grid,
 * tuned so the shoulders stay apart at 16px. Paint with `currentColor`
 * (black or white); do not introduce a brand hue.
 */
export const convergeMark = {
  viewBox: "0 0 24 24",
  strokeWidth: 2,
  paths: {
    stem: "M12 3.25V20.75",
    left: "M4.75 4.25C4.75 9.5 12 8.75 12 13.25",
    right: "M19.25 4.25C19.25 9.5 12 8.75 12 13.25",
  },
} as const;

type MarkProps = {
  className?: string;
  /** When set, the mark is named for assistive tech. Otherwise it is decorative. */
  title?: string;
};

export function LogoMark({ className, title }: MarkProps) {
  const labelled = Boolean(title);

  return (
    <svg
      viewBox={convergeMark.viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={convergeMark.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={labelled ? "img" : undefined}
      aria-hidden={labelled ? undefined : true}
      aria-label={title}
      className={cn("h-6 w-6 shrink-0", className)}
    >
      {labelled ? <title>{title}</title> : null}
      <path d={convergeMark.paths.stem} />
      <path d={convergeMark.paths.left} />
      <path d={convergeMark.paths.right} />
    </svg>
  );
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display font-semibold leading-none", className)}>
      PersonaLearn
    </span>
  );
}

export function LogoLockup({
  className,
  markClassName,
  wordmarkClassName,
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={markClassName} />
      <LogoWordmark className={wordmarkClassName} />
    </span>
  );
}
