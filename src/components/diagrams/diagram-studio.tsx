"use client";

import { useEffect, useMemo, useState } from "react";
import { WaterCycleDiagram } from "@/components/diagrams/water-cycle-diagram";
import {
  DIAGRAM_PART_IDS,
  type DiagramContent,
  type DiagramPartId,
} from "@/lib/diagrams/content";
import type { DiagramAnswer } from "@/lib/diagrams/tally";

const ADVANCE_MS = 1400;

export function DiagramStudio({
  content,
  onAnswer,
}: {
  content: DiagramContent;
  onAnswer?: (answer: DiagramAnswer) => void;
}) {
  const [index, setIndex] = useState(0);
  const [verdict, setVerdict] = useState<{ index: number; text: string } | null>(null);
  const [selectedId, setSelectedId] = useState<DiagramPartId | null>(null);
  const part = content.parts[index % content.parts.length]!;
  const feedback = verdict?.index === index ? verdict.text : null;

  const labels = useMemo(() => {
    const map = {} as Record<DiagramPartId, string>;
    for (const id of DIAGRAM_PART_IDS) {
      map[id] = content.parts.find((item) => item.id === id)?.label ?? id;
    }
    return map;
  }, [content.parts]);

  useEffect(() => {
    if (!verdict || verdict.index !== index) return;
    const timer = window.setTimeout(() => {
      setIndex((value) => value + 1);
      setVerdict(null);
      setSelectedId(null);
    }, ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [verdict, index]);

  function activate(id: DiagramPartId) {
    if (verdict?.index === index) return;
    const correct = id === part.id;
    setSelectedId(id);
    setVerdict({
      index,
      text: correct ? `Right. ${part.explanation}` : "Not that part.",
    });
    onAnswer?.({ partId: part.id, mode: "find", correct });
  }

  return (
    <div className="relative">
      <WaterCycleDiagram selectedId={selectedId} labels={labels} onActivate={activate} />
      <div className="pointer-events-none absolute inset-x-4 bottom-3">
        <p className="text-sm text-foreground">{part.prompt}</p>
        {feedback ? <p className="mt-0.5 text-sm text-muted-foreground">{feedback}</p> : null}
      </div>
    </div>
  );
}
