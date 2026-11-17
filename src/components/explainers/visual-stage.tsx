"use client";

import { useId, useMemo, useRef, useState } from "react";
import { ExplainerStage } from "@/components/explainers/explainer-stage";
import { MediaControls } from "@/components/explainers/media-controls";
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

type Prompt = { id: string; text: string };
type Feedback = { promptId: string; text: string };

function sameText(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
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
  if (spec.block === "process-flow") {
    return (
      <ExplainerStage
        script={{ title: spec.title, steps: spec.steps }}
        language={artifact.language}
        playKey={playKey}
        autoPlay={autoPlay}
      />
    );
  }

  return <StaticFigure spec={spec} language={artifact.language} />;
}

function StaticFigure({
  spec,
  language,
}: {
  spec: Exclude<VisualSpec, { block: "process-flow" }>;
  language: string;
}) {
  const narration = useNarration(visualCaptions(spec), language);
  const [prompt, setPrompt] = useState<Prompt>({ id: "quiz", text: spec.quiz.prompt });
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const shownFeedback = feedback?.promptId === prompt.id ? feedback.text : null;

  function answerQuiz(correct: boolean, rightText: string, miss: string) {
    setFeedback({
      promptId: "quiz",
      text: correct ? `Right. ${rightText}` : miss,
    });
  }

  function advance(next: Prompt) {
    setPrompt(next);
    setFeedback(null);
  }

  const quizOpen = prompt.id === "quiz" && feedback?.promptId !== "quiz";

  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-surface-1">
      <figcaption className="px-4 pt-4 text-[15px] font-medium tracking-tight text-foreground">
        {spec.title}
      </figcaption>
      <div className="relative">
        {spec.block === "number-line" ? (
          <NumberLine
            spec={spec}
            quizOpen={quizOpen}
            onQuiz={answerQuiz}
            onAdvance={advance}
          />
        ) : null}
        {spec.block === "labelled-diagram" ? (
          <LabelledDiagram
            spec={spec}
            quizOpen={quizOpen}
            onQuiz={answerQuiz}
            onAdvance={advance}
          />
        ) : null}
        {spec.block === "comparison" ? (
          <Comparison
            spec={spec}
            quizOpen={quizOpen}
            onQuiz={answerQuiz}
            onAdvance={advance}
          />
        ) : null}
        {spec.block === "timeline" ? (
          <Timeline
            spec={spec}
            quizOpen={quizOpen}
            onQuiz={answerQuiz}
            onAdvance={advance}
          />
        ) : null}
      </div>
      <div className="flex items-end justify-between gap-3 px-4 pt-2 pb-3">
        <div className="min-h-10 min-w-0">
          <p className="text-sm text-foreground">{prompt.text}</p>
          {shownFeedback ? <p className="mt-1 text-sm text-muted-foreground">{shownFeedback}</p> : null}
        </div>
        <MediaControls
          playing={narration.playing}
          muted={narration.muted}
          onPlay={narration.play}
          onPause={narration.pause}
          onToggleVolume={narration.toggleVolume}
        />
      </div>
    </figure>
  );
}

function useNarration(captions: string[], language: string) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const timers = useRef<number[]>([]);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  function pause() {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
    window.speechSynthesis?.cancel();
    setPlaying(false);
  }

  function play() {
    pause();
    setPlaying(true);
    if (mutedRef.current) return;
    const voice = pickNarrationVoice(voiceList(), language);
    if (!voice || !window.speechSynthesis) return;
    captions.forEach((caption, index) => {
      const id = window.setTimeout(() => {
        if (mutedRef.current || !window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(caption);
        utterance.lang = voice.lang;
        const live = window.speechSynthesis
          .getVoices()
          .find((item) => item.lang === voice.lang && item.name === voice.name);
        if (live) utterance.voice = live;
        if (index === captions.length - 1) {
          utterance.onend = () => setPlaying(false);
        }
        window.speechSynthesis.speak(utterance);
      }, index * 2200);
      timers.current.push(id);
    });
  }

  function toggleVolume() {
    setMuted((value) => {
      if (!value) window.speechSynthesis?.cancel();
      return !value;
    });
  }

  return { playing, muted, play, pause, toggleVolume };
}

function NumberLine({
  spec,
  quizOpen,
  onQuiz,
  onAdvance,
}: {
  spec: Extract<VisualSpec, { block: "number-line" }>;
  quizOpen: boolean;
  onQuiz: (correct: boolean, rightText: string, miss: string) => void;
  onAdvance: (prompt: Prompt) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const span = Math.max(spec.max - spec.min, 1);
  const ticks = useMemo(() => tickValues(spec.min, spec.max, spec.points.map((point) => point.value)), [spec]);
  const pointValues = new Set(spec.points.map((point) => point.value));

  function xOf(value: number) {
    return 48 + ((value - spec.min) / span) * 544;
  }

  function choose(point: (typeof spec.points)[number]) {
    setSelected(point.value);
    if (quizOpen) {
      const correct = sameText(point.label, spec.quiz.answer) || sameText(String(point.value), spec.quiz.answer);
      onQuiz(correct, point.caption, "Not that point.");
      return;
    }
    onAdvance({ id: `point-${point.value}`, text: point.caption });
  }

  return (
    <div className="relative">
      <svg viewBox="0 0 640 168" className="block h-auto w-full text-foreground" role="img" aria-label={spec.title}>
        <line x1="36" y1="78" x2="604" y2="78" stroke="currentColor" strokeWidth="1.5" />
        <path d="M36 78 l10 -5 v10 z M604 78 l-10 -5 v10 z" fill="currentColor" />
        {ticks.map((value) => {
          const x = xOf(value);
          const major = value === 0 || pointValues.has(value);
          return (
            <g key={value}>
              <line
                x1={x}
                y1={major ? 64 : 70}
                x2={x}
                y2={major ? 92 : 86}
                stroke="currentColor"
                strokeWidth={value === 0 ? 2 : 1.25}
              />
              {pointValues.has(value) ? null : (
                <text
                  x={x}
                  y="118"
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize="14"
                  fontFamily="var(--font-mono), ui-monospace, monospace"
                >
                  {value}
                </text>
              )}
            </g>
          );
        })}
        {selected == null ? null : <circle cx={xOf(selected)} cy="78" r="5.5" fill="currentColor" />}
      </svg>
      {spec.points.map((point) => (
        <button
          key={point.value}
          type="button"
          aria-pressed={selected === point.value}
          className={cn(
            "absolute flex h-11 w-12 -translate-x-1/2 -translate-y-1/2 items-end justify-center bg-transparent text-sm tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            selected === point.value ? "font-semibold" : "font-medium"
          )}
          style={{
            left: `${(xOf(point.value) / 640) * 100}%`,
            top: `${(112 / 168) * 100}%`,
          }}
          onClick={() => choose(point)}
        >
          {point.label}
        </button>
      ))}
    </div>
  );
}

function tickValues(min: number, max: number, points: number[]) {
  const span = Math.max(max - min, 1);
  const step = span <= 14 ? 1 : Math.max(1, Math.round(span / 8));
  const values = new Set<number>(points);
  for (let value = min; value <= max; value += step) values.add(value);
  values.add(max);
  return [...values].filter((value) => value >= min && value <= max).sort((a, b) => a - b);
}

type DiagramPart = Extract<VisualSpec, { block: "labelled-diagram" }>["parts"][number];

const PLANT_REGIONS = {
  flower: { left: "38%", top: "8%", width: "24%", height: "22%" },
  leaf: { left: "18%", top: "28%", width: "28%", height: "22%" },
  stem: { left: "40%", top: "30%", width: "20%", height: "42%" },
  root: { left: "30%", top: "68%", width: "40%", height: "24%" },
} as const;

function plantRegion(part: DiagramPart) {
  const blob = `${part.id} ${part.label}`.toLowerCase();
  if (/flower|bloom|petal/.test(blob)) return "flower" as const;
  if (/leaf|leaves/.test(blob)) return "leaf" as const;
  if (/stem|stalk/.test(blob)) return "stem" as const;
  if (/root/.test(blob)) return "root" as const;
  return null;
}

function LabelledDiagram({
  spec,
  quizOpen,
  onQuiz,
  onAdvance,
}: {
  spec: Extract<VisualSpec, { block: "labelled-diagram" }>;
  quizOpen: boolean;
  onQuiz: (correct: boolean, rightText: string, miss: string) => void;
  onAdvance: (prompt: Prompt) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const plant = spec.parts.every((part) => plantRegion(part));

  function choose(part: DiagramPart) {
    setSelected(part.id);
    if (quizOpen) {
      onQuiz(sameText(part.label, spec.quiz.answer), `${part.label}. ${part.explanation}`, "Not that part.");
      return;
    }
    onAdvance({ id: part.id, text: `${part.label}. ${part.explanation}` });
  }

  return (
    <div className="relative">
      <svg viewBox="0 0 640 380" className="block h-auto w-full text-foreground" aria-hidden="true">
        <rect x="16" y="12" width="608" height="356" rx="18" fill="var(--surface-2)" />
        {plant ? <PlantDrawing selected={selected} parts={spec.parts} /> : <CalloutStrip selected={selected} parts={spec.parts} />}
      </svg>
      {(plant ? spec.parts : spec.parts).map((part) => {
        const region = plant ? PLANT_REGIONS[plantRegion(part)!] : stripRegion(spec.parts.length, spec.parts.indexOf(part));
        return (
          <button
            key={part.id}
            type="button"
            aria-pressed={selected === part.id}
            aria-label={part.label}
            className="absolute bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={region}
            onClick={() => choose(part)}
          />
        );
      })}
    </div>
  );
}

function PlantDrawing({
  selected,
  parts,
}: {
  selected: string | null;
  parts: DiagramPart[];
}) {
  const labelFor = (kind: keyof typeof PLANT_REGIONS) =>
    parts.find((part) => plantRegion(part) === kind)?.label ?? "";
  const on = (kind: keyof typeof PLANT_REGIONS) =>
    parts.some((part) => plantRegion(part) === kind && part.id === selected);
  return (
    <g>
      <path d="M70 300 C 180 286, 460 286, 570 304" fill="none" stroke="currentColor" strokeOpacity="0.25" />
      <path d="M318 96 C 318 180, 314 240, 320 292" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M214 214 C 250 196, 286 188, 312 196 C 286 214, 250 228, 214 214 Z"
        fill="color-mix(in srgb, var(--success) 55%, var(--surface-1))"
        stroke="currentColor"
        strokeWidth={on("leaf") ? 2 : 1}
      />
      <path
        d="M430 168 C 390 156, 350 160, 326 176 C 356 188, 398 190, 430 168 Z"
        fill="color-mix(in srgb, var(--success) 55%, var(--surface-1))"
        stroke="currentColor"
        strokeWidth={on("leaf") ? 2 : 1}
      />
      <path d="M292 292 C 270 324, 246 338, 220 346 M320 294 C 320 330, 336 348, 368 356 M348 292 C 372 318, 390 332, 410 338" fill="none" stroke="currentColor" strokeWidth={on("root") ? 2.4 : 1.6} strokeLinecap="round" />
      <circle cx="320" cy="78" r="16" fill="color-mix(in srgb, var(--warning) 70%, var(--surface-1))" stroke="currentColor" strokeWidth={on("flower") ? 2 : 1} />
      <circle cx="304" cy="66" r="10" fill="var(--surface-1)" stroke="currentColor" strokeWidth="1" />
      <circle cx="336" cy="66" r="10" fill="var(--surface-1)" stroke="currentColor" strokeWidth="1" />
      <circle cx="308" cy="90" r="10" fill="var(--surface-1)" stroke="currentColor" strokeWidth="1" />
      <circle cx="334" cy="90" r="10" fill="var(--surface-1)" stroke="currentColor" strokeWidth="1" />
      <Leader x1={360} y1={78} x2={470} y2={64} label={labelFor("flower")} hot={on("flower")} />
      <Leader x1={214} y1={214} x2={78} y2={196} label={labelFor("leaf")} hot={on("leaf")} />
      <Leader x1={336} y1={200} x2={470} y2={220} label={labelFor("stem")} hot={on("stem")} />
      <Leader x1={280} y1={330} x2={78} y2={348} label={labelFor("root")} hot={on("root")} />
    </g>
  );
}

function Leader({ x1, y1, x2, y2, label, hot }: { x1: number; y1: number; x2: number; y2: number; label: string; hot: boolean }) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeOpacity="0.55" strokeWidth="1" />
      <text x={x2} y={y2} fill="currentColor" fontSize="15" fontWeight={hot ? 650 : 500} textAnchor={x2 < 200 ? "start" : "start"}>
        {label}
      </text>
    </g>
  );
}

function stripRegion(count: number, index: number) {
  const width = 80 / count;
  return {
    left: `${10 + index * width}%`,
    top: "18%",
    width: `${width - 2}%`,
    height: "64%",
  };
}

function CalloutStrip({ selected, parts }: { selected: string | null; parts: DiagramPart[] }) {
  const markerId = useId().replace(/:/g, "");
  return (
    <g>
      <defs>
        <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0 0 L7 4 L0 8" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </marker>
      </defs>
      {parts.map((part, index) => {
        const count = parts.length;
        const x = 70 + ((500 / Math.max(count - 1, 1)) * index);
        const next = index < count - 1 ? 70 + (500 / Math.max(count - 1, 1)) * (index + 1) : null;
        const hot = selected === part.id;
        return (
          <g key={part.id}>
            {next == null ? null : (
              <line x1={x + 28} y1={150} x2={next - 28} y2={150} stroke="currentColor" strokeWidth="1.25" markerEnd={`url(#${markerId})`} />
            )}
            <rect x={x - 22} y={128} width="44" height="44" rx="12" fill="var(--surface-1)" stroke="currentColor" strokeWidth={hot ? 2 : 1} />
            <text x={x} y={214} textAnchor="middle" fill="currentColor" fontSize="15" fontWeight={hot ? 650 : 500}>
              {part.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Comparison({
  spec,
  quizOpen,
  onQuiz,
  onAdvance,
}: {
  spec: Extract<VisualSpec, { block: "comparison" }>;
  quizOpen: boolean;
  onQuiz: (correct: boolean, rightText: string, miss: string) => void;
  onAdvance: (prompt: Prompt) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  function choose(index: number) {
    const row = spec.rows[index]!;
    setSelected(index);
    const caption = spec.captions[index] ?? row.cells.join(". ");
    if (quizOpen) {
      const correct = row.cells.some((cell) => sameText(cell, spec.quiz.answer));
      onQuiz(correct, caption, "Not that row.");
      return;
    }
    onAdvance({ id: `row-${index}`, text: caption });
  }

  return (
    <div className="px-3 pt-1">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border">
        {spec.columns.map((column) => (
          <div key={column} className="bg-surface-2 px-3 py-2 text-xs font-medium text-muted-foreground">
            {column}
          </div>
        ))}
        {spec.rows.map((row, index) => (
          <button
            key={`${row.cells[0]}-${index}`}
            type="button"
            aria-pressed={selected === index}
            className={cn(
              "col-span-2 grid grid-cols-2 bg-surface-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected === index ? "bg-surface-2" : ""
            )}
            onClick={() => choose(index)}
          >
            {row.cells.map((cell) => (
              <span key={cell} className="px-3 py-3 text-sm text-foreground">
                {cell}
              </span>
            ))}
          </button>
        ))}
      </div>
    </div>
  );
}

function Timeline({
  spec,
  quizOpen,
  onQuiz,
  onAdvance,
}: {
  spec: Extract<VisualSpec, { block: "timeline" }>;
  quizOpen: boolean;
  onQuiz: (correct: boolean, rightText: string, miss: string) => void;
  onAdvance: (prompt: Prompt) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  function choose(index: number) {
    const event = spec.events[index]!;
    setSelected(index);
    if (quizOpen) {
      const correct = sameText(event.label, spec.quiz.answer) || sameText(event.when, spec.quiz.answer);
      onQuiz(correct, event.caption, "Not that event.");
      return;
    }
    onAdvance({ id: `event-${index}`, text: event.caption });
  }

  return (
    <ol className="relative mx-4 my-2 border-l border-foreground/25">
      {spec.events.map((event, index) => (
        <li key={`${event.when}-${event.label}`}>
          <button
            type="button"
            aria-pressed={selected === index}
            className="relative block w-full py-2 pl-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => choose(index)}
          >
            <span
              className={cn(
                "absolute top-4 -left-[5px] h-2 w-2 rounded-full bg-foreground",
                selected === index ? "scale-125" : "opacity-70"
              )}
              aria-hidden
            />
            <span className="block text-xs text-muted-foreground">{event.when}</span>
            <span className="block text-sm font-medium text-foreground">{event.label}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
