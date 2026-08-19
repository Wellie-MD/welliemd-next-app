import type { ProgramCheckoutQuestion } from "./checkout";
import type { ProgramQuestion } from "./questions";

export type ProgramStage = "intake" | "follow_up";

export type ProgramStatus = "draft" | "published" | "archived";

export interface ProgramAuthConfig {
  email: boolean;
  phone: boolean;
  identity: boolean;
  account: boolean;
  enabled?: boolean;
}

export interface ProgramLabRequirement {
  id?: string;
  panelId: string;
  panelName?: string;
  displayOrder: number;
  isRequired: boolean;
  isActive: boolean;
  instructions?: string;
}

export interface Program {
  id: string;
  name: string;
  description?: string;
  stage: ProgramStage;
  treatmentTypeKey: string;
  visitType: string;
  questionCount: number;
  checkoutQuestionCount: number;
  status: ProgramStatus;
  updatedAt: string;
  slug: string;
  sourceQuestionnaireTemplateId?: string | null;
  authConfig?: ProgramAuthConfig;
  screeningQuestions?: ProgramQuestion[];
  checkoutQuestions?: ProgramCheckoutQuestion[];
  consentIds?: string[];
  assignedClientsCount?: number;
  sexRequirement?: "any" | "male" | "female";
  minAge?: number | null;
  maxAge?: number | null;
  minBmi?: number | null;
  maxBmi?: number | null;
  serviceStatesAll?: boolean;
  serviceStates?: string[];
  serviceAreaCoverage?: {
    programStates: string[];
    coveredStates: string[];
    missingStates: string[];
    hasServiceAreaQuestion: boolean;
    warning?: string | null;
  };
  shippingDestinationPolicy?: "service_location_only" | "separate_verified_allowed";
  labRequirements?: ProgramLabRequirement[];
  assignmentRuntimeState?: string;
  runtimeReadyAt?: string | null;
  sourceAssignmentChecksum?: string;
}
