"use client";

import { useId, useState } from "react";
import type { VisualSpec } from "@/lib/explainers/blocks";

type SceneSpec = Extract<VisualSpec, { block: "scene" }>;
type ScenePart = SceneSpec["parts"][number];

const WIDTH = 640;
const HEIGHT = 400;

function place(value: number, start: number, span: number) {
  return start + (Math.min(100, Math.max(0, value)) / 100) * span;
}

export function ScenePlate({
  spec,
  quizOpen,
  onQuiz,
  onAdvance,
}: {
  spec: SceneSpec;
  quizOpen: boolean;
  onQuiz: (correct: boolean, rightText: string, miss: string) => void;
  onAdvance: (prompt: { id: string; text: string }) => void;
}) {
  const markerId = useId().replace(/:/g, "");
  const [selected, setSelected] = useState<string | null>(null);
  const byId = new Map(spec.parts.map((part) => [part.id, part]));
  const center = {
    x: spec.parts.reduce((sum, part) => sum + part.x, 0) / spec.parts.length,
    y: spec.parts.reduce((sum, part) => sum + part.y, 0) / spec.parts.length,
  };

  function choose(part: ScenePart) {
    setSelected(part.id);
    if (quizOpen) {
      const correct = part.label.trim().toLowerCase() === spec.quiz.answer.trim().toLowerCase();
      onQuiz(correct, `${part.label}. ${part.explanation}`, "Not that part.");
      return;
    }
    onAdvance({ id: part.id, text: `${part.label}. ${part.explanation}` });
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block h-auto w-full text-foreground" role="img" aria-label={spec.title}>
        <rect x="16" y="12" width="608" height="376" rx="18" fill="var(--surface-2)" />
        <defs>
          <marker id={markerId} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
            <path d="M0 0 L7 3 L0 6" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </marker>
        </defs>
        {spec.arrows.map((arrow) => {
          const from = byId.get(arrow.from);
          const to = byId.get(arrow.to);
          if (!from || !to) return null;
          const x1 = place(from.x, 72, 496);
          const y1 = place(from.y, 56, 280);
          const x2 = place(to.x, 72, 496);
          const y2 = place(to.y, 56, 280);
          return (
            <line
              key={`${arrow.from}-${arrow.to}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth="1.25"
              markerEnd={`url(#${markerId})`}
            />
          );
        })}
        {spec.parts.map((part) => {
          const x = place(part.x, 72, 496);
          const y = place(part.y, 56, 280);
          const hot = selected === part.id;
          const dx = part.x - center.x;
          const dy = part.y - center.y;
          const length = Math.hypot(dx, dy) || 1;
          const labelX = x + (dx / length) * 36;
          const labelY = y + (dy / length) * 28;
          return (
            <g key={part.id}>
              <line
                x1={x}
                y1={y}
                x2={labelX}
                y2={labelY}
                stroke="currentColor"
                strokeOpacity="0.35"
                strokeWidth="1"
              />
              <circle
                cx={x}
                cy={y}
                r={hot ? 8 : 6}
                fill={hot ? "currentColor" : "var(--surface-1)"}
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor={dx >= 0 ? "start" : "end"}
                dominantBaseline="middle"
                fill="currentColor"
                fontSize="15"
                fontWeight={hot ? 650 : 560}
              >
                {part.label}
              </text>
            </g>
          );
        })}
      </svg>
      {spec.parts.map((part) => {
        const x = place(part.x, 72, 496);
        const y = place(part.y, 56, 280);
        return (
          <button
            key={part.id}
            type="button"
            aria-label={part.label}
            aria-pressed={selected === part.id}
            className="absolute h-16 w-28 -translate-x-1/2 -translate-y-1/2 bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ left: `${(x / WIDTH) * 100}%`, top: `${(y / HEIGHT) * 100}%` }}
            onClick={() => choose(part)}
          />
        );
      })}
    </div>
  );
}
