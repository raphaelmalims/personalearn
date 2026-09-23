"use client";

import { useState } from "react";
import { GraduationCap, CheckCircle2, Sparkles } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface CompetencyItem {
  id: string;
  name: string;
  shortName: string;
  traditionalScore: number; // 0 to 100
  personalizedScore: number; // 0 to 100
  catalyst: string;
  classroomExample: string;
  rubricShift: string;
}

const COMPETENCIES: CompetencyItem[] = [
  {
    id: "critical-thinking",
    name: "Critical Thinking & Problem Solving",
    shortName: "Critical Thinking",
    traditionalScore: 48,
    personalizedScore: 92,
    catalyst: "Real-world friction from student passions",
    classroomExample: "Brian models soil moisture retention using actual drip irrigation math rather than abstract textbook equations.",
    rubricShift: "Moves from memorizing formulas to diagnosing real agricultural system breakdowns.",
  },
  {
    id: "creativity",
    name: "Imagination & Creativity",
    shortName: "Creativity",
    traditionalScore: 40,
    personalizedScore: 96,
    catalyst: "Unshackled multimodal student expression",
    classroomExample: "Faith creates graphic novels and visual infographics explaining cell respiration and stomata transpiration.",
    rubricShift: "Transforms rote regurgitation into authentic visual and conceptual design.",
  },
  {
    id: "communication",
    name: "Communication & Collaboration",
    shortName: "Collaboration",
    traditionalScore: 52,
    personalizedScore: 88,
    catalyst: "Complementary interest-based peer grouping",
    classroomExample: "Pairing a coder (Wanjiku) with a farmer (Brian) to build a prototype smart greenhouse sensor project.",
    rubricShift: "Shifts from solitary worksheets to cross-discipline peer problem solving.",
  },
  {
    id: "citizenship",
    name: "Citizenship & Environmental Stewardship",
    shortName: "Citizenship",
    traditionalScore: 45,
    personalizedScore: 86,
    catalyst: "Local community relevance and ethics",
    classroomExample: "Learners investigate water rationing and indigenous seed conservation in their immediate home ward.",
    rubricShift: "Theoretical civics becomes tangible local community contribution.",
  },
  {
    id: "learning-to-learn",
    name: "Learning to Learn",
    shortName: "Metacognition",
    traditionalScore: 38,
    personalizedScore: 90,
    catalyst: "Intrinsic curiosity replacing exam pressure",
    classroomExample: "Kevin analyzes athletic stride frequency and self-initiates inquiries into Newtonian kinetic laws.",
    rubricShift: "Replaces cramming for tests with lifelong, self-directed curiosity.",
  },
  {
    id: "self-efficacy",
    name: "Self-Efficacy & Confidence",
    shortName: "Self-Efficacy",
    traditionalScore: 44,
    personalizedScore: 94,
    catalyst: "Early mastery in an area of personal strength",
    classroomExample: "A shy student who struggles with public speaking leads the class because the topic is their personal hobby.",
    rubricShift: "Eradicates academic alienation by validating what the child already knows and loves.",
  },
  {
    id: "digital-literacy",
    name: "Digital & Technological Literacy",
    shortName: "Digital Literacy",
    traditionalScore: 42,
    personalizedScore: 89,
    catalyst: "Direct engagement with modern AI co-pilots",
    classroomExample: "Students learn how to prompt-engineer questions to verify scientific data for their club projects.",
    rubricShift: "Moves from basic typing practice to critical digital inquiry and AI literacy.",
  },
];

export function CompetencyRadar() {
  const [selectedCompId, setSelectedCompId] = useState<string>(COMPETENCIES[0].id);

  const selected = COMPETENCIES.find((c) => c.id === selectedCompId) || COMPETENCIES[0];

  // SVG Heptagon geometry
  const size = 320;
  const center = size / 2;
  const radius = size * 0.4;
  const total = COMPETENCIES.length;

  const getCoordinates = (index: number, score: number) => {
    // Angle in radians (start from top, offset by -PI / 2)
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
    const r = (score / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Generate paths for Traditional and Personalized
  const traditionalPoints = COMPETENCIES.map((c, i) => getCoordinates(i, c.traditionalScore));
  const personalizedPoints = COMPETENCIES.map((c, i) => getCoordinates(i, c.personalizedScore));

  const traditionalPath = traditionalPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ") + " Z";

  const personalizedPath = personalizedPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ") + " Z";

  return (
    <div className="relative mx-auto w-full max-w-5xl rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-[10px] font-mono text-foreground font-semibold">
              KICD 7 CORE COMPETENCIES
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              [CBC_MASTERY_TELEMETRY]
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1.5">
            Holistic Growth Beyond Rote Memorization
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
            The Competency-Based Curriculum measures a child across seven dimensions. Click any competency vertex to see how interest-anchored personalization accelerates growth from &quot;Approaching&quot; to &quot;Exceeding&quot; Expectation.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-1.5 self-start sm:self-auto rounded-xl border border-border bg-surface-1 p-2.5 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-foreground" />
            <span className="text-foreground font-medium">Personalized (PersonaLearn)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full border border-border bg-surface-3" />
            <span className="text-muted-foreground">Standard 1:40 Lecture</span>
          </div>
        </div>
      </div>

      {/* Main Heptagon + Inspector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: SVG Radar Heptagon (Cols 1-6) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-2 relative">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-full max-w-[340px] sm:max-w-[380px] h-auto overflow-visible select-none"
          >
            {/* Concentric Grid Rings (25%, 50%, 75%, 100%) */}
            {[0.25, 0.5, 0.75, 1.0].map((scale, sIdx) => {
              const ringPoints = COMPETENCIES.map((_, i) => getCoordinates(i, scale * 100));
              const ringPath = ringPoints
                .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
                .join(" ") + " Z";
              return (
                <path
                  key={sIdx}
                  d={ringPath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-border/60"
                  strokeDasharray={scale === 1 ? undefined : "3 3"}
                />
              );
            })}

            {/* Radial Axis Spokes */}
            {COMPETENCIES.map((_, i) => {
              const end = getCoordinates(i, 100);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={end.x}
                  y2={end.y}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-border/60"
                />
              );
            })}

            {/* Traditional Shape (Dashed Inner) */}
            <path
              d={traditionalPath}
              fill="currentColor"
              fillOpacity="0.08"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              className="text-muted-foreground"
            />

            {/* Personalized Shape (Solid Outer) */}
            <path
              d={personalizedPath}
              fill="currentColor"
              fillOpacity="0.14"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-foreground transition-all duration-300"
            />

            {/* Interactive Vertex Dots */}
            {COMPETENCIES.map((c, i) => {
              const p = personalizedPoints[i];
              const isSelected = c.id === selectedCompId;
              return (
                <g
                  key={c.id}
                  onClick={() => setSelectedCompId(c.id)}
                  className="cursor-pointer group"
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isSelected ? 6 : 4}
                    className={cn(
                      "transition-all duration-150",
                      isSelected
                        ? "fill-foreground stroke-background stroke-2"
                        : "fill-foreground group-hover:r-5"
                    )}
                  />
                </g>
              );
            })}
          </svg>

          {/* Quick Selection Pills Under Radar */}
          <div className="flex flex-wrap justify-center gap-1.5 pt-3">
            {COMPETENCIES.map((c) => {
              const isSelected = c.id === selectedCompId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCompId(c.id)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-mono transition-all",
                    isSelected
                      ? "bg-foreground text-background font-semibold"
                      : "border border-border/80 bg-surface-1 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {c.shortName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Competency Inspector Dossier (Cols 7-12) */}
        <div className="lg:col-span-6 rounded-2xl border border-border/80 bg-surface-1/50 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Selected CBC Competency #{COMPETENCIES.findIndex((c) => c.id === selectedCompId) + 1}
              </span>
              <h4 className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                {selected.name}
              </h4>
            </div>
            <div className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-right">
              <span className="text-[10px] font-mono text-muted-foreground block">GROWTH</span>
              <span className="text-xs font-bold text-foreground font-mono">
                +{selected.personalizedScore - selected.traditionalScore}%
              </span>
            </div>
          </div>

          {/* Growth Tier Indicator */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="rounded-xl border border-border/60 bg-surface-2/40 p-3 space-y-1">
              <span className="text-[10px] text-muted-foreground">STANDARD LECTURE</span>
              <p className="font-semibold text-muted-foreground">Approaching Expectation</p>
              <div className="h-1.5 w-full rounded-full bg-surface-3 overflow-hidden mt-1">
                <div
                  className="h-full bg-muted-foreground/60 rounded-full"
                  style={{ width: `${selected.traditionalScore}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-foreground/30 bg-surface-2/80 p-3 space-y-1">
              <span className="text-[10px] text-foreground font-semibold flex items-center gap-1">
                <Icon icon={Sparkles} size="sm" />
                PERSONALEARN
              </span>
              <p className="font-bold text-foreground">Exceeding Expectation</p>
              <div className="h-1.5 w-full rounded-full bg-surface-3 overflow-hidden mt-1">
                <div
                  className="h-full bg-foreground rounded-full"
                  style={{ width: `${selected.personalizedScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Pedagogy Catalyst */}
          <div className="space-y-1 text-xs">
            <span className="font-mono text-[10px] uppercase text-muted-foreground flex items-center gap-1">
              <Icon icon={GraduationCap} size="sm" />
              Pedagogical Catalyst
            </span>
            <p className="font-medium text-foreground">
              {selected.catalyst}
            </p>
          </div>

          {/* Classroom Proof Point */}
          <div className="rounded-xl border border-border/60 bg-surface-2/30 p-3.5 space-y-1.5 text-xs">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Icon icon={CheckCircle2} size="sm" />
              Classroom Breakthrough Scenario
            </span>
            <p className="text-muted-foreground leading-relaxed italic">
              &quot;{selected.classroomExample}&quot;
            </p>
            <p className="text-[11px] font-mono text-foreground font-medium pt-1 border-t border-border/40">
              Shift: {selected.rubricShift}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
