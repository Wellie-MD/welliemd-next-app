import { apiClient } from "@/shared/api/client";

export interface BrandColors {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  neutralColor: string;
}

export interface BrandLogos {
  square?: string | undefined;
  round?: string | undefined;
  transparent?: string | undefined;
  favicon?: string | undefined;
}

export interface BrandSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  neutralColor: string;
  logos?: BrandLogos;
  patientPortalTheme?: 'light' | 'dark';
}

export const brandingService = {
  async getBrandSettings(): Promise<BrandSettings> {
    const response = await apiClient.get('questionnaires/frontend/brand-settings/', { skipAuth: true });
    return response.data;
  }
};
