import axiosInstance from "@/api/axiosInstance";
import { TREATMENT_PROGRAM_ENDPOINTS } from "@/api/endpoints";
import type {
  Program,
  ProgramLabRequirement,
  ProgramQuestion,
  ProgramStatus,
  TreatmentType,
  QuestionKind,
  VisibilityRuleGroup,
} from "@/features/treatments/types";
import type { PaginatedResponse, ProgramQuestionRecord, ProgramRecord } from "./contracts";
import {
  isPersistedUuid,
  programFromRecord,
  programToRecord,
  questionFromRecord,
  questionToRecord,
  slugify,
} from "./mappers";

const records = <T>(data: PaginatedResponse<T> | T[]): T[] => Array.isArray(data) ? data : data.results || [];

export type ProgramSaveInput = Partial<Program> & Pick<Program, "id">;

export interface EffectiveSectionItem {
  id: string;
  source_id?: string;
  source_version?: number;
  source_type: "global" | "visit_type" | "program" | "custom_program";
  scope: "common" | "program";
  section_scope?: "global" | "visit_type";
  name: string;
  version?: number;
  fields: Array<{
    id?: string;
    source_id?: string;
    source_field_id?: string;
    label: string;
    kind: QuestionKind | string;
    required?: boolean;
    order?: number;
    mapped_field?: string;
    configuration?: Record<string, unknown>;
    section_origin?: { source_id: string; name: string; version: number };
  }>;
}

export interface ProgramEffectiveContent {
  visit_type: string;
  consents: {
    inherited_global: any[];
    inherited_visit_type: any[];
    explicit_program: any[];
    inline_conditional: any[];
  };
  sections: {
    inherited_global: EffectiveSectionItem[];
    inherited_visit_type: EffectiveSectionItem[];
    explicit_program: EffectiveSectionItem[];
  };
  blockers: Array<{
    code: string;
    message: string;
    corrective_action?: { code: string; route: string };
  }>;
}

export const programsApi = {
  list: async (): Promise<Program[]> => {
    const { data } = await axiosInstance.get<PaginatedResponse<ProgramRecord> | ProgramRecord[]>(
      TREATMENT_PROGRAM_ENDPOINTS.collection,
      { params: { page_size: 100 } },
    );
    if (Array.isArray(data)) return data.map(programFromRecord);

    const allRecords = [...records(data)];
    let next = data.next;
    let pageGuard = 0;
    while (next && pageGuard < 100) {
      const response = await axiosInstance.get<PaginatedResponse<ProgramRecord>>(next);
      allRecords.push(...records(response.data));
      next = response.data.next;
      pageGuard += 1;
    }
    return allRecords.map(programFromRecord);
  },

  get: async (id: string): Promise<Program | undefined> => {
    if (!isPersistedUuid(id)) return undefined;
    const { data } = await axiosInstance.get<ProgramRecord>(TREATMENT_PROGRAM_ENDPOINTS.detail(id));
    return programFromRecord(data);
  },

  save: async (program: ProgramSaveInput, treatmentTypes: TreatmentType[]): Promise<Program> => {
    const payload = programToRecord(program, treatmentTypes);
    const { data } = isPersistedUuid(program.id)
      ? await axiosInstance.patch<ProgramRecord>(TREATMENT_PROGRAM_ENDPOINTS.detail(program.id), payload)
      : await axiosInstance.post<ProgramRecord>(TREATMENT_PROGRAM_ENDPOINTS.collection, payload);
    return programFromRecord(data);
  },

  saveLabRequirements: async (
    programId: string,
    requirements: ProgramLabRequirement[],
    labCheckoutVisibilityRule?: VisibilityRuleGroup,
  ): Promise<Program> => {
    if (!isPersistedUuid(programId)) throw new Error("Save the Program before editing labs.");
    const labRequirements = requirements.map((requirement, index) => ({
      panel_id: requirement.panelId,
      display_order: requirement.displayOrder || index + 1,
      is_required: requirement.isRequired,
      is_active: requirement.isActive,
      instructions: requirement.instructions || "",
    }));
    const payload: Record<string, unknown> = { lab_requirements: labRequirements };
    if (labCheckoutVisibilityRule !== undefined) {
      payload.lab_checkout_visibility_rule = labCheckoutVisibilityRule || {};
    }
    const { data } = await axiosInstance.patch<ProgramRecord>(
      TREATMENT_PROGRAM_ENDPOINTS.detail(programId),
      payload,
    );
    return programFromRecord(data);
  },

  updateSlug: async (id: string, slug: string): Promise<Program> => {
    if (!isPersistedUuid(id)) throw new Error("Save the Program before updating its slug.");
    const { data } = await axiosInstance.patch<ProgramRecord>(
      TREATMENT_PROGRAM_ENDPOINTS.slug(id),
      { slug: slugify(slug) },
    );
    return programFromRecord(data);
  },

  updateStatus: async (id: string, status: ProgramStatus): Promise<Program> => {
    if (!isPersistedUuid(id)) throw new Error("Save the Program before publishing it.");
    const { data } = await axiosInstance.patch<ProgramRecord>(
      TREATMENT_PROGRAM_ENDPOINTS.live(id),
      { is_published: status === "published" },
    );
    return programFromRecord(data);
  },

  archive: async (id: string): Promise<Program> => {
    const { data } = await axiosInstance.post<ProgramRecord>(TREATMENT_PROGRAM_ENDPOINTS.archive(id));
    return programFromRecord(data);
  },

  restore: async (id: string): Promise<Program> => {
    const { data } = await axiosInstance.post<ProgramRecord>(TREATMENT_PROGRAM_ENDPOINTS.restore(id));
    return programFromRecord(data);
  },

  duplicate: async (id: string): Promise<Program> => {
    const { data } = await axiosInstance.post<ProgramRecord>(TREATMENT_PROGRAM_ENDPOINTS.duplicate(id));
    return programFromRecord(data);
  },

  listQuestions: async (programId: string): Promise<ProgramQuestion[]> => {
    if (!isPersistedUuid(programId)) return [];
    const { data } = await axiosInstance.get<ProgramQuestionRecord[]>(
      TREATMENT_PROGRAM_ENDPOINTS.questions(programId),
    );
    return (data || []).map(questionFromRecord);
  },

  saveQuestions: async (programId: string, questions: ProgramQuestion[]): Promise<ProgramQuestion[]> => {
    if (!isPersistedUuid(programId)) throw new Error("Save the Program before editing questions.");
    const { data } = await axiosInstance.put<ProgramQuestionRecord[]>(
      TREATMENT_PROGRAM_ENDPOINTS.questions(programId),
      { questions: questions.map(questionToRecord) },
    );
    return (data || []).map(questionFromRecord);
  },

  getEffectiveContent: async (programId: string, stage?: string): Promise<ProgramEffectiveContent | undefined> => {
    if (!isPersistedUuid(programId)) return undefined;
    const { data } = await axiosInstance.get(
      TREATMENT_PROGRAM_ENDPOINTS.effectiveContent(programId),
      { params: stage ? { stage } : undefined },
    );
    return data;
  },
};
