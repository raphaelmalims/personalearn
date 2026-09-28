import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { getLandingCtas } from "@/lib/auth/post-login-path";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const title = "PersonaLearn — the AI Hub for CBC teachers";
const description =
  "Plan, ask, and grade inside one class. PersonaLearn is the AI Hub for Kenyan CBC teachers, grounded in your scheme of work and your students.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: "/",
    siteName: "PersonaLearn",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

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

export default async function HomePage() {
  const ctas = await getHomeLandingCtas();
  return <LandingPage ctas={ctas} />;
}
