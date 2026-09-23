"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  ArrowUp,
  GraduationCap,
  Users,
  FileText,
  MessageSquare,
  Bot,
  User,
  Heart,
  ChevronRight,
} from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

interface Scenario {
  id: string;
  label: string;
  badge: string;
  prompt: string;
  thought: string;
  responseTitle: string;
  responseGroups: {
    groupName: string;
    studentTags: string[];
    interestFocus: string;
    activity: string;
    cbcCompetency: string;
  }[];
  activeTab: "chats" | "resources" | "students";
  focusedStudentId?: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "photosynthesis",
    label: "Photosynthesis Differentiation",
    badge: "Student Interests",
    prompt: "Adapt tomorrow's Grade 7 Photosynthesis lesson for Brian (Agriculture) and Faith (Visual Arts)",
    thought:
      "Accessing active class roster: Grade 7 Integrated Science... Identified Brian Kiprop (interests: Agriculture, Soil) & Faith Achieng (interests: Visual Arts, Sketching)... Grounding in KICD Strand 2.1...",
    responseTitle: "Personalized Lesson Differentiation · KICD Grade 7 Strand 2.1",
    responseGroups: [
      {
        groupName: "Pathway A · Applied Agriculture",
        studentTags: ["Brian Kiprop", "Kevin Omondi"],
        interestFocus: "Crop Biology & Soil Nutrition",
        activity:
          "Practical exploration: Observe chlorophyll variations in local sukuma wiki and maize leaves. Relate sunlight exposure to crop yield and moisture retention.",
        cbcCompetency: "Critical Thinking & Problem Solving · Environmental Literacy",
      },
      {
        groupName: "Pathway B · Visual Arts & Design",
        studentTags: ["Faith Achieng", "Amina Abdi"],
        interestFocus: "Infographics & Solar Energy Flow",
        activity:
          "Visual modeling: Create an illustrated cross-section infographic of a plant leaf showing stomata gas exchange and chloroplast energy absorption.",
        cbcCompetency: "Creativity & Imagination · Communication and Collaboration",
      },
    ],
    activeTab: "students",
    focusedStudentId: "brian",
  },
  {
    id: "fractions",
    label: "Evening Remedial Plan",
    badge: "Personalized Interventions",
    prompt: "Suggest personalized evening homework for learners struggling with Fractions",
    thought:
      "Analyzing recent formative assessment math rubrics... 3 students approaching expectation... Correlating individual student interests for high-engagement homework...",
    responseTitle: "Interest-Anchored Evening Tasks · Grade 7 Mathematics",
    responseGroups: [
      {
        groupName: "Sports & Athletics Context",
        studentTags: ["Kevin Omondi", "Dennis Mwangi"],
        interestFocus: "Football & Track Timings",
        activity:
          "Calculate fractional split times for an 800m track run and determine ball possession ratios during a 90-minute match.",
        cbcCompetency: "Digital & Mathematical Literacy",
      },
      {
        groupName: "Culinary & Agriculture Context",
        studentTags: ["Brian Kiprop", "Mary Wambui"],
        interestFocus: "Recipe Ratios & Seed Spacing",
        activity:
          "Scale a recipe for 6 people down to 2/3 portion, or calculate fractional seed distribution per square meter of vegetable garden.",
        cbcCompetency: "Self-Efficacy & Practical Numeracy",
      },
    ],
    activeTab: "students",
    focusedStudentId: "kevin",
  },
  {
    id: "scheme-align",
    label: "CBC Scheme Alignment",
    badge: "Curriculum Anchor",
    prompt: "How does next week's energy strand connect to our class robotics club projects?",
    thought:
      "Cross-referencing approved Scheme of Work (Term 2, Week 5) with student interest registry (Robotics & Coding: Wanjiku Kamau, Samuel Kiptoo)...",
    responseTitle: "Curriculum-to-Passion Bridge · Renewable Energy & Circuits",
    responseGroups: [
      {
        groupName: "Kinesthetic Electronics Lab",
        studentTags: ["Wanjiku Kamau", "Samuel Kiptoo"],
        interestFocus: "Solar Micro-Controllers",
        activity:
          "Design a miniature solar-powered buzzer circuit demonstrating electrical energy conversion from radiant solar cells.",
        cbcCompetency: "Innovation & Technological Literacy",
      },
    ],
    activeTab: "resources",
  },
];

const STUDENTS = [
  {
    id: "wanjiku",
    name: "Wanjiku Kamau",
    adm: "4012",
    interests: "Robotics, Coding, Chess",
    level: "Exceeding Expectation",
    color: "var(--foreground)",
  },
  {
    id: "brian",
    name: "Brian Kiprop",
    adm: "4018",
    interests: "Agriculture, Crop Biology",
    level: "Meeting Expectation",
    color: "var(--foreground)",
  },
  {
    id: "faith",
    name: "Faith Achieng",
    adm: "4025",
    interests: "Visual Arts, Illustration",
    level: "Approaching Expectation",
    color: "var(--foreground)",
  },
  {
    id: "kevin",
    name: "Kevin Omondi",
    adm: "4031",
    interests: "Athletics, Mechanics",
    level: "Meeting Expectation",
    color: "var(--foreground)",
  },
];

const RESOURCES = [
  { title: "Grade 7 Integrated Science Scheme", type: "Scheme of Work", meta: "KICD · Term 2 · Approved" },
  { title: "Strand 2.1: Living Things & Photosynthesis", type: "Unit Plan", meta: "Week 4 · 4 Lessons" },
  { title: "Mid-Term Formative Competency Rubric", type: "Assessment", meta: "7 Core CBC Competencies" },
];

export function DynamicHubPreview() {
  const [activeScenarioId, setActiveScenarioId] = useState(SCENARIOS[0].id);
  const [panelTab, setPanelTab] = useState<"chats" | "resources" | "students">("students");
  const [isTyping, setIsTyping] = useState(false);
  const [displayedText, setDisplayedText] = useState("");

  const scenario = SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0];

  useEffect(() => {
    setIsTyping(true);
    setDisplayedText("");
    setPanelTab(scenario.activeTab);

    let index = 0;
    const fullText = scenario.prompt;
    const interval = setInterval(() => {
      index++;
      setDisplayedText(fullText.slice(0, index));
      if (index >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [scenario]);

  return (
    <div className="relative mx-auto w-full max-w-5xl rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden backdrop-blur-xl transition-all duration-300">
      {/* Top Application Header / Class Selector Rail */}
      <div className="flex flex-wrap items-center justify-between border-b border-border/80 bg-surface-1/80 px-4 py-3 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-surface-2 text-foreground">
            <LogoMark className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-foreground">Grade 7 · Integrated Science</span>
              <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                Term 2
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              34 Students · Personalized CBC Intelligence
            </p>
          </div>
        </div>

        {/* Live System Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface-2/80 px-2.5 py-1 text-[11px] font-mono text-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-foreground" />
            </span>
            <span>HUB CONNECTED</span>
          </div>
        </div>
      </div>

      {/* Main IDE Layout Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
        {/* Chat / Workspace Canvas (Cols 1-8) */}
        <div className="lg:col-span-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border/80 bg-background/50 p-4 sm:p-6">
          <div className="space-y-4">
            {/* Scenario Picker Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pb-2">
              <span className="text-[11px] font-mono text-muted-foreground mr-1 hidden sm:inline">Try Scenario:</span>
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveScenarioId(s.id)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 flex items-center gap-1.5",
                    activeScenarioId === s.id
                      ? "bg-foreground text-background font-semibold shadow-xs"
                      : "border border-border/80 bg-surface-1 text-muted-foreground hover:text-foreground hover:bg-surface-2"
                  )}
                >
                  <Sparkles className="h-3 w-3" />
                  {s.label}
                </button>
              ))}
            </div>

            {/* Teacher's Message Bubble */}
            <div className="flex items-start gap-3 justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-xs border border-border/80 bg-surface-2 px-4 py-3 shadow-xs">
                <div className="flex items-center gap-1.5 mb-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Teacher · You</span>
                </div>
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {displayedText}
                  {isTyping && <span className="inline-block w-1.5 h-3.5 bg-foreground ml-1 animate-pulse" />}
                </p>
              </div>
            </div>

            {/* Assistant's Thought Process & Response */}
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-foreground text-background">
                <LogoMark className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-3 max-w-[92%]">
                {/* Reasoning Telemetry Drawer */}
                <div className="rounded-xl border border-border/60 bg-surface-1/60 p-2.5 font-mono text-[11px]">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Bot className="h-3.5 w-3.5 animate-pulse" />
                    <span className="uppercase tracking-wider font-semibold">Hub Reasoning Chain</span>
                  </div>
                  <p className="text-muted-foreground/90 leading-relaxed text-[10.5px]">
                    {scenario.thought}
                  </p>
                </div>

                {/* Main Response Output Card */}
                <div className="rounded-2xl rounded-tl-xs border border-border/80 bg-surface-1 p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5" />
                      {scenario.responseTitle}
                    </h4>
                    <span className="rounded-full border border-border/80 bg-surface-2 px-2 py-0.5 text-[9.5px] font-mono uppercase text-muted-foreground">
                      {scenario.badge}
                    </span>
                  </div>

                  {/* Differentiated Pathways */}
                  <div className="space-y-3 pt-1">
                    {scenario.responseGroups.map((group, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-border/60 bg-surface-2/40 p-3 space-y-2 transition-colors hover:border-border"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="text-xs font-semibold text-foreground">
                            {group.groupName}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {group.interestFocus}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {group.activity}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40 text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <div className="flex items-center gap-1">
                              {group.studentTags.map((name) => (
                                <span
                                  key={name}
                                  className="rounded-md bg-surface-3 px-1.5 py-0.5 font-medium text-foreground"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="font-mono text-muted-foreground/80">
                            CBC: {group.cbcCompetency}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Composer Footer */}
          <div className="mt-6 pt-3 border-t border-border/60">
            <div className="flex items-center gap-2 rounded-full border border-border/80 bg-surface-1 px-4 py-2 shadow-xs">
              <span className="text-xs text-muted-foreground select-none flex-1 truncate">
                Ask the Hub to personalize lessons, review interests, or adapt tasks...
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Send prompt"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background transition-transform active:scale-95"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Class & Context Rail (Cols 9-12) */}
        <div className="lg:col-span-4 flex flex-col bg-surface-1/40 p-4 border-t lg:border-t-0">
          {/* Segmented Tab Pill */}
          <div className="flex items-center rounded-full border border-border/80 bg-surface-2/60 p-1 mb-3">
            {(["students", "resources", "chats"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setPanelTab(tab)}
                className={cn(
                  "flex-1 rounded-full py-1 text-xs font-medium capitalize transition-all duration-150",
                  panelTab === tab
                    ? "bg-foreground text-background font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content 1: Students Roster with Interests */}
          {panelTab === "students" && (
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  Learner Interest Registry
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">34 Enrolled</span>
              </div>

              {STUDENTS.map((student) => {
                const isSelected = scenario.focusedStudentId === student.id;
                return (
                  <div
                    key={student.id}
                    className={cn(
                      "rounded-xl border p-2.5 transition-all text-left",
                      isSelected
                        ? "border-foreground bg-surface-2 shadow-xs"
                        : "border-border/60 bg-surface-1/60 hover:bg-surface-2/60"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground">{student.name}</p>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Adm #{student.adm}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      <Heart className="h-3 w-3 text-muted-foreground shrink-0" />
                      <p className="text-[11px] text-foreground font-medium truncate">
                        {student.interests}
                      </p>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between pt-1 border-t border-border/40 text-[10px] font-mono">
                      <span className="text-muted-foreground">CBC Growth:</span>
                      <span className="text-foreground font-medium">{student.level}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab Content 2: Scheme & Resources */}
          {panelTab === "resources" && (
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  Class Scheme & Syllabus
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">KICD 2026</span>
              </div>

              {RESOURCES.map((res, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border/60 bg-surface-1/60 p-2.5 hover:bg-surface-2/60 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-foreground leading-snug">{res.title}</p>
                      <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{res.meta}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab Content 3: Recent Conversations */}
          {panelTab === "chats" && (
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  Class Chats
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">History</span>
              </div>

              {[
                "Differentiated Photosynthesis Lesson",
                "Evening fractions check-in for Kevin",
                "Robotics & energy curriculum bridge",
                "Strand 1 formative competency recap",
              ].map((title, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border/60 bg-surface-1/60 p-2.5 hover:bg-surface-2/60 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-foreground truncate max-w-[170px]">{title}</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
