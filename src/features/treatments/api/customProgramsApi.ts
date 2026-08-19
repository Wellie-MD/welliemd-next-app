import axiosInstance from "@/api/axiosInstance";
import type { CustomProgram } from "@/features/treatments/types";
import type {
  CustomProgramRecord,
  CustomProgramValidationRecord,
  PaginatedResponse,
} from "./contracts";
import { customProgramFromRecord, customProgramToRecord, isPersistedUuid } from "./mappers";
export {
  customProgramMutationErrorMessage,
  isCustomProgramRevisionConflict,
} from "./customProgramErrors";

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
    const payload = customProgramToRecord(program) as Record<string, unknown>;
    if (isPersistedUuid(program.id) && program.updatedAt) {
      payload.expected_updated_at = program.updatedAt;
    }
    const { data } = isPersistedUuid(program.id)
      ? await axiosInstance.patch<CustomProgramRecord>(`treatments/custom-programs/${program.id}/`, payload)
      : await axiosInstance.post<CustomProgramRecord>("treatments/custom-programs/", payload);
    return customProgramFromRecord(data);
  },
  validate: async (id: string): Promise<CustomProgramValidationRecord> => {
    const { data } = await axiosInstance.post<CustomProgramValidationRecord>(
      `treatments/custom-programs/${id}/builder/validate/`,
    );
    return data;
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
