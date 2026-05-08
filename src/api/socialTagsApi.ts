/**
 * Tracking JS API Service
 *
 * API client for managing the client portal's tracking script payload.
 * Backend: welliemd/apps/clients/api/views.py - ClientViewSet.me_social_tags
 */

import axiosInstance from './axiosInstance';

export interface SocialTags {
  custom_global_js: string;
  conversion_tracking_js: string;
}

export interface SocialTagsResponse {
  success: boolean;
  social_tags: SocialTags;
}

const BASE_URL = '/clients';

export const socialTagsApi = {
  /**
   * Get current client's tracking JS payload
   * GET /api/v1/clients/me/social-tags/
   */
  getCurrent: async (): Promise<SocialTags> => {
    const response = await axiosInstance.get<SocialTagsResponse>(`${BASE_URL}/me/social-tags/`);
    return response.data.social_tags;
  },

  /**
   * Update tracking JS payload
   * PATCH /api/v1/clients/me/social-tags/
   */
  updateTrackingJs: async (payload: SocialTags): Promise<SocialTags> => {
    const response = await axiosInstance.patch<SocialTagsResponse>(`${BASE_URL}/me/social-tags/`, {
      custom_global_js: payload.custom_global_js,
      conversion_tracking_js: payload.conversion_tracking_js,
    });
    return response.data.social_tags;
  },
};

export default socialTagsApi;



