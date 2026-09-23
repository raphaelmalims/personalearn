"use client";

import { useState } from "react";
import { Sliders, Activity, Zap, CheckCircle2 } from "lucide-react";
import { Icon } from "@/components/ui/icon";

export function CognitiveResonanceVisualizer() {
  const [resonanceLevel, setResonanceLevel] = useState<number>(85); // 0 to 100

  // Derive metrics from resonanceLevel
  const engagementIndex = Math.round(28 + (resonanceLevel / 100) * 68);
  const retentionMultiplier = (1.0 + (resonanceLevel / 100) * 2.4).toFixed(1);
  const prepSeconds = Math.round(150 - (resonanceLevel / 100) * 105);

  // SVG Waveform generation
  const width = 640;
  const height = 140;
  const midY = height / 2;
  const points: [number, number][] = [];

  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    const progress = i / steps;

    // Harmonic wave when high resonance, chaotic/flat when low
    const t = progress * Math.PI * 6;
    const harmonic = Math.sin(t) * (resonanceLevel / 100) * 45;
    const noise =
      Math.sin(progress * 24 + 1.2) *
      ((100 - resonanceLevel) / 100) *
      12;

    const y = midY + harmonic + noise;
    points.push([x, y]);
  }

  const pathD = points.reduce((acc, [x, y], idx) => {
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, "");

  return (
    <div className="relative mx-auto w-full max-w-4xl rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-[10px] font-mono text-foreground font-semibold">
              COGNITIVE FREQUENCY ENGINE
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              [ACTIVE_RESONANCE_MONITOR]
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1.5">
            The Physics of Learner Attention
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
            When abstract concepts connect to what a child naturally loves, cognitive friction drops to zero. Tune the slider to observe how personalization transforms classroom dynamics.
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto rounded-full border border-border bg-surface-1 px-3 py-1 font-mono text-xs">
          {resonanceLevel >= 60 ? (
            <>
              <span className="h-2 w-2 rounded-full bg-foreground animate-ping" />
              <span className="text-foreground font-semibold">HIGH RESONANCE</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-muted-foreground" />
              <span className="text-muted-foreground">COGNITIVE DISSONANCE</span>
            </>
          )}
        </div>
      </div>

      {/* Interactive Slider Control */}
      <div className="space-y-3 rounded-xl border border-border/60 bg-surface-1/50 p-4">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Icon icon={Sliders} size="sm" />
            PERSONALIZATION DEPTH:
          </span>
          <span className="font-bold text-foreground">{resonanceLevel}% HARMONIZED</span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={resonanceLevel}
          onChange={(e) => setResonanceLevel(Number(e.target.value))}
          className="w-full accent-foreground cursor-pointer"
          aria-label="Personalization Depth"
        />

        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-1">
          <button
            onClick={() => setResonanceLevel(15)}
            className="hover:text-foreground transition-colors underline decoration-dotted"
          >
            ← 1:40 Industrial Lecture
          </button>
          <button
            onClick={() => setResonanceLevel(95)}
            className="hover:text-foreground transition-colors underline decoration-dotted"
          >
            1:1 Passion Resonance →
          </button>
        </div>
      </div>

      {/* SVG Waveform Visualizer Screen */}
      <div className="relative rounded-xl border border-border/80 bg-background/90 p-4 overflow-hidden">
        {/* Background Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:40px_40px] opacity-15" />

        <div className="relative">
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-2">
            <span>INPUT: KICD CURRICULUM VECTOR</span>
            <span>AMPLITUDE: {resonanceLevel}%</span>
            <span>OUTPUT: MEANINGFUL RETENTION</span>
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-28 sm:h-36 overflow-visible"
            preserveAspectRatio="none"
          >
            {/* Center Zero-Reference Line */}
            <line
              x1="0"
              y1={midY}
              x2={width}
              y2={midY}
              stroke="currentColor"
              strokeDasharray="4 4"
              className="text-border"
            />

            {/* Dynamic Waveform Path */}
            <path
              d={pathD}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-foreground transition-all duration-150"
            />

            {/* Nodes on Harmonic Peaks */}
            {resonanceLevel > 50 && (
              <>
                <circle cx={width * 0.25} cy={midY - 40} r="4" className="fill-foreground" />
                <circle cx={width * 0.5} cy={midY + 40} r="4" className="fill-foreground" />
                <circle cx={width * 0.75} cy={midY - 40} r="4" className="fill-foreground" />
              </>
            )}
          </svg>

          {/* Node Labels */}
          <div className="grid grid-cols-3 text-center text-[10px] font-mono text-muted-foreground pt-2 border-t border-border/40">
            <div>[01 // KICD STRAND ANCHOR]</div>
            <div>[02 // LEARNER PASSION BRIDGE]</div>
            <div>[03 // COMPETENCY MASTERY]</div>
          </div>
        </div>
      </div>

      {/* Telemetry Output Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/80 bg-surface-1 p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Icon icon={Activity} size="sm" />
            Classroom Engagement Index
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-foreground">
            {engagementIndex}%
          </p>
          <p className="text-[11px] text-muted-foreground">
            {resonanceLevel >= 60 ? "Active student-led discourse" : "Passive compliance / disengagement"}
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-surface-1 p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Icon icon={Zap} size="sm" />
            Concept Retention Rate
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-foreground">
            {retentionMultiplier}x
          </p>
          <p className="text-[11px] text-muted-foreground">
            Compared to generic textbook lectures
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-surface-1 p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Icon icon={CheckCircle2} size="sm" />
            Teacher Preparation Load
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-foreground">
            {prepSeconds} sec
          </p>
          <p className="text-[11px] text-muted-foreground">
            Per differentiated lesson tier
          </p>
        </div>
      </div>
    </div>
  );
}
