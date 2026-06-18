import type { ProgramCheckoutQuestion } from "./checkout";

export type ProgramStage = "intake" | "follow_up";

export type ProgramStatus = "draft" | "published" | "archived";

export interface ProgramAuthConfig {
  email: boolean;
  phone: boolean;
  identity: boolean;
  account: boolean;
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
  sexRequirement?: "any" | "male" | "female";
  minAge?: number | null;
  maxAge?: number | null;
  minBmi?: number | null;
  maxBmi?: number | null;
}
