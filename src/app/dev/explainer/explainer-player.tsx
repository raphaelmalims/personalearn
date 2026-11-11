"use client";

import { useState } from "react";
import { LogoMark } from "@/components/brand/logo";
import { ExplainerStage } from "@/components/explainers/explainer-stage";
import { Button } from "@/components/ui/button";
import type { ExplainerResult } from "@/lib/explainers/request";

const SAMPLE_SCRIPT = {
  title: "The water cycle",
  steps: [
    { label: "Evaporation", caption: "The sun turns water into vapour." },
    { label: "Condensation", caption: "Vapour cools and forms clouds." },
    { label: "Precipitation", caption: "Heavy drops fall as rain." },
    { label: "Collection", caption: "Water collects, then rises again." },
  ],
};

function money(value: number) {
  if (value === 0) return "$0";
  if (value < 0.01) return `$${value.toFixed(6)}`;
  return `$${value.toFixed(4)}`;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-1 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-mono text-sm text-foreground">{value}</p>
    </div>
  );
}

export function ExplainerPlayer() {
  const [grade, setGrade] = useState(4);
  const [language, setLanguage] = useState("en");
  const [emphasis, setEmphasis] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [miss, setMiss] = useState<ExplainerResult | null>(null);
  const [personalised, setPersonalised] = useState<ExplainerResult | null>(null);
  const [hit, setHit] = useState<ExplainerResult | null>(null);
  const [sample, setSample] = useState(false);

  const showing = hit ?? personalised ?? miss;
  const playback = sample
    ? { script: SAMPLE_SCRIPT, language: "en", playKey: "sample" }
    : showing
      ? { script: showing.script, language: showing.language, playKey: `${showing.cache}-${showing.metrics.wallTimeMs}` }
      : null;

  async function requestExplainer() {
    setPending(true);
    setError(null);
    setSample(false);
    try {
      const response = await fetch("/api/explainers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic: "water cycle",
          grade,
          language,
          emphasis: emphasis.trim() || undefined,
        }),
      });
      const body = (await response.json()) as ExplainerResult & { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Explainer failed");
      }
      if (body.cache === "miss") {
        setMiss(body);
        setPersonalised(null);
        setHit(null);
      } else if (body.cache === "personalised") {
        setPersonalised(body);
        setHit(null);
      } else {
        setHit(body);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Explainer failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center gap-3">
        <LogoMark className="size-8" title="PersonaLearn" />
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">PersonaLearn</p>
          <h1 className="text-xl font-semibold text-foreground">Animated explainer</h1>
        </div>
      </header>

      <section className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm text-foreground">
          Topic
          <input
            className="h-10 rounded-md border border-border bg-surface-1 px-3 text-sm"
            value="Water cycle"
            readOnly
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-foreground">
          Grade
          <select
            className="h-10 rounded-md border border-border bg-surface-1 px-3 text-sm"
            value={grade}
            onChange={(event) => {
              setGrade(Number(event.target.value));
              setHit(null);
              setPersonalised(null);
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
              setPersonalised(null);
            }}
          >
            <option value="en">English</option>
            <option value="sw">Kiswahili</option>
          </select>
        </label>
        <label className="flex min-w-64 flex-1 flex-col gap-1 text-sm text-foreground">
          Emphasis
          <input
            className="h-10 rounded-md border border-border bg-surface-1 px-3 text-sm"
            value={emphasis}
            placeholder="Optional, such as a local example"
            onChange={(event) => {
              setEmphasis(event.target.value);
              setHit(null);
            }}
          />
        </label>
        <Button type="button" onClick={requestExplainer} disabled={pending}>
          {pending ? "Requesting…" : "Play explainer"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setSample(true)}>
          Sample playback
        </Button>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {sample ? (
        <p className="text-sm text-muted-foreground">
          Sample playback uses the template script. It does not call the model.
        </p>
      ) : null}

      {playback ? (
        <ExplainerStage
          script={playback.script}
          language={playback.language}
          playKey={playback.playKey}
          autoPlay
        />
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-xl border border-border text-sm text-muted-foreground">
          Request an explainer to play it here. A signed-in teacher is required.
        </div>
      )}

      {showing && !sample ? (
        <section className="grid gap-4 md:grid-cols-3">
          <Metrics title="First request" result={miss} />
          <Metrics title="Base cached, personalised" result={personalised} />
          <Metrics title="Fully cached" result={hit} />
        </section>
      ) : null}
    </main>
  );
}

function Metrics({
  title,
  result,
}: {
  title: string;
  result: ExplainerResult | null;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      {result ? (
        <div className="grid grid-cols-2 gap-2">
          <Metric label="Cache" value={result.cache} />
          <Metric label="Model" value={result.metrics.modelId} />
          <Metric label="Prompt tokens" value={String(result.metrics.promptTokens)} />
          <Metric label="Completion tokens" value={String(result.metrics.completionTokens)} />
          <Metric label="Cached prompt tokens" value={String(result.metrics.cachedPromptTokens)} />
          <Metric label="Cost" value={money(result.metrics.costUsd)} />
          <Metric label="Wall time" value={`${result.metrics.wallTimeMs} ms`} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Not measured yet.</p>
      )}
    </div>
  );
}
