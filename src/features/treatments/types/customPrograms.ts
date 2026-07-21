import type { CheckoutProductOption } from "./checkout";
import type { QuestionKind } from "./questions";
import type { SharedQuestionDraft } from "@/features/treatments/common/utils/sharedQuestionDraft";

export type CustomProgramStatus = "draft" | "published" | "archived";

export type FlowItemKind =
  | "authentication"
  | "program"
  | "section"
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
}

export type CustomProgramFlowItemInput = Omit<CustomProgramFlowItem, "id">;

export interface CustomProgramBuilderAddItem extends CustomProgramFlowItemInput {
  checkoutOption?: Omit<CheckoutProductOption, "id">;
}

export type CustomProgramBuilderItemSource = "admin" | "client" | "welliemd";

export type CustomProgramBuilderItemKind = "question" | "section" | "program" | "consent";

export interface CustomProgramBuilderStageItem {
  id: string;
  kind: CustomProgramBuilderItemKind;
  title: string;
  subtitle?: string;
  source: CustomProgramBuilderItemSource;
  locked: boolean;
  required?: boolean;
  questionKind?: QuestionKind;
  choiceCount?: number;
  answerOptions?: string[];
  treatmentTypeKey?: string;
  sourceId?: string;
}

export interface CustomProgramBuilderStage {
  id: string;
  stageNumber: number;
  title: string;
  tone: "question" | "program" | "consent";
  items: CustomProgramBuilderStageItem[];
}

export interface CustomProgramBuilderLockedItem {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  locked: true;
  required?: boolean;
  kind: "authentication" | "checkout";
}

export type CustomProgramBuilderQuestionInput = SharedQuestionDraft;

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
  slugOverride?: string | null;
  visitType?: string | null;
  onboardingName?: string;
  questionCount?: number;
  icon?: string;
  iconBg?: string;
  iconColor?: string;
  tags?: string[];
  isMulti?: boolean;
  builderQuestions?: CustomProgramBuilderStageItem[];
  builderSections?: CustomProgramBuilderStageItem[];
  builderTreatmentOptions?: CustomProgramBuilderStageItem[];
  builderConsents?: CustomProgramBuilderStageItem[];
  runtimeSummary?: CustomProgramRuntimeSummary | null;
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
