import Link from "next/link";
import {
  Sparkles,
  Heart,
  Brain,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Compass,
} from "lucide-react";
import { LogoLockup } from "@/components/brand/logo";
import { HeroBackdrop } from "@/components/layout/hero-backdrop";
import { DynamicHubPreview } from "@/components/layout/dynamic-hub-preview";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { buttonVariants } from "@/components/ui/button-variants";
import { getLandingCtas } from "@/lib/auth/post-login-path";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getHomeLandingCtas() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return getLandingCtas(false, false);
  }

  const { count } = await supabase
    .from("classes")
    .select("id", { count: "exact", head: true })
    .eq("teacher_id", user.id)
    .eq("is_active", true);

  return getLandingCtas(true, (count ?? 0) > 0);
}

const CAPABILITIES = [
  {
    icon: Heart,
    title: "Interest-Driven Learning",
    description:
      "Weave individual student passions — from agriculture and robotics to visual art and athletics — directly into daily CBC lessons and homework.",
  },
  {
    icon: Compass,
    title: "CBC Competency Tracking",
    description:
      "Track formative mastery across strands, sub-strands, and all 7 core CBC competencies with zero guesswork.",
  },
  {
    icon: Brain,
    title: "Class-Scoped Intelligence",
    description:
      "The Hub remembers your active class, schemes of work, and individual learner needs. No generic chatbot replies.",
  },
  {
    icon: Layers,
    title: "One Unified Hub",
    description:
      "Lesson co-planning, student interest profiles, curriculum schemes, and formative assessments live seamlessly on one screen.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Map Student Interests & Talents",
    description:
      "Capture each student's unique passions, hobbies, and learning styles alongside your class roster in seconds.",
  },
  {
    step: "02",
    title: "Co-Plan With The Hub",
    description:
      "Ask the Hub to generate differentiated activities, tiered assignments, and adaptive explanations grounded in your KICD scheme.",
  },
  {
    step: "03",
    title: "Inspire Every Learner",
    description:
      "Watch classroom engagement surge as every child connects curriculum concepts to things they genuinely care about.",
  },
];

const BENTO_FEATURES = [
  {
    title: "Evening Personalization Engine",
    subtitle: "Tailor learning beyond the bell",
    description:
      "Generate personalized evening homework and remedial tasks that connect tough academic concepts to a student's home environment and passions.",
    badge: "PSL Personalization",
  },
  {
    title: "KICD Curriculum Alignment",
    subtitle: "Strictly Kenyan CBC syllabus",
    description:
      "Every generated lesson plan, strand recap, and activity is anchored directly in the approved Competency-Based Curriculum for Grades 1–9.",
    badge: "100% CBC Aligned",
  },
  {
    title: "Dynamic Student Grouping",
    subtitle: "Collaborative learning that works",
    description:
      "Intelligently pair students by complementary interests and competency growth levels for hands-on, high-impact group projects.",
    badge: "Classroom Orchestration",
  },
  {
    title: "Mobile-First Teacher Drawer",
    subtitle: "Full power in the palm of your hand",
    description:
      "Engineered for teachers on the move. Manage rosters, review student profiles, and chat with the Hub right from your smartphone.",
    badge: "Responsive Hub",
  },
];

const FAQS = [
  {
    question: "How does PersonaLearn personalize education for large classrooms?",
    answer:
      "PersonaLearn lets you tag learner interests (e.g. agriculture, coding, art, football) in your class roster. When you ask the Hub for a lesson plan or assessment, it automatically suggests differentiated learning pathways, matching groups of students to tasks that leverage their passions.",
  },
  {
    question: "Is PersonaLearn aligned with the official KICD CBC guidelines?",
    answer:
      "Yes. PersonaLearn is built specifically for the Kenyan Competency-Based Curriculum (CBC) across Primary and Junior Secondary School (Grades 1–9). It structures all outputs around official strands, sub-strands, specific learning outcomes, and the 7 core competencies.",
  },
  {
    question: "Can I use PersonaLearn entirely from my phone?",
    answer:
      "Yes. The entire PersonaLearn Hub is designed mobile-first. The responsive navigation drawer gives you one-tap access to your active class roster, student interests, curriculum resources, and AI co-pilot without needing a laptop.",
  },
  {
    question: "How are student privacy and class data protected?",
    answer:
      "Your class roster, student notes, and curriculum schemes are strictly class-scoped and private to your verified educator account. Student data is never shared publicly or used to train external models.",
  },
];

export default async function HomePage() {
  const ctas = await getHomeLandingCtas();

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-foreground selection:text-background">
      {/* Dynamic Background Scene */}
      <HeroBackdrop />

      {/* Sticky Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-xl transition-colors">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="transition-opacity hover:opacity-90">
            <LogoLockup />
          </Link>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <ThemeToggle />
            {ctas.signedIn ? (
              <SignOutButton />
            ) : (
              <Link
                href={ctas.headerHref}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                {ctas.headerLabel}
              </Link>
            )}
            <Link
              href={ctas.primaryHref}
              className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
            >
              {ctas.signedIn ? "Open Hub" : "Get started"}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Stage */}
      <section className="relative z-10 pt-16 pb-12 sm:pt-24 sm:pb-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl text-center space-y-6">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface-1 px-3.5 py-1 text-xs font-mono text-muted-foreground shadow-xs">
            <span className="flex h-2 w-2 rounded-full bg-foreground animate-pulse" />
            <span>PERSONALIZING EDUCATION · KENYAN CBC</span>
          </div>

          {/* Monumental Headline */}
          <h1 className="mx-auto max-w-4xl text-balance text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl leading-[1.08]">
            Every learner is unique.
            <span className="block text-muted-foreground font-normal">
              Every lesson should be too.
            </span>
          </h1>

          {/* Subhead */}
          <p className="mx-auto max-w-2xl text-balance text-base sm:text-lg leading-relaxed text-muted-foreground">
            The AI co-pilot built for Kenyan educators. PersonaLearn grounds lesson planning,
            formative assessment, and classroom activities in each student’s unique passions and CBC competencies.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={ctas.primaryHref}
              className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full sm:w-auto font-semibold shadow-md")}
            >
              <span>{ctas.signedIn ? "Open AI Hub" : "Start Personalizing Free"}</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
            <Link
              href={ctas.secondaryHref}
              className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "w-full sm:w-auto")}
            >
              Explore Hub Demo
            </Link>
          </div>

          {/* Key Value Props Strip */}
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-4 pt-8 border-t border-border/60 text-left sm:text-center">
            <div>
              <p className="text-sm font-semibold text-foreground sm:text-base">100% CBC Aligned</p>
              <p className="text-xs text-muted-foreground">Strands & competencies</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground sm:text-base">Interest-Driven</p>
              <p className="text-xs text-muted-foreground">Tailored per learner</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground sm:text-base">One Unified Hub</p>
              <p className="text-xs text-muted-foreground">Zero scattered tabs</p>
            </div>
          </div>
        </div>

        {/* Dynamic Hub Simulator (Directly in Hero) */}
        <div className="mx-auto max-w-6xl pt-14 sm:pt-20">
          <div className="mb-4 text-center">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Interactive Product Preview · The PersonaLearn Hub
            </p>
          </div>
          <DynamicHubPreview />
        </div>
      </section>

      {/* Capability Strip */}
      <section className="relative z-10 border-t border-border/80 bg-surface-1/40 py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center space-y-3 mb-14">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              The 4 Pillars of Personalized Education
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
              Education tailored to how children thrive
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              When students see their personal passions connected to classroom topics, learning moves from passive listening to active discovery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CAPABILITIES.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.title}
                  className="rounded-2xl border border-border/80 bg-card p-6 space-y-3 transition-all duration-200 hover:-translate-y-1 hover:border-border hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-2 text-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{cap.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {cap.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How Personalization Works Pipeline */}
      <section className="relative z-10 py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center space-y-3 mb-14">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Simple 3-Step Process
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
              From student passion to classroom breakthrough
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div
                key={step.step}
                className="relative rounded-2xl border border-border/80 bg-card p-6 space-y-3"
              >
                <span className="font-mono text-xs font-bold text-muted-foreground">
                  {"// "}{step.step}
                </span>
                <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section className="relative z-10 border-t border-border/80 bg-surface-1/40 py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center space-y-3 mb-14">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Built for Real Classrooms
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
              Personalization at scale
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Designed to help Kenyan teachers meet every learner without burnout or hours of manual paperwork.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {BENTO_FEATURES.map((bento) => (
              <div
                key={bento.title}
                className="rounded-2xl border border-border/80 bg-card p-8 space-y-3 transition-colors hover:border-border"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-border/80 bg-surface-2 px-2.5 py-0.5 text-[11px] font-mono text-muted-foreground">
                    {bento.badge}
                  </span>
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{bento.title}</h3>
                <p className="text-sm font-medium text-foreground/85">{bento.subtitle}</p>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                  {bento.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kenya & CBC Trust Strip */}
      <section className="relative z-10 py-16 px-4 sm:px-6 border-b border-border/80">
        <div className="mx-auto max-w-4xl text-center space-y-4">
          <ShieldCheck className="mx-auto h-8 w-8 text-foreground" />
          <h2 className="text-2xl font-bold text-foreground">
            Built for Kenyan Junior & Primary Secondary Educators
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Aligned with the Kenya Institute of Curriculum Development (KICD) standards. Empowering educators to bring the spirit of Competency-Based Education to life.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-foreground" /> Grades 1 through 9
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-foreground" /> 7 Core Competencies
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-foreground" /> Private Class Data
            </span>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="relative z-10 py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-10">
          <div className="text-center space-y-2">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Frequently Asked Questions
            </p>
            <h2 className="text-3xl font-bold text-foreground">Questions from teachers</h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/80 bg-card p-6 space-y-2 transition-colors hover:border-border"
              >
                <h3 className="text-base font-semibold text-foreground flex items-center justify-between">
                  <span>{faq.question}</span>
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="relative z-10 border-t border-border/80 bg-surface-1 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center space-y-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
            Ready to personalize education for your learners?
          </h2>
          <p className="mx-auto max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            Join Kenyan teachers who are transforming how they plan lessons and inspire individual students with the PersonaLearn Hub.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={ctas.footerHref}
              className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full sm:w-auto font-semibold shadow-md")}
            >
              {ctas.signedIn ? "Open AI Hub" : "Get started free"}
            </Link>
          </div>
        </div>
      </section>

      {/* Clean Monochrome Footer */}
      <footer className="relative z-10 border-t border-border/80 bg-background py-8 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <LogoLockup />
          </div>
          <p>© {new Date().getFullYear()} PersonaLearn · Nervus Technologies</p>
          <div className="flex items-center gap-4">
            <Link href={ctas.headerHref} className="hover:text-foreground transition-colors">
              {ctas.headerLabel}
            </Link>
            <span>·</span>
            <span>Kenya CBC Aligned</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
