import axiosInstance from "@/api/axiosInstance";
import type {
  CustomProgram,
  CustomProgramBuilderQuestionInput,
  CustomProgramBuilderStageItem,
  Program,
  ProgramQuestion,
  ProgramStatus,
  TreatmentLibraryScope,
} from "@/features/treatments/types";
import { normalizeTreatmentSlug } from "@/features/treatments/common/utils/slug";
import {
  formatSharedQuestionSubtitle,
  getSharedQuestionOptionCount,
  normalizeSharedQuestionDraft,
} from "@/features/treatments/common/utils/sharedQuestionDraft";
import {
  mapCustomProgramFromApi,
  mapCustomProgramToPatchPayload,
  type CustomProgramApiRecord,
  type CustomProgramPatch,
  type MappedCustomProgram,
} from "./customProgramFlowMapper";

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
  service_states?: string[];
  publish_version?: number;
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

const fetchAllRecords = async <T>(endpoint: string): Promise<T[]> => {
  const records: T[] = [];
  let nextUrl: string | null = `${endpoint}${endpoint.includes("?") ? "&" : "?"}page_size=100`;
  let pageCount = 0;

  while (nextUrl && pageCount < 100) {
    const { data } = await axiosInstance.get<PaginatedResponse<T> | T[]>(nextUrl);
    if (Array.isArray(data)) return [...records, ...data];
    records.push(...(data.results || []));
    nextUrl = data.next || null;
    pageCount += 1;
  }

  return records;
};

const createClientQuestionId = () => `custom-q-${Date.now()}`;

const mapProgramFromApi = (record: ProgramApiRecord): Program => ({
  id: record.id,
  name: record.name,
  stage: record.stage || (record.phase === "follow_up" ? "follow_up" : "intake"),
  treatmentTypeKey: record.treatment_type_key,
  treatmentTypeName: record.treatment_type_name,
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
  serviceStates: record.service_states || [],
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
  ...(program.serviceStates !== undefined ? { service_states: program.serviceStates } : {}),
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
  payload: CustomProgramPatch
): Promise<CustomProgram | undefined> => {
  const { data } = await axiosInstance.patch<CustomProgramApiRecord>(
    `treatments/custom-programs/${customProgramId}/`,
    mapCustomProgramToPatchPayload(payload)
  );
  return mapCustomProgramFromApi(data);
};

export const treatmentsApi = {
  listPrograms: async (): Promise<Program[]> => {
    const records = await fetchAllRecords<ProgramApiRecord>("treatments/programs/");
    return records.map(mapProgramFromApi);
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
    const records = await fetchAllRecords<SectionApiRecord>("treatments/sections/");
    return records.map(mapSectionFromApi);
  },

  listConsents: async (): Promise<ClientTreatmentConsent[]> => {
    const records = await fetchAllRecords<ConsentApiRecord>("treatments/consents/");
    return records.map(mapConsentFromApi);
  },

  listCustomPrograms: async (): Promise<CustomProgram[]> => {
    const records = await fetchAllRecords<CustomProgramApiRecord>("treatments/custom-programs/");
    return records.map(mapCustomProgramFromApi);
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
    const mappedProgram = program as MappedCustomProgram;
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
      __apiFlowItems: mappedProgram.__apiFlowItems,
    });
  },

  deleteCustomProgramBuilderQuestion: async (
    customProgramId: string,
    questionId: string
  ): Promise<CustomProgram | undefined> => {
    const program = await treatmentsApi.getCustomProgram(customProgramId);
    if (!program) return undefined;

    const mappedProgram = program as MappedCustomProgram;
    const nextBuilderQuestions = (program.builderQuestions || []).filter((question) => {
      if (question.id !== questionId) return true;
      return question.source !== "client" || question.locked;
    });

    return patchCustomProgram(customProgramId, {
      flowItems: program.flowItems,
      builderQuestions: nextBuilderQuestions,
      questionCount: nextBuilderQuestions.length,
      __apiFlowItems: mappedProgram.__apiFlowItems,
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
    const mappedProgram = program as MappedCustomProgram;
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
      __apiFlowItems: mappedProgram.__apiFlowItems,
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

  updateProgramGroupStatus: async (programIds: string[], status: ProgramStatus): Promise<Program[]> => {
    const { data } = await axiosInstance.patch<ProgramApiRecord[]>(
      "treatments/programs/bulk-live/",
      {
        program_ids: programIds,
        is_published: status === "published",
      }
    );
    return (data || []).map(mapProgramFromApi);
  },

  saveProgramQuestions: async (programId: string, questions: ProgramQuestion[]): Promise<ProgramQuestion[]> => {
    const { data } = await axiosInstance.put<ProgramQuestion[]>(
      `treatments/programs/${programId}/questions/`,
      {
        questions: questions.map((question, index) => ({
          ...question,
          question_text: question.text,
          question_type: question.kind,
          answer_choices: question.choices ?? [],
          is_required: question.required,
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
