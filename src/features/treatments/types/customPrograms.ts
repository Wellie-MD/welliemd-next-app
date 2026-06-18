import type { CheckoutProductOption } from "./checkout";

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
