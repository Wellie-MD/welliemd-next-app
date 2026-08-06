import type {
  CommonSection,
  CommonSectionField,
  ConsentForm,
  CustomProgram,
  Program,
  ProgramCheckoutProduct,
  ProgramCheckoutQuestion,
  ProgramQuestion,
  TreatmentType,
} from "@/features/treatments/types";
import {
  isCheckoutQuestionRequired,
  PROGRAM_PRODUCT_ROLE,
} from "../programs/checkout-question/constants";
import type {
  ConsentRecord,
  CustomProgramRecord,
  ProgramQuestionRecord,
  ProgramRecord,
  SectionFieldRecord,
  SectionRecord,
  TreatmentTypeRecord,
} from "./contracts";

const dateStamp = () => new Date().toISOString().split("T")[0];

export const slugify = (value: string): string => value
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

export const isPersistedUuid = (value?: string | null): boolean =>
  Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));

const visibilityGroup = (record: ProgramQuestionRecord): ProgramQuestion["visibilityRuleGroup"] | undefined => {
  const raw = record.visibilityRuleGroup || record.visibilityRules || record.visibility_rules || record.conditional_logic;
  if (!raw || typeof raw !== "object") return undefined;
  const candidate = raw as NonNullable<ProgramQuestion["visibilityRuleGroup"]>;
  if ((candidate.mode !== "simple" && candidate.mode !== "nested") || !Array.isArray(candidate.rules)) return undefined;
  return { mode: candidate.mode, rules: candidate.rules, subgroups: candidate.subgroups || [] };
};

type CheckoutRecord = Record<string, unknown>;

const checkoutVisibilityGroup = (raw: unknown): ProgramCheckoutProduct["visibilityRules"] => {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  const candidate = raw as Partial<ProgramCheckoutQuestion["visibilityRules"]>;
  const subgroups = Array.isArray(candidate.subgroups)
    ? candidate.subgroups
        .map(checkoutVisibilityGroup)
        .filter((group): group is NonNullable<ProgramCheckoutProduct["visibilityRules"]> => Boolean(group))
    : [];
  const rules = Array.isArray(candidate.rules) ? candidate.rules : [];
  if (rules.length === 0 && subgroups.length === 0) return undefined;
  return {
    mode: candidate.mode === "nested" ? "nested" : "simple",
    rules,
    subgroups,
  };
};

const checkoutProductFromRecord = (record: CheckoutRecord, index: number): ProgramCheckoutProduct => ({
  id: String(record.id ?? record.option_id ?? `product-option-${index + 1}`),
  categoryId: Number(record.categoryId ?? record.category_id) || undefined,
  category: String(record.category ?? record.category_name ?? record.treatment ?? ""),
  regimenId: Number(record.regimenId ?? record.regimen_id ?? record.titration_category_id) || undefined,
  regimen: String(record.regimen ?? record.titration_category ?? ""),
  doseMappingId: Number(record.doseMappingId ?? record.dose_mapping_id) || undefined,
  doseLabel: String(record.doseLabel ?? record.dose_label ?? record.dose ?? ""),
  productId: record.productId || record.product_id || record.value || record.sourceProductId || record.source_product_id
    ? String(record.productId ?? record.product_id ?? record.value ?? record.sourceProductId ?? record.source_product_id)
    : undefined,
  sourceProductId: record.sourceProductId || record.source_product_id
    ? String(record.sourceProductId ?? record.source_product_id)
    : undefined,
  rxDaysSupply: Number(
    record.rxDaysSupply
    ?? record.rx_days_supply
    ?? record.days_supply
    ?? record.default_supply_duration,
  ) || undefined,
  price: Number(record.price ?? record.final_price ?? record.unit_price) || undefined,
  productRole: (
    record.productRole ||
    record.product_role ||
    PROGRAM_PRODUCT_ROLE.primaryChoice
  ) as ProgramCheckoutProduct["productRole"],
  choiceGroup: record.choiceGroup || record.choice_group
    ? String(record.choiceGroup ?? record.choice_group)
    : undefined,
  patientLabel: record.patientLabel || record.patient_label
    ? String(record.patientLabel ?? record.patient_label)
    : undefined,
  visibilityRules: checkoutVisibilityGroup(
    record.visibilityRules ?? record.visibility_rules ?? record.visibility_rule,
  ),
});

export const checkoutQuestionFromRecord = (raw: unknown, index: number): ProgramCheckoutQuestion => {
  const record = raw as CheckoutRecord;
  const checkoutConfig = (record.checkout_config ?? record.checkoutConfig) as CheckoutRecord | undefined;
  const rawProducts = (
    record.products ?? record.answer_choices ?? record.options ?? checkoutConfig?.products ?? []
  ) as CheckoutRecord[];
  return {
    id: String(record.id ?? record.source_id ?? `checkout-question-${index + 1}`),
    text: String(record.text ?? record.question_text ?? record.prompt ?? "Checkout Options"),
    products: rawProducts.map(checkoutProductFromRecord),
    visibilityRules: checkoutVisibilityGroup(
      record.visibilityRules ?? record.visibility_rules ?? record.visibility_rule ?? record.conditional_logic,
    ) ?? { mode: "simple", rules: [], subgroups: [] },
    required: Boolean(record.required ?? record.is_required ?? isCheckoutQuestionRequired(rawProducts.map(checkoutProductFromRecord))),
  };
};

export const questionFromRecord = (record: ProgramQuestionRecord, index = 0): ProgramQuestion => ({
  id: String(record.id || `q-${index + 1}`),
  order: Number(record.order ?? record.order_index ?? index + 1),
  text: String(record.text ?? record.question_text ?? ""),
  kind: (record.kind ?? record.question_type ?? "text") as ProgramQuestion["kind"],
  section: record.section || "General Intake",
  required: Boolean(record.required ?? record.is_required ?? false),
  choices: record.choices ?? record.answer_choices ?? [],
  dqChoices: record.dqChoices ?? [],
  consentText: record.consentText,
  checkoutProductIds: record.checkoutProductIds,
  checkoutProducts: record.checkoutProducts,
  visibilityRule: record.visibilityRule,
  visibilityRuleGroup: visibilityGroup(record),
  includeInQa: record.includeInQa ?? record.include_in_qa_section ?? true,
  hiddenFromPatient: record.hiddenFromPatient ?? false,
  prefillFromPrevious: record.prefillFromPrevious ?? false,
  elementConfig: record.elementConfig ?? record.element_config ??
    record.validation_rules?.element_config ?? record.validation?.element_config,
});

export const questionToRecord = (question: ProgramQuestion): ProgramQuestionRecord => ({
  ...question,
  order_index: question.order,
  question_text: question.text,
  question_type: question.kind,
  is_required: question.required,
  answer_choices: question.choices || [],
  visibilityRules: question.visibilityRuleGroup,
  visibility_rules: question.visibilityRuleGroup,
  include_in_qa_section: question.includeInQa,
  element_config: question.elementConfig,
});

export const treatmentTypeFromRecord = (record: TreatmentTypeRecord): TreatmentType => ({
  id: record.id,
  key: record.key,
  name: record.name,
  intakeVisitType: record.intake_visit_type,
  followupVisitType: record.followup_visit_type || undefined,
  description: record.description || "",
  programCount: 0,
  productCount: 0,
  sectionCount: 0,
  consentCount: 0,
  isActive: record.is_active,
});

export const treatmentTypeToRecord = (type: TreatmentType) => ({
  // New Treatment Types use the display name as their stable identity. The
  // intake/follow-up values are provider route identifiers and may be shared.
  key: slugify(isPersistedUuid(type.id) ? type.key || type.name : type.name),
  name: type.name.trim(),
  slug: slugify(isPersistedUuid(type.id) ? type.key || type.name : type.name),
  description: type.description || "",
  intake_visit_type: type.intakeVisitType.trim(),
  followup_visit_type: type.followupVisitType?.trim() || "",
  is_active: type.isActive,
});

export const sectionFromRecord = (record: SectionRecord): CommonSection => ({
  id: record.id,
  name: record.name,
  scope: record.scope,
  visitTypeKeys: record.visit_type_keys || [],
  fieldCount: record.field_count || 0,
  updatedAt: record.updated_at?.split("T")[0] || dateStamp(),
});

export const sectionToRecord = (section: CommonSection) => ({
  name: section.name.trim(),
  scope: section.scope,
  visit_type_keys: section.visitTypeKeys || [],
});

export const sectionFieldFromRecord = (record: SectionFieldRecord): CommonSectionField => ({
  id: record.id,
  sourceFieldId: record.source_field_id || record.id,
  sectionId: record.section,
  order: record.order,
  label: record.label,
  kind: record.kind,
  required: record.required,
  mappedField: record.mapped_field || undefined,
  configuration: record.configuration || {},
});

export const sectionFieldToRecord = (field: CommonSectionField) => ({
  id: isPersistedUuid(field.id) ? field.id : undefined,
  order: field.order,
  label: field.label,
  kind: field.kind,
  required: field.required,
  mapped_field: field.mappedField || "",
  configuration: field.configuration || {},
});

export const consentFromRecord = (record: ConsentRecord): ConsentForm => ({
  id: record.id,
  name: record.name,
  scope: record.scope,
  isArchived: record.is_archived ?? false,
  visitTypeKeys: record.visit_type_keys || [],
  text: record.text || "",
  options: record.options || [],
  updatedAt: record.updated_at?.split("T")[0] || dateStamp(),
});

export const consentToRecord = (consent: ConsentForm) => ({
  name: consent.name.trim(),
  scope: consent.scope,
  is_archived: consent.isArchived,
  visit_type_keys: consent.visitTypeKeys || [],
  text: consent.text || "",
  options: consent.options || [],
});

export const customProgramFromRecord = (record: CustomProgramRecord): CustomProgram => ({
  id: record.id,
  name: record.name,
  slug: record.slug,
  description: record.description || "",
  status: record.status,
  audience: record.audience,
  minAge: record.min_age,
  maxAge: record.max_age ?? undefined,
  includedProgramIds: record.included_program_ids || [],
  sectionIds: record.section_ids || [],
  consentIds: record.consent_ids || [],
  checkoutOptions: record.checkout_options || [],
  flowItems: record.flow_items || [],
  updatedAt: record.updated_at?.split("T")[0] || dateStamp(),
  visitType: record.visit_type ?? null,
  onboardingName: record.onboarding_name || "",
  questionCount: record.question_count || 0,
  icon: record.icon || undefined,
  iconBg: record.icon_bg || undefined,
  iconColor: record.icon_color || undefined,
  tags: record.tags || [],
  isMulti: record.is_multi ?? false,
  programMatchingRules: record.program_matching_rules || {},
  assignmentRuntimeState: record.assignment_runtime_state,
  runtimeReadyAt: record.runtime_ready_at ?? null,
  sourceAssignmentChecksum: record.source_assignment_checksum,
  runtimeSummary: record.runtime_summary ? {
    status: record.runtime_summary.status,
    schemaVersion: record.runtime_summary.schema_version,
    releaseId: record.runtime_summary.release_id,
    releaseVersion: record.runtime_summary.release_version,
    effectiveQuestionCount: record.runtime_summary.effective_question_count,
    screeningQuestionCount: record.runtime_summary.screening_question_count,
    routingQuestionCount: record.runtime_summary.routing_question_count,
    commonQuestionCount: record.runtime_summary.common_question_count,
    consentCount: record.runtime_summary.consent_count,
    checkoutQuestionCount: record.runtime_summary.checkout_question_count,
    productCount: record.runtime_summary.product_count,
    medicineCount: record.runtime_summary.medicine_count,
    supplyCount: record.runtime_summary.supply_count,
    labCount: record.runtime_summary.lab_count,
    programCount: record.runtime_summary.program_count,
  } : null,
});

export const customProgramToRecord = (program: CustomProgram) => ({
  name: program.name.trim(),
  slug: slugify(program.slug || program.name),
  description: program.description || "",
  status: program.status,
  audience: program.audience,
  min_age: program.minAge,
  max_age: program.maxAge ?? null,
  included_program_ids: program.includedProgramIds || [],
  section_ids: program.sectionIds || [],
  consent_ids: program.consentIds || [],
  checkout_options: program.checkoutOptions || [],
  flow_items: program.flowItems || [],
  visit_type: program.visitType ?? null,
  onboarding_name: program.onboardingName || "",
  question_count: program.questionCount || 0,
  icon: program.icon || "",
  icon_bg: program.iconBg || "",
  icon_color: program.iconColor || "",
  tags: program.tags || [],
  is_multi: program.isMulti ?? false,
  program_matching_rules: program.programMatchingRules || {},
});

export const programFromRecord = (record: ProgramRecord): Program => ({
  id: record.id,
  name: record.name,
  stage: record.stage || (record.phase === "follow_up" ? "follow_up" : "intake"),
  treatmentTypeKey: record.treatment_type_key,
  visitType: record.visit_type,
  questionCount: record.question_count || 0,
  checkoutQuestionCount: record.checkout_question_count || 0,
  status: record.status,
  updatedAt: record.updated_at?.split("T")[0] || dateStamp(),
  slug: record.slug,
  sourceQuestionnaireTemplateId: record.source_questionnaire_template || null,
  description: record.description || "",
  authConfig: record.auth_config || { email: true, phone: false, identity: false, account: true },
  screeningQuestions: (record.screening_questions || []).map(questionFromRecord),
  checkoutQuestions: (record.checkout_questions || []).map(checkoutQuestionFromRecord),
  consentIds: record.consent_ids || [],
  assignedClientsCount: record.assigned_clients_count ?? 0,
  sexRequirement: record.sex_requirement || "any",
  minAge: record.min_age ?? null,
  maxAge: record.max_age ?? null,
  minBmi: record.min_bmi ?? null,
  maxBmi: record.max_bmi ?? null,
  serviceStatesAll: record.service_states_all ?? true,
  serviceStates: record.service_states || [],
  shippingDestinationPolicy: record.shipping_destination_policy || "service_location_only",
  labRequirements: (record.lab_requirements || []).map((requirement) => ({
    id: requirement.id,
    panelId: requirement.panel_id,
    panelName: requirement.panel_name,
    displayOrder: requirement.display_order,
    isRequired: requirement.is_required,
    isActive: requirement.is_active,
    instructions: requirement.instructions || "",
  })),
  assignmentRuntimeState: record.assignment_runtime_state,
  runtimeReadyAt: record.runtime_ready_at ?? null,
  sourceAssignmentChecksum: record.source_assignment_checksum,
});

// ponytail: partial mapping to avoid stale frontend query cache overwrites during PATCH requests
export const programToRecord = (program: Partial<Program>, treatmentTypes: TreatmentType[]) => {
  const payload: Record<string, unknown> = {};

  if (program.treatmentTypeKey !== undefined) {
    const treatmentType = treatmentTypes.find((item) => item.key === program.treatmentTypeKey);
    if (treatmentType) {
      payload.treatment_type = treatmentType.id;
    }
  }

  if (program.sourceQuestionnaireTemplateId !== undefined) {
    payload.source_questionnaire_template = program.sourceQuestionnaireTemplateId || null;
  }
  if (program.name !== undefined) {
    payload.name = program.name.trim();
    if (program.slug === undefined) {
      payload.slug = slugify(program.slug || program.name);
    }
  }
  if (program.slug !== undefined) {
    payload.slug = slugify(program.slug);
  }
  if (program.description !== undefined) {
    payload.description = program.description || "";
  }
  if (program.stage !== undefined) {
    payload.stage = program.stage;
    payload.phase = program.stage === "follow_up" ? "follow_up" : "onboarding";
  }
  if (program.questionCount !== undefined) {
    payload.question_count = program.questionCount || 0;
  }
  if (program.checkoutQuestionCount !== undefined) {
    payload.checkout_question_count = program.checkoutQuestionCount || 0;
  }
  if (program.status !== undefined) {
    payload.status = program.status;
  }
  if (program.authConfig !== undefined) {
    payload.auth_config = program.authConfig;
  }
  if (program.screeningQuestions !== undefined) {
    payload.screening_questions = (program.screeningQuestions || []).map(questionToRecord);
  }
  if (program.checkoutQuestions !== undefined) {
    payload.checkout_questions = program.checkoutQuestions || [];
  }
  if (program.consentIds !== undefined) {
    payload.consent_ids = program.consentIds || [];
  }
  if (program.sexRequirement !== undefined) {
    payload.sex_requirement = program.sexRequirement || "any";
  }
  if (program.minAge !== undefined) {
    payload.min_age = program.minAge ?? null;
  }
  if (program.maxAge !== undefined) {
    payload.max_age = program.maxAge ?? null;
  }
  if (program.minBmi !== undefined) {
    payload.min_bmi = program.minBmi ?? null;
  }
  if (program.maxBmi !== undefined) {
    payload.max_bmi = program.maxBmi ?? null;
  }
  if (program.serviceStatesAll !== undefined) {
    payload.service_states_all = program.serviceStatesAll ?? true;
  }
  if (program.serviceStates !== undefined) {
    payload.service_states = program.serviceStatesAll === false ? (program.serviceStates || []) : [];
  }
  if (program.shippingDestinationPolicy !== undefined) {
    payload.shipping_destination_policy = program.shippingDestinationPolicy;
  }
  if (program.labRequirements !== undefined) {
    payload.lab_requirements = (program.labRequirements || []).map((requirement, index) => ({
      panel_id: requirement.panelId,
      display_order: requirement.displayOrder || index + 1,
      is_required: requirement.isRequired,
      is_active: requirement.isActive,
      instructions: requirement.instructions || "",
    }));
  }

  return payload;
};
