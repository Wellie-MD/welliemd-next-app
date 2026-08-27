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
  dqChoices?: string[];
  required?: boolean;
  mappedField?: string;
  visibilityRules?: VisibilityRuleGroup | Record<string, unknown>;
  includeInQa?: boolean;
  hiddenFromPatient?: boolean;
  prefillFromPrevious?: boolean;
  lockClientChanges?: boolean;
}

/** Mirrors the backend `RUNTIME_RULE_OPERATORS` set. */
export type ProgramMatchingOperator =
  | "eq" | "neq" | "in" | "not_in" | "contains" | "not_contains"
  | "gt" | "gte" | "lt" | "lte" | "between" | "exists"
  | "is_empty" | "is_not_empty";

export interface ProgramMatchingCondition {
  field: string;
  operator: ProgramMatchingOperator;
  value?: string | number | string[] | boolean;
  /** Upper bound for `between`. */
  value2?: string | number;
}

/**
 * A rule group. `rules` may contain conditions and further groups, so the
 * tree nests arbitrarily — the same shape the backend evaluator accepts.
 */
export interface ProgramMatchingGroup {
  combinator: "and" | "or";
  rules: ProgramMatchingNode[];
}

export type ProgramMatchingNode = ProgramMatchingCondition | ProgramMatchingGroup;

/** Retained name for the root group. */
export type ProgramMatchingRule = ProgramMatchingGroup;

export interface ProgramMatchingConfig {
  /**
   * `false` withholds an attached Program without deleting its authored rule.
   * It is not the same as an empty rule, which means "always offered".
   */
  enabled: boolean;
  rule: ProgramMatchingGroup | ProgramMatchingCondition | Record<string, never>;
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
  includedPrograms?: Array<{ id: string; name: string }>;
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

export interface EffectiveContentReason {
  type: "global" | "visit_type" | "program" | "custom_program" | "inline";
  key?: string;
  id?: string;
  programId?: string;
}

export interface EffectiveCustomProgramNode {
  sourceId: string;
  sourceVersion: number;
  name: string;
  scope?: string;
  sourceType?: string;
  libraryScope?: "global" | "visit_type" | string;
  applicableProgramIds: string[];
  resolvedFrom: EffectiveContentReason[];
  fields?: Array<{ sourceId: string; label: string; kind: string; order: number }>;
}

export interface EffectiveCustomProgramContent {
  customProgramId: string;
  revision: string;
  systemSteps: { authentication: { count: number; locked: boolean } };
  stages: {
    stage1: {
      questions: Array<{ id: string; sourceId: string; title?: string; displayOrder: number }>;
      sections: EffectiveCustomProgramNode[];
    };
    stage2: { programs: Array<{
      inclusionId: string;
      programId: string;
      name: string;
      displayOrder: number;
      matchingEnabled: boolean;
      matchingRule: Record<string, unknown>;
      matchingState: "always_offered" | "conditional" | "not_offered";
      effectiveConsentCount: number;
      effectiveSectionCount: number;
      sectionOccurrences: EffectiveCustomProgramNode[];
      checkoutCount: number;
    }> };
    stage3: { consents: EffectiveCustomProgramNode[] };
    stage4: { checkout: { count: number; locked: boolean } };
  };
  blockers: Array<Record<string, unknown>>;
}
