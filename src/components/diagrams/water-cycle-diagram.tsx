"use client";

import type { DiagramPartId } from "@/lib/diagrams/content";

const HOTSPOTS: Record<DiagramPartId, { left: string; top: string; width: string; height: string }> = {
  evaporation: { left: "6%", top: "6%", width: "34%", height: "46%" },
  condensation: { left: "58%", top: "4%", width: "36%", height: "28%" },
  precipitation: { left: "60%", top: "30%", width: "30%", height: "34%" },
  collection: { left: "8%", top: "58%", width: "78%", height: "28%" },
};

export function WaterCycleDiagram({
  selectedId,
  labels,
  onActivate,
}: {
  selectedId: DiagramPartId | null;
  labels: Record<DiagramPartId, string>;
  onActivate: (id: DiagramPartId) => void;
}) {
  return (
    <div className="relative">
      <svg viewBox="0 0 640 460" className="block h-auto w-full text-foreground" role="img" aria-label="The water cycle">
        <rect width="640" height="460" fill="color-mix(in srgb, var(--info) 10%, var(--surface-1))" />
        <path
          d="M0 248 C 90 210, 150 228, 230 196 C 310 164, 390 210, 470 176 C 530 154, 590 188, 640 166 L 640 400 L 0 400 Z"
          fill="color-mix(in srgb, var(--success) 22%, var(--surface-2))"
        />
        <path
          d="M70 312 C 150 286, 230 300, 320 292 C 410 284, 490 308, 560 298 C 600 292, 612 322, 596 348 C 540 386, 180 392, 96 358 C 62 344, 46 328, 70 312 Z"
          fill="color-mix(in srgb, var(--info) 48%, var(--surface-1))"
        />
        <path d="M120 330 C 200 318, 280 324, 360 318" fill="none" stroke="var(--surface-1)" strokeOpacity="0.7" />
        <g stroke="currentColor" strokeOpacity="0.35" strokeLinecap="round" fill="none">
          <path d="M132 196 C 140 176, 136 158, 128 140" />
          <path d="M156 188 C 164 168, 158 150, 150 132" />
          <path d="M178 180 C 184 162, 176 146, 168 128" />
        </g>
        <g stroke="var(--warning)" strokeWidth="1.6" strokeLinecap="round">
          <path d="M108 36 v18 M108 112 v18 M70 78 h18 M128 78 h18 M82 52 l12 12 M134 52 l-12 12 M82 104 l12 -12 M134 104 l-12 -12" />
        </g>
        <circle cx="108" cy="78" r="22" fill="color-mix(in srgb, var(--warning) 78%, var(--surface-1))" />
        <g fill="color-mix(in srgb, var(--info) 28%, var(--surface-1))" stroke="currentColor" strokeOpacity="0.35">
          <ellipse cx="470" cy="78" rx="46" ry="22" />
          <ellipse cx="512" cy="86" rx="36" ry="20" />
          <ellipse cx="438" cy="90" rx="30" ry="16" />
          <ellipse cx="486" cy="98" rx="40" ry="16" />
        </g>
        <g stroke="var(--info)" strokeWidth="2" strokeLinecap="round">
          <path d="M452 124 v28 M470 118 v40 M490 124 v32 M508 120 v36 M526 126 v24" />
        </g>
        <defs>
          <marker id="cycle-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0 0 L6 3 L0 6" fill="none" stroke="currentColor" strokeWidth="1" />
          </marker>
        </defs>
        <g fill="none" stroke="currentColor" strokeWidth="1.25" markerEnd="url(#cycle-arrow)">
          <path d="M150 250 C 120 200, 90 160, 108 112" />
          <path d="M188 150 C 260 110, 340 92, 420 88" />
          <path d="M500 124 C 520 170, 530 210, 520 260" />
          <path d="M500 330 C 420 348, 300 352, 200 336" />
        </g>
        <Label x={150} y={132} text={labels.evaporation} hot={selectedId === "evaporation"} />
        <Label x={430} y={52} text={labels.condensation} hot={selectedId === "condensation"} />
        <Label x={536} y={196} text={labels.precipitation} hot={selectedId === "precipitation"} />
        <Label x={300} y={332} text={labels.collection} hot={selectedId === "collection"} />
        <rect x="0" y="404" width="640" height="56" fill="var(--surface-1)" />
      </svg>
      {(Object.keys(HOTSPOTS) as DiagramPartId[]).map((id) => (
        <button
          key={id}
          type="button"
          aria-label={labels[id]}
          aria-pressed={selectedId === id}
          className="absolute bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={HOTSPOTS[id]}
          onClick={() => onActivate(id)}
        />
      ))}
    </div>
  );
}

function Label({ x, y, text, hot }: { x: number; y: number; text: string; hot: boolean }) {
  return (
    <text x={x} y={y} fill="currentColor" fontSize="15" fontWeight={hot ? 650 : 560}>
      {text}
    </text>
  );
}
