"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Check,
  Copy,
  Users,
  GraduationCap,
  Terminal,
  Sliders,
  Compass,
  ChevronRight,
} from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

interface StudentProfile {
  id: string;
  name: string;
  adm: string;
  tagline: string;
  passions: string[];
  growthLevel: "Approaching" | "Meeting" | "Exceeding";
  learningModality: string;
}

interface CurriculumStrand {
  id: string;
  code: string;
  grade: string;
  subject: string;
  title: string;
  outcome: string;
}

interface SynthesizedLesson {
  headline: string;
  strandTag: string;
  hook: string;
  activityTitle: string;
  activitySteps: string[];
  cbcCompetency: string;
  assessmentRubric: string;
  teacherGuidingQuestion: string;
}

const STUDENTS: StudentProfile[] = [
  {
    id: "brian",
    name: "Brian Kiprop",
    adm: "4018",
    tagline: "Young Farmer & Soil Explorer",
    passions: ["Smart Agriculture", "Soil Science", "Crop Biology"],
    growthLevel: "Meeting",
    learningModality: "Kinesthetic / Field Practical",
  },
  {
    id: "wanjiku",
    name: "Wanjiku Kamau",
    adm: "4012",
    tagline: "Hardware Maker & Chess Strategist",
    passions: ["Robotics", "Circuitry", "Chess Tactics"],
    growthLevel: "Exceeding",
    learningModality: "Logical / Systems Design",
  },
  {
    id: "faith",
    name: "Faith Achieng",
    adm: "4025",
    tagline: "Visual Storyteller & Sketch Artist",
    passions: ["Visual Arts", "Graphic Storytelling", "Textiles"],
    growthLevel: "Approaching",
    learningModality: "Visual / Spatial Modeling",
  },
  {
    id: "kevin",
    name: "Kevin Omondi",
    adm: "4031",
    tagline: "Track Athlete & Biomechanics Enthusiast",
    passions: ["Athletics", "Football Tactics", "Kinetic Movement"],
    growthLevel: "Meeting",
    learningModality: "Physical / Observational",
  },
  {
    id: "amina",
    name: "Amina Abdi",
    adm: "4044",
    tagline: "Acoustic Musician & Spoken Word Poet",
    passions: ["Traditional Music", "Sound Rhythms", "Storytelling"],
    growthLevel: "Exceeding",
    learningModality: "Auditory / Narrative",
  },
];

const CURRICULUM_STRANDS: CurriculumStrand[] = [
  {
    id: "photosynthesis",
    code: "Strand 2.1",
    grade: "Grade 7",
    subject: "Integrated Science",
    title: "Living Things & Energy Conversion",
    outcome: "Learner explains how solar energy is converted to chemical energy in plant cells.",
  },
  {
    id: "fractions",
    code: "Strand 3.2",
    grade: "Grade 7",
    subject: "Mathematics",
    title: "Proportional Ratios & Fractional Rates",
    outcome: "Learner applies fractions and percentages to model real-world distributions.",
  },
  {
    id: "kinetic",
    code: "Strand 1.4",
    grade: "Grade 8",
    subject: "Pre-Technical Studies",
    title: "Mechanical Advantage & Simple Machines",
    outcome: "Learner investigates mechanical levers, fulcrums, and work efficiency.",
  },
  {
    id: "conservation",
    code: "Strand 4.1",
    grade: "Grade 9",
    subject: "Agriculture & Nutrition",
    title: "Soil Moisture & Water Conservation",
    outcome: "Learner designs sustainable soil moisture retention techniques.",
  },
];

type PedagogyMode = "activity" | "homework" | "rubric";

function generateSynthesis(
  student: StudentProfile,
  strand: CurriculumStrand,
  mode: PedagogyMode
): SynthesizedLesson {
  const primaryPassion = student.passions[0];

  if (mode === "activity") {
    return {
      headline: `${student.name} · Passion-Anchored Classroom Pathway`,
      strandTag: `KICD ${strand.grade} · ${strand.code}`,
      hook: `Anchoring "${strand.title}" to ${student.name}'s passion for ${primaryPassion}.`,
      activityTitle: `Practical Investigation: ${primaryPassion} as a Lens for ${strand.title}`,
      activitySteps: [
        `Discovery Probe: Present a real-world scenario from ${primaryPassion} requiring ${strand.outcome.toLowerCase()}`,
        `Hands-on Modeling: Allow ${student.name} to demonstrate the concept using tangible artifacts or diagrams aligned with ${student.learningModality}.`,
        `Peer Synthesis: Pair with a peer to explain how the underlying scientific/mathematical principle governs both the textbook theory and real-life practice.`,
      ],
      cbcCompetency: "Critical Thinking & Problem Solving · Learning to Learn",
      assessmentRubric: "Formative Observation: Evidence of causal reasoning connecting physical phenomena to formal syllabus principles.",
      teacherGuidingQuestion: `"${student.name}, how would a change in this system directly impact the outcome you observe in ${primaryPassion}?"`,
    };
  }

  if (mode === "homework") {
    return {
      headline: `${student.name} · Evening Resonance Task`,
      strandTag: `KICD ${strand.grade} · ${strand.code} · Home Extension`,
      hook: `Transforming homework into an authentic investigation connected to ${student.name}'s evening environment.`,
      activityTitle: `Home Field Log: Exploring ${strand.title} through ${primaryPassion}`,
      activitySteps: [
        `Observe 2 instances in your home or neighborhood where principles of ${strand.title} interact with ${primaryPassion}.`,
        `Record measurements, qualitative observations, or annotated sketches in your learner reflective journal.`,
        `Draft a 3-sentence hypothesis predicting what happens when one variable is altered.`,
      ],
      cbcCompetency: "Self-Efficacy · Digital and Environmental Literacy",
      assessmentRubric: "Self-Reflection Checklist: Learner articulates personal curiosity and links classroom concepts to everyday life.",
      teacherGuidingQuestion: `"What surprised you most when you looked at ${primaryPassion} through the lens of today's lesson?"`,
    };
  }

  return {
    headline: `${student.name} · CBC Formative Growth Rubric`,
    strandTag: `KICD ${strand.grade} · Competency Evaluation`,
    hook: `Assessing individual student growth across 7 Core CBC Competencies without high-stakes pen-and-paper stress.`,
    activityTitle: `Observable Competency Matrix for ${student.name}`,
    activitySteps: [
      `Approaching Expectation (AE): Identifies isolated facts related to ${strand.title} when prompted.`,
      `Meeting Expectation (ME): Independently maps ${strand.title} principles to ${primaryPassion} with clear rationale.`,
      `Exceeding Expectation (EE): Innovates a novel application or guides peers in synthesizing complex connections.`,
    ],
    cbcCompetency: "Imagination & Creativity · Communication and Collaboration",
    assessmentRubric: `Target Growth Milestone: Transitioning ${student.name} from "${student.growthLevel} Expectation" to the next competency tier through scaffolded inquiry.`,
    teacherGuidingQuestion: `"How can you share your findings with the rest of the class to help them see this concept differently?"`,
  };
}

export function PersonalizationSynthesizer() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(STUDENTS[0].id);
  const [selectedStrandId, setSelectedStrandId] = useState<string>(CURRICULUM_STRANDS[0].id);
  const [pedagogyMode, setPedagogyMode] = useState<PedagogyMode>("activity");
  const [activeTab, setActiveTab] = useState<"synthesizer" | "roster" | "reasoning">("synthesizer");
  const [copied, setCopied] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const student = STUDENTS.find((s) => s.id === selectedStudentId) || STUDENTS[0];
  const strand = CURRICULUM_STRANDS.find((s) => s.id === selectedStrandId) || CURRICULUM_STRANDS[0];
  const lesson = generateSynthesis(student, strand, pedagogyMode);

  // Trigger micro-animation on selection change
  useEffect(() => {
    setIsSynthesizing(true);
    const timer = setTimeout(() => setIsSynthesizing(false), 240);
    return () => clearTimeout(timer);
  }, [selectedStudentId, selectedStrandId, pedagogyMode]);

  const handleCopy = () => {
    const textToCopy = `${lesson.headline}\n${lesson.strandTag}\n\n${lesson.activityTitle}\n${lesson.activitySteps.join("\n")}\n\nCBC Competency: ${lesson.cbcCompetency}\nGuiding Question: ${lesson.teacherGuidingQuestion}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mx-auto w-full max-w-5xl rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden backdrop-blur-xl transition-all">
      {/* Studio Header Rail */}
      <div className="flex flex-wrap items-center justify-between border-b border-border/80 bg-surface-1/90 px-4 sm:px-6 py-3 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-surface-2 text-foreground">
            <LogoMark className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground tracking-tight">
                PersonaLearn Personalization Synthesizer
              </span>
              <span className="rounded-full border border-border px-2 py-0.2 text-[10px] font-mono text-muted-foreground">
                v2.4
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              [KICD_CBC_INTELLIGENCE: 100%] · [PERSONALIZATION_COEFFICIENT: 1:1]
            </p>
          </div>
        </div>

        {/* Studio View Tabs */}
        <div className="flex items-center rounded-full border border-border/80 bg-surface-2/60 p-0.5">
          <button
            onClick={() => setActiveTab("synthesizer")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
              activeTab === "synthesizer"
                ? "bg-foreground text-background font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon icon={Sliders} size="sm" />
            <span>Synthesizer</span>
          </button>
          <button
            onClick={() => setActiveTab("roster")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
              activeTab === "roster"
                ? "bg-foreground text-background font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon icon={Users} size="sm" />
            <span>Learner Dossier</span>
          </button>
          <button
            onClick={() => setActiveTab("reasoning")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
              activeTab === "reasoning"
                ? "bg-foreground text-background font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon icon={Terminal} size="sm" />
            <span>Telemetry</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
        {/* Left Column: Interactive Levers (Cols 1-5) */}
        <div className="lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border/80 bg-surface-1/30 p-4 sm:p-5 space-y-5">
          <div className="space-y-5">
            {/* Step 1: Select Student Persona */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-foreground" />
                  1. Select Learner Persona
                </label>
                <span className="text-[10px] font-mono text-muted-foreground">5 Profiles Loaded</span>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {STUDENTS.map((s) => {
                  const isSelected = s.id === selectedStudentId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStudentId(s.id)}
                      className={cn(
                        "w-full rounded-xl border p-2.5 text-left transition-all flex items-center justify-between group",
                        isSelected
                          ? "border-foreground bg-surface-2 shadow-xs"
                          : "border-border/60 bg-surface-1/40 hover:bg-surface-2/40 hover:border-border"
                      )}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-foreground truncate">{s.name}</p>
                          <span className="text-[10px] font-mono text-muted-foreground">#{s.adm}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {s.passions.join(" · ")}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full shrink-0 transition-opacity",
                          isSelected ? "bg-foreground" : "bg-border opacity-0 group-hover:opacity-100"
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Select KICD Curriculum Strand */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-foreground" />
                  2. Anchor to KICD Strand
                </label>
                <span className="text-[10px] font-mono text-muted-foreground">CBC Approved</span>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {CURRICULUM_STRANDS.map((str) => {
                  const isSelected = str.id === selectedStrandId;
                  return (
                    <button
                      key={str.id}
                      onClick={() => setSelectedStrandId(str.id)}
                      className={cn(
                        "w-full rounded-xl border p-2 text-left transition-all",
                        isSelected
                          ? "border-foreground bg-surface-2 shadow-xs"
                          : "border-border/60 bg-surface-1/40 hover:bg-surface-2/40 hover:border-border"
                      )}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                        <span>{str.grade} · {str.subject}</span>
                        <span className="font-semibold text-foreground">{str.code}</span>
                      </div>
                      <p className="text-xs font-medium text-foreground truncate mt-0.5">
                        {str.title}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Pedagogy Delivery Mode */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span className="flex h-1.5 w-1.5 rounded-full bg-foreground" />
                3. Synthesis Mode
              </label>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "activity", label: "Class Activity" },
                  { id: "homework", label: "Evening Task" },
                  { id: "rubric", label: "CBC Rubric" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setPedagogyMode(mode.id as PedagogyMode)}
                    className={cn(
                      "rounded-lg border py-1.5 text-center text-xs font-medium transition-all",
                      pedagogyMode === mode.id
                        ? "border-foreground bg-foreground text-background font-semibold shadow-xs"
                        : "border-border/60 bg-surface-1/60 text-muted-foreground hover:text-foreground hover:bg-surface-2"
                    )}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Synthesis Summary Bar */}
          <div className="rounded-xl border border-border/60 bg-surface-2/40 p-3 text-[11px] font-mono text-muted-foreground space-y-1">
            <div className="flex items-center justify-between">
              <span>TARGET LEARNER:</span>
              <span className="text-foreground font-semibold">{student.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>CURRICULUM STRAND:</span>
              <span className="text-foreground font-semibold">{strand.code}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>LEARNING STYLE:</span>
              <span className="text-foreground font-semibold">{student.learningModality}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Output Studio (Cols 6-12) */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-background p-4 sm:p-6">
          {activeTab === "synthesizer" && (
            <div className="space-y-4">
              {/* Teacher Prompt Prompt Simulation */}
              <div className="flex items-start gap-3 justify-end">
                <div className="max-w-[88%] rounded-2xl rounded-tr-xs border border-border/80 bg-surface-2 px-4 py-3 shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      Teacher · Class Copilot Command
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground">AUTONOMOUS</span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
                    Personalize {strand.title} for {student.name}, integrating their passion for {student.passions[0]}.
                  </p>
                </div>
              </div>

              {/* Synthesized Output Card */}
              <div
                className={cn(
                  "rounded-2xl border border-border/80 bg-surface-1 p-5 shadow-sm space-y-4 transition-all duration-300",
                  isSynthesizing && "opacity-60 scale-[0.99]"
                )}
              >
                {/* Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-border/80 bg-surface-2 px-2.5 py-0.5 text-[10px] font-mono text-foreground font-semibold">
                        {lesson.strandTag}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {strand.subject}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground mt-1">
                      {lesson.headline}
                    </h3>
                  </div>

                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs font-medium text-foreground transition-all hover:bg-surface-3 active:scale-95"
                  >
                    <Icon icon={copied ? Check : Copy} size="sm" />
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                {/* Lesson Plan / Activity Core */}
                <div className="space-y-3">
                  <div className="rounded-xl border border-border/60 bg-surface-2/40 p-3.5 space-y-2">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Icon icon={Sparkles} size="sm" />
                      {lesson.activityTitle}
                    </p>
                    <div className="space-y-1.5 pt-1">
                      {lesson.activitySteps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="font-mono text-[10px] text-foreground font-semibold shrink-0 pt-0.5">
                            {idx + 1}.
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CBC Competencies & Guiding Question */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="rounded-xl border border-border/60 bg-surface-2/30 p-3 space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Icon icon={GraduationCap} size="sm" />
                        CBC Core Competency
                      </span>
                      <p className="text-xs font-semibold text-foreground">
                        {lesson.cbcCompetency}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-surface-2/30 p-3 space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Icon icon={Compass} size="sm" />
                        Formative Rubric
                      </span>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {lesson.assessmentRubric}
                      </p>
                    </div>
                  </div>

                  {/* Teacher's Master Prompt */}
                  <div className="rounded-xl border border-border/80 bg-foreground text-background p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider opacity-80">
                      <span>High-Impact Classroom Facilitation Cue</span>
                      <span>1-to-1 Engagement</span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold italic">
                      {lesson.teacherGuidingQuestion}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Full Learner Dossier Grid */}
          {activeTab === "roster" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Learner Passion Dossier</h4>
                  <p className="text-xs text-muted-foreground">Class-wide interest profiles stored in the Hub</p>
                </div>
                <span className="text-xs font-mono text-muted-foreground">Grade 7 Integrated Science</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STUDENTS.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedStudentId(s.id);
                      setActiveTab("synthesizer");
                    }}
                    className="cursor-pointer rounded-xl border border-border/80 bg-surface-1 p-3 space-y-2 transition-all hover:border-foreground hover:bg-surface-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground">{s.name}</p>
                      <span className="text-[10px] font-mono text-muted-foreground">Adm #{s.adm}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground italic">{s.tagline}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {s.passions.map((p) => (
                        <span
                          key={p}
                          className="rounded-md border border-border bg-surface-3 px-1.5 py-0.5 text-[9.5px] font-medium text-foreground"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] font-mono text-muted-foreground">
                      <span>CBC Growth: {s.growthLevel}</span>
                      <span className="text-foreground font-semibold flex items-center gap-0.5">
                        Synthesize <Icon icon={ChevronRight} size="sm" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Telemetry Reasoning Logs */}
          {activeTab === "reasoning" && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Icon icon={Terminal} size="sm" />
                  Autonomous Personalization Telemetry
                </span>
                <span className="text-[10px] text-muted-foreground">LATENCY: 18ms</span>
              </div>

              <div className="rounded-xl border border-border/80 bg-surface-1 p-4 space-y-2 text-[11px] text-muted-foreground">
                <p className="text-foreground font-semibold">
                  {`[01] ROSTER_QUERY: Identified "${student.name}" (Adm ${student.adm})`}
                </p>
                <p>
                  {`[02] PASSION_VECTOR: Loaded passions [${student.passions.join(", ")}]`}
                </p>
                <p>
                  {`[03] SYLLABUS_GROUNDING: Cross-referencing KICD ${strand.grade} ${strand.subject} -> ${strand.code}`}
                </p>
                <p>
                  {`[04] PEDAGOGICAL_CONSTRAINT: Enforcing Bloom's Taxonomy Tier: Analytical & Creative`}
                </p>
                <p>
                  {`[05] DIFFERENTIATION_SYNTHESIS: Generated bespoke pathway with zero generic scaffolding.`}
                </p>
                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-foreground">
                  <span>STATUS: 200 OK · ALL TOKENS VERIFIED</span>
                  <span>KICD CBC ALIGNMENT: 100%</span>
                </div>
              </div>
            </div>
          )}

          {/* Terminal Input Bar at Bottom */}
          <div className="mt-4 pt-3 border-t border-border/60">
            <div className="flex items-center gap-2 rounded-full border border-border/80 bg-surface-1 px-4 py-2 shadow-xs">
              <span className="text-[11px] font-mono text-muted-foreground select-none truncate flex-1">
                Connected to active class: Grade 7 · 34 personalized learning vectors
              </span>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-foreground animate-pulse" />
                <span className="text-[10px] font-mono text-foreground font-semibold">LIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
