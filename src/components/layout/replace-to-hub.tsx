"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Silent Hub landing for leftover `/classes` and `/dashboard*` bookmarks. */
export function ReplaceToHub() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/ai-hub");
  }, [router]);

  return (
    <p className="text-sm text-muted-foreground">Loading AI Hub…</p>
  );
}
