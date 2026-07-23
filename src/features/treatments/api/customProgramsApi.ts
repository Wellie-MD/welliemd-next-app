import axiosInstance from "@/api/axiosInstance";
import type { CustomProgram } from "@/features/treatments/types";
import type { CustomProgramRecord, PaginatedResponse } from "./contracts";
import { customProgramFromRecord, customProgramToRecord, isPersistedUuid } from "./mappers";

const records = <T>(data: PaginatedResponse<T> | T[]): T[] => Array.isArray(data) ? data : data.results || [];

export const customProgramsApi = {
  list: async (): Promise<CustomProgram[]> => {
    const { data } = await axiosInstance.get<PaginatedResponse<CustomProgramRecord> | CustomProgramRecord[]>(
      "treatments/custom-programs/",
    );
    return records(data).map(customProgramFromRecord);
  },
  get: async (id: string): Promise<CustomProgram | null> => {
    if (!isPersistedUuid(id)) return null;
    const { data } = await axiosInstance.get<CustomProgramRecord>(`treatments/custom-programs/${id}/`);
    return customProgramFromRecord(data);
  },
  save: async (program: CustomProgram): Promise<CustomProgram> => {
    const payload = customProgramToRecord(program);
    const { data } = isPersistedUuid(program.id)
      ? await axiosInstance.patch<CustomProgramRecord>(`treatments/custom-programs/${program.id}/`, payload)
      : await axiosInstance.post<CustomProgramRecord>("treatments/custom-programs/", payload);
    return customProgramFromRecord(data);
  },
  publish: async (id: string): Promise<void> => {
    if (!isPersistedUuid(id)) return;
    await axiosInstance.post(`treatments/custom-programs/${id}/publish/`);
  },
  delete: async (id: string): Promise<void> => {
    if (!isPersistedUuid(id)) return;
    await axiosInstance.delete(`treatments/custom-programs/${id}/`);
  },
};
