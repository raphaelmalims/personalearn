"use client";

import Script from "next/script";
import { createElement, useEffect, useState } from "react";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { templateVariables, type ExplainerResult } from "@/lib/explainers/request";

type PlayerElement = HTMLElement & { play: () => void };

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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [miss, setMiss] = useState<ExplainerResult | null>(null);
  const [hit, setHit] = useState<ExplainerResult | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);

  async function requestExplainer() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/explainers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic: "water cycle", grade, language }),
      });
      const body = (await response.json()) as ExplainerResult & { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Explainer failed");
      }
      const vars = templateVariables(body.script);
      const nextSrc = `/explainers/template?vars=${encodeURIComponent(JSON.stringify(vars))}&play=${Date.now()}`;
      setSrc(nextSrc);
      if (body.cache === "miss") {
        setMiss(body);
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

  const showing = hit ?? miss;

  useEffect(() => {
    if (!src) return;
    const timer = window.setTimeout(() => {
      const player = document.querySelector("hyperframes-player") as PlayerElement | null;
      try {
        player?.play();
      } catch {
        // The player rejects play until its timeline is ready.
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [src]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <Script
        src="https://cdn.jsdelivr.net/npm/hyperframes@0.9.32/dist/hyperframes-player.global.js"
        strategy="afterInteractive"
        onLoad={() => setPlayerReady(true)}
      />
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
        <Button type="button" onClick={requestExplainer} disabled={pending || !playerReady}>
          {pending ? "Requesting…" : "Play explainer"}
        </Button>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="overflow-hidden rounded-xl border border-border bg-surface-1">
        {src
          ? createElement("hyperframes-player", {
              key: src,
              src,
              controls: true,
              style: { display: "block", width: "100%", aspectRatio: "16 / 9" },
            })
          : null}
        {src ? null : (
          <div className="flex aspect-video items-center justify-center text-sm text-muted-foreground">
            Request an explainer to play it here.
          </div>
        )}
      </div>

      {showing ? (
        <section className="grid gap-4 md:grid-cols-2">
          <Metrics title="First request" result={miss} />
          <Metrics title="Cached request" result={hit} />
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
          <Metric label="Cost" value={money(result.metrics.costUsd)} />
          <Metric label="Wall time" value={`${result.metrics.wallTimeMs} ms`} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Not measured yet.</p>
      )}
    </div>
  );
}
