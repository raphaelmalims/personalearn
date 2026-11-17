"use client";

import { useMemo, useRef, useState } from "react";
import { ExplainerStage } from "@/components/explainers/explainer-stage";
import { MediaControls } from "@/components/explainers/media-controls";
import { ScenePlate } from "@/components/explainers/scene-plate";
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
        {spec.block === "scene" ? (
          <ScenePlate
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
