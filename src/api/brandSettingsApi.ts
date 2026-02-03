/**
 * Brand Settings API
 * * Handles fetching and updating client-specific branding configurations.
 */

import axiosInstance from './axiosInstance';

export interface BrandLogos {
    square: string;
    round: string;
    transparent: string;
    favicon: string;
}

export interface BrandNotifications {
    smsCompleted: boolean;
    smsNoShow: boolean;
    smsNoTreatment: boolean;
}

export interface BrandSupport {
    phone: string;
    email: string;
    hours: string;
}

export interface BrandSettings {
    homePageUrl: string;
    helpPageSlug: string;
    logos: BrandLogos;
    loginPageImage: string;
    support: BrandSupport;
    enabledNotifications: BrandNotifications;
    // colors, pages, and ads can be added here later
}

/**
 * Fetch existing brand settings
 */
export async function fetchBrandSettings(): Promise<BrandSettings> {
    const response = await axiosInstance.get<BrandSettings>('/brand-settings/');
    return response.data;
}

/**
 * Update/Save brand settings
 */
export async function updateBrandSettings(data: BrandSettings): Promise<{ status: string }> {
    const response = await axiosInstance.post<{ status: string }>('/brand-settings/', data);
    return response.data;
}

export default {
    fetchBrandSettings,
    updateBrandSettings,
};