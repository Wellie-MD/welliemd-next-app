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
        program_id?: string;
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
 * Ask the tenant backend for a release-bound, pre-authenticated launch URL.
 */
export async function startNewTreatment(treatment: AvailableTreatment): Promise<StartTreatmentResponse> {
    if (!treatment.can_start || !treatment.launch) {
        return {
            success: false,
            message: 'This treatment has no published release.',
        };
    }

    try {
        if (
            treatment.launch.template_id
            && !treatment.launch.program_id
            && !treatment.launch.custom_program_id
        ) {
            const response = await apiClient.post<StartTreatmentResponse>(
                '/questionnaires/start-new-treatment/',
                { template_id: treatment.launch.template_id },
            );
            return response.data;
        }

        const response = await apiClient.post<StartTreatmentResponse>(
            '/treatments/available/launch/',
            { kind: treatment.kind, id: treatment.id },
        );
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error?.response?.data?.detail
            || error?.response?.data?.message
            || error?.response?.data?.error
            || 'Unable to start this treatment intake.',
        };
    }
}

export default {
    getAvailableTreatments,
    startNewTreatment,
};
