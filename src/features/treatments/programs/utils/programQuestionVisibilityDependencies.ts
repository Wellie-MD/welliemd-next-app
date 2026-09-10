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

const countGroupReferences = (
  group: VisibilityRuleGroup | undefined,
  sourceQuestionId: string,
): number => {
  if (!group) return 0;

  return (group.rules || []).filter(
    (rule) => rule.questionId === sourceQuestionId,
  ).length + (group.subgroups || []).reduce(
    (count, subgroup) => count + countGroupReferences(subgroup, sourceQuestionId),
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
