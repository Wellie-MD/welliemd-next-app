import type {
  ProgramCheckoutQuestion,
  ProgramLabRequirement,
  ProgramQuestion,
  VisibilityRuleGroup,
} from "@/features/treatments/types";

export type VisibilityDependent = {
  id: string;
  label: string;
  ruleCount: number;
};

/**
 * Visibility rules are persisted by several APIs and may arrive in either the
 * builder's group shape (`rules`/`subgroups`) or an older nested shape
 * (`conditions`/`children`). Keep the dependency scan schema-agnostic so a
 * new visibility-capable entity does not need a question-type-specific check.
 */
const countGroupReferences = (
  group: VisibilityRuleGroup | Record<string, unknown> | undefined,
  sourceQuestionId: string,
): number => {
  if (!group || typeof group !== "object") return 0;

  const node = group as Record<string, unknown>;
  const isReference = node.questionId === sourceQuestionId
    || node.question_id === sourceQuestionId;
  const children = [
    node.rules,
    node.conditions,
    node.subgroups,
    node.children,
  ].flatMap((value) => Array.isArray(value) ? value : []);

  return (isReference ? 1 : 0) + children.reduce(
    (count, child) => count + countGroupReferences(
      child as Record<string, unknown>,
      sourceQuestionId,
    ),
    0,
  );
};

const questionReferenceCount = (question: ProgramQuestion, sourceQuestionId: string) =>
  (question.visibilityRule?.questionId === sourceQuestionId ? 1 : 0)
  + countGroupReferences(question.visibilityRuleGroup, sourceQuestionId);

/** Lists every Program element whose visibility rules read a question's answer. */
export const getQuestionVisibilityDependents = (
  sourceQuestionId: string,
  questions: ProgramQuestion[],
  checkoutQuestions: ProgramCheckoutQuestion[] = [],
  labRequirements: ProgramLabRequirement[] = [],
): VisibilityDependent[] => {
  const questionDependents = questions.flatMap((question) => {
    const ruleCount = questionReferenceCount(question, sourceQuestionId);
    return ruleCount > 0 && question.id !== sourceQuestionId
      ? [{ id: `question:${question.id}`, label: `Question "${question.text || "Untitled question"}"`, ruleCount }]
      : [];
  });

  const checkoutDependents = checkoutQuestions.flatMap((checkoutQuestion) => {
    const questionRuleCount = countGroupReferences(
      checkoutQuestion.visibilityRules,
      sourceQuestionId,
    );
    const questionEntry = questionRuleCount > 0
      ? [{
          id: `checkout:${checkoutQuestion.id}`,
          label: `Checkout question "${checkoutQuestion.text || "Untitled checkout question"}"`,
          ruleCount: questionRuleCount,
        }]
      : [];
    const productEntries = checkoutQuestion.products.flatMap((product) => {
      const ruleCount = countGroupReferences(product.visibilityRules, sourceQuestionId);
      if (ruleCount === 0) return [];
      const productName = product.patientLabel || product.doseLabel || product.productId || "Unnamed product";
      return [{
        id: `product:${checkoutQuestion.id}:${product.id}`,
        label: `Product "${productName}" in "${checkoutQuestion.text || "Checkout"}"`,
        ruleCount,
      }];
    });
    return [...questionEntry, ...productEntries];
  });

  const labDependents = labRequirements.flatMap((requirement, index) => {
    const ruleCount = countGroupReferences(requirement.visibilityRuleGroup, sourceQuestionId);
    if (ruleCount === 0) return [];
    const name = requirement.panelName || requirement.combinedPanelName || "Unnamed lab requirement";
    return [{ id: `lab:${requirement.id || index}`, label: `Lab requirement "${name}"`, ruleCount }];
  });

  return [...questionDependents, ...checkoutDependents, ...labDependents];
};
