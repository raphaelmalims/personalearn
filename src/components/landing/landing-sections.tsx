import Link from "next/link";
import { LogoLockup } from "@/components/brand/logo";
import { landingCtaLabels } from "@/components/landing/cta";
import { HubFrame } from "@/components/landing/hub-frame";
import { LandingHeroBackground } from "@/components/landing/landing-hero-background";
import { buttonVariants } from "@/components/ui/button-variants";
import type { LandingCtas } from "@/lib/auth/post-login-path";
import { cn } from "@/lib/utils";

const capabilities = [
  { value: "Grades 1–9", label: "CBC coverage" },
  { value: "Class-scoped", label: "Answers stay with the roster" },
  { value: "Scheme first", label: "Your plan, not a generic one" },
  { value: "In the chat", label: "Marking without a second app" },
];

const faqs = [
  {
    q: "Who is PersonaLearn for?",
    a: "Kenyan CBC teachers. You create a class, and planning, questions, and marking stay tied to that grade, subject, and term.",
  },
  {
    q: "Does it replace my scheme of work?",
    a: "No. You upload the scheme. The Hub treats it as the source, then answers inside that class.",
  },
  {
    q: "How is marking different from a chatbot?",
    a: "Scripts are graded in the chat against the class and the scheme. You review each marked script before it is final.",
  },
  {
    q: "What happens to student work?",
    a: "It stays scoped to your class. A question in one class does not pull scripts or names from another.",
  },
  {
    q: "I do not have a class yet. Where do I start?",
    a: "Sign in and create the class. That is the first step. The Hub opens once the class exists.",
  },
];

export function LandingHero({ ctas }: { ctas: LandingCtas }) {
  const labels = landingCtaLabels(ctas);

  return (
    <section id="product" className="relative scroll-mt-24 overflow-hidden">
      <LandingHeroBackground />
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <div>
          <p className="text-caption uppercase tracking-widest text-text-tertiary">
            CBC educator co-pilot
          </p>
          <h1 className="mt-4 max-w-xl text-display font-semibold text-balance">
            The class, in one conversation.
          </h1>
          <p className="mt-6 max-w-xl text-body leading-relaxed text-muted-foreground sm:text-lg">
            PersonaLearn is the Hub for Kenyan teachers. Upload a scheme, ask about the students in front of you, and grade scripts — with answers that stay inside that class.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={ctas.primaryHref}
              className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
            >
              {labels.primary}
            </Link>
            {labels.showSecondary ? (
              <Link
                href={ctas.secondaryHref}
                className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
              >
                {labels.secondary}
              </Link>
            ) : null}
          </div>
        </div>
        <HubFrame />
      </div>
    </section>
  );
}

export function CapabilityStrip() {
  return (
    <section aria-label="Capabilities" className="border-t border-border">
      <ul className="mx-auto grid max-w-6xl grid-cols-2 lg:grid-cols-4">
        {capabilities.map((item) => (
          <li key={item.label} className="border-b border-border px-4 py-6 sm:px-6 lg:border-b-0 lg:border-r lg:last:border-r-0">
            <p className="text-h4 font-semibold">{item.value}</p>
            <p className="mt-1 text-caption text-muted-foreground">{item.label}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FeatureBento() {
  return (
    <section id="features" className="scroll-mt-24 border-t border-border px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="text-caption uppercase tracking-widest text-text-tertiary">Features</p>
        <h2 className="mt-3 max-w-2xl text-h1 font-semibold text-balance">
          The Hub, the class, and the work in between.
        </h2>
        <div className="mt-12 grid gap-4 lg:grid-cols-6">
          <article className="surface-1 rounded-lg p-5 sm:p-6 lg:col-span-4 lg:row-span-2">
            <h3 className="text-h3 font-semibold">Hub chat</h3>
            <p className="mt-2 max-w-lg text-small text-muted-foreground">
              One thread for the class. Questions, drafts, and marked work land in the same place.
            </p>
            <div className="mt-6 space-y-3 rounded-lg border border-border bg-background p-4">
              <p className="ml-auto max-w-xs rounded-lg bg-foreground px-3 py-2 text-small text-background">
                Draft a practical for states of matter.
              </p>
              <p className="max-w-md rounded-lg border border-border px-3 py-2 text-small">
                Use the week 4 practical. Pair Amina with the extension card. Keep Brian on the core worksheet.
              </p>
              <div className="flex h-11 items-center rounded-full border border-border px-4 text-caption text-text-tertiary">
                Ask the Hub
              </div>
            </div>
          </article>

          <article className="surface-1 rounded-lg p-5 sm:p-6 lg:col-span-2">
            <h3 className="text-h4 font-semibold">Class panel</h3>
            <p className="mt-2 text-small text-muted-foreground">
              Chats, resources, and students sit beside the conversation.
            </p>
            <ul className="mt-4 space-y-2 text-small">
              {["Chats", "Resources", "Students"].map((tab, index) => (
                <li
                  key={tab}
                  className={
                    index === 2
                      ? "rounded-full bg-foreground px-3 py-1.5 text-background"
                      : "rounded-full border border-border px-3 py-1.5"
                  }
                >
                  {tab}
                </li>
              ))}
            </ul>
          </article>

          <article className="surface-1 rounded-lg p-5 sm:p-6 lg:col-span-2">
            <h3 className="text-h4 font-semibold">Chat-native eval</h3>
            <p className="mt-2 text-small text-muted-foreground">
              A script comes in. A marked script goes back to that student.
            </p>
            <div className="mt-4 space-y-2 text-caption">
              <p className="rounded-md border border-border px-3 py-2">Paper · Amina</p>
              <p className="rounded-md border border-foreground/25 px-3 py-2">Marked · reviewed by you</p>
            </div>
          </article>

          <article className="surface-1 rounded-lg p-5 sm:p-6 lg:col-span-3">
            <h3 className="text-h4 font-semibold">Resources</h3>
            <p className="mt-2 text-small text-muted-foreground">
              The scheme, the paper, and the notes the Hub is allowed to use.
            </p>
            <ul className="mt-4 divide-y divide-border text-small">
              {["Scheme of work · Term 2", "Week 4 practical", "Core worksheet"].map((item) => (
                <li key={item} className="py-2">
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="surface-1 rounded-lg p-5 sm:p-6 lg:col-span-3">
            <h3 className="text-h4 font-semibold">Student interests</h3>
            <p className="mt-2 text-small text-muted-foreground">
              The reply can name who is ready for more, and who needs a shorter path.
            </p>
            <ul className="mt-4 space-y-2 text-small">
              <li className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <span>Amina</span>
                <span className="text-caption text-muted-foreground">Extension</span>
              </li>
              <li className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <span>Brian</span>
                <span className="text-caption text-muted-foreground">Shorter stem</span>
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}

export function TrustSection() {
  const points = [
    {
      title: "Competency-Based Curriculum",
      body: "Grades 1–9, competencies, and the scheme of work are the frame. The Hub does not invent a different syllabus.",
    },
    {
      title: "A Kenyan classroom",
      body: "Large classes, terms, and the papers you already mark. The product is built for that week, not a generic lesson marketplace.",
    },
    {
      title: "One class at a time",
      body: "Context does not leak across classes. When you switch class, the Hub switches with you.",
    },
    {
      title: "You still review the mark",
      body: "Evaluation is chat-native so it is fast. It is not automatic. The teacher remains the person who accepts the script.",
    },
  ];

  return (
    <section id="trust" className="scroll-mt-24 border-t border-border px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <p className="text-caption uppercase tracking-widest text-text-tertiary">CBC · Kenya</p>
          <h2 className="mt-3 text-h1 font-semibold text-balance">
            Grounded in the curriculum you already teach.
          </h2>
        </div>
        <ul className="divide-y divide-border border-y border-border">
          {points.map((point) => (
            <li key={point.title} className="py-5">
              <h3 className="text-h4 font-semibold">{point.title}</h3>
              <p className="mt-2 text-small leading-relaxed text-muted-foreground">{point.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-24 border-t border-border px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-h1 font-semibold">Questions</h2>
        <div className="mt-8 divide-y divide-border border-y border-border">
          {faqs.map((item) => (
            <details key={item.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-h4 font-medium [&::-webkit-details-marker]:hidden">
                {item.q}
                <span aria-hidden className="text-muted-foreground transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-small leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta({ ctas }: { ctas: LandingCtas }) {
  const labels = landingCtaLabels(ctas);

  return (
    <section className="border-t border-border px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
        <div>
          <h2 className="max-w-xl text-h1 font-semibold text-balance">
            Ready when the class is.
          </h2>
          <p className="mt-3 max-w-lg text-body text-muted-foreground">
            Set up a class and ask the Hub something only that scheme can answer.
          </p>
        </div>
        <Link
          href={ctas.footerHref}
          className={cn(buttonVariants({ variant: "primary", size: "lg" }), "shrink-0")}
        >
          {labels.footer}
        </Link>
      </div>
    </section>
  );
}

export function LandingFooter({ ctas }: { ctas: LandingCtas }) {
  const labels = landingCtaLabels(ctas);

  return (
    <footer className="border-t border-border px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <LogoLockup />
          <p className="mt-3 text-caption text-muted-foreground">
            © {new Date().getFullYear()} PersonaLearn · Nervus Technologies
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2 text-small">
          <a href="#product" className="inline-flex h-11 items-center text-muted-foreground hover:text-foreground sm:h-auto">
            Product
          </a>
          <a href="#how-it-works" className="inline-flex h-11 items-center text-muted-foreground hover:text-foreground sm:h-auto">
            How it works
          </a>
          <a href="#faq" className="inline-flex h-11 items-center text-muted-foreground hover:text-foreground sm:h-auto">
            FAQ
          </a>
          <Link href={ctas.headerHref} className="inline-flex h-11 items-center text-muted-foreground hover:text-foreground sm:h-auto">
            {labels.header}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
