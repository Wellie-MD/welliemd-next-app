import type { CheckoutProductOption } from "./checkout";
import type { QuestionKind, VisibilityRuleGroup } from "./questions";

export type CustomProgramStatus = "draft" | "published" | "archived";

export type FlowItemKind =
  | "authentication"
  | "program"
  | "section"
  | "section_field"
  | "consent"
  | "routing_question"
  | "checkout";

export interface CustomProgramFlowItem {
  id: string;
  kind: FlowItemKind;
  title: string;
  subtitle: string;
  locked?: boolean;
  treatmentTypeKey?: string;
  sourceId?: string;
  questionKind?: QuestionKind | "single" | "multiple";
  answerOptions?: string[];
  choices?: string[];
  required?: boolean;
  mappedField?: string;
  visibilityRules?: VisibilityRuleGroup | Record<string, unknown>;
  includeInQa?: boolean;
  hiddenFromPatient?: boolean;
  prefillFromPrevious?: boolean;
  lockClientChanges?: boolean;
}

export type ProgramMatchingOperator = "eq" | "neq" | "contains" | "not_contains" | "gt" | "gte" | "lt" | "lte" | "between" | "exists";

export interface ProgramMatchingCondition {
  field: string;
  operator: ProgramMatchingOperator;
  value?: string | number | string[] | boolean;
}

export interface ProgramMatchingRule {
  combinator: "and" | "or";
  rules: ProgramMatchingCondition[];
}

export interface ProgramMatchingConfig {
  enabled: boolean;
  rule: ProgramMatchingRule | Record<string, never>;
}

export type CustomProgramFlowItemInput = Omit<CustomProgramFlowItem, "id">;

export interface CustomProgramBuilderAddItem extends CustomProgramFlowItemInput {
  checkoutOption?: Omit<CheckoutProductOption, "id">;
}

export interface CustomProgramRuntimeSummary {
  status: "ready" | "republish_required";
  schemaVersion: number;
  releaseId: string;
  releaseVersion: number;
  effectiveQuestionCount: number | null;
  screeningQuestionCount: number;
  routingQuestionCount: number;
  commonQuestionCount: number;
  consentCount: number;
  checkoutQuestionCount: number;
  productCount: number;
  medicineCount: number;
  supplyCount: number;
  labCount: number;
  programCount: number;
}

export interface CustomProgram {
  id: string;
  name: string;
  description: string;
  status: CustomProgramStatus;
  audience: "all" | "male" | "female";
  minAge: number;
  maxAge?: number;
  includedProgramIds: string[];
  sectionIds: string[];
  consentIds: string[];
  checkoutOptions: CheckoutProductOption[];
  flowItems: CustomProgramFlowItem[];
  updatedAt: string;
  slug: string;
  visitType?: string | null;
  onboardingName?: string;
  questionCount?: number;
  icon?: string;
  iconBg?: string;
  iconColor?: string;
  tags?: string[];
  isMulti?: boolean;
  programMatchingRules: Record<string, ProgramMatchingConfig>;
  assignmentRuntimeState?: string;
  runtimeReadyAt?: string | null;
  sourceAssignmentChecksum?: string;
  runtimeSummary?: CustomProgramRuntimeSummary | null;
}
