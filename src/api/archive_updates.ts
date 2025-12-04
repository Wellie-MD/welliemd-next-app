import { axiosInstance } from './axiosInstance';

export interface ArchiveTemplatesPayload {
    template_ids: string[];
    client_ids: string[];
}

export interface ArchiveProductsPayload {
    product_ids: number[];
    client_ids: string[];
}

// ... existing interfaces ...

// Add to existing questionnaires.ts
/*
  archiveTemplates: async (payload: ArchiveTemplatesPayload) => {
    const { data } = await axiosInstance.post(
      'questionnaires/admin/template-assignments/archive/',
      payload
    );
    return data;
  },

  unarchiveTemplates: async (payload: ArchiveTemplatesPayload) => {
    const { data } = await axiosInstance.post(
      'questionnaires/admin/template-assignments/unarchive/',
      payload
    );
    return data;
  },
*/
