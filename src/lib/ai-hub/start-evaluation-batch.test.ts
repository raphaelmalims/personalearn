import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeStartEvaluationBatch } from "./agent-tools";

vi.mock("@/lib/evaluation/batches", () => ({
  listClassAssessments: vi.fn(),
  createEvaluationBatch: vi.fn(),
}));

vi.mock("@/lib/evaluation/create-assessment-from-resource", () => ({
  ensureAssessmentForGradableResource: vi.fn(),
  shouldPublishAssessment: vi.fn(),
}));

vi.mock("@/lib/ai-hub/drafts", () => ({
  createAgentDraft: vi.fn(),
  downloadDraftImageBytes: vi.fn(),
  getAgentDraft: vi.fn(),
  markAgentDraftSaved: vi.fn(),
  updateAgentDraft: vi.fn(),
  uploadDraftImageBytes: vi.fn(),
}));

vi.mock("@/lib/ai/llm", () => ({ getChatModel: vi.fn() }));
vi.mock("@/lib/ai/ingest-resource", () => ({
  ingestResource: vi.fn(),
  ingestTxtResource: vi.fn(),
}));
vi.mock("@/lib/ai/rag", () => ({ queryClassResources: vi.fn() }));
vi.mock("@/lib/ai/vision-model", () => ({ getImageGenerationModel: vi.fn() }));

import {
  createEvaluationBatch,
  listClassAssessments,
} from "@/lib/evaluation/batches";

const mockList = vi.mocked(listClassAssessments);
const mockCreate = vi.mocked(createEvaluationBatch);

function deps(fromImpl: (table: string) => unknown) {
  return {
    supabase: { from: vi.fn((table: string) => fromImpl(table)) },
    classId: "class-1",
    teacherId: "teacher-1",
    classContext: {
      id: "class-1",
      name: "7 East",
      subject: "Math",
      grade_level: 7,
      term: 2,
      section: "East",
      academic_year: "2026",
    },
    conversationId: "conv-1",
  } as never;
}

describe("executeStartEvaluationBatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("asks which assignment when several saved titles exist", async () => {
    mockList.mockResolvedValue([
      { id: "a1", title: "CAT 2", class_id: "class-1" },
      { id: "a2", title: "Exam", class_id: "class-1" },
    ] as never);

    const result = await executeStartEvaluationBatch(
      deps(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
      })),
      { assignmentQuery: "grade these scripts" }
    );

    expect(result).toMatchObject({
      started: false,
      needsClarification: true,
    });
    expect(String((result as { message?: string }).message)).toContain("CAT 2");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("creates a batch for the only saved assignment and auto-uses a scheme", async () => {
    mockList.mockResolvedValue([
      { id: "a1", title: "CAT 2", class_id: "class-1" },
    ] as never);
    mockCreate.mockResolvedValue({
      batch: {
        id: "batch-1",
        assessment_id: "a1",
        status: "draft",
        conversation_id: "conv-1",
        marking_scheme_resource_id: "scheme-1",
      },
      reused: false,
    } as never);

    const result = await executeStartEvaluationBatch(
      deps((table) => {
        if (table === "resources") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: "scheme-1", title: "CAT 2 scheme" }],
                  error: null,
                }),
              })),
            })),
          };
        }
        return { select: vi.fn() };
      }),
      { assignmentQuery: "grade CAT 2" }
    );

    expect(mockCreate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        assessmentId: "a1",
        markingSchemeResourceId: "scheme-1",
        conversationId: "conv-1",
      })
    );
    expect(result).toMatchObject({
      started: true,
      batchId: "batch-1",
      acceptAttachedScans: true,
    });
  });
});
