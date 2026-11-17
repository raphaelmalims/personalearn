"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MediaControls({
  playing,
  muted,
  disabled = false,
  onPlay,
  onPause,
  onToggleVolume,
  className,
}: {
  playing: boolean;
  muted: boolean;
  disabled?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onToggleVolume: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-border bg-surface-1 p-0.5",
        className
      )}
    >
      <button
        type="button"
        aria-label={playing ? "Pause" : "Play"}
        disabled={disabled}
        className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
        onClick={playing ? onPause : onPlay}
      >
        {playing ? <PauseMark /> : <PlayMark />}
      </button>
      <button
        type="button"
        aria-label="Volume"
        aria-pressed={muted}
        disabled={disabled}
        className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
        onClick={onToggleVolume}
      >
        {muted ? <VolumeOffMark /> : <VolumeMark />}
      </button>
    </div>
  );
}

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      {children}
    </svg>
  );
}

function PlayMark() {
  return (
    <Glyph>
      <path d="M8 6.5v11l9-5.5-9-5.5Z" strokeLinejoin="round" />
    </Glyph>
  );
}

function PauseMark() {
  return (
    <Glyph>
      <path d="M9 6v12M15 6v12" strokeLinecap="round" />
    </Glyph>
  );
}

function VolumeMark() {
  return (
    <Glyph>
      <path d="M4 10v4h3l4 3V7L7 10H4Z" strokeLinejoin="round" />
      <path d="M16 9.5a3.5 3.5 0 0 1 0 5" strokeLinecap="round" />
    </Glyph>
  );
}

function VolumeOffMark() {
  return (
    <Glyph>
      <path d="M4 10v4h3l4 3V7L7 10H4Z" strokeLinejoin="round" />
      <path d="M16 10l4 4M20 10l-4 4" strokeLinecap="round" />
    </Glyph>
  );
}
