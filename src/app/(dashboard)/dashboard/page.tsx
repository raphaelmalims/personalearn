import { redirect } from "next/navigation";

/** Home is no longer a signed-in destination — Hub is the only shell surface. */
export default function DashboardPage() {
  redirect("/ai-hub");
}
