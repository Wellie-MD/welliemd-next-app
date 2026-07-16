/**
 * Available Treatments API service for patient portal.
 *
 * Explore Treatments lists eligibility-filtered Custom Programs and launches their
 * immutable published releases.
 */
import { apiClient } from '@/shared/api/client';

export interface AvailableTreatment {
    id: string;
    name: string;
    description: string;
    slug: string;
    category: string;
    categories: string[];
    program_count: number;
    sex_requirement: 'male' | 'female' | null;
    min_age: number | null;
    max_age: number | null;
    min_bmi: number | null;
    max_bmi: number | null;
    can_start: boolean;
    blocked_until: string | null;
    days_remaining: number | null;
    launch: { custom_program_id: string; release_token: string; release_version: number; path: string } | null;
}

export interface AvailableTreatmentsResponse {
    success: boolean;
    treatments: AvailableTreatment[];
    error?: string;
}

export interface StartTreatmentResponse {
    success: boolean;
    questionnaire_url?: string;
    session_id?: string;
    template_name?: string;
    error?: string;
    message?: string;
    blocked_until?: string;
    days_remaining?: number;
}

/**
 * Get list of treatments (eligibility-filtered Custom Programs) available for the
 * authenticated patient.
 */
export async function getAvailableTreatments(): Promise<AvailableTreatment[]> {
    const response = await apiClient.get<AvailableTreatmentsResponse>(
        '/treatments/available/'
    );

    if (response.data.success && response.data.treatments) {
        return response.data.treatments;
    }

    throw new Error(response.data.error || 'Available treatments could not be loaded.');
}

/**
 * Start a new treatment.
 *
 * Build a release-bound questionnaire URL from backend-issued launch metadata.
 */
export async function startNewTreatment(treatment: AvailableTreatment): Promise<StartTreatmentResponse> {
    if (!treatment.can_start || !treatment.launch) return { success: false, message: 'This treatment has no published release.' };
    const base = (import.meta.env.VITE_QUESTIONNAIRE_BASE_URL || window.location.origin).replace(/\/$/, '');
    const url = new URL(treatment.launch.path, `${base}/`);
    url.searchParams.set('custom_program_id', treatment.launch.custom_program_id);
    url.searchParams.set('release_token', treatment.launch.release_token);
    url.searchParams.set('release_version', String(treatment.launch.release_version));
    return { success: true, questionnaire_url: url.toString() };
}

export default {
    getAvailableTreatments,
    startNewTreatment,
};
