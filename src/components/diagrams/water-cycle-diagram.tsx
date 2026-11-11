"use client";

import type { DiagramPartId } from "@/lib/diagrams/content";

const REGIONS: Record<DiagramPartId, { cx: number; cy: number; name: string }> = {
  evaporation: { cx: 78, cy: 78, name: "Region 1" },
  condensation: { cx: 236, cy: 84, name: "Region 2" },
  precipitation: { cx: 236, cy: 196, name: "Region 3" },
  collection: { cx: 150, cy: 292, name: "Region 4" },
};

export function WaterCycleDiagram({
  selectedId,
  placedLabels,
  revealNames,
  labels,
  onActivate,
}: {
  selectedId: DiagramPartId | null;
  placedLabels: Partial<Record<DiagramPartId, string>>;
  revealNames: boolean;
  labels: Record<DiagramPartId, string>;
  onActivate: (id: DiagramPartId) => void;
}) {
  return (
    <div className="relative aspect-[8/9] w-full">
      <svg
        viewBox="0 0 320 360"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full rounded-xl border border-border bg-surface-1"
      >
        <circle cx="78" cy="72" r="22" fill="var(--warning)" />
        <ellipse cx="236" cy="78" rx="36" ry="16" fill="var(--info)" />
        <ellipse cx="214" cy="84" rx="22" ry="12" fill="var(--info)" />
        <path
          d="M220 118 v28 M236 114 v36 M252 118 v28"
          stroke="var(--info)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <ellipse cx="150" cy="300" rx="90" ry="28" fill="var(--success)" />
      </svg>
      {(Object.keys(REGIONS) as DiagramPartId[]).map((id) => {
        const region = REGIONS[id];
        const selected = selectedId === id;
        const placed = placedLabels[id];
        const accessibleName = revealNames ? labels[id] : placed || region.name;
        return (
          <button
            key={id}
            type="button"
            aria-label={accessibleName}
            aria-pressed={selected}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-transparent text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{
              left: `${(region.cx / 320) * 100}%`,
              top: `${(region.cy / 360) * 100}%`,
              width: "30%",
              height: "22%",
              borderColor: selected ? "var(--foreground)" : undefined,
            }}
            onClick={() => onActivate(id)}
          >
            {placed ?? ""}
          </button>
        );
      })}
    </div>
  );
}
