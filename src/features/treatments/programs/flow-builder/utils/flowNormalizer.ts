import type { ProgramQuestion } from "../../../types";
import { collectVisibilityRules } from "./flowLayoutHelpers";

export type FlowNormalizationIssue = {
  questionId: string;
  type: "invalid_parent" | "missing_value" | "self_reference" | "cycle";
  referencedQuestionId?: string;
};

export type NormalizedProgramFlow = {
  sortedQuestions: ProgramQuestion[];
  questionIds: Set<string>;
  questionsById: Map<string, ProgramQuestion>;
  spineQuestions: ProgramQuestion[];
  branchChildren: Map<string, ProgramQuestion[]>;
  parentOf: Map<string, string>;
  triggerValueOf: Map<string, string>;
  issues: FlowNormalizationIssue[];
};

type ParentCandidate = {
  questionId: string;
  value: string;
};

const questionCandidates = (question: ProgramQuestion): ParentCandidate[] => {
  const candidates: ParentCandidate[] = [];

  if (question.visibilityRule?.questionId) {
    candidates.push({
      questionId: question.visibilityRule.questionId,
      value: question.visibilityRule.value || "",
    });
  }

  collectVisibilityRules(question.visibilityRuleGroup).forEach((rule) => {
    candidates.push({ questionId: rule.questionId, value: rule.value });
  });

  return candidates;
};

const findCycle = (parentOf: Map<string, string>, orderedIds: string[]): string[] | null => {
  const complete = new Set<string>();

  for (const startId of orderedIds) {
    if (complete.has(startId)) continue;

    const path: string[] = [];
    const pathIndex = new Map<string, number>();
    let currentId: string | undefined = startId;

    while (currentId && !complete.has(currentId)) {
      const existingIndex = pathIndex.get(currentId);
      if (existingIndex !== undefined) return path.slice(existingIndex);

      pathIndex.set(currentId, path.length);
      path.push(currentId);
      currentId = parentOf.get(currentId);
    }

    path.forEach((id) => complete.add(id));
  }

  return null;
};

/**
 * Produces a deterministic, cycle-safe Program question hierarchy.
 * Invalid visibility references remain visible on the main spine instead of
 * disappearing from the canvas.
 */
export function normalizeProgramFlowData(questions: ProgramQuestion[]): NormalizedProgramFlow {
  const sortedQuestions = [...questions].sort((a, b) => {
    const orderDiff = (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
    return orderDiff || a.id.localeCompare(b.id);
  });
  const questionIds = new Set(sortedQuestions.map((question) => question.id));
  const questionsById = new Map(sortedQuestions.map((question) => [question.id, question]));
  const parentOf = new Map<string, string>();
  const triggerValueOf = new Map<string, string>();
  const issues: FlowNormalizationIssue[] = [];

  sortedQuestions.forEach((question) => {
    if (question.kind === "state_routing") return;

    const candidates = questionCandidates(question);
    if (!candidates.length) return;

    candidates.forEach((candidate) => {
      if (!candidate.value) {
        issues.push({
          questionId: question.id,
          type: "missing_value",
          referencedQuestionId: candidate.questionId,
        });
      } else if (candidate.questionId === question.id) {
        issues.push({
          questionId: question.id,
          type: "self_reference",
          referencedQuestionId: candidate.questionId,
        });
      } else if (!questionIds.has(candidate.questionId)) {
        issues.push({
          questionId: question.id,
          type: "invalid_parent",
          referencedQuestionId: candidate.questionId,
        });
      }
    });

    const validParent = candidates.find(
      (candidate) =>
        Boolean(candidate.value) && candidate.questionId !== question.id && questionIds.has(candidate.questionId)
    );
    if (!validParent) return;

    parentOf.set(question.id, validParent.questionId);
    triggerValueOf.set(question.id, validParent.value);
  });

  // Break every cycle deterministically at the earliest question in Program
  // order. That question becomes a spine item and the remaining chain stays
  // visible beneath it.
  const orderedIds = sortedQuestions.map((question) => question.id);
  let cycle = findCycle(parentOf, orderedIds);
  while (cycle?.length) {
    const promotedId = cycle.reduce((winner, id) => {
      const winnerIndex = orderedIds.indexOf(winner);
      const currentIndex = orderedIds.indexOf(id);
      return currentIndex < winnerIndex ? id : winner;
    }, cycle[0]);

    issues.push({
      questionId: promotedId,
      type: "cycle",
      referencedQuestionId: parentOf.get(promotedId),
    });
    parentOf.delete(promotedId);
    triggerValueOf.delete(promotedId);
    cycle = findCycle(parentOf, orderedIds);
  }

  const branchChildren = new Map<string, ProgramQuestion[]>();
  const spineQuestions: ProgramQuestion[] = [];

  sortedQuestions.forEach((question) => {
    const parentId = parentOf.get(question.id);
    if (!parentId) {
      spineQuestions.push(question);
      return;
    }

    branchChildren.set(parentId, [...(branchChildren.get(parentId) || []), question]);
  });

  return {
    sortedQuestions,
    questionIds,
    questionsById,
    spineQuestions,
    branchChildren,
    parentOf,
    triggerValueOf,
    issues,
  };
}
