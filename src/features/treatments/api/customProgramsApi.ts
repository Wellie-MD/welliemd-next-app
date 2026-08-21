import axiosInstance from "@/api/axiosInstance";
import type { CustomProgram, EffectiveCustomProgramContent } from "@/features/treatments/types";
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
  getEffectiveContent: async (id: string): Promise<EffectiveCustomProgramContent> => {
    const { data } = await axiosInstance.get<Record<string, any>>(
      `treatments/custom-programs/${id}/effective-content/`,
    );
    const node = (value: Record<string, any>) => ({
      sourceId: String(value.source_id || value.id || ""),
      sourceVersion: Number(value.source_version || value.version || 1),
      name: String(value.name || value.title || "Unavailable referenced block"),
      scope: value.scope,
      sourceType: value.source_type,
      applicableProgramIds: (value.applicable_program_ids || []).map(String),
      resolvedFrom: (value.resolved_from || []).map((reason: Record<string, any>) => ({
        type: reason.type,
        key: reason.key,
        id: reason.id,
        programId: reason.program_id,
      })),
    });
    const stages = data.stages || {};
    return {
      customProgramId: String(data.custom_program_id),
      revision: String(data.revision || ""),
      systemSteps: {
        authentication: {
          count: Number(data.system_steps?.authentication?.count || 1),
          locked: data.system_steps?.authentication?.locked !== false,
        },
      },
      stages: {
        stage1: {
          questions: (stages.stage_1?.questions || []).map((question: Record<string, any>) => ({
            id: String(question.id),
            sourceId: String(question.source_id || question.id),
            title: question.title,
            displayOrder: Number(question.display_order || 0),
          })),
          sections: (stages.stage_1?.sections || []).map(node),
        },
        stage2: {
          programs: (stages.stage_2?.programs || []).map((program: Record<string, any>) => ({
            inclusionId: String(program.inclusion_id),
            programId: String(program.program_id),
            name: String(program.name),
            displayOrder: Number(program.display_order),
            matchingEnabled: program.matching_enabled !== false,
            matchingRule: program.matching_rule || {},
            matchingState: program.matching_state,
            effectiveConsentCount: Number(program.effective_consent_count || 0),
            effectiveSectionCount: Number(program.effective_section_count || 0),
            checkoutCount: Number(program.checkout_count || 0),
          })),
        },
        stage3: { consents: (stages.stage_3?.consents || []).map(node) },
        stage4: {
          checkout: {
            count: Number(stages.stage_4?.checkout?.count || 1),
            locked: stages.stage_4?.checkout?.locked !== false,
          },
        },
      },
      blockers: data.blockers || [],
    };
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
    try {
      const { data } = await axiosInstance.post<CustomProgramValidationRecord>(
        `treatments/custom-programs/${id}/builder/validate/`,
      );
      return data;
    } catch (error) {
      // The API deliberately uses 409 when a draft has configuration
      // dependencies. Keep the structured response so the builder can render
      // the actionable blockers instead of treating it as an opaque query
      // failure and hiding the diagnostics.
      const response = (error as {
        response?: { status?: number; data?: unknown };
      })?.response;
      if (response?.status === 409 && response.data && typeof response.data === "object") {
        return response.data as CustomProgramValidationRecord;
      }
      throw error;
    }
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
