import { redirect } from "next/navigation";

/** Class index is no longer a destination — Hub owns roster and resources. */
export default function ClassesPage() {
  redirect("/ai-hub");
}
