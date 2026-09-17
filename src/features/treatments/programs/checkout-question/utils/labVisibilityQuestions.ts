import { DERIVED_BMI_ID } from "../../../../../components/questionnaires/visibilityRuleConstants";
import {
  PATIENT_PROFILE_AGE_ID,
  PATIENT_PROFILE_SEX_ID,
} from "../../../utils/visibilityBuilderAdapters";
import type { ProgramQuestion } from "../../../types";

export interface LabVisibilitySectionField {
  sourceFieldId?: string;
  id?: string;
  label: string;
  kind?: string;
  configuration?: { choices?: unknown };
}

export interface LabVisibilityQuestionOption {
  id: string;
  question_text: string;
  order_index: number;
  question_type: string;
  answer_choices?: Array<string | Record<string, unknown>>;
}

const choiceValues = (choices: unknown): Array<string | Record<string, unknown>> => Array.isArray(choices)
  ? choices.filter((choice): choice is string | Record<string, unknown> => (
      typeof choice === "string" || (typeof choice === "object" && choice !== null)
    ))
  : [];

/** Build the answerable sources available to a Lab Checkout visibility rule. */
export const buildLabVisibilityQuestions = (
  eligibleQuestions: ProgramQuestion[],
  sectionFields: Array<LabVisibilitySectionField[]>,
): LabVisibilityQuestionOption[] => {
  const hasBmiQuestion = eligibleQuestions.some(
    (question) => question.kind === "height_weight" || question.kind === "bmi",
  );
  const questions: LabVisibilityQuestionOption[] = eligibleQuestions
    .filter((question) => !["height_weight", "bmi", "section"].includes(question.kind))
    .map((question) => ({
      id: question.id,
      question_text: question.text,
      order_index: question.order,
      question_type: question.kind,
      answer_choices: question.choices,
    }));

  eligibleQuestions
    .filter((question) => question.kind === "section")
    .forEach((sectionQuestion, index) => {
      (sectionFields[index] || [])
        .filter((field) => field.kind !== "checkout" && (field.sourceFieldId || field.id))
        .forEach((field) => {
          questions.push({
            id: String(field.sourceFieldId || field.id),
            question_text: `${sectionQuestion.text} — ${field.label}`,
            order_index: sectionQuestion.order,
            question_type: field.kind || "text",
            answer_choices: choiceValues(field.configuration?.choices),
          });
        });
    });

  if (hasBmiQuestion) {
    const bmiQuestion = eligibleQuestions.find(
      (question) => question.kind === "height_weight" || question.kind === "bmi",
    );
    questions.push({
      id: DERIVED_BMI_ID,
      question_text: "BMI (Calculated)",
      order_index: bmiQuestion?.order ?? 0,
      question_type: "bmi",
    });
  }

  questions.push(
    {
      id: PATIENT_PROFILE_SEX_ID,
      question_text: "Patient profile — Sex assigned at birth",
      order_index: 10000,
      question_type: "sex",
      answer_choices: ["Male", "Female", "Other"],
    },
    {
      id: PATIENT_PROFILE_AGE_ID,
      question_text: "Patient profile — Age",
      order_index: 10001,
      question_type: "number",
    },
  );
  return questions.sort((left, right) => left.order_index - right.order_index);
};
