import type {
  CommonSection,
  CommonSectionField,
  ConsentForm,
  CustomProgram,
  Program,
  ProgramQuestion,
  TreatmentType,
} from "@/features/treatments/types";
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

export const questionFromRecord = (record: ProgramQuestionRecord, index = 0): ProgramQuestion => ({
  id: String(record.id || `q-${index + 1}`),
  order: Number(record.order ?? record.order_index ?? index + 1),
  text: String(record.text ?? record.question_text ?? ""),
  kind: (record.kind ?? record.question_type ?? "text") as ProgramQuestion["kind"],
  section: record.section || "General Intake",
  required: Boolean(record.required ?? record.is_required ?? true),
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
  key: slugify(type.key || type.intakeVisitType || type.name),
  name: type.name.trim(),
  slug: slugify(type.key || type.intakeVisitType || type.name),
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
  checkoutQuestions: record.checkout_questions || [],
  consentIds: record.consent_ids || [],
  assignedClientsCount: record.assigned_clients_count ?? 0,
  sexRequirement: record.sex_requirement || "any",
  minAge: record.min_age ?? null,
  maxAge: record.max_age ?? null,
  minBmi: record.min_bmi ?? null,
  maxBmi: record.max_bmi ?? null,
  serviceStatesAll: record.service_states_all ?? true,
  serviceStates: record.service_states || [],
});

export const programToRecord = (program: Program, treatmentTypes: TreatmentType[]) => {
  const treatmentType = treatmentTypes.find((item) => item.key === program.treatmentTypeKey);
  if (!treatmentType) throw new Error(`Treatment type ${program.treatmentTypeKey} was not found`);
  return {
    treatment_type: treatmentType.id,
    source_questionnaire_template: program.sourceQuestionnaireTemplateId || null,
    name: program.name.trim(),
    slug: slugify(program.slug || program.name),
    description: program.description || "",
    stage: program.stage,
    question_count: program.questionCount || 0,
    checkout_question_count: program.checkoutQuestionCount || 0,
    status: program.status,
    auth_config: program.authConfig,
    screening_questions: (program.screeningQuestions || []).map(questionToRecord),
    checkout_questions: program.checkoutQuestions || [],
    consent_ids: program.consentIds || [],
    sex_requirement: program.sexRequirement || "any",
    min_age: program.minAge ?? null,
    max_age: program.maxAge ?? null,
    min_bmi: program.minBmi ?? null,
    max_bmi: program.maxBmi ?? null,
    service_states_all: program.serviceStatesAll ?? true,
    service_states: program.serviceStatesAll === false ? (program.serviceStates || []) : [],
    phase: program.stage === "follow_up" ? "follow_up" : "onboarding",
  };
};
