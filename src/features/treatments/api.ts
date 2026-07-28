/**
 * Available Treatments API service for patient portal.
 *
 * Explore Treatments lists eligibility-filtered Custom Programs and launches their
 * immutable published releases.
 */
import { API_ENDPOINTS } from '@/config/constants';
import { apiClient } from '@/shared/api/client';

export interface AvailableTreatment {
    kind?: 'custom_program' | 'program';
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
    launch: {
        custom_program_id?: string;
        template_id?: string;
        release_token?: string;
        release_version?: number;
        path: string;
        questionnaire_url?: string;
    } | null;
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
        API_ENDPOINTS.TREATMENTS.AVAILABLE
    );

    if (response.data.success) {
        return response.data.treatments;
    }

    throw new Error(response.data.error ?? 'Available treatments could not be loaded.');
}

/**
 * Start a new treatment.
 *
 * Build a release-bound questionnaire URL from backend-issued launch metadata.
 */
export function startNewTreatment(treatment: AvailableTreatment): Promise<StartTreatmentResponse> {
    if (!treatment.can_start || !treatment.launch) {
        return Promise.resolve({
            success: false,
            message: 'This treatment has no published release.',
        });
    }
    if (treatment.launch.template_id) {
        return apiClient.post<StartTreatmentResponse>(
            '/questionnaires/start-new-treatment/',
            { template_id: treatment.launch.template_id },
        ).then(response => response.data).catch((error: any) => ({
            success: false,
            message: error?.response?.data?.message || error?.response?.data?.error || 'Unable to start this treatment intake.',
        }));
    }

    const serverUrl = treatment.launch.questionnaire_url?.trim();
    const configuredBase = import.meta.env.VITE_QUESTIONNAIRE_BASE_URL?.trim().replace(/\/$/, '');

    if (!serverUrl && !configuredBase) {
        return Promise.resolve({
            success: false,
            message: 'Treatment intake is not configured. Please contact your care team.',
        });
    }

    try {
        const url = serverUrl
            ? new URL(serverUrl)
            : new URL(treatment.launch.path, `${configuredBase}/`);
        if (treatment.launch.custom_program_id && treatment.launch.release_token && treatment.launch.release_version != null) {
            url.searchParams.set('custom_program_id', treatment.launch.custom_program_id);
            url.searchParams.set('release_token', treatment.launch.release_token);
            url.searchParams.set('release_version', String(treatment.launch.release_version));
        }
        return Promise.resolve({ success: true, questionnaire_url: url.toString() });
    } catch {
        return Promise.resolve({
            success: false,
            message: 'Treatment intake is not configured. Please contact your care team.',
        });
    }
}

export default {
    getAvailableTreatments,
    startNewTreatment,
};
