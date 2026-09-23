"use client";

import { useState } from "react";
import { User, Heart, Sparkles, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface LearnerArchetype {
  id: string;
  name: string;
  location: string;
  grade: string;
  archetype: string;
  passions: string[];
  struggleBefore: string;
  hubAdaptation: string;
  breakthroughQuote: string;
  cbcOutcome: string;
}

const ARCHETYPES: LearnerArchetype[] = [
  {
    id: "brian",
    name: "Brian Kiprop",
    location: "Rongai, Nakuru County",
    grade: "Grade 7",
    archetype: "The Young Agronomist",
    passions: ["Small-scale Drip Irrigation", "Crop Biology", "Poultry Feeding"],
    struggleBefore: "Felt detached from abstract science textbooks and silent during whole-class lectures.",
    hubAdaptation:
      "The Hub adapted the Photosynthesis lesson into a practical field test comparing chlorophyll density in local sukuma wiki leaves under varying sunlight.",
    breakthroughQuote:
      "When teacher asked about chlorophyll using our vegetable garden, for the first time I knew the answer before everyone else. School finally felt like my life.",
    cbcOutcome: "Critical Thinking & Environmental Literacy · Exceeding Expectation",
  },
  {
    id: "wanjiku",
    name: "Wanjiku Kamau",
    location: "Kasarani, Nairobi County",
    grade: "Grade 8",
    archetype: "The Hardware Maker",
    passions: ["Solar Circuitry", "Scrap Robotics", "Chess Openings"],
    struggleBefore: "Bored by repetitive theory notes; frequently doodled during mechanical science classes.",
    hubAdaptation:
      "The Hub turned a lesson on mechanical levers and fulcrums into a challenge: design a balanced mechanical crane using salvaged bottle caps and toothpicks.",
    breakthroughQuote:
      "The Hub gave us an engineering challenge that felt like actual maker work. I didn't want the 40-minute bell to ring.",
    cbcOutcome: "Innovation & Digital Literacy · Exceeding Expectation",
  },
  {
    id: "faith",
    name: "Faith Achieng",
    location: "Nyando, Kisumu County",
    grade: "Grade 7",
    archetype: "The Visual Storyteller",
    passions: ["Textile Pattern Design", "Comic Sketching", "Narrative Illustration"],
    struggleBefore: "Struggled with dense text-heavy biology paragraphs; classified as Approaching Expectation.",
    hubAdaptation:
      "The Hub scaffolded the human digestive system as a 3-part graphic storyboard where digestive enzymes were characterized as specialized chemical workers.",
    breakthroughQuote:
      "Instead of writing 10 lines of definitions, I drew the journey. The teacher pinned my comic on the classroom wall for others to study from.",
    cbcOutcome: "Creativity & Communication · Exceeding Expectation",
  },
  {
    id: "kevin",
    name: "Kevin Omondi",
    location: "Iten, Elgeyo-Marakwet County",
    grade: "Grade 7",
    archetype: "The Biomechanics Athlete",
    passions: ["Middle-Distance Track", "Football Passing Angles", "Endurance Pacing"],
    struggleBefore: "Intimidated by fraction equations and decimal conversions in junior math.",
    hubAdaptation:
      "The Hub generated fractional math problems calculating athletic split timings, heart-rate recovery zones, and track lane radius differentials.",
    breakthroughQuote:
      "Math was always my enemy until it was about my 800-meter race splits. Suddenly 3/4 and 75% made complete physical sense.",
    cbcOutcome: "Mathematical Literacy & Self-Efficacy · Meeting Expectation",
  },
];

export function StudentArchetypeCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  const current = ARCHETYPES[activeIndex];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? ARCHETYPES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === ARCHETYPES.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative mx-auto w-full max-w-5xl rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-[10px] font-mono text-foreground font-semibold">
              LEARNER CENTRICITY
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              [AUTHENTIC_CLASSROOM_STORIES]
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1.5">
            Every Child Has A Spark. PersonaLearn Lights It.
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
            In standard classrooms, children hide their unique talents to survive the lecture. With PersonaLearn, teachers effortlessly bring those talents into the spotlight.
          </p>
        </div>

        {/* Carousel Arrows */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handlePrev}
            aria-label="Previous profile"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-1 text-foreground transition-all hover:bg-surface-2 active:scale-95"
          >
            <Icon icon={ChevronLeft} size="md" />
          </button>
          <span className="font-mono text-xs text-muted-foreground px-1">
            {activeIndex + 1} / {ARCHETYPES.length}
          </span>
          <button
            onClick={handleNext}
            aria-label="Next profile"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-1 text-foreground transition-all hover:bg-surface-2 active:scale-95"
          >
            <Icon icon={ChevronRight} size="md" />
          </button>
        </div>
      </div>

      {/* Main Student Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Dossier (Cols 1-5) */}
        <div className="lg:col-span-5 rounded-xl border border-border/80 bg-surface-1/50 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                  {current.grade} · {current.location}
                </span>
                <h4 className="text-lg font-bold text-foreground mt-0.5">
                  {current.name}
                </h4>
                <p className="text-xs font-semibold text-foreground/80 font-mono mt-0.5">
                  &ldquo;{current.archetype}&rdquo;
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-2 text-foreground">
                <Icon icon={User} size="lg" />
              </div>
            </div>

            {/* Passions Tags */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-muted-foreground flex items-center gap-1">
                <Icon icon={Heart} size="sm" />
                Individual Passion Vector
              </span>
              <div className="flex flex-wrap gap-1.5">
                {current.passions.map((p) => (
                  <span
                    key={p}
                    className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-xs font-medium text-foreground"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Before vs After */}
            <div className="space-y-2 text-xs pt-2 border-t border-border/40">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                  Before Personalization:
                </span>
                <p className="text-muted-foreground">{current.struggleBefore}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border/60 bg-surface-2/60 p-2.5 text-[10px] font-mono text-foreground">
            CBC STRAND RESULT: {current.cbcOutcome}
          </div>
        </div>

        {/* Right Hub Adaptation & Quote (Cols 6-12) */}
        <div className="lg:col-span-7 rounded-xl border border-border/80 bg-surface-1/50 p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            {/* The Hub Adaptation */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Icon icon={Sparkles} size="sm" />
                The PersonaLearn Adaptation
              </span>
              <div className="rounded-xl border border-border/80 bg-surface-2/70 p-4">
                <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                  {current.hubAdaptation}
                </p>
              </div>
            </div>

            {/* Student's Voice Quote */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Icon icon={Quote} size="sm" />
                The Breakthrough Moment
              </span>
              <blockquote className="text-sm sm:text-base font-medium italic text-foreground leading-relaxed pl-3 border-l-2 border-foreground">
                &ldquo;{current.breakthroughQuote}&rdquo;
              </blockquote>
            </div>
          </div>

          {/* Quick Archetype Switcher Bar */}
          <div className="flex items-center gap-2 pt-4 border-t border-border/40">
            {ARCHETYPES.map((arch, idx) => (
              <button
                key={arch.id}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-center text-xs font-mono transition-all",
                  activeIndex === idx
                    ? "bg-foreground text-background font-semibold shadow-xs"
                    : "border border-border/60 bg-surface-2 text-muted-foreground hover:text-foreground"
                )}
              >
                {arch.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
