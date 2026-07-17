import axiosInstance from "@/api/axiosInstance";
import type { Program, ProgramQuestion, ProgramStatus, TreatmentType } from "@/features/treatments/types";
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

export const programsApi = {
  list: async (): Promise<Program[]> => {
    const { data } = await axiosInstance.get<PaginatedResponse<ProgramRecord> | ProgramRecord[]>(
      "treatments/programs/",
    );
    return records(data).map(programFromRecord);
  },

  get: async (id: string): Promise<Program | undefined> => {
    if (!isPersistedUuid(id)) return undefined;
    const { data } = await axiosInstance.get<ProgramRecord>(`treatments/programs/${id}/`);
    return programFromRecord(data);
  },

  save: async (program: Program, treatmentTypes: TreatmentType[]): Promise<Program> => {
    const payload = programToRecord(program, treatmentTypes);
    const { data } = isPersistedUuid(program.id)
      ? await axiosInstance.patch<ProgramRecord>(`treatments/programs/${program.id}/`, payload)
      : await axiosInstance.post<ProgramRecord>("treatments/programs/", payload);
    return programFromRecord(data);
  },

  updateSlug: async (id: string, slug: string): Promise<Program> => {
    if (!isPersistedUuid(id)) throw new Error("Save the Program before updating its slug.");
    const { data } = await axiosInstance.patch<ProgramRecord>(
      `treatments/programs/${id}/slug/`,
      { slug: slugify(slug) },
    );
    return programFromRecord(data);
  },

  updateStatus: async (id: string, status: ProgramStatus): Promise<Program> => {
    if (!isPersistedUuid(id)) throw new Error("Save the Program before publishing it.");
    const { data } = await axiosInstance.patch<ProgramRecord>(
      `treatments/programs/${id}/live/`,
      { is_published: status === "published" },
    );
    return programFromRecord(data);
  },

  archive: async (id: string): Promise<Program> => {
    const { data } = await axiosInstance.post<ProgramRecord>(`treatments/programs/${id}/archive/`);
    return programFromRecord(data);
  },

  restore: async (id: string): Promise<Program> => {
    const { data } = await axiosInstance.post<ProgramRecord>(`treatments/programs/${id}/restore/`);
    return programFromRecord(data);
  },

  duplicate: async (id: string): Promise<Program> => {
    const { data } = await axiosInstance.post<ProgramRecord>(`treatments/programs/${id}/duplicate/`);
    return programFromRecord(data);
  },

  listQuestions: async (programId: string): Promise<ProgramQuestion[]> => {
    if (!isPersistedUuid(programId)) return [];
    const { data } = await axiosInstance.get<ProgramQuestionRecord[]>(
      `treatments/programs/${programId}/questions/`,
    );
    return (data || []).map(questionFromRecord);
  },

  saveQuestions: async (programId: string, questions: ProgramQuestion[]): Promise<ProgramQuestion[]> => {
    if (!isPersistedUuid(programId)) throw new Error("Save the Program before editing questions.");
    const { data } = await axiosInstance.put<ProgramQuestionRecord[]>(
      `treatments/programs/${programId}/questions/`,
      { questions: questions.map(questionToRecord) },
    );
    return (data || []).map(questionFromRecord);
  },
};
