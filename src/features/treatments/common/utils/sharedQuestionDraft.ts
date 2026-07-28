import type { QuestionKind } from "@/features/treatments/types/questions";

export interface SharedQuestionDraft {
  questionText: string;
  questionType: QuestionKind;
  answerOptions: string[];
  required: boolean;
}

const choiceQuestionKinds = new Set<QuestionKind>(["single_choice", "multiple_choice"]);

const questionTypeLabels: Partial<Record<QuestionKind, string>> = {
  single_choice: "Single Choice",
  multiple_choice: "Multiple Choice",
  yes_no: "Yes / No",
  text: "Text",
  textarea: "Textarea",
  number: "Number",
  date: "Date",
};

export const normalizeSharedQuestionDraft = (draft: SharedQuestionDraft): SharedQuestionDraft => {
  const answerOptions = draft.answerOptions
    .map((option) => option.trim())
    .filter(Boolean);

  return {
    questionText: draft.questionText.trim(),
    questionType: draft.questionType,
    answerOptions: draft.questionType === "yes_no" && answerOptions.length === 0 ? ["Yes", "No"] : answerOptions,
    required: draft.required,
  };
};

export const validateSharedQuestionDraft = (draft: SharedQuestionDraft): string | null => {
  const normalized = normalizeSharedQuestionDraft(draft);

  if (!normalized.questionText) {
    return "Question text is required.";
  }

  if (choiceQuestionKinds.has(normalized.questionType) && normalized.answerOptions.length === 0) {
    return "Add at least one answer option.";
  }

  return null;
};

export const getSharedQuestionOptionCount = (draft: SharedQuestionDraft) => {
  const normalized = normalizeSharedQuestionDraft(draft);
  if (normalized.answerOptions.length > 0) return normalized.answerOptions.length;
  if (normalized.questionType === "yes_no") return 2;
  return undefined;
};

export const formatSharedQuestionSubtitle = (draft: SharedQuestionDraft) => {
  const normalized = normalizeSharedQuestionDraft(draft);
  const label = questionTypeLabels[normalized.questionType] ?? normalized.questionType;
  const optionCount = getSharedQuestionOptionCount(normalized);
  if (!optionCount) return label;
  return `${label} - ${optionCount} ${optionCount === 1 ? "option" : "options"}`;
};
