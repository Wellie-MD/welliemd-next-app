import type {
  CommonSection,
  CommonSectionField,
  ConsentForm,
  CustomProgram,
  Program,
  ProgramQuestion,
  VisibilityRuleGroup,
} from "@/features/treatments/types";

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type TreatmentTypeRecord = {
  id: string;
  key: string;
  name: string;
  slug: string;
  description: string;
  intake_visit_type: string;
  followup_visit_type?: string;
  is_active: boolean;
};

export type SectionRecord = {
  id: string;
  name: string;
  scope: CommonSection["scope"];
  visit_type_keys: string[];
  field_count: number;
  updated_at?: string;
};

export type SectionFieldRecord = {
  id: string;
  source_field_id: string;
  section: string;
  order: number;
  label: string;
  kind: CommonSectionField["kind"];
  required: boolean;
  mapped_field?: string;
  configuration?: Record<string, unknown>;
};

export type ConsentRecord = {
  id: string;
  name: string;
  scope: ConsentForm["scope"];
  is_archived?: boolean;
  visit_type_keys: string[];
  text?: string;
  options?: ConsentForm["options"];
  version: number;
  updated_at?: string;
};

export type CustomProgramRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: CustomProgram["status"];
  audience: CustomProgram["audience"];
  min_age: number;
  max_age?: number | null;
  included_program_ids: string[];
  included_programs?: Array<{ id: string; name: string }>;
  section_ids: string[];
  consent_ids: string[];
  checkout_options: CustomProgram["checkoutOptions"];
  flow_items: CustomProgram["flowItems"];
  visit_type?: string | null;
  onboarding_name?: string;
  question_count?: number;
  icon?: string;
  icon_bg?: string;
  icon_color?: string;
  tags?: string[];
  is_multi?: boolean;
  program_matching_rules?: CustomProgram["programMatchingRules"];
  updated_at?: string;
  expected_updated_at?: string;
  assignment_runtime_state?: string;
  runtime_ready_at?: string | null;
  source_assignment_checksum?: string;
  runtime_summary?: {
    status: "ready" | "republish_required";
    schema_version: number;
    release_id: string;
    release_version: number;
    effective_question_count: number | null;
    screening_question_count: number;
    routing_question_count: number;
    common_question_count: number;
    consent_count: number;
    checkout_question_count: number;
    product_count: number;
    medicine_count: number;
    supply_count: number;
    lab_count: number;
    program_count: number;
  } | null;
};

export type CustomProgramValidationBlocker = {
  code: string;
  source_id?: string;
  program_id?: string;
  stage?: string;
  message: string | Record<string, unknown>;
  corrective_action?: {
    code: string;
    route: string;
  };
};

export type CustomProgramValidationRecord = {
  valid: boolean;
  custom_program_id: string;
  blockers: CustomProgramValidationBlocker[];
};

export type ProgramRecord = {
  id: string;
  source_questionnaire_template?: string | null;
  treatment_type: string;
  treatment_type_key: string;
  treatment_type_name: string;
  name: string;
  slug: string;
  description?: string;
  stage?: Program["stage"];
  phase?: "onboarding" | "follow_up";
  visit_type: string;
  question_count: number;
  checkout_question_count: number;
  status: Program["status"];
  auth_config?: Program["authConfig"];
  screening_questions?: ProgramQuestion[];
  checkout_questions?: Program["checkoutQuestions"];
  consent_ids?: string[];
  assigned_clients_count?: number;
  sex_requirement?: Program["sexRequirement"];
  min_age?: number | null;
  max_age?: number | null;
  min_bmi?: number | null;
  max_bmi?: number | null;
  service_states_all?: boolean;
  service_states?: string[];
  service_area_coverage?: {
    program_states?: string[];
    covered_states?: string[];
    missing_states?: string[];
    has_service_area_question?: boolean;
    warning?: string | null;
  };
  shipping_destination_policy?: Program["shippingDestinationPolicy"];
  lab_checkout_visibility_rule?: VisibilityRuleGroup;
  lab_requirements?: Array<{
    id?: string;
    panel_id: string;
    panel_name?: string;
    display_order: number;
    is_required: boolean;
    is_active: boolean;
    instructions?: string;
  }>;
  updated_at?: string;
  assignment_runtime_state?: string;
  runtime_ready_at?: string | null;
  source_assignment_checksum?: string;
};

export type ProgramQuestionRecord = Partial<ProgramQuestion> & {
  scope?: "routing" | "program";
  question_text?: string;
  question_type?: ProgramQuestion["kind"];
  order_index?: number;
  is_required?: boolean;
  answer_choices?: string[];
  conditional_logic?: unknown;
  validation_rules?: Record<string, unknown>;
  validation?: Record<string, unknown>;
  visibilityRules?: unknown;
  visibility_rules?: unknown;
  visibilityRuleGroup?: unknown;
  include_in_qa_section?: boolean;
  element_config?: Record<string, unknown>;
  can_be_modified?: boolean;
  is_read_only?: boolean;
  is_from_admin?: boolean;
  is_client_custom?: boolean;
  locked?: boolean;
};
