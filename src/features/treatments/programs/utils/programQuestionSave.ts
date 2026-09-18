import type { ProgramQuestion } from "@/features/treatments/types";

/**
 * Applies a save from the question currently open in the editor.
 *
 * The dialog lets an author move between questions without closing it, so the
 * question that opened the dialog may no longer be the one being saved.
 */
export const applyQuestionSave = (
  questions: ProgramQuestion[],
  savedQuestion: ProgramQuestion,
): ProgramQuestion[] => {
  const existingQuestionIndex = questions.findIndex(
    (question) => question.id === savedQuestion.id,
  );

  if (existingQuestionIndex === -1) {
    return [...questions, savedQuestion];
  }

  return questions.map((question) => (
    question.id === savedQuestion.id ? savedQuestion : question
  ));
};
