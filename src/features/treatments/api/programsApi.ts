import axiosInstance from "@/api/axiosInstance";
import { TREATMENT_PROGRAM_ENDPOINTS } from "@/api/endpoints";
import type {
  Program,
  ProgramLabRequirement,
  ProgramQuestion,
  ProgramStatus,
  TreatmentType,
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

export const programsApi = {
  list: async (): Promise<Program[]> => {
    const { data } = await axiosInstance.get<PaginatedResponse<ProgramRecord> | ProgramRecord[]>(
      TREATMENT_PROGRAM_ENDPOINTS.collection,
    );
    return records(data).map(programFromRecord);
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
  ): Promise<Program> => {
    if (!isPersistedUuid(programId)) throw new Error("Save the Program before editing labs.");
    const labRequirements = requirements.map((requirement, index) => ({
      panel_id: requirement.panelId,
      display_order: requirement.displayOrder || index + 1,
      is_required: requirement.isRequired,
      is_active: requirement.isActive,
      instructions: requirement.instructions || "",
    }));
    const { data } = await axiosInstance.patch<ProgramRecord>(
      TREATMENT_PROGRAM_ENDPOINTS.detail(programId),
      { lab_requirements: labRequirements },
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
};
