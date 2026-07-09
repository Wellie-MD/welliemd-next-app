import axiosInstance from "@/api/axiosInstance";
import type {
  CustomProgram,
  CustomProgramBuilderQuestionInput,
  CustomProgramBuilderStageItem,
  CustomProgramFlowItem,
  Program,
  ProgramQuestion,
  ProgramStatus,
  TreatmentLibraryScope,
} from "@/features/treatments/types";
import { normalizeTreatmentSlug } from "@/features/treatments/common/utils/slug";
import { normalizeCustomProgramSlug } from "@/features/treatments/custom-programs/utils/customProgramSlug";
import {
  formatSharedQuestionSubtitle,
  getSharedQuestionOptionCount,
  normalizeSharedQuestionDraft,
} from "@/features/treatments/common/utils/sharedQuestionDraft";

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type ProgramApiRecord = {
  id: string;
  source_questionnaire_template?: string | null;
  treatment_type?: string;
  treatment_type_key: string;
  treatment_type_name?: string;
  name: string;
  slug: string;
  description?: string;
  stage?: Program["stage"];
  phase?: "onboarding" | "follow_up";
  visit_type: string;
  question_count: number;
  checkout_question_count: number;
  status: Program["status"];
  is_published?: boolean;
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
  flow_items: Array<CustomProgramFlowItem & Partial<CustomProgramBuilderStageItem>>;
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

type SectionApiRecord = {
  id: string;
  name: string;
  scope: TreatmentLibraryScope;
  visit_type_keys: string[];
  field_count: number;
  created_at?: string;
  updated_at?: string;
};

type ConsentApiRecord = {
  id: string;
  name: string;
  scope: TreatmentLibraryScope;
  visit_type_keys: string[];
  text?: string;
  options?: Array<{
    id: string;
    text: string;
    disqualifies: boolean;
  }>;
  version: number;
  created_at?: string;
  updated_at?: string;
};

export type ClientTreatmentSection = {
  id: string;
  name: string;
  scope: TreatmentLibraryScope;
  visitTypeKeys: string[];
  fieldCount: number;
  updatedAt: string;
};

export type ClientTreatmentConsent = {
  id: string;
  name: string;
  scope: TreatmentLibraryScope;
  visitTypeKeys: string[];
  text?: string;
  options?: Array<{
    id: string;
    text: string;
    disqualifies: boolean;
  }>;
  updatedAt: string;
};

const currentDateStamp = () => new Date().toISOString().split("T")[0];

const unwrapRecords = <T>(data: PaginatedResponse<T> | T[]): T[] =>
  Array.isArray(data) ? data : data.results || [];

const createClientQuestionId = () => `custom-q-${Date.now()}`;

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
  authConfig: record.auth_config || {
    email: true,
    phone: false,
    identity: false,
    account: true,
  },
  checkoutQuestions: record.checkout_questions || [],
  consentIds: record.consent_ids || [],
  sexRequirement: record.sex_requirement || "any",
  minAge: record.min_age ?? null,
  maxAge: record.max_age ?? null,
  minBmi: record.min_bmi ?? null,
  maxBmi: record.max_bmi ?? null,
});

const mapProgramToPatchPayload = (program: Partial<Program>) => ({
  ...(program.name !== undefined ? { name: program.name } : {}),
  ...(program.slug !== undefined ? { slug: normalizeTreatmentSlug(program.slug) } : {}),
  ...(program.status !== undefined
    ? { status: program.status, is_published: program.status === "published" }
    : {}),
  ...(program.authConfig !== undefined ? { auth_config: program.authConfig } : {}),
  ...(program.checkoutQuestions !== undefined ? { checkout_questions: program.checkoutQuestions } : {}),
  ...(program.consentIds !== undefined ? { consent_ids: program.consentIds } : {}),
  ...(program.sexRequirement !== undefined ? { sex_requirement: program.sexRequirement } : {}),
  ...(program.minAge !== undefined ? { min_age: program.minAge } : {}),
  ...(program.maxAge !== undefined ? { max_age: program.maxAge } : {}),
  ...(program.minBmi !== undefined ? { min_bmi: program.minBmi } : {}),
  ...(program.maxBmi !== undefined ? { max_bmi: program.maxBmi } : {}),
});

const isBuilderQuestionFlowItem = (item: CustomProgramApiRecord["flow_items"][number]) =>
  item.kind === "routing_question" || item.kind === "question";

const mapBuilderQuestionFromFlowItem = (
  item: CustomProgramApiRecord["flow_items"][number]
): CustomProgramBuilderStageItem => ({
  id: item.id,
  kind: "question",
  title: item.title,
  subtitle: item.subtitle,
  source: item.source || "client",
  locked: item.locked ?? false,
  required: item.required ?? true,
  questionKind: item.questionKind || "single_choice",
  choiceCount: item.choiceCount,
  answerOptions: item.answerOptions || [],
  treatmentTypeKey: item.treatmentTypeKey,
  sourceId: item.sourceId,
});

const mapBuilderTreatmentOptionFromFlowItem = (
  item: CustomProgramApiRecord["flow_items"][number]
): CustomProgramBuilderStageItem => ({
  id: item.id,
  kind: "program",
  title: item.title,
  subtitle: item.subtitle || "",
  source: item.source || "welliemd",
  locked: item.locked ?? true,
  required: item.required ?? true,
  treatmentTypeKey: item.treatmentTypeKey,
  sourceId: item.sourceId,
});

const mapCustomProgramFromApi = (record: CustomProgramApiRecord): CustomProgram => {
  const flowItems = record.flow_items || [];

  return {
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
    flowItems: flowItems.filter((item) => !isBuilderQuestionFlowItem(item)) as CustomProgramFlowItem[],
    updatedAt: record.updated_at?.split("T")[0] || currentDateStamp(),
    slugOverride: null,
    visitType: record.visit_type ?? null,
    onboardingName: record.onboarding_name || "",
    questionCount: record.question_count || 0,
    icon: record.icon || undefined,
    iconBg: record.icon_bg || undefined,
    iconColor: record.icon_color || undefined,
    tags: record.tags || [],
    isMulti: record.is_multi ?? false,
    builderQuestions: flowItems.filter(isBuilderQuestionFlowItem).map(mapBuilderQuestionFromFlowItem),
    builderTreatmentOptions: flowItems
      .filter((item) => item.kind === "program")
      .map(mapBuilderTreatmentOptionFromFlowItem),
  };
};

const mapBuilderQuestionToFlowItem = (
  question: CustomProgramBuilderStageItem
): CustomProgramApiRecord["flow_items"][number] => ({
  id: question.id,
  kind: "routing_question",
  title: question.title,
  subtitle: question.subtitle || "",
  locked: question.locked,
  source: question.source,
  required: question.required,
  questionKind: question.questionKind,
  choiceCount: question.choiceCount,
  answerOptions: question.answerOptions || [],
  treatmentTypeKey: question.treatmentTypeKey,
  sourceId: question.sourceId,
});

const mapCustomProgramToPatchPayload = (program: Partial<CustomProgram>) => ({
  ...(program.name !== undefined ? { name: program.name } : {}),
  ...(program.slug !== undefined ? { slug: normalizeCustomProgramSlug(program.slug) } : {}),
  ...(program.description !== undefined ? { description: program.description } : {}),
  ...(program.status !== undefined ? { status: program.status } : {}),
  ...(program.audience !== undefined ? { audience: program.audience } : {}),
  ...(program.minAge !== undefined ? { min_age: program.minAge } : {}),
  ...(program.maxAge !== undefined ? { max_age: program.maxAge ?? null } : {}),
  ...(program.includedProgramIds !== undefined ? { included_program_ids: program.includedProgramIds } : {}),
  ...(program.sectionIds !== undefined ? { section_ids: program.sectionIds } : {}),
  ...(program.consentIds !== undefined ? { consent_ids: program.consentIds } : {}),
  ...(program.checkoutOptions !== undefined ? { checkout_options: program.checkoutOptions } : {}),
  ...(program.flowItems !== undefined || program.builderQuestions !== undefined
    ? {
        flow_items: [
          ...(program.flowItems || []),
          ...(program.builderQuestions || []).map(mapBuilderQuestionToFlowItem),
        ],
      }
    : {}),
  ...(program.visitType !== undefined ? { visit_type: program.visitType ?? null } : {}),
  ...(program.onboardingName !== undefined ? { onboarding_name: program.onboardingName } : {}),
  ...(program.questionCount !== undefined ? { question_count: program.questionCount } : {}),
  ...(program.icon !== undefined ? { icon: program.icon || "" } : {}),
  ...(program.iconBg !== undefined ? { icon_bg: program.iconBg || "" } : {}),
  ...(program.iconColor !== undefined ? { icon_color: program.iconColor || "" } : {}),
  ...(program.tags !== undefined ? { tags: program.tags || [] } : {}),
  ...(program.isMulti !== undefined ? { is_multi: program.isMulti } : {}),
});

const mapSectionFromApi = (record: SectionApiRecord): ClientTreatmentSection => ({
  id: record.id,
  name: record.name,
  scope: record.scope,
  visitTypeKeys: record.visit_type_keys || [],
  fieldCount: record.field_count || 0,
  updatedAt: record.updated_at?.split("T")[0] || currentDateStamp(),
});

const mapConsentFromApi = (record: ConsentApiRecord): ClientTreatmentConsent => ({
  id: record.id,
  name: record.name,
  scope: record.scope,
  visitTypeKeys: record.visit_type_keys || [],
  text: record.text || "",
  options: record.options || [],
  updatedAt: record.updated_at?.split("T")[0] || currentDateStamp(),
});

const patchProgram = async (programId: string, payload: Partial<Program>): Promise<Program | undefined> => {
  const { data } = await axiosInstance.patch<ProgramApiRecord>(
    `treatments/programs/${programId}/`,
    mapProgramToPatchPayload(payload)
  );
  return mapProgramFromApi(data);
};

const patchCustomProgram = async (
  customProgramId: string,
  payload: Partial<CustomProgram>
): Promise<CustomProgram | undefined> => {
  const { data } = await axiosInstance.patch<CustomProgramApiRecord>(
    `treatments/custom-programs/${customProgramId}/`,
    mapCustomProgramToPatchPayload(payload)
  );
  return mapCustomProgramFromApi(data);
};

export const treatmentsApi = {
  listPrograms: async (): Promise<Program[]> => {
    const { data } = await axiosInstance.get<PaginatedResponse<ProgramApiRecord> | ProgramApiRecord[]>(
      "treatments/programs/"
    );
    return unwrapRecords(data).map(mapProgramFromApi);
  },

  getProgram: async (id: string): Promise<Program | undefined> => {
    const { data } = await axiosInstance.get<ProgramApiRecord>(`treatments/programs/${id}/`);
    return mapProgramFromApi(data);
  },

  listProgramQuestions: async (programId: string): Promise<ProgramQuestion[]> => {
    if (!programId) return [];
    const { data } = await axiosInstance.get<ProgramQuestion[]>(`treatments/programs/${programId}/questions/`);
    return data || [];
  },

  listSections: async (): Promise<ClientTreatmentSection[]> => {
    const { data } = await axiosInstance.get<PaginatedResponse<SectionApiRecord> | SectionApiRecord[]>(
      "treatments/sections/"
    );
    return unwrapRecords(data).map(mapSectionFromApi);
  },

  listConsents: async (): Promise<ClientTreatmentConsent[]> => {
    const { data } = await axiosInstance.get<PaginatedResponse<ConsentApiRecord> | ConsentApiRecord[]>(
      "treatments/consents/"
    );
    return unwrapRecords(data).map(mapConsentFromApi);
  },

  listCustomPrograms: async (): Promise<CustomProgram[]> => {
    const { data } = await axiosInstance.get<PaginatedResponse<CustomProgramApiRecord> | CustomProgramApiRecord[]>(
      "treatments/custom-programs/"
    );
    return unwrapRecords(data).map(mapCustomProgramFromApi);
  },

  getCustomProgram: async (id: string): Promise<CustomProgram | undefined> => {
    const { data } = await axiosInstance.get<CustomProgramApiRecord>(`treatments/custom-programs/${id}/`);
    return mapCustomProgramFromApi(data);
  },

  addCustomProgramBuilderQuestion: async (
    customProgramId: string,
    input: CustomProgramBuilderQuestionInput
  ): Promise<CustomProgram | undefined> => {
    const program = await treatmentsApi.getCustomProgram(customProgramId);
    if (!program) return undefined;

    const normalizedInput = normalizeSharedQuestionDraft(input);
    const optionCount = getSharedQuestionOptionCount(normalizedInput);
    const nextBuilderQuestions: CustomProgramBuilderStageItem[] = [
      ...(program.builderQuestions || []),
      {
        id: createClientQuestionId(),
        kind: "question",
        title: normalizedInput.questionText,
        subtitle: formatSharedQuestionSubtitle(normalizedInput),
        source: "client",
        locked: false,
        required: normalizedInput.required,
        questionKind: normalizedInput.questionType,
        choiceCount: optionCount,
        answerOptions: normalizedInput.answerOptions,
      },
    ];

    return patchCustomProgram(customProgramId, {
      flowItems: program.flowItems,
      builderQuestions: nextBuilderQuestions,
      questionCount: nextBuilderQuestions.length,
    });
  },

  deleteCustomProgramBuilderQuestion: async (
    customProgramId: string,
    questionId: string
  ): Promise<CustomProgram | undefined> => {
    const program = await treatmentsApi.getCustomProgram(customProgramId);
    if (!program) return undefined;

    const nextBuilderQuestions = (program.builderQuestions || []).filter((question) => {
      if (question.id !== questionId) return true;
      return question.source !== "client" || question.locked;
    });

    return patchCustomProgram(customProgramId, {
      flowItems: program.flowItems,
      builderQuestions: nextBuilderQuestions,
      questionCount: nextBuilderQuestions.length,
    });
  },

  updateCustomProgramBuilderQuestion: async (
    customProgramId: string,
    questionId: string,
    input: CustomProgramBuilderQuestionInput
  ): Promise<CustomProgram | undefined> => {
    const program = await treatmentsApi.getCustomProgram(customProgramId);
    if (!program) return undefined;

    const normalizedInput = normalizeSharedQuestionDraft(input);
    const optionCount = getSharedQuestionOptionCount(normalizedInput);
    const nextBuilderQuestions = (program.builderQuestions || []).map((question) => {
      if (question.id !== questionId || question.source !== "client" || question.locked) return question;
      return {
        ...question,
        title: normalizedInput.questionText,
        subtitle: formatSharedQuestionSubtitle(normalizedInput),
        required: normalizedInput.required,
        questionKind: normalizedInput.questionType,
        choiceCount: optionCount,
        answerOptions: normalizedInput.answerOptions,
      };
    });

    return patchCustomProgram(customProgramId, {
      flowItems: program.flowItems,
      builderQuestions: nextBuilderQuestions,
      questionCount: nextBuilderQuestions.length,
    });
  },

  updateCustomProgramSlugOverride: async (
    customProgramId: string,
    slugOverride: string
  ): Promise<CustomProgram | undefined> => {
    const normalizedSlug = normalizeCustomProgramSlug(slugOverride);
    const { data } = await axiosInstance.patch<CustomProgramApiRecord>(
      `treatments/custom-programs/${customProgramId}/slug/`,
      { slug: normalizedSlug }
    );
    return mapCustomProgramFromApi(data);
  },

  updateProgramSlug: async (programId: string, slug: string): Promise<Program | undefined> => {
    const { data } = await axiosInstance.patch<ProgramApiRecord>(
      `treatments/programs/${programId}/slug/`,
      { slug: normalizeTreatmentSlug(slug) }
    );
    return mapProgramFromApi(data);
  },

  updateProgramStatus: async (programId: string, status: ProgramStatus): Promise<Program | undefined> => {
    const { data } = await axiosInstance.patch<ProgramApiRecord>(
      `treatments/programs/${programId}/live/`,
      {
        is_published: status === "published",
      }
    );
    return mapProgramFromApi(data);
  },

  updateProgramGroupStatus: async (treatmentTypeKey: string, status: ProgramStatus): Promise<Program[]> => {
    const programs = await treatmentsApi.listPrograms();
    const matchingPrograms = programs.filter((program) => program.treatmentTypeKey === treatmentTypeKey);
    const updatedPrograms = await Promise.all(
      matchingPrograms.map((program) => treatmentsApi.updateProgramStatus(program.id, status))
    );

    return updatedPrograms.filter(Boolean) as Program[];
  },

  saveProgramQuestions: async (programId: string, questions: ProgramQuestion[]): Promise<ProgramQuestion[]> => {
    const { data } = await axiosInstance.put<ProgramQuestion[]>(
      `treatments/programs/${programId}/questions/`,
      {
        questions: questions.map((question, index) => ({
          ...question,
          order: index + 1,
        })),
      }
    );
    return data || [];
  },

  saveProgramQuestion: async (programId: string, question: ProgramQuestion): Promise<ProgramQuestion> => {
    const list = await treatmentsApi.listProgramQuestions(programId);
    const index = list.findIndex((item) => item.id === question.id);
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
    const list = await treatmentsApi.listProgramQuestions(programId);
    const updated = list
      .filter((question) => question.id !== questionId)
      .map((question, index) => ({ ...question, order: index + 1 }));

    await treatmentsApi.saveProgramQuestions(programId, updated);
  },

  reorderProgramQuestions: async (programId: string, questionIds: string[]): Promise<void> => {
    const list = await treatmentsApi.listProgramQuestions(programId);
    const reordered = questionIds.map((id, index) => {
      const found = list.find((question) => question.id === id);
      if (!found) throw new Error(`Question ${id} not found`);
      return { ...found, order: index + 1 };
    });

    await treatmentsApi.saveProgramQuestions(programId, reordered);
  },
};
