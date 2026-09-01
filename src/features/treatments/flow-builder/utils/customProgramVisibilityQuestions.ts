import type {
  CommonSectionField,
  CustomProgramFlowItem,
  ProgramQuestion,
} from "@/features/treatments/types";

export interface CustomProgramVisibilityQuestionInputs {
  flowItems: CustomProgramFlowItem[];
  sectionFields: Record<string, CommonSectionField[]>;
}

function toQuestionKind(
  kind: CustomProgramFlowItem["questionKind"],
): ProgramQuestion["kind"] {
  if (kind === "single") return "single_choice";
  if (kind === "multiple") return "multiple_choice";
  return (kind || "text") as ProgramQuestion["kind"];
}

function getFieldChoices(field: CommonSectionField): string[] {
  const configuredChoices = field.configuration?.choices;
  if (!Array.isArray(configuredChoices)) return [];

  return configuredChoices
    .map((choice) => {
      if (typeof choice === "string") return choice;
      if (!choice || typeof choice !== "object") return "";
      const candidate = choice as Record<string, unknown>;
      return String(candidate.label || candidate.value || "");
    })
    .filter(Boolean);
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
 * Projects custom-program flow rows into the same question contract consumed
 * by QuestionVisibilityTab.
 *
 * Only rows that can provide an answer are projected. Authentication,
 * programs, checkout, and section containers are structural/runtime steps,
 * not visibility-rule inputs. Section containers are used to locate their
 * hydrated fields, which are represented by their actual source field IDs.
 */
export function buildCustomProgramVisibilityQuestions({
  flowItems,
  sectionFields,
}: CustomProgramVisibilityQuestionInputs): ProgramQuestion[] {
  const questions: ProgramQuestion[] = [];
  const seenIds = new Set<string>();

  flowItems.forEach((item, index) => {
    const order = index + 1;

    if (item.kind === "routing_question" || item.kind === "consent") {
      addQuestion(questions, seenIds, {
        id: item.sourceId || item.id,
        order,
        text: item.title,
        kind: item.kind === "consent" ? "consent" : toQuestionKind(item.questionKind),
        section: "Flow Items",
        required: item.required ?? true,
        choices: item.choices || item.answerOptions || [],
        dqChoices: item.dqChoices || [],
        visibilityRuleGroup: item.visibilityRules as ProgramQuestion["visibilityRuleGroup"],
        includeInQa: item.includeInQa,
        hiddenFromPatient: item.hiddenFromPatient,
        prefillFromPrevious: item.prefillFromPrevious,
        lockClientChanges: item.lockClientChanges,
      });
      return;
    }

    if (item.kind !== "section" && item.kind !== "section_field") return;

    const sectionId = item.sourceId || "";
    (sectionFields[sectionId] || [])
      .filter((field) => field.kind !== "checkout")
      .forEach((field) => {
        const id = field.sourceFieldId || field.id;
        addQuestion(questions, seenIds, {
          id,
          order,
          text: item.kind === "section" ? `${item.title} — ${field.label}` : field.label,
          kind: field.kind,
          section: "Flow Items",
          required: field.required,
          choices: getFieldChoices(field),
          elementConfig: {
            sourceId: id,
            sourceFieldId: id,
            sourceSectionId: sectionId,
          },
        });
      });
  });

  return questions;
}
