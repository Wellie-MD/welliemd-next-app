import type { ProgramQuestion } from "@/features/treatments/types";
import { PROGRAM_QUESTION_KIND_ORDER } from "@/features/treatments/programs/programAuthoringConstants";

const searchableQuestionText = (question: ProgramQuestion) => [
  question.text,
  question.kind,
  question.section,
  question.consentText,
  ...(question.choices || []),
  ...(question.dqChoices || []),
  ...(question.checkoutProductIds || []),
  ...(question.checkoutProducts || []).flatMap((product) => [
    product.category,
    product.regimen,
    product.doseLabel,
  ]),
  ...Object.values(question.elementConfig || {}).filter((value): value is string => typeof value === "string"),
].filter(Boolean).join(" ").toLowerCase();

export function filterQuestions(questions: ProgramQuestion[], searchQuery: string, typeFilter: string) {
  let result = [...questions].sort((a, b) => a.order - b.order);
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    result = result.filter((question) => searchableQuestionText(question).includes(query));
  }
  if (typeFilter !== "all") {
    result = result.filter((question) => question.kind === typeFilter);
  }
  return result;
}

export function countQuestionTypes(questions: ProgramQuestion[]) {
  const counts: Record<string, number> = { all: questions.length };
  PROGRAM_QUESTION_KIND_ORDER.forEach((kind) => { counts[kind] = 0; });
  for (const question of questions) {
    counts[question.kind] = (counts[question.kind] || 0) + 1;
  }
  return counts;
}
