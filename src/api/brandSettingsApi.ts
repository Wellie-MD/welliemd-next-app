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

/** Optional S3 metadata per logo slot (stored inside Client.branding_config JSON). */
export interface LogoSlotMeta {
    s3Key?: string;
}

export type LogosMeta = Partial<Record<keyof BrandLogos, LogoSlotMeta>>;

export interface BrandSettings {
    logos: BrandLogos;
    logosMeta?: LogosMeta;
    // loginPageImage has been deprecated in favor of a shared login video.
    // Kept optional for backward compatibility with existing data.
    loginPageImage?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    neutralColor?: string;
    patientPortalTheme?: 'light' | 'dark';
    seoTitle?: string;
    seoDescription?: string;
    seoImage?: string;
    clientId?: string;
    clientName?: string;
}

interface BrandSettingsEnvelope {
    branding: BrandSettings;
    client_id?: string;
    client_name?: string;
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
    const response = await axiosInstance.get<BrandSettings | BrandSettingsEnvelope>('/brand-settings/');
    const payload = response.data;
    if ('branding' in payload) {
        return {
            ...payload.branding,
            clientId: payload.client_id,
            clientName: payload.client_name,
        };
    }
    return payload;
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
