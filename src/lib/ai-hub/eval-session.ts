export type EvalSessionArtifact = {
  batchId: string;
  conversationId: string | null;
  status: string;
  assessmentTitle?: string | null;
  reused?: boolean;
};

export function isEvalSessionArtifact(
  value: unknown
): value is EvalSessionArtifact {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.batchId === "string" && record.batchId.length > 0;
}
