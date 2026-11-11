"use client";

import { useMemo, useState } from "react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { WaterCycleDiagram } from "@/components/diagrams/water-cycle-diagram";
import {
  DIAGRAM_PART_IDS,
  type DiagramContent,
  type DiagramPart,
  type DiagramPartId,
} from "@/lib/diagrams/content";
import type { DiagramAnswer } from "@/lib/diagrams/tally";

type Mode = "explore" | "find" | "name";

export function DiagramStudio({
  content,
  onAnswer,
}: {
  content: DiagramContent;
  onAnswer?: (answer: DiagramAnswer) => void;
}) {
  const [mode, setMode] = useState<Mode>("explore");
  const [selectedId, setSelectedId] = useState<DiagramPartId | null>(null);
  const [findIndex, setFindIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [chosenLabel, setChosenLabel] = useState<DiagramPartId | null>(null);
  const [placed, setPlaced] = useState<Partial<Record<DiagramPartId, string>>>({});

  const byId = useMemo(() => {
    const map = {} as Record<DiagramPartId, DiagramPart>;
    for (const part of content.parts) map[part.id] = part;
    return map;
  }, [content.parts]);

  const labels = useMemo(() => {
    const map = {} as Record<DiagramPartId, string>;
    for (const id of DIAGRAM_PART_IDS) map[id] = byId[id]?.label ?? id;
    return map;
  }, [byId]);

  const findPart = content.parts[findIndex % content.parts.length];
  const nameLabels = [...content.parts].reverse();

  function activate(id: DiagramPartId) {
    if (mode === "explore") {
      setSelectedId(id);
      setFeedback(null);
      return;
    }
    if (mode === "find") {
      const correct = id === findPart.id;
      setSelectedId(id);
      setFeedback(correct ? `Right. That is ${findPart.label}.` : "Not that part. Try the next one.");
      onAnswer?.({ partId: findPart.id, mode: "find", correct });
      setFindIndex((index) => index + 1);
      return;
    }
    if (!chosenLabel) {
      setFeedback("Choose a label, then tap the part.");
      return;
    }
    const correct = chosenLabel === id;
    setFeedback(correct ? "Placed." : "That label belongs on another part.");
    onAnswer?.({ partId: chosenLabel, mode: "name", correct });
    if (correct) {
      setPlaced((current) => ({ ...current, [id]: byId[id].label }));
    }
    setChosenLabel(null);
    setSelectedId(id);
  }

  const explored = mode === "explore" && selectedId ? byId[selectedId] : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Diagram mode">
        {(
          [
            ["explore", "Explore"],
            ["find", "Find it"],
            ["name", "Name it"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            className={cn(
              buttonVariants({
                size: "sm",
                variant: mode === value ? "primary" : "outline",
              })
            )}
            onClick={() => {
              setMode(value);
              setFeedback(null);
              setSelectedId(null);
              setChosenLabel(null);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <WaterCycleDiagram
        selectedId={selectedId}
        placedLabels={mode === "name" ? placed : {}}
        revealNames={mode === "explore"}
        labels={labels}
        onActivate={activate}
      />

      {mode === "explore" ? (
        <section className="min-h-16 rounded-xl border border-border bg-surface-1 px-4 py-3">
          {explored ? (
            <>
              <h2 className="text-base font-semibold text-foreground">{explored.label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{explored.explanation}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Tap a part to see its name.</p>
          )}
        </section>
      ) : null}

      {mode === "find" ? (
        <section className="rounded-xl border border-border bg-surface-1 px-4 py-3">
          <p className="text-sm font-medium text-foreground">{findPart.prompt}</p>
          {feedback ? <p className="mt-2 text-sm text-muted-foreground">{feedback}</p> : null}
        </section>
      ) : null}

      {mode === "name" ? (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {nameLabels.map((part) => {
              const used = placed[part.id] === part.label;
              return (
                <button
                  key={part.id}
                  type="button"
                  disabled={used}
                  aria-pressed={chosenLabel === part.id}
                  className={cn(
                    buttonVariants({
                      size: "sm",
                      variant: chosenLabel === part.id ? "primary" : "outline",
                    })
                  )}
                  onClick={() => setChosenLabel(part.id)}
                >
                  {part.label}
                </button>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground">
            {feedback ?? "Tap a label, then tap the part it names."}
          </p>
        </section>
      ) : null}
    </div>
  );
}
