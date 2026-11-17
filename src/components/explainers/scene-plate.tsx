"use client";

import { useState } from "react";
import type { VisualSpec } from "@/lib/explainers/blocks";

type SceneSpec = Extract<VisualSpec, { block: "scene" }>;
type ScenePart = SceneSpec["parts"][number];

export function ScenePlate({
  spec,
  quizOpen,
  onQuiz,
  onAdvance,
  onPart,
  imageSrc,
}: {
  spec: SceneSpec;
  quizOpen: boolean;
  onQuiz: (correct: boolean, rightText: string, miss: string) => void;
  onAdvance: (prompt: { id: string; text: string }) => void;
  onPart?: (part: ScenePart) => void;
  imageSrc?: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const src =
    imageSrc ??
    (spec.imagePath ? `/api/explainers/scenes?path=${encodeURIComponent(spec.imagePath)}` : "");

  function choose(part: ScenePart) {
    setSelected(part.id);
    onPart?.(part);
    if (quizOpen) {
      const correct = part.label.trim().toLowerCase() === spec.quiz.answer.trim().toLowerCase();
      onQuiz(correct, `${part.label}. ${part.explanation}`, "Not that part.");
      return;
    }
    onAdvance({ id: part.id, text: `${part.label}. ${part.explanation}` });
  }

  return (
    <div className="relative">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={spec.title} className="block h-auto w-full" />
      ) : null}
      {spec.parts.map((part) => (
        <button
          key={part.id}
          type="button"
          aria-label={part.label}
          aria-pressed={selected === part.id}
          className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ left: `${part.x}%`, top: `${part.y}%` }}
          onClick={() => choose(part)}
        />
      ))}
    </div>
  );
}
