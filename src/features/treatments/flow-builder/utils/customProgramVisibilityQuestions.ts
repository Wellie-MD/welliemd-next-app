import type {
  CommonSectionField,
  CustomProgramFlowItem,
  ProgramQuestion,
} from "../../types";

export interface CustomProgramVisibilityQuestionInputs {
  flowItems: CustomProgramFlowItem[];
  sectionFields?: Record<string, CommonSectionField[]>;
}

function toQuestionKind(
  kind: CustomProgramFlowItem["questionKind"],
): ProgramQuestion["kind"] {
  if (kind === "single") return "single_choice";
  if (kind === "multiple") return "multiple_choice";
  return (kind || "text") as ProgramQuestion["kind"];
}

function addQuestion(
  questions: ProgramQuestion[],
  seenIds: Set<string>,
  question: ProgramQuestion,
) {
  if (!question.id || seenIds.has(question.id)) return;
  seenIds.add(question.id);
  questions.push(question);
}

/**
 * Projects custom-program flow rows into the question contract consumed
 * by QuestionVisibilityTab.
 *
 * Per the Custom Program custom-question visibility contract, ONLY earlier
 * Stage 1 custom questions (routing_question items) are valid visibility sources.
 * Authentication, sections, section fields, programs, consents, and checkout
 * containers are completely excluded.
 */
export function buildCustomProgramVisibilityQuestions({
  flowItems,
}: CustomProgramVisibilityQuestionInputs): ProgramQuestion[] {
  const questions: ProgramQuestion[] = [];
  const seenIds = new Set<string>();

  flowItems.forEach((item, index) => {
    const order = index + 1;

    if (item.kind === "routing_question") {
      addQuestion(questions, seenIds, {
        id: item.sourceId || item.id,
        order,
        text: item.title,
        kind: toQuestionKind(item.questionKind),
        section: "Program Matching",
        required: item.required ?? true,
        choices: item.choices || item.answerOptions || [],
        dqChoices: item.dqChoices || [],
        visibilityRuleGroup: item.visibilityRules as ProgramQuestion["visibilityRuleGroup"],
        includeInQa: item.includeInQa,
        hiddenFromPatient: item.hiddenFromPatient,
        prefillFromPrevious: item.prefillFromPrevious,
        lockClientChanges: item.lockClientChanges,
      });
    }
  });

  return questions;
}
