import type { ExplainerCacheStatus, ExplainerMetrics, ExplainerStep } from "@/lib/explainers/script";

export type ExplainerArtifact = {
  topic: string;
  grade: number;
  language: string;
  title: string;
  steps: ExplainerStep[];
  cache: ExplainerCacheStatus;
  metrics: ExplainerMetrics;
};

export function isExplainerArtifact(value: unknown): value is ExplainerArtifact {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (typeof record.title !== "string" || !record.title.trim()) return false;
  if (typeof record.language !== "string") return false;
  if (!Array.isArray(record.steps) || record.steps.length < 3 || record.steps.length > 4) {
    return false;
  }
  return record.steps.every((step) => {
    if (!step || typeof step !== "object") return false;
    const row = step as Record<string, unknown>;
    return typeof row.label === "string" && typeof row.caption === "string";
  });
}
