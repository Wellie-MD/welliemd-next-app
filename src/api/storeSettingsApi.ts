/**
 * Store Settings API Service
 * 
 * API client for managing store settings
 * Backend: welliemd/apps/clients/api/views.py - StoreSettingsViewSet
 * API Docs: welliemd/apps/clients/API_DOCUMENTATION.md
 */

import axiosInstance from './axiosInstance';
import type {
  StoreSettings,
  StoreSettingsResponse,
  StoreSettingsUpdateResponse,
  StoreSettingsListResponse,
  StoreSettingsUpdate,
  StoreSettingsCreate,
} from '@/types/storeSettings';

const BASE_URL = '/store-settings';

export const storeSettingsApi = {
  /**
   * Get current client's store settings
   * GET /api/v1/store-settings/current/
   * 
   * Automatically creates settings if they don't exist
   */
  getCurrent: async (): Promise<StoreSettings> => {
    const response = await axiosInstance.get<StoreSettings>(`${BASE_URL}/current/`);
    return response.data;
  },

  /**
   * List all store settings (admin only)
   * GET /api/v1/store-settings/
   */
  list: async (params?: {
    page?: number;
    page_size?: number;
  }): Promise<StoreSettingsListResponse> => {
    const response = await axiosInstance.get<StoreSettingsListResponse>(BASE_URL, { params });
    return response.data;
  },

  /**
   * Get store settings by ID
   * GET /api/v1/store-settings/{id}/
   */
  get: async (id: string): Promise<StoreSettings> => {
    const response = await axiosInstance.get<StoreSettings>(`${BASE_URL}/${id}/`);
    return response.data;
  },

  /**
   * Create new store settings
   * POST /api/v1/store-settings/
   */
  create: async (data: StoreSettingsCreate): Promise<StoreSettings> => {
    const response = await axiosInstance.post<StoreSettings>(BASE_URL, data);
    return response.data;
  },

  /**
   * Update store settings (full update)
   * PUT /api/v1/store-settings/{id}/
   */
  update: async (id: string, data: StoreSettingsUpdate): Promise<StoreSettings> => {
    const response = await axiosInstance.put<StoreSettings>(`${BASE_URL}/${id}/`, data);
    return response.data;
  },

  /**
   * Partially update store settings
   * PATCH /api/v1/store-settings/{id}/
   */
  partialUpdate: async (id: string, data: Partial<StoreSettingsUpdate>): Promise<StoreSettings> => {
    const response = await axiosInstance.patch<StoreSettings>(`${BASE_URL}/${id}/`, data);
    return response.data;
  },

  /**
   * Delete store settings
   * DELETE /api/v1/store-settings/{id}/
   */
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/${id}/`);
  },
};

export default storeSettingsApi;
