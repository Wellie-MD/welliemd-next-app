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

export interface BrandSettings {
    logos: BrandLogos;
    // loginPageImage has been deprecated in favor of a shared login video.
    // Kept optional for backward compatibility with existing data.
    loginPageImage?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    neutralColor?: string;
    patientPortalTheme?: 'light' | 'dark';
}

export interface PublicBrandSettings {
    // Deprecated: no longer used by the login page (which shows a shared video).
    loginPageImage?: string;
    logos: BrandLogos;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    neutralColor?: string;
}

/**
 * Fetch existing brand settings (requires authentication)
 */
export async function fetchBrandSettings(): Promise<BrandSettings> {
    const response = await axiosInstance.get<BrandSettings>('/brand-settings/');
    return response.data;
}

/**
 * Fetch public brand settings (no authentication required)
 * Used for login page and other public pages
 */
export async function fetchPublicBrandSettings(): Promise<PublicBrandSettings> {
    const response = await axiosInstance.get<PublicBrandSettings>('/public/brand-settings/');
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
    fetchPublicBrandSettings,
    updateBrandSettings,
};
