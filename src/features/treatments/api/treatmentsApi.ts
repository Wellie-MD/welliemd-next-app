import type {
  CommonSection,
  ConsentForm,
  ContentLibraryStats,
  CustomProgram,
  Program,
  ProgramQuestion,
  CommonSectionField,
  TreatmentType,
} from "@/features/treatments/types";
import axiosInstance from "@/api/axiosInstance";
import { mockConsents } from "@/features/treatments/libraries/data/consents.mock";
import { mockCustomPrograms } from "@/features/treatments/custom-programs/data/customPrograms.mock";
import { mockProgramQuestions } from "@/features/treatments/programs/data/programQuestions.mock";
import { mockPrograms } from "@/features/treatments/programs/data/programs.mock";
import { mockSections } from "@/features/treatments/libraries/data/sections.mock";
import { mockTreatmentTypes } from "@/features/treatments/libraries/data/treatmentTypes.mock";
import { mockContentLibraryStats } from "@/features/treatments/libraries/data/stats.mock";
import { createMockId, currentDateStamp } from "@/features/treatments/common/data/factories";

// Keys for localStorage
const KEYS = {
  TREATMENT_TYPES: "welliemd_mock_treatment_types",
  PROGRAMS: "welliemd_mock_programs",
  SECTIONS: "welliemd_mock_sections",
  CONSENTS: "welliemd_mock_consents",
  CUSTOM_PROGRAMS: "welliemd_mock_custom_programs",
  PROGRAM_QUESTIONS: "welliemd_mock_program_questions",
  SECTION_FIELDS: "welliemd_mock_section_fields",
};

const SEED_VERSION_KEY = "welliemd_mock_data_version_v12";

const defaultSectionFields: Record<string, CommonSectionField[]> = {
  "sec-medical-baseline": [
    {
      id: "medical-conditions",
      sectionId: "sec-medical-baseline",
      order: 1,
      label: "Please identify all your current medical conditions",
      kind: "multiple_choice",
      required: true,
    },
    {
      id: "current-medications",
      sectionId: "sec-medical-baseline",
      order: 2,
      label: "Please list all your current medications including dosages",
      kind: "text",
      required: true,
    },
    {
      id: "known-allergies",
      sectionId: "sec-medical-baseline",
      order: 3,
      label: "Please list all of your known allergies",
      kind: "multiple_choice",
      required: true,
    },
    {
      id: "past-surgeries",
      sectionId: "sec-medical-baseline",
      order: 4,
      label: "Past surgeries",
      kind: "text",
      required: false,
    },
    {
      id: "family-medical-history",
      sectionId: "sec-medical-baseline",
      order: 5,
      label: "Family medical history",
      kind: "text",
      required: false,
    },
  ],
  "sec-body-stats": [
    {
      id: "highest-weight",
      sectionId: "sec-body-stats",
      order: 1,
      label: "What was the highest weight that you have reached?",
      kind: "text",
      required: true,
    },
  ],
};

const checkAndSeedMockData = () => {
  const seeded = localStorage.getItem(SEED_VERSION_KEY);
  if (!seeded) {
    localStorage.removeItem(KEYS.CUSTOM_PROGRAMS);
    localStorage.removeItem(KEYS.PROGRAMS);
    localStorage.removeItem(KEYS.TREATMENT_TYPES);
    localStorage.removeItem(KEYS.SECTIONS);
    localStorage.removeItem(KEYS.CONSENTS);
    localStorage.removeItem(KEYS.PROGRAM_QUESTIONS);
    localStorage.removeItem(KEYS.SECTION_FIELDS);

    localStorage.setItem(KEYS.CUSTOM_PROGRAMS, JSON.stringify(mockCustomPrograms));
    localStorage.setItem(KEYS.PROGRAMS, JSON.stringify(mockPrograms));
    localStorage.setItem(KEYS.TREATMENT_TYPES, JSON.stringify(mockTreatmentTypes));
    localStorage.setItem(KEYS.SECTIONS, JSON.stringify(mockSections));
    localStorage.setItem(KEYS.CONSENTS, JSON.stringify(mockConsents));

    const initialQuestions: Record<string, ProgramQuestion[]> = {
      "program-glp-intake": mockProgramQuestions,
      "program-compounded-glp-intake": mockProgramQuestions,
      "program-branded-glp-intake": mockProgramQuestions,
      "program-glp-microdose": mockProgramQuestions,
      "program-ed-intake": mockProgramQuestions.slice(0, 2),
      "program-trt-intake": mockProgramQuestions.slice(0, 3),
      "sec-medical-baseline": [
        {
          id: "medical-conditions",
          order: 1,
          text: "Please identify all your current medical conditions",
          kind: "multiple_choice",
          section: "Medical Baseline",
          required: true,
          choices: ["Hypertension", "Diabetes", "Asthma", "None"]
        },
        {
          id: "current-medications",
          order: 2,
          text: "Please list all your current medications including dosages",
          kind: "text",
          section: "Medical Baseline",
          required: true,
        },
        {
          id: "known-allergies",
          order: 3,
          text: "Please list all of your known allergies",
          kind: "multiple_choice",
          section: "Medical Baseline",
          required: true,
          choices: ["Penicillin", "Peanuts", "None"]
        },
        {
          id: "past-surgeries",
          order: 4,
          text: "Past surgeries",
          kind: "text",
          section: "Medical Baseline",
          required: false,
        },
        {
          id: "family-medical-history",
          order: 5,
          text: "Family medical history",
          kind: "text",
          section: "Medical Baseline",
          required: false,
        },
      ],
      "sec-body-stats": [
        {
          id: "highest-weight",
          order: 1,
          text: "What was the highest weight that you have reached?",
          kind: "text",
          section: "Body Stats",
          required: true,
        },
      ]
    };
    localStorage.setItem(KEYS.PROGRAM_QUESTIONS, JSON.stringify(initialQuestions));

    const initialSectionFields: Record<string, CommonSectionField[]> = {
      "sec-medical-baseline": initialQuestions["sec-medical-baseline"].map((q) => ({
        id: q.id,
        sectionId: "sec-medical-baseline",
        order: q.order,
        label: q.text,
        kind: q.kind,
        required: q.required,
      })),
      "sec-body-stats": initialQuestions["sec-body-stats"].map((q) => ({
        id: q.id,
        sectionId: "sec-body-stats",
        order: q.order,
        label: q.text,
        kind: q.kind,
        required: q.required,
      }))
    };
    localStorage.setItem(KEYS.SECTION_FIELDS, JSON.stringify(initialSectionFields));

    localStorage.setItem(SEED_VERSION_KEY, "true");
  }
};

if (typeof window !== "undefined") {
  checkAndSeedMockData();
}

// Initializers
const getStored = <T>(key: string, defaults: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(data);
};

const setStored = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Seed/Load data
const getTreatmentTypes = () => getStored(KEYS.TREATMENT_TYPES, mockTreatmentTypes);
const getPrograms = () => getStored(KEYS.PROGRAMS, mockPrograms);
const getSections = () => getStored(KEYS.SECTIONS, mockSections);
const getConsents = () => getStored(KEYS.CONSENTS, mockConsents);
const getCustomPrograms = () => {
  const stored = getStored<CustomProgram[]>(KEYS.CUSTOM_PROGRAMS, mockCustomPrograms);
  if (stored.length < mockCustomPrograms.length) {
    const merged = [...stored];
    mockCustomPrograms.forEach(def => {
      if (!merged.some(p => p.id === def.id)) {
        merged.push(def);
      }
    });
    setStored(KEYS.CUSTOM_PROGRAMS, merged);
    return merged;
  }
  return stored;
};

const getInitialSectionFields = (): Record<string, CommonSectionField[]> => defaultSectionFields;
const getProgramQuestions = (programId: string) => {
  const allQuestions = getStored<Record<string, ProgramQuestion[]>>(KEYS.PROGRAM_QUESTIONS, {
    "program-glp-intake": mockProgramQuestions,
    "program-compounded-glp-intake": mockProgramQuestions,
    "program-branded-glp-intake": mockProgramQuestions,
    "program-glp-microdose": mockProgramQuestions,
    "program-ed-intake": mockProgramQuestions.slice(0, 2),
    "program-trt-intake": mockProgramQuestions.slice(0, 3),
    "sec-medical-baseline": [
      {
        id: "medical-conditions",
        order: 1,
        text: "Please identify all your current medical conditions",
        kind: "multiple_choice",
        section: "Medical Baseline",
        required: true,
        choices: ["Hypertension", "Diabetes", "Asthma", "None"]
      },
      {
        id: "current-medications",
        order: 2,
        text: "Please list all your current medications including dosages",
        kind: "text",
        section: "Medical Baseline",
        required: true,
      },
      {
        id: "known-allergies",
        order: 3,
        text: "Please list all of your known allergies",
        kind: "multiple_choice",
        section: "Medical Baseline",
        required: true,
        choices: ["Penicillin", "Peanuts", "None"]
      },
      {
        id: "past-surgeries",
        order: 4,
        text: "Past surgeries",
        kind: "text",
        section: "Medical Baseline",
        required: false,
      },
      {
        id: "family-medical-history",
        order: 5,
        text: "Family medical history",
        kind: "text",
        section: "Medical Baseline",
        required: false,
      },
    ],
    "sec-body-stats": [
      {
        id: "highest-weight",
        order: 1,
        text: "What was the highest weight that you have reached?",
        kind: "text",
        section: "Body Stats",
        required: true,
      },
    ]
  });
  return allQuestions[programId] || [];
};

const setProgramQuestions = (programId: string, questions: ProgramQuestion[]) => {
  const allQuestions = getStored<Record<string, ProgramQuestion[]>>(KEYS.PROGRAM_QUESTIONS, {
    "program-glp-intake": mockProgramQuestions,
    "program-compounded-glp-intake": mockProgramQuestions,
    "program-branded-glp-intake": mockProgramQuestions,
    "program-glp-microdose": mockProgramQuestions,
    "program-ed-intake": mockProgramQuestions.slice(0, 2),
    "program-trt-intake": mockProgramQuestions.slice(0, 3),
    "sec-medical-baseline": [
      {
        id: "medical-conditions",
        order: 1,
        text: "Please identify all your current medical conditions",
        kind: "multiple_choice",
        section: "Medical Baseline",
        required: true,
        choices: ["Hypertension", "Diabetes", "Asthma", "None"]
      },
      {
        id: "current-medications",
        order: 2,
        text: "Please list all your current medications including dosages",
        kind: "text",
        section: "Medical Baseline",
        required: true,
      },
      {
        id: "known-allergies",
        order: 3,
        text: "Please list all of your known allergies",
        kind: "multiple_choice",
        section: "Medical Baseline",
        required: true,
        choices: ["Penicillin", "Peanuts", "None"]
      },
      {
        id: "past-surgeries",
        order: 4,
        text: "Past surgeries",
        kind: "text",
        section: "Medical Baseline",
        required: false,
      },
      {
        id: "family-medical-history",
        order: 5,
        text: "Family medical history",
        kind: "text",
        section: "Medical Baseline",
        required: false,
      },
    ],
    "sec-body-stats": [
      {
        id: "highest-weight",
        order: 1,
        text: "What was the highest weight that you have reached?",
        kind: "text",
        section: "Body Stats",
        required: true,
      },
    ]
  });
  allQuestions[programId] = questions;
  setStored(KEYS.PROGRAM_QUESTIONS, allQuestions);
};

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value ?? null));

const getSectionFields = (sectionId: string) => {
  const allFields = getStored<Record<string, CommonSectionField[]>>(
    KEYS.SECTION_FIELDS,
    getInitialSectionFields()
  );
  return allFields[sectionId] || [];
};

const setSectionFields = (sectionId: string, fields: CommonSectionField[]) => {
  const allFields = getStored<Record<string, CommonSectionField[]>>(
    KEYS.SECTION_FIELDS,
    getInitialSectionFields()
  );
  allFields[sectionId] = fields;
  setStored(KEYS.SECTION_FIELDS, allFields);
};


const resolveMock = async <T>(value: T): Promise<T> => Promise.resolve(value);

type TreatmentTypeApiRecord = {
  id: string;
  key: string;
  name: string;
  slug: string;
  description: string;
  intake_visit_type: string;
  followup_visit_type?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type SectionApiRecord = {
  id: string;
  name: string;
  scope: CommonSection["scope"];
  visit_type_keys: string[];
  field_count: number;
  created_at?: string;
  updated_at?: string;
};

type SectionFieldApiRecord = {
  id: string;
  section: string;
  order: number;
  label: string;
  kind: CommonSectionField["kind"];
  required: boolean;
  mapped_field?: string;
  created_at?: string;
  updated_at?: string;
};

type ConsentApiRecord = {
  id: string;
  name: string;
  scope: ConsentForm["scope"];
  visit_type_keys: string[];
  text?: string;
  options?: ConsentForm["options"];
  version: number;
  created_at?: string;
  updated_at?: string;
};

type CustomProgramApiRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: CustomProgram["status"];
  audience: CustomProgram["audience"];
  min_age: number;
  max_age?: number | null;
  included_program_ids: string[];
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
  created_at?: string;
  updated_at?: string;
};

type ProgramApiRecord = {
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
  sex_requirement?: Program["sexRequirement"];
  min_age?: number | null;
  max_age?: number | null;
  min_bmi?: number | null;
  max_bmi?: number | null;
  publish_version?: number;
  created_at?: string;
  updated_at?: string;
};

type ProgramQuestionApiRecord = Partial<ProgramQuestion> & {
  question_text?: string;
  text?: string;
  question_type?: ProgramQuestion["kind"];
  kind?: ProgramQuestion["kind"];
  order_index?: number;
  order?: number;
  is_required?: boolean;
  required?: boolean;
  answer_choices?: string[];
  choices?: string[];
  conditional_logic?: unknown;
  visibilityRules?: unknown;
  visibility_rules?: unknown;
  visibilityRuleGroup?: unknown;
  include_in_qa_section?: boolean;
  includeInQa?: boolean;
};

const slugifyTreatmentValue = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const isPersistedUuid = (value?: string | null): boolean =>
  Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));

const isVisibilityRuleGroup = (value: unknown): value is NonNullable<ProgramQuestion["visibilityRuleGroup"]> => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { mode?: unknown; rules?: unknown };
  return (candidate.mode === "simple" || candidate.mode === "nested") && Array.isArray(candidate.rules);
};

const normalizeVisibilityRuleGroup = (record: ProgramQuestionApiRecord): ProgramQuestion["visibilityRuleGroup"] | undefined => {
  const raw =
    record.visibilityRuleGroup ||
    record.visibilityRules ||
    record.visibility_rules ||
    record.conditional_logic;
  if (isVisibilityRuleGroup(raw)) {
    return {
      mode: raw.mode,
      rules: raw.rules || [],
      subgroups: raw.subgroups || [],
    };
  }
  return undefined;
};

const mapProgramQuestionFromApi = (record: ProgramQuestionApiRecord, index = 0): ProgramQuestion => ({
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
  visibilityRuleGroup: normalizeVisibilityRuleGroup(record),
  includeInQa: record.includeInQa ?? record.include_in_qa_section ?? true,
  hiddenFromPatient: record.hiddenFromPatient ?? false,
  prefillFromPrevious: record.prefillFromPrevious ?? false,
});

const mapProgramQuestionToApi = (question: ProgramQuestion): ProgramQuestionApiRecord => ({
  id: question.id,
  order: question.order,
  order_index: question.order,
  text: question.text,
  question_text: question.text,
  kind: question.kind,
  question_type: question.kind,
  required: question.required,
  is_required: question.required,
  choices: question.choices || [],
  answer_choices: question.choices || [],
  visibilityRuleGroup: question.visibilityRuleGroup,
  visibilityRules: question.visibilityRuleGroup,
  visibility_rules: question.visibilityRuleGroup,
  includeInQa: question.includeInQa,
  include_in_qa_section: question.includeInQa,
  hiddenFromPatient: question.hiddenFromPatient,
  prefillFromPrevious: question.prefillFromPrevious,
  section: question.section,
  dqChoices: question.dqChoices,
  consentText: question.consentText,
  checkoutProductIds: question.checkoutProductIds,
  checkoutProducts: question.checkoutProducts,
});

const mapTreatmentTypeFromApi = (record: TreatmentTypeApiRecord): TreatmentType => ({
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

const mapTreatmentTypeToApi = (type: TreatmentType): Omit<TreatmentTypeApiRecord, "id" | "created_at" | "updated_at"> => {
  const normalizedKey = slugifyTreatmentValue(type.key || type.intakeVisitType || type.name);
  return {
    key: normalizedKey,
    name: type.name.trim(),
    slug: slugifyTreatmentValue(type.key || type.intakeVisitType || type.name),
    description: type.description || "",
    intake_visit_type: type.intakeVisitType.trim(),
    followup_visit_type: type.followupVisitType?.trim() || "",
    is_active: type.isActive,
  };
};

const mapSectionFromApi = (record: SectionApiRecord): CommonSection => ({
  id: record.id,
  name: record.name,
  scope: record.scope,
  visitTypeKeys: record.visit_type_keys || [],
  fieldCount: record.field_count || 0,
  updatedAt: record.updated_at?.split("T")[0] || currentDateStamp(),
});

const mapSectionToApi = (section: CommonSection): Omit<SectionApiRecord, "id" | "field_count" | "created_at" | "updated_at"> => ({
  name: section.name.trim(),
  scope: section.scope,
  visit_type_keys: section.visitTypeKeys || [],
});

const mapSectionFieldFromApi = (record: SectionFieldApiRecord): CommonSectionField => ({
  id: record.id,
  sectionId: record.section,
  order: record.order,
  label: record.label,
  kind: record.kind,
  required: record.required,
  mappedField: record.mapped_field || undefined,
});

const mapSectionFieldToApi = (field: CommonSectionField) => ({
  id: isPersistedUuid(field.id) ? field.id : undefined,
  order: field.order,
  label: field.label,
  kind: field.kind,
  required: field.required,
  mapped_field: field.mappedField || "",
});

const mapConsentFromApi = (record: ConsentApiRecord): ConsentForm => ({
  id: record.id,
  name: record.name,
  scope: record.scope,
  visitTypeKeys: record.visit_type_keys || [],
  text: record.text || "",
  options: record.options || [],
  updatedAt: record.updated_at?.split("T")[0] || currentDateStamp(),
});

const mapConsentToApi = (consent: ConsentForm) => ({
  name: consent.name.trim(),
  scope: consent.scope,
  visit_type_keys: consent.visitTypeKeys || [],
  text: consent.text || "",
  options: consent.options || [],
});

const mapCustomProgramFromApi = (record: CustomProgramApiRecord): CustomProgram => ({
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
  updatedAt: record.updated_at?.split("T")[0] || currentDateStamp(),
  visitType: record.visit_type ?? null,
  onboardingName: record.onboarding_name || "",
  questionCount: record.question_count || 0,
  icon: record.icon || undefined,
  iconBg: record.icon_bg || undefined,
  iconColor: record.icon_color || undefined,
  tags: record.tags || [],
  isMulti: record.is_multi ?? false,
});

const mapCustomProgramToApi = (program: CustomProgram) => ({
  name: program.name.trim(),
  slug: slugifyTreatmentValue(program.slug || program.name),
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

const mapProgramFromApi = (record: ProgramApiRecord): Program => ({
  id: record.id,
  name: record.name,
  stage: record.stage || (record.phase === "follow_up" ? "follow_up" : "intake"),
  treatmentTypeKey: record.treatment_type_key,
  visitType: record.visit_type,
  questionCount: record.question_count || 0,
  checkoutQuestionCount: record.checkout_question_count || 0,
  status: record.status,
  updatedAt: record.updated_at?.split("T")[0] || currentDateStamp(),
  slug: record.slug,
  sourceQuestionnaireTemplateId: record.source_questionnaire_template || null,
  description: record.description || "",
  authConfig: record.auth_config || {
    email: true,
    phone: false,
    identity: false,
    account: true,
  },
  screeningQuestions: (record.screening_questions || []).map(mapProgramQuestionFromApi),
  checkoutQuestions: record.checkout_questions || [],
  consentIds: record.consent_ids || [],
  sexRequirement: record.sex_requirement || "any",
  minAge: record.min_age ?? null,
  maxAge: record.max_age ?? null,
  minBmi: record.min_bmi ?? null,
  maxBmi: record.max_bmi ?? null,
});

const mapProgramToApi = (
  program: Program,
  treatmentTypes: TreatmentType[]
): Omit<
  ProgramApiRecord,
  | "id"
  | "treatment_type_key"
  | "treatment_type_name"
  | "visit_type"
  | "publish_version"
  | "created_at"
  | "updated_at"
> => {
  const treatmentType = treatmentTypes.find((item) => item.key === program.treatmentTypeKey);
  if (!treatmentType) {
    throw new Error(`Treatment type ${program.treatmentTypeKey} was not found`);
  }

  return {
    treatment_type: treatmentType.id,
    source_questionnaire_template: null,
    name: program.name.trim(),
    slug: slugifyTreatmentValue(program.slug || program.name),
    description: program.description || "",
    stage: program.stage,
    question_count: program.questionCount || 0,
    checkout_question_count: program.checkoutQuestionCount || 0,
    status: program.status,
    auth_config: program.authConfig || {
      email: true,
      phone: false,
      identity: false,
      account: true,
    },
    screening_questions: (program.screeningQuestions || []).map(mapProgramQuestionToApi),
    checkout_questions: program.checkoutQuestions || [],
    consent_ids: program.consentIds || [],
    sex_requirement: program.sexRequirement || "any",
    min_age: program.minAge ?? null,
    max_age: program.maxAge ?? null,
    min_bmi: program.minBmi ?? null,
    max_bmi: program.maxBmi ?? null,
    phase: program.stage === "follow_up" ? "follow_up" : "onboarding",
  };
};

export const treatmentsApi = {
  listStats: async (): Promise<ContentLibraryStats> => {
    const [consents, sections, customPrograms, programs] = await Promise.all([
      treatmentsApi.listConsents(),
      treatmentsApi.listSections(),
      treatmentsApi.listCustomPrograms(),
      treatmentsApi.listPrograms(),
    ]);

    return {
      consentForms: consents.length,
      commonSections: sections.length,
      programs: programs.length,
      customPrograms: customPrograms.length,
    };
  },
  listTreatmentTypes: async (): Promise<TreatmentType[]> => {
    const { data } = await axiosInstance.get<
      PaginatedResponse<TreatmentTypeApiRecord> | TreatmentTypeApiRecord[]
    >("treatments/types/");
    const records = Array.isArray(data) ? data : data.results || [];
    return records.map(mapTreatmentTypeFromApi);
  },
  listPrograms: async (): Promise<Program[]> => {
    const { data } = await axiosInstance.get<PaginatedResponse<ProgramApiRecord> | ProgramApiRecord[]>(
      "treatments/programs/"
    );
    const records = Array.isArray(data) ? data : data.results || [];
    return records.map(mapProgramFromApi);
  },
  listSections: async (): Promise<CommonSection[]> => {
    const { data } = await axiosInstance.get<PaginatedResponse<SectionApiRecord> | SectionApiRecord[]>(
      "treatments/sections/"
    );
    const records = Array.isArray(data) ? data : data.results || [];
    return records.map(mapSectionFromApi);
  },
  listConsents: async (): Promise<ConsentForm[]> => {
    const { data } = await axiosInstance.get<PaginatedResponse<ConsentApiRecord> | ConsentApiRecord[]>(
      "treatments/consents/"
    );
    const records = Array.isArray(data) ? data : data.results || [];
    return records.map(mapConsentFromApi);
  },
  listCustomPrograms: async (): Promise<CustomProgram[]> => {
    const { data } = await axiosInstance.get<
      PaginatedResponse<CustomProgramApiRecord> | CustomProgramApiRecord[]
    >("treatments/custom-programs/");
    const records = Array.isArray(data) ? data : data.results || [];
    return records.map(mapCustomProgramFromApi);
  },

  getCustomProgram: async (id: string): Promise<CustomProgram | undefined> => {
    if (!isPersistedUuid(id)) {
      return getCustomPrograms().find((program) => program.id === id);
    }
    const { data } = await axiosInstance.get<CustomProgramApiRecord>(`treatments/custom-programs/${id}/`);
    return mapCustomProgramFromApi(data);
  },

  getProgram: async (id: string): Promise<Program | undefined> => {
    if (!isPersistedUuid(id)) {
      return getPrograms().find((program) => program.id === id || program.slug === id);
    }
    const { data } = await axiosInstance.get<ProgramApiRecord>(`treatments/programs/${id}/`);
    return mapProgramFromApi(data);
  },

  listProgramQuestions: async (programId: string): Promise<ProgramQuestion[]> => {
    if (!isPersistedUuid(programId)) {
      return getProgramQuestions(programId);
    }
    const { data } = await axiosInstance.get<ProgramQuestionApiRecord[]>(`treatments/programs/${programId}/questions/`);
    return (data || []).map(mapProgramQuestionFromApi);
  },

  saveProgramQuestions: async (programId: string, questions: ProgramQuestion[]): Promise<ProgramQuestion[]> => {
    if (!isPersistedUuid(programId)) {
      setProgramQuestions(programId, questions);
      return questions;
    }
    const { data } = await axiosInstance.put<ProgramQuestionApiRecord[]>(
      `treatments/programs/${programId}/questions/`,
      { questions: questions.map(mapProgramQuestionToApi) }
    );
    return (data || []).map(mapProgramQuestionFromApi);
  },

  // Mutations
  saveCustomProgram: async (program: CustomProgram): Promise<CustomProgram> => {
    const payload = mapCustomProgramToApi(program);
    if (isPersistedUuid(program.id)) {
      const { data } = await axiosInstance.patch<CustomProgramApiRecord>(
        `treatments/custom-programs/${program.id}/`,
        payload
      );
      return mapCustomProgramFromApi(data);
    }
    const { data } = await axiosInstance.post<CustomProgramApiRecord>("treatments/custom-programs/", payload);
    return mapCustomProgramFromApi(data);
  },

  deleteCustomProgram: async (id: string): Promise<void> => {
    if (!isPersistedUuid(id)) {
      const list = getCustomPrograms().filter((p) => p.id !== id);
      setStored(KEYS.CUSTOM_PROGRAMS, list);
      return;
    }
    await axiosInstance.delete(`treatments/custom-programs/${id}/`);
  },

  saveProgram: async (program: Program): Promise<Program> => {
    const treatmentTypes = await treatmentsApi.listTreatmentTypes();
    const payload = mapProgramToApi(program, treatmentTypes);

    if (isPersistedUuid(program.id)) {
      const { data } = await axiosInstance.patch<ProgramApiRecord>(
        `treatments/programs/${program.id}/`,
        payload
      );
      return mapProgramFromApi(data);
    }

    const { data } = await axiosInstance.post<ProgramApiRecord>("treatments/programs/", payload);
    return mapProgramFromApi(data);
  },

  archiveProgram: async (id: string): Promise<Program> => {
    if (!isPersistedUuid(id)) {
      const list = getPrograms();
      const index = list.findIndex((program) => program.id === id);
      if (index < 0) {
        throw new Error(`Program ${id} was not found`);
      }
      const source = list[index];
      if (source.status === "published") {
        const activeCustomPrograms = getCustomPrograms().filter(
          (program) =>
            program.status !== "archived" &&
            (program.includedProgramIds || []).map(String).includes(String(id))
        );
        if (activeCustomPrograms.length > 0) {
          throw new Error(
            `Cannot archive published program while it is included in ${activeCustomPrograms.length} active custom program${activeCustomPrograms.length === 1 ? "" : "s"}.`
          );
        }
      }
      const archived = {
        ...source,
        status: "archived" as const,
        updatedAt: currentDateStamp(),
      };
      const updated = [...list];
      updated[index] = archived;
      setStored(KEYS.PROGRAMS, updated);
      return archived;
    }

    const { data } = await axiosInstance.post<ProgramApiRecord>(`treatments/programs/${id}/archive/`);
    return mapProgramFromApi(data);
  },

  restoreProgram: async (id: string): Promise<Program> => {
    if (!isPersistedUuid(id)) {
      const list = getPrograms();
      const index = list.findIndex((program) => program.id === id);
      if (index < 0) {
        throw new Error(`Program ${id} was not found`);
      }
      const restored = {
        ...list[index],
        status: "draft" as const,
        updatedAt: currentDateStamp(),
      };
      const updated = [...list];
      updated[index] = restored;
      setStored(KEYS.PROGRAMS, updated);
      return restored;
    }

    const { data } = await axiosInstance.post<ProgramApiRecord>(`treatments/programs/${id}/restore/`);
    return mapProgramFromApi(data);
  },

  duplicateProgram: async (id: string): Promise<Program> => {
    if (!isPersistedUuid(id)) {
      const list = getPrograms();
      const source = list.find((program) => program.id === id);
      if (!source) {
        throw new Error(`Program ${id} was not found`);
      }

      const baseName = `Copy of ${source.name}`;
      let name = baseName;
      let nameCounter = 2;
      while (list.some((program) => program.name === name)) {
        name = `${baseName} ${nameCounter}`;
        nameCounter += 1;
      }

      const baseSlug = slugifyTreatmentValue(`copy-of-${source.slug || source.name}`);
      let slug = baseSlug;
      let slugCounter = 2;
      while (list.some((program) => program.slug === slug)) {
        slug = `${baseSlug}-${slugCounter}`;
        slugCounter += 1;
      }

      const duplicate: Program = {
        ...cloneJson(source),
        id: createMockId("program"),
        name,
        slug,
        status: "draft",
        updatedAt: currentDateStamp(),
        screeningQuestions: cloneJson(source.screeningQuestions || []),
        checkoutQuestions: cloneJson(source.checkoutQuestions || []),
        consentIds: cloneJson(source.consentIds || []),
        authConfig: cloneJson(source.authConfig),
      };

      setStored(KEYS.PROGRAMS, [...list, duplicate]);
      const sourceQuestions = getProgramQuestions(source.id);
      if (sourceQuestions.length > 0) {
        setProgramQuestions(duplicate.id, cloneJson(sourceQuestions));
      }
      return duplicate;
    }

    const { data } = await axiosInstance.post<ProgramApiRecord>(`treatments/programs/${id}/duplicate/`);
    return mapProgramFromApi(data);
  },

  saveProgramQuestion: async (programId: string, question: ProgramQuestion): Promise<ProgramQuestion> => {
    const list = await treatmentsApi.listProgramQuestions(programId);
    const index = list.findIndex((q) => q.id === question.id);
    const nextQuestion = {
      ...question,
      order: question.order || (index >= 0 ? list[index].order : list.length + 1),
    };
    const updated = [...list];
    if (index >= 0) {
      updated[index] = nextQuestion;
    } else {
      updated.push(nextQuestion);
    }
    const saved = await treatmentsApi.saveProgramQuestions(programId, updated);
    return saved.find((item) => item.id === nextQuestion.id) || nextQuestion;
  },

  deleteProgramQuestion: async (programId: string, questionId: string): Promise<void> => {
    const list = (await treatmentsApi.listProgramQuestions(programId)).filter((q) => q.id !== questionId);
    // Recalculate order
    const updated = list.map((q, idx) => ({ ...q, order: idx + 1 }));
    await treatmentsApi.saveProgramQuestions(programId, updated);
  },

  reorderProgramQuestions: async (programId: string, questionIds: string[]): Promise<void> => {
    const list = await treatmentsApi.listProgramQuestions(programId);
    const reordered = questionIds.map((id, index) => {
      const found = list.find((q) => q.id === id);
      if (!found) {
        throw new Error(`Program question ${id} was not found`);
      }
      return { ...found, order: index + 1 };
    });
    await treatmentsApi.saveProgramQuestions(programId, reordered);
  },

  listSectionFields: async (sectionId: string): Promise<CommonSectionField[]> => {
    if (!isPersistedUuid(sectionId)) {
      return getSectionFields(sectionId);
    }
    const { data } = await axiosInstance.get<SectionFieldApiRecord[]>(`treatments/sections/${sectionId}/fields/`);
    return data.map(mapSectionFieldFromApi);
  },

  saveSectionFields: async (
    sectionId: string,
    fields: CommonSectionField[]
  ): Promise<CommonSectionField[]> => {
    if (!isPersistedUuid(sectionId)) {
      setSectionFields(sectionId, fields);
      return fields;
    }
    const payload = {
      fields: fields.map(mapSectionFieldToApi),
    };
    const { data } = await axiosInstance.put<SectionFieldApiRecord[]>(
      `treatments/sections/${sectionId}/fields/`,
      payload
    );
    return data.map(mapSectionFieldFromApi);
  },

  saveSectionField: async (
    sectionId: string,
    field: CommonSectionField
  ): Promise<CommonSectionField> => {
    const list = await treatmentsApi.listSectionFields(sectionId);
    const index = list.findIndex((f) => f.id === field.id);
    const updated = [...list];
    if (index >= 0) {
      updated[index] = field;
    } else {
      updated.push(field);
    }
    const saved = await treatmentsApi.saveSectionFields(sectionId, updated);
    return saved.find((item) => item.order === field.order && item.label === field.label) || field;
  },

  deleteSectionField: async (sectionId: string, fieldId: string): Promise<void> => {
    const list = await treatmentsApi.listSectionFields(sectionId);
    const updated = list.filter((f) => f.id !== fieldId).map((f, idx) => ({ ...f, order: idx + 1 }));
    await treatmentsApi.saveSectionFields(sectionId, updated);
  },

  reorderSectionFields: async (sectionId: string, fieldIds: string[]): Promise<void> => {
    if (!isPersistedUuid(sectionId)) {
      const list = getSectionFields(sectionId);
      const reordered = fieldIds.map((id, index) => {
        const found = list.find((f) => f.id === id);
        if (!found) {
          throw new Error(`Section field ${id} was not found`);
        }
        return { ...found, order: index + 1 };
      });
      setSectionFields(sectionId, reordered);
      return;
    }
    await axiosInstance.post(`treatments/sections/${sectionId}/fields/reorder/`, {
      field_ids: fieldIds,
    });
  },

  saveSection: async (section: CommonSection): Promise<CommonSection> => {
    const payload = mapSectionToApi(section);
    if (isPersistedUuid(section.id)) {
      const { data } = await axiosInstance.patch<SectionApiRecord>(`treatments/sections/${section.id}/`, payload);
      return mapSectionFromApi(data);
    }
    const { data } = await axiosInstance.post<SectionApiRecord>("treatments/sections/", payload);
    return mapSectionFromApi(data);
  },

  deleteSection: async (id: string): Promise<void> => {
    await axiosInstance.delete(`treatments/sections/${id}/`);
  },

  saveConsent: async (consent: ConsentForm): Promise<ConsentForm> => {
    const payload = mapConsentToApi(consent);
    if (isPersistedUuid(consent.id)) {
      const { data } = await axiosInstance.patch<ConsentApiRecord>(`treatments/consents/${consent.id}/`, payload);
      return mapConsentFromApi(data);
    }
    const { data } = await axiosInstance.post<ConsentApiRecord>("treatments/consents/", payload);
    return mapConsentFromApi(data);
  },

  deleteConsent: async (id: string): Promise<void> => {
    await axiosInstance.delete(`treatments/consents/${id}/`);
  },

  saveTreatmentType: async (type: TreatmentType): Promise<TreatmentType> => {
    const payload = mapTreatmentTypeToApi(type);
    const hasPersistedId = Boolean(type.id && !String(type.id).startsWith("tt-"));

    if (hasPersistedId) {
      const { data } = await axiosInstance.patch<TreatmentTypeApiRecord>(
        `treatments/types/${type.id}/`,
        payload
      );
      return mapTreatmentTypeFromApi(data);
    }

    const { data } = await axiosInstance.post<TreatmentTypeApiRecord>("treatments/types/", payload);
    return mapTreatmentTypeFromApi(data);
  },

  deleteTreatmentType: async (id: string): Promise<void> => {
    await axiosInstance.delete(`treatments/types/${id}/`);
  },
};
