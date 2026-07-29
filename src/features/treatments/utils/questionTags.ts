import type { ProgramQuestion } from "@/features/treatments/types";

export type QuestionTagType = "visibility" | "disqualifying" | "consent" | "auth" | "checkout" | "section";

export interface QuestionTag {
  type: QuestionTagType;
  label: string;
}

/**
 * Derives the active tags for a given ProgramQuestion.
 * These tags represent key behaviors (IF, DQ, CONSENT, AUTH, CHECKOUT).
 */
export function getQuestionTags(question: ProgramQuestion | null | undefined): QuestionTag[] {
  if (!question) return [];

  const tags: QuestionTag[] = [];

  const hasVisibility = !!question.visibilityRuleGroup || !!question.visibilityRule;
  const isDQ = question.dqChoices && question.dqChoices.length > 0;
  const isConsent = question.kind === "consent";
  const isAuth =
    question.kind === "auth" || question.kind === "patient_authentication";
  const isCheckout = question.kind === "checkout";
  const isSection = question.kind === "section";

  if (hasVisibility) {
    tags.push({ type: "visibility", label: "IF" });
  }
  if (isDQ) {
    tags.push({ type: "disqualifying", label: "DQ" });
  }
  if (isConsent) {
    tags.push({ type: "consent", label: "CONSENT" });
  }
  if (isAuth) {
    tags.push({ type: "auth", label: "AUTH" });
  }
  if (isCheckout) {
    tags.push({ type: "checkout", label: "CHECKOUT" });
  }
  if (isSection) {
    tags.push({ type: "section", label: "SECTION" });
  }

  return tags;
}
