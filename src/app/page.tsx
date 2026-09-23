import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Compass,
  Cpu,
  Layers,
  BookOpen,
  Terminal,
  Zap,
} from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { LogoLockup } from "@/components/brand/logo";
import { HeroBackdrop } from "@/components/layout/hero-backdrop";
import { PersonalizationSynthesizer } from "@/components/landing/personalization-synthesizer";
import { CognitiveResonanceVisualizer } from "@/components/landing/cognitive-resonance-visualizer";
import { CompetencyRadar } from "@/components/landing/competency-radar";
import { StudentArchetypeCarousel } from "@/components/landing/student-archetype-carousel";
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

const BENTO_FEATURES = [
  {
    title: "Continuous Learner Interest Matrix",
    badge: "1:1 Personalization",
    icon: Sparkles,
    description:
      "Tag hobbies, sports, and natural talents across your class roster. The Hub retains persistent memory of what excites each child across terms.",
  },
  {
    title: "100% KICD Syllabi Engine",
    badge: "Kenyan CBC Native",
    icon: BookOpen,
    description:
      "Every generated lesson plan, strand recap, and activity is anchored directly in the approved Competency-Based Curriculum for Grades 1–9. Zero foreign hallucinations.",
  },
  {
    title: "Evening Passion-Anchored Practice",
    badge: "Home Engagement",
    icon: Zap,
    description:
      "Generate personalized evening homework that connects tough academic concepts to a student’s home environment, family garden, or favorite games.",
  },
  {
    title: "Frictionless Staffroom Copilot",
    badge: "Mobile-First Design",
    icon: Cpu,
    description:
      "Engineered for teachers on the move. Manage rosters, review student interest dossiers, and chat with the Hub directly from your smartphone.",
  },
];

const FAQS = [
  {
    question: "How does PersonaLearn personalize education for large classrooms?",
    answer:
      "PersonaLearn lets teachers tag learner interests (e.g., smart agriculture, robotics, art, track athletics) in the class roster. When you ask the Hub to plan a lesson or create formative evaluations, it automatically groups students by complementary passions and suggests tailored, tiered activities.",
  },
  {
    question: "Is PersonaLearn aligned with official KICD CBC guidelines?",
    answer:
      "Yes. PersonaLearn is built specifically for the Kenyan Competency-Based Curriculum (CBC) across Primary and Junior Secondary School (Grades 1–9). It structures all outputs around official strands, sub-strands, specific learning outcomes, and the 7 core competencies.",
  },
  {
    question: "Why focus on student passions instead of just lesson paperwork?",
    answer:
      "The true promise of CBC is nurturing each learner's unique potential. Paperwork automation is just a byproduct; the real breakthrough happens when a child who dislikes abstract math suddenly discovers how fractions explain their favorite sport or agricultural project.",
  },
  {
    question: "How is student data and privacy safeguarded?",
    answer:
      "Your class roster, student notes, and curriculum schemes are strictly class-scoped and private to your verified educator account. Student data is never sold or used to train public foundation models.",
  },
];

export default async function HomePage() {
  const ctas = await getHomeLandingCtas();

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-foreground selection:text-background">
      {/* Dynamic Background Scene with Convergent Parallax */}
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
            Every mind learns differently.
            <span className="block text-muted-foreground font-normal">
              Give every child their own wavelength.
            </span>
          </h1>

          {/* Subhead */}
          <p className="mx-auto max-w-2xl text-balance text-base sm:text-lg leading-relaxed text-muted-foreground">
            Kenya’s Competency-Based Curriculum was conceived to nurture individual learner potential.
            PersonaLearn bridges what each student loves outside school with what they must master inside school.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={ctas.primaryHref}
              className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full sm:w-auto font-semibold shadow-md")}
            >
              <span>{ctas.signedIn ? "Open AI Hub" : "Start Personalizing Free"}</span>
              <Icon icon={ArrowRight} size="sm" className="ml-1" />
            </Link>
            <a
              href="#synthesizer"
              className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "w-full sm:w-auto")}
            >
              Test Personalization Studio ↓
            </a>
          </div>

          {/* Key Value Props Strip */}
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-4 pt-8 border-t border-border/60 text-left sm:text-center">
            <div>
              <p className="text-sm font-semibold text-foreground sm:text-base">100% CBC Aligned</p>
              <p className="text-xs text-muted-foreground">Official KICD Strands 1–9</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground sm:text-base">1:1 Passion Vectors</p>
              <p className="text-xs text-muted-foreground">Tailored per learner</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground sm:text-base">Autonomous Synthesis</p>
              <p className="text-xs text-muted-foreground">Zero manual drafting load</p>
            </div>
          </div>
        </div>

        {/* Crown Interactive Studio: Personalization Synthesizer */}
        <div id="synthesizer" className="mx-auto max-w-6xl pt-14 sm:pt-20">
          <div className="mb-4 text-center">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Interactive Sandbox · Personalization Synthesizer v2.4
            </p>
          </div>
          <PersonalizationSynthesizer />
        </div>
      </section>

      {/* The Physics of Learner Attention (Cognitive Resonance Visualizer) */}
      <section className="relative z-10 border-t border-border/80 bg-surface-1/40 py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <CognitiveResonanceVisualizer />
        </div>
      </section>

      {/* The 7 CBC Competencies Mastery Radar */}
      <section className="relative z-10 border-t border-border/80 py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <CompetencyRadar />
        </div>
      </section>

      {/* Authentic Classroom Learner Stories */}
      <section className="relative z-10 border-t border-border/80 bg-surface-1/40 py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <StudentArchetypeCarousel />
        </div>
      </section>

      {/* Feature Bento Grid (Precision at Scale) */}
      <section className="relative z-10 border-t border-border/80 py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center space-y-3 mb-14">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Engineered for Kenyan Classrooms
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
              Personalization at scale
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Designed to help Kenyan teachers meet every learner without burnout or hours of manual paperwork.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {BENTO_FEATURES.map((bento) => {
              const FeatureIcon = bento.icon;
              return (
                <div
                  key={bento.title}
                  className="rounded-2xl border border-border/80 bg-card p-8 space-y-3 transition-colors hover:border-border"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-border/80 bg-surface-2 px-2.5 py-0.5 text-[11px] font-mono text-muted-foreground">
                      {bento.badge}
                    </span>
                    <Icon icon={FeatureIcon} size="md" className="text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{bento.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                    {bento.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Kenya & CBC Trust Strip */}
      <section className="relative z-10 py-16 px-4 sm:px-6 border-t border-border/80 bg-surface-1/20">
        <div className="mx-auto max-w-4xl text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface-2 text-foreground">
            <Icon icon={ShieldCheck} size="xl" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Built for Kenyan Junior & Primary Secondary Educators
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Aligned with the Kenya Institute of Curriculum Development (KICD) standards. Empowering educators to bring the true spirit of Competency-Based Education to life.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Icon icon={CheckCircle2} size="sm" className="text-foreground" /> Grades 1 through 9
            </span>
            <span className="flex items-center gap-1.5">
              <Icon icon={CheckCircle2} size="sm" className="text-foreground" /> 7 Core Competencies
            </span>
            <span className="flex items-center gap-1.5">
              <Icon icon={CheckCircle2} size="sm" className="text-foreground" /> Private Class Data
            </span>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="relative z-10 py-20 px-4 sm:px-6 border-t border-border/80">
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
                <h3 className="text-base font-semibold text-foreground">
                  {faq.question}
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
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1 font-mono text-xs text-muted-foreground">
            <Icon icon={Terminal} size="sm" className="text-foreground" />
            <span>INSTANT SETUP · NO CREDIT CARD REQUIRED</span>
          </div>
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
