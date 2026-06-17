export type TreatmentLibraryScope = "global" | "shared" | "treatment";

export type ProgramStage = "intake" | "follow_up";

export type ProgramStatus = "draft" | "published" | "archived";

export type CustomProgramStatus = "draft" | "published" | "archived";

export type FlowItemKind =
  | "authentication"
  | "program"
  | "section"
  | "consent"
  | "routing_question"
  | "checkout";

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
  | "checkout";

export interface TreatmentType {
  id: string;
  key: string;
  name: string;
  intakeVisitType: string;
  followupVisitType?: string;
  description: string;
  programCount: number;
  productCount: number;
  sectionCount: number;
  consentCount: number;
  isActive: boolean;
}

export interface ProgramAuthConfig {
  email: boolean;
  phone: boolean;
  identity: boolean;
  account: boolean;
}

export interface VisibilityRule {
  id?: string;
  questionId: string;
  operator: "equals" | "not_equals";
  value: string;
}

export interface VisibilityRuleGroup {
  mode: "simple" | "nested";
  rules: VisibilityRule[];
}

export interface ProgramCheckoutProduct {
  id: string;
  category: string;
  regimen: string;
  doseLabel: string;
  productId?: string;
}

export interface ProgramCheckoutQuestion {
  id: string;
  text: string;
  products: ProgramCheckoutProduct[];
  visibilityRules: VisibilityRuleGroup;
}

export interface Program {
  id: string;
  name: string;
  stage: ProgramStage;
  treatmentTypeKey: string;
  visitType: string;
  questionCount: number;
  checkoutQuestionCount: number;
  status: ProgramStatus;
  updatedAt: string;
  slug: string;
  authConfig?: ProgramAuthConfig;
  checkoutQuestions?: ProgramCheckoutQuestion[];
  consentIds?: string[];
}

export interface CommonSection {
  id: string;
  name: string;
  scope: TreatmentLibraryScope;
  visitTypeKeys: string[];
  fieldCount: number;
  updatedAt: string;
}

export interface ConsentForm {
  id: string;
  name: string;
  scope: TreatmentLibraryScope;
  visitTypeKeys: string[];
  updatedAt: string;
}

export interface CheckoutProductOption {
  id: string;
  productId: string;
  treatmentTypeKey: string;
  category: string;
  regimen: string;
  dose: string;
  productName: string;
  price: number;
  visibilitySummary: string;
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
  consentText?: string;
  checkoutProductIds?: string[];
  visibilityRule?: {
    questionId: string;
    value: string;
  };
}

export interface CustomProgramFlowItem {
  id: string;
  kind: FlowItemKind;
  title: string;
  subtitle: string;
  locked?: boolean;
  treatmentTypeKey?: string;
  sourceId?: string; // stable ID linking to the original program/section/consent/question
}

export type CustomProgramFlowItemInput = Omit<CustomProgramFlowItem, "id">;

export interface CustomProgramBuilderAddItem extends CustomProgramFlowItemInput {
  checkoutOption?: Omit<CheckoutProductOption, "id">;
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
}

export interface ContentLibraryStats {
  consentForms: number;
  commonSections: number;
  programs: number;
  customPrograms: number;
}
