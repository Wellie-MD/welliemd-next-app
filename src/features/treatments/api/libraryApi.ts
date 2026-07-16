import axiosInstance from "@/api/axiosInstance";
import type { CommonSection, CommonSectionField, ConsentForm, TreatmentType } from "@/features/treatments/types";
import type {
  ConsentRecord,
  PaginatedResponse,
  SectionFieldRecord,
  SectionRecord,
  TreatmentTypeRecord,
} from "./contracts";
import {
  consentFromRecord,
  consentToRecord,
  isPersistedUuid,
  sectionFieldFromRecord,
  sectionFieldToRecord,
  sectionFromRecord,
  sectionToRecord,
  treatmentTypeFromRecord,
  treatmentTypeToRecord,
} from "./mappers";

const records = <T>(data: PaginatedResponse<T> | T[]): T[] => Array.isArray(data) ? data : data.results || [];

export const treatmentTypesApi = {
  list: async (): Promise<TreatmentType[]> => {
    const { data } = await axiosInstance.get<PaginatedResponse<TreatmentTypeRecord> | TreatmentTypeRecord[]>(
      "treatments/types/",
    );
    return records(data).map(treatmentTypeFromRecord);
  },
  save: async (type: TreatmentType): Promise<TreatmentType> => {
    const payload = treatmentTypeToRecord(type);
    const { data } = isPersistedUuid(type.id)
      ? await axiosInstance.patch<TreatmentTypeRecord>(`treatments/types/${type.id}/`, payload)
      : await axiosInstance.post<TreatmentTypeRecord>("treatments/types/", payload);
    return treatmentTypeFromRecord(data);
  },
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`treatments/types/${id}/`);
  },
};

export const sectionsApi = {
  list: async (): Promise<CommonSection[]> => {
    const { data } = await axiosInstance.get<PaginatedResponse<SectionRecord> | SectionRecord[]>(
      "treatments/sections/",
    );
    return records(data).map(sectionFromRecord);
  },
  save: async (section: CommonSection): Promise<CommonSection> => {
    const payload = sectionToRecord(section);
    const { data } = isPersistedUuid(section.id)
      ? await axiosInstance.patch<SectionRecord>(`treatments/sections/${section.id}/`, payload)
      : await axiosInstance.post<SectionRecord>("treatments/sections/", payload);
    return sectionFromRecord(data);
  },
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`treatments/sections/${id}/`);
  },
  listFields: async (sectionId: string): Promise<CommonSectionField[]> => {
    if (!isPersistedUuid(sectionId)) return [];
    const { data } = await axiosInstance.get<SectionFieldRecord[]>(
      `treatments/sections/${sectionId}/fields/`,
    );
    return data.map(sectionFieldFromRecord);
  },
  saveFields: async (sectionId: string, fields: CommonSectionField[]): Promise<CommonSectionField[]> => {
    if (!isPersistedUuid(sectionId)) throw new Error("Save the Section before editing fields.");
    const { data } = await axiosInstance.put<SectionFieldRecord[]>(
      `treatments/sections/${sectionId}/fields/`,
      { fields: fields.map(sectionFieldToRecord) },
    );
    return data.map(sectionFieldFromRecord);
  },
  reorderFields: async (sectionId: string, fieldIds: string[]): Promise<void> => {
    await axiosInstance.post(`treatments/sections/${sectionId}/fields/reorder/`, { field_ids: fieldIds });
  },
};

export const consentsApi = {
  list: async (): Promise<ConsentForm[]> => {
    const { data } = await axiosInstance.get<PaginatedResponse<ConsentRecord> | ConsentRecord[]>(
      "treatments/consents/",
    );
    return records(data).map(consentFromRecord);
  },
  save: async (consent: ConsentForm): Promise<ConsentForm> => {
    const payload = consentToRecord(consent);
    const { data } = isPersistedUuid(consent.id)
      ? await axiosInstance.patch<ConsentRecord>(`treatments/consents/${consent.id}/`, payload)
      : await axiosInstance.post<ConsentRecord>("treatments/consents/", payload);
    return consentFromRecord(data);
  },
  archive: async (id: string): Promise<ConsentForm> => {
    const { data } = await axiosInstance.post<ConsentRecord>(`treatments/consents/${id}/archive/`);
    return consentFromRecord(data);
  },
  restore: async (id: string): Promise<ConsentForm> => {
    const { data } = await axiosInstance.post<ConsentRecord>(`treatments/consents/${id}/restore/`);
    return consentFromRecord(data);
  },
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`treatments/consents/${id}/`);
  },
};
