import type { ProgramCheckoutProduct } from "./checkout";

export type QuestionKind =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "email"
  | "phone"
  | "zip"
  | "single_choice"
  | "multiple_choice"
  | "yes_no"
  | "height_weight"
  | "consent"
  | "file_upload"
  | "state_routing"
  | "medication_dose"
  | "pharmacy"
  // System boundary projected into the builder. Not authorable, never persisted
  // as a ProgramQuestion.
  | "patient_authentication"
  // Legacy questionnaire grouped demographics. Retained so legacy templates
  // still type-check; Programs must not author it.
  | "personal_details"
  | "shipping_address"
  | "sex"
  | "medical_conditions"
  | "self_reported_meds"
  | "allergies"
  | "labs_preference"
  | "checkout"
  | "section"
  | "bmi";

export type VisibilityRuleOperator =
  | "equals"
  | "eq"
  | "not_equals"
  | "neq"
  | "in"
  | "not_in"
  | "contains"
  | "not_contains"
  | "gt"
  | "greater_than"
  | "gte"
  | "greater_than_or_equal"
  | "lt"
  | "less_than"
  | "lte"
  | "less_than_or_equal"
  | "between";

export interface VisibilityRule {
  id?: string;
  questionId: string;
  question_type?: string;
  operator: VisibilityRuleOperator;
  /** For "in"/"not_in" the value is a comma-separated list of choices.
      For "between" the value is "min,max". */
  value: string | string[];
  source?: "answer" | "patient_profile";
  field?: string;
}

export interface VisibilityRuleGroup {
  mode: "simple" | "nested";
  rules: VisibilityRule[];
  subgroups?: VisibilityRuleGroup[];
}

export interface ProgramQuestion {
  id: string;
  order: number;
  text: string;
  kind: QuestionKind;
  section: string;
  required: boolean;
  answerCount?: number;
  flags?: Array<"conditional" | "disqualifying" | "consent">;
  choices?: string[];
  dqChoices?: string[];
  consentText?: string;
  checkoutProductIds?: string[];
  checkoutProducts?: ProgramCheckoutProduct[];
  checkoutSelectionMode?: "single" | "multiple";
  checkoutMinSelections?: number;
  checkoutMaxSelections?: number;
  visibilityRule?: {
    questionId: string;
    value: string;
  };
  visibilityRuleGroup?: VisibilityRuleGroup;
  includeInQa?: boolean;
  hiddenFromPatient?: boolean;
  prefillFromPrevious?: boolean;
  lockClientChanges?: boolean;
  elementConfig?: Record<string, unknown>;
}
