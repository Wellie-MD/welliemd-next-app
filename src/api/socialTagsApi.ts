/**
 * Social Tags API Service
 * 
 * API client for managing social platform integration tags (GTM, Facebook, TikTok)
 * Backend: welliemd/apps/clients/api/views.py - ClientViewSet.me_social_tags
 */

import axiosInstance from './axiosInstance';

export interface SocialTags {
  gtm_tag: string;
  facebook_tag: string;
  tiktok_tag: string;
}

export interface SocialTagsResponse {
  success: boolean;
  social_tags: SocialTags;
}

const BASE_URL = '/clients';

export const socialTagsApi = {
  /**
   * Get current client's social tags
   * GET /api/v1/clients/me/social-tags/
   */
  getCurrent: async (): Promise<SocialTags> => {
    const response = await axiosInstance.get<SocialTagsResponse>(`${BASE_URL}/me/social-tags/`);
    return response.data.social_tags;
  },

  /**
   * Update GTM tag
   * PATCH /api/v1/clients/me/social-tags/
   */
  updateGtmTag: async (tag: string): Promise<SocialTags> => {
    const response = await axiosInstance.patch<SocialTagsResponse>(`${BASE_URL}/me/social-tags/`, {
      gtm_tag: tag,
    });
    return response.data.social_tags;
  },

  /**
   * Update Facebook tag
   * PATCH /api/v1/clients/me/social-tags/
   */
  updateFacebookTag: async (tag: string): Promise<SocialTags> => {
    const response = await axiosInstance.patch<SocialTagsResponse>(`${BASE_URL}/me/social-tags/`, {
      facebook_tag: tag,
    });
    return response.data.social_tags;
  },

  /**
   * Update TikTok tag
   * PATCH /api/v1/clients/me/social-tags/
   */
  updateTikTokTag: async (tag: string): Promise<SocialTags> => {
    const response = await axiosInstance.patch<SocialTagsResponse>(`${BASE_URL}/me/social-tags/`, {
      tiktok_tag: tag,
    });
    return response.data.social_tags;
  },
};

export default socialTagsApi;

