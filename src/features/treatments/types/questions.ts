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
  | "personal_details"
  | "shipping_address"
  | "sex"
  | "medical_conditions"
  | "self_reported_meds"
  | "allergies"
  | "labs_preference"
  | "checkout"
  | "auth";

export type VisibilityRuleOperator =
  | "equals"
  | "not_equals"
  | "in"
  | "not_in"
  | "contains"
  | "not_contains";

export interface VisibilityRule {
  id?: string;
  questionId: string;
  operator: VisibilityRuleOperator;
  value: string;
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
  source?: "client" | "admin" | "welliemd";
  locked?: boolean;
  answerCount?: number;
  flags?: Array<"conditional" | "disqualifying" | "consent">;
  choices?: string[];
  dqChoices?: string[];
  consentText?: string;
  checkoutProductIds?: string[];
  checkoutProducts?: ProgramCheckoutProduct[];
  visibilityRule?: {
    questionId: string;
    value: string;
  };
  visibilityRuleGroup?: VisibilityRuleGroup;
  includeInQa?: boolean;
  hiddenFromPatient?: boolean;
  prefillFromPrevious?: boolean;
}
