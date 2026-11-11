"use client";

import { useState } from "react";
import { LogoMark } from "@/components/brand/logo";
import { DiagramStudio } from "@/components/diagrams/diagram-studio";
import { Button } from "@/components/ui/button";
import {
  DIAGRAM_PART_IDS,
  SAMPLE_DIAGRAM,
  type DiagramContent,
  type DiagramResult,
} from "@/lib/diagrams/content";
import { tallyAnswers, type DiagramAnswer, type PartTally } from "@/lib/diagrams/tally";

function money(value: number) {
  if (value === 0) return "$0";
  if (value < 0.01) return `$${value.toFixed(6)}`;
  return `$${value.toFixed(4)}`;
}

export function DiagramPlayer() {
  const [grade, setGrade] = useState(4);
  const [language, setLanguage] = useState("en");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [miss, setMiss] = useState<DiagramResult | null>(null);
  const [hit, setHit] = useState<DiagramResult | null>(null);
  const [sample, setSample] = useState(false);
  const [tally, setTally] = useState<PartTally[] | null>(null);
  const [sampleAnswers, setSampleAnswers] = useState<DiagramAnswer[]>([]);

  const active = sample ? null : (hit ?? miss);
  const content: DiagramContent | null = sample ? SAMPLE_DIAGRAM : (active?.content ?? null);
  const visibleTally = sample
    ? sampleAnswers.length > 0
      ? tallyAnswers(DIAGRAM_PART_IDS, sampleAnswers)
      : null
    : tally;

  async function loadTally(nextGrade: number, nextLanguage: string) {
    const params = new URLSearchParams({
      topic: "water cycle",
      grade: String(nextGrade),
      language: nextLanguage,
    });
    const response = await fetch(`/api/diagrams/answers?${params}`);
    if (!response.ok) return;
    const body = (await response.json()) as { tally?: PartTally[] };
    if (body.tally) setTally(body.tally);
  }

  async function requestDiagram() {
    setPending(true);
    setError(null);
    setSample(false);
    try {
      const response = await fetch("/api/diagrams", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic: "water cycle", grade, language }),
      });
      const body = (await response.json()) as DiagramResult & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Diagram failed");
      if (body.cache === "miss") {
        setMiss(body);
        setHit(null);
      } else {
        setHit(body);
      }
      await loadTally(grade, language);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Diagram failed");
    } finally {
      setPending(false);
    }
  }

  async function recordAnswer(answer: DiagramAnswer) {
    if (sample) {
      setSampleAnswers((current) => [...current, answer]);
      return;
    }
    const response = await fetch("/api/diagrams/answers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        topic: "water cycle",
        grade,
        language,
        partId: answer.partId,
        mode: answer.mode,
        correct: answer.correct,
      }),
    });
    if (!response.ok) return;
    const body = (await response.json()) as { tally?: PartTally[] };
    if (body.tally) setTally(body.tally);
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-6">
      <header className="flex items-center gap-3">
        <LogoMark className="size-8" title="PersonaLearn" />
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">PersonaLearn</p>
          <h1 className="text-xl font-semibold text-foreground">Labelled diagram</h1>
        </div>
      </header>

      <section className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm text-foreground">
          Grade
          <select
            className="h-10 rounded-md border border-border bg-surface-1 px-3 text-sm"
            value={grade}
            onChange={(event) => {
              setGrade(Number(event.target.value));
              setHit(null);
            }}
          >
            {Array.from({ length: 9 }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value}>
                Grade {value}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-foreground">
          Language
          <select
            className="h-10 rounded-md border border-border bg-surface-1 px-3 text-sm"
            value={language}
            onChange={(event) => {
              setLanguage(event.target.value);
              setHit(null);
            }}
          >
            <option value="en">English</option>
            <option value="sw">Kiswahili</option>
          </select>
        </label>
        <Button type="button" onClick={requestDiagram} disabled={pending}>
          {pending ? "Requesting…" : "Load diagram"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setSample(true)}>
          Sample diagram
        </Button>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {sample ? (
        <p className="text-sm text-muted-foreground">
          Sample diagram uses the template text. It does not call the model.
        </p>
      ) : null}

      {content ? (
        <DiagramStudio content={content} onAnswer={recordAnswer} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Load a diagram to tap its parts. A signed-in teacher is required.
        </p>
      )}

      {visibleTally ? (
        <section className="rounded-xl border border-border bg-surface-1 px-4 py-3">
          <h2 className="text-sm font-medium text-foreground">Parts learners missed</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {visibleTally.map((row) => (
              <li key={row.partId}>
                {row.partId}: {row.incorrect} wrong, {row.correct} right
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {active && !sample ? (
        <section className="grid grid-cols-2 gap-2 text-sm">
          <p className="text-muted-foreground">First request</p>
          <p className="text-muted-foreground">Cached request</p>
          <Metric result={miss} />
          <Metric result={hit} />
        </section>
      ) : null}
    </main>
  );
}

function Metric({ result }: { result: DiagramResult | null }) {
  if (!result) return <p className="text-sm text-muted-foreground">Not measured yet.</p>;
  return (
    <p className="font-mono text-xs text-foreground">
      {result.cache} · {result.metrics.promptTokens}+{result.metrics.completionTokens} tok ·{" "}
      {money(result.metrics.costUsd)} · {result.metrics.wallTimeMs} ms
    </p>
  );
}
