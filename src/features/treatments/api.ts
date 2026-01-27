/**
 * Available Treatments API service for patient portal.
 * 
 * Provides methods to:
 * - List treatments available for the patient to start
 * - Start a new treatment questionnaire
 */
import { apiClient } from '@/shared/api/client';

export interface AvailableTreatment {
    id: string;
    name: string;
    description: string;
    treatment_type: string;
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
 * Get list of available treatments for the authenticated patient.
 */
export async function getAvailableTreatments(): Promise<AvailableTreatment[]> {
    try {
        const response = await apiClient.get<AvailableTreatmentsResponse>(
            '/questionnaires/available-treatments/'
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
 * Start a new treatment questionnaire.
 * Returns the URL to redirect the patient to.
 */
export async function startNewTreatment(templateId: string): Promise<StartTreatmentResponse> {
    try {
        const response = await apiClient.post<StartTreatmentResponse>(
            '/questionnaires/start-new-treatment/',
            { template_id: templateId }
        );

        return response.data;
    } catch (error: any) {
        console.error('Error starting new treatment:', error);

        // Handle blocked error from backend
        if (error.response?.data) {
            return error.response.data;
        }

        return {
            success: false,
            error: error.message || 'Failed to start treatment',
        };
    }
}

export default {
    getAvailableTreatments,
    startNewTreatment,
};
