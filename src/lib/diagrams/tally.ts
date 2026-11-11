import type { DiagramPartId } from "@/lib/diagrams/content";

export type DiagramAnswerMode = "find" | "name";

export type DiagramAnswer = {
  partId: DiagramPartId;
  mode: DiagramAnswerMode;
  correct: boolean;
};

export type PartTally = {
  partId: DiagramPartId;
  correct: number;
  incorrect: number;
};

export function tallyAnswers(
  partIds: readonly DiagramPartId[],
  answers: DiagramAnswer[]
): PartTally[] {
  return partIds.map((partId) => {
    const rows = answers.filter((answer) => answer.partId === partId);
    return {
      partId,
      correct: rows.filter((answer) => answer.correct).length,
      incorrect: rows.filter((answer) => !answer.correct).length,
    };
  });
}
