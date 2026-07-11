/**
 * Available Treatments API service for patient portal.
 *
 * Explore Treatments now lists eligibility-filtered Custom Programs (the "wrapper" catalog
 * unit - see apps.treatments.services.eligibility_service on the backend). Starting a
 * treatment from here is not wired yet (see startNewTreatment below); it stays a
 * network-free stub until the Program/CustomProgram intake-start flow lands.
 */
import { apiClient } from '@/shared/api/client';

export interface AvailableTreatment {
    id: string;
    name: string;
    description: string;
    slug: string;
    category: string;
    program_count: number;
    sex_requirement: 'male' | 'female' | null;
    min_age: number | null;
    max_age: number | null;
    min_bmi: number | null;
    max_bmi: number | null;
    can_start: boolean;
    blocked_until: string | null;
    days_remaining: number | null;
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
    try {
        const response = await apiClient.get<AvailableTreatmentsResponse>(
            '/treatments/available/'
        );

        if (response.data.success && response.data.treatments) {
            return response.data.treatments;
        }

        return [];
    } catch (error) {
        console.error('Error fetching available treatments:', error);
        return [];
    }
}

/**
 * Start a new treatment.
 *
 * ponytail: stub. There is no intake-start endpoint yet that accepts a Custom Program /
 * Program id (the legacy endpoint only accepts a QuestionnaireTemplate id, which these
 * are not). Resolves without a network call rather than firing a request guaranteed to
 * 404. Replace with a real call once the slug-intake-url workstream lands.
 */
export async function startNewTreatment(_treatmentId: string): Promise<StartTreatmentResponse> {
    return {
        success: false,
        message: "Starting this treatment isn't available yet. Please check back soon.",
    };
}

export default {
    getAvailableTreatments,
    startNewTreatment,
};
