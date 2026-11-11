"use client";

import { useEffect, useState } from "react";
import { DiagramStudio } from "@/components/diagrams/diagram-studio";
import { ExplainerStage } from "@/components/explainers/explainer-stage";
import { buttonVariants } from "@/components/ui/button-variants";
import type { DiagramAnswer, PartTally } from "@/lib/diagrams/tally";
import { toWaterCycleDiagram } from "@/lib/diagrams/water-cycle-parts";
import {
  visualCaptions,
  type VisualArtifact,
  type VisualSpec,
} from "@/lib/explainers/blocks";
import { pickNarrationVoice } from "@/lib/explainers/narration";
import { cn } from "@/lib/utils";

function voiceList() {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices().map((voice) => ({
    lang: voice.lang,
    name: voice.name,
  }));
}

export function VisualStage({
  artifact,
  playKey,
  autoPlay = false,
}: {
  artifact: VisualArtifact;
  playKey: string;
  autoPlay?: boolean;
}) {
  const spec = artifact.spec;
  const waterDiagram = toWaterCycleDiagram(artifact.topic, spec);
  const [tally, setTally] = useState<PartTally[] | null>(null);

  const tallyKey = waterDiagram
    ? `${artifact.topic}|${artifact.grade}|${artifact.language}`
    : "";
  useEffect(() => {
    if (!tallyKey) return;
    let cancelled = false;
    void loadDiagramTally(artifact).then((rows) => {
      if (!cancelled && rows) setTally(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [tallyKey, artifact]);

  return (
    <div className="flex flex-col gap-3">
      {spec.block === "process-flow" ? (
        <ExplainerStage
          script={{ title: spec.title, steps: spec.steps }}
          language={artifact.language}
          playKey={playKey}
          autoPlay={autoPlay}
        />
      ) : waterDiagram ? (
        <DiagramStudio
          content={waterDiagram}
          onAnswer={(answer) => {
            void recordDiagramAnswer(artifact, answer).then((rows) => {
              if (rows) setTally(rows);
            });
          }}
        />
      ) : (
        <BlockFrame spec={spec} language={artifact.language} />
      )}
      {tally ? <PartTallyList tally={tally} /> : null}
      {waterDiagram ? null : <QuizHook quiz={spec.quiz} />}
    </div>
  );
}

function PartTallyList({ tally }: { tally: PartTally[] }) {
  return (
    <section className="rounded-xl border border-border bg-surface-1 px-4 py-3">
      <h2 className="text-sm font-medium text-foreground">Parts learners missed</h2>
      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
        {tally.map((row) => (
          <li key={row.partId}>
            {row.partId}: {row.incorrect} wrong, {row.correct} right
          </li>
        ))}
      </ul>
    </section>
  );
}

async function loadDiagramTally(artifact: VisualArtifact) {
  const params = new URLSearchParams({
    topic: artifact.topic,
    grade: String(artifact.grade),
    language: artifact.language,
  });
  const response = await fetch(`/api/diagrams/answers?${params}`);
  if (!response.ok) return null;
  const body = (await response.json()) as { tally?: PartTally[] };
  return body.tally ?? null;
}

function recordDiagramAnswer(artifact: VisualArtifact, answer: DiagramAnswer) {
  return fetch("/api/diagrams/answers", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      topic: artifact.topic,
      grade: artifact.grade,
      language: artifact.language,
      partId: answer.partId,
      mode: answer.mode,
      correct: answer.correct,
    }),
  }).then(async (response) => {
    if (!response.ok) return null;
    const body = (await response.json()) as { tally?: PartTally[] };
    return body.tally ?? null;
  });
}

function BlockFrame({ spec, language }: { spec: Exclude<VisualSpec, { block: "process-flow" }>; language: string }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface-1 p-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-foreground">{spec.title}</h3>
        <NarrateButton captions={visualCaptions(spec)} language={language} />
      </div>
      {spec.block === "number-line" ? <NumberLine spec={spec} /> : null}
      {spec.block === "labelled-diagram" ? <LabelledDiagram spec={spec} /> : null}
      {spec.block === "comparison" ? <Comparison spec={spec} /> : null}
      {spec.block === "timeline" ? <Timeline spec={spec} /> : null}
    </section>
  );
}

function NarrateButton({ captions, language }: { captions: string[]; language: string }) {
  const [muted, setMuted] = useState(false);
  const [captionsOnly, setCaptionsOnly] = useState(false);

  function speak() {
    window.speechSynthesis?.cancel();
    if (muted) return;
    const voice = pickNarrationVoice(voiceList(), language);
    if (!voice || !window.speechSynthesis) {
      setCaptionsOnly(true);
      return;
    }
    setCaptionsOnly(false);
    captions.forEach((caption, index) => {
      window.setTimeout(() => {
        if (!window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(caption);
        utterance.lang = voice.lang;
        const live = window.speechSynthesis
          .getVoices()
          .find((item) => item.lang === voice.lang && item.name === voice.name);
        if (live) utterance.voice = live;
        window.speechSynthesis.speak(utterance);
      }, index * 2200);
    });
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
        aria-pressed={muted}
        onClick={() => {
          const next = !muted;
          setMuted(next);
          if (next) window.speechSynthesis?.cancel();
          else speak();
        }}
      >
        {muted ? "Muted" : "Play"}
      </button>
      {captionsOnly ? (
        <p className="text-xs text-muted-foreground">Captions only</p>
      ) : null}
    </div>
  );
}

function NumberLine({ spec }: { spec: Extract<VisualSpec, { block: "number-line" }> }) {
  const [selected, setSelected] = useState<number | null>(null);
  const span = spec.max - spec.min;
  const xFor = (value: number) => 28 + ((value - spec.min) / span) * 264;
  const chosen = spec.points.find((point) => point.value === selected);

  return (
    <div className="flex flex-col gap-2">
      <svg viewBox="0 0 320 96" className="h-auto w-full" role="img" aria-label={spec.title}>
        <line x1="20" y1="48" x2="300" y2="48" stroke="var(--foreground)" strokeWidth="2" />
        {spec.points.map((point) => {
          const x = xFor(point.value);
          const on = selected === point.value;
          return (
            <g key={point.value}>
              <line x1={x} y1="40" x2={x} y2="56" stroke="var(--foreground)" strokeWidth="2" />
              <circle cx={x} cy="48" r={on ? 8 : 6} fill={on ? "var(--info)" : "var(--foreground)"} />
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-2">
        {spec.points.map((point) => (
          <button
            key={point.value}
            type="button"
            aria-pressed={selected === point.value}
            className={cn(
              buttonVariants({
                size: "sm",
                variant: selected === point.value ? "primary" : "outline",
              })
            )}
            onClick={() => setSelected(point.value)}
          >
            {point.label}
          </button>
        ))}
      </div>
      <p className="min-h-10 text-sm text-muted-foreground">
        {chosen?.caption ?? "Tap a point to hear what it shows."}
      </p>
    </div>
  );
}

const DIAGRAM_SLOTS = [
  { left: "25%", top: "32%" },
  { left: "75%", top: "32%" },
  { left: "25%", top: "72%" },
  { left: "75%", top: "72%" },
];

function LabelledDiagram({ spec }: { spec: Extract<VisualSpec, { block: "labelled-diagram" }> }) {
  const [selected, setSelected] = useState<string | null>(null);
  const chosen = spec.parts.find((part) => part.id === selected);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-[8/5] w-full rounded-xl border border-border">
        {spec.parts.map((part, index) => {
          const slot = DIAGRAM_SLOTS[index] ?? DIAGRAM_SLOTS[0]!;
          const on = selected === part.id;
          return (
            <button
              key={part.id}
              type="button"
              aria-pressed={on}
              className="absolute flex min-h-11 w-[42%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{
                left: slot.left,
                top: slot.top,
                borderColor: on ? "var(--foreground)" : undefined,
              }}
              onClick={() => setSelected(part.id)}
            >
              {part.label}
            </button>
          );
        })}
      </div>
      <p className="min-h-10 text-sm text-muted-foreground">
        {chosen ? `${chosen.label}. ${chosen.explanation}` : "Tap a part to see its name."}
      </p>
    </div>
  );
}

function Comparison({ spec }: { spec: Extract<VisualSpec, { block: "comparison" }> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {spec.columns.map((column) => (
              <th key={column} className="border border-border px-2 py-2 text-left font-medium text-foreground">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {spec.rows.map((row, index) => (
            <tr key={`${row.cells[0]}-${index}`}>
              {row.cells.map((cell) => (
                <td key={cell} className="border border-border px-2 py-2 text-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Timeline({ spec }: { spec: Extract<VisualSpec, { block: "timeline" }> }) {
  return (
    <ol className="flex flex-col gap-3 border-l border-border pl-4">
      {spec.events.map((event) => (
        <li key={`${event.when}-${event.label}`}>
          <p className="text-xs text-muted-foreground">{event.when}</p>
          <p className="text-sm font-medium text-foreground">{event.label}</p>
          <p className="text-sm text-muted-foreground">{event.caption}</p>
        </li>
      ))}
    </ol>
  );
}

function QuizHook({ quiz }: { quiz: { prompt: string; answer: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-xl border border-border bg-surface-1 px-3 py-3">
      <p className="text-sm text-foreground">{quiz.prompt}</p>
      <button
        type="button"
        className={cn(buttonVariants({ size: "sm", variant: "outline" }), "mt-2")}
        onClick={() => setOpen(true)}
      >
        {open ? quiz.answer : "Show answer"}
      </button>
    </section>
  );
}
