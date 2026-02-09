/**
 * Follow-up API for client portal.
 * 
 * Provides methods to:
 * - Create follow-up sessions for patients
 * - List follow-ups for a patient
 * - Get follow-up status
 */
import axiosInstance from './axiosInstance';

export interface FollowUpSession {
    id: string;
    patient_id: string;
    questionnaire_id: string;
    questionnaire_name?: string;
    status: 'CREATED' | 'VIEWED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
    created_at: string;
    expires_at: string;
    completed_at: string | null;
    follow_up_url?: string;
}

export interface CreateFollowUpRequest {
    patient_id: string;
    questionnaire_id: string;
    parent_visit_id?: string;
    expiry_hours?: number;
    episode_id?: string | null;
}

export interface CreateFollowUpResponse {
    success: boolean;
    session_id: string;
    follow_up_url: string;
    expires_at: string;
    status: string;
    error?: string;
}

export interface FollowUpTemplate {
    id: string;
    name: string;
    treatment_type: string;
    questionnaire_type: string;
}

/**
 * Create a new follow-up session for a patient.
 * Returns the follow-up URL to send to the patient.
 */
export async function createFollowUp(data: CreateFollowUpRequest): Promise<CreateFollowUpResponse> {
    try {
        const response = await axiosInstance.post<CreateFollowUpResponse>(
            '/questionnaires/follow-ups/',
            data
        );
        return response.data;
    } catch (error: any) {
        console.error('Error creating follow-up:', error);
        return {
            success: false,
            session_id: '',
            follow_up_url: '',
            expires_at: '',
            status: 'error',
            error: error.response?.data?.error || error.message || 'Failed to create follow-up',
        };
    }
}

/**
 * Get list of follow-ups for a specific patient.
 */
export async function getPatientFollowUps(patientId: string): Promise<FollowUpSession[]> {
    try {
        const response = await axiosInstance.get<{ success: boolean; followups: FollowUpSession[] }>(
            `/questionnaires/follow-ups/patient/${patientId}/`
        );

        if (response.data.success && response.data.followups) {
            return response.data.followups;
        }
        return [];
    } catch (error) {
        console.error('Error fetching patient follow-ups:', error);
        return [];
    }
}

/**
 * Get available follow-up questionnaire templates.
 */
export async function getFollowUpTemplates(): Promise<FollowUpTemplate[]> {
    try {
        // API returns paginated response: { count, next, previous, results }
        const response = await axiosInstance.get<{
            count: number;
            next: string | null;
            previous: string | null;
            results: FollowUpTemplate[]
        }>(
            '/questionnaires/templates/',
            { params: { questionnaire_type: 'follow_up' } }
        );
        return response.data.results || [];
    } catch (error) {
        console.error('Error fetching follow-up templates:', error);
        return [];
    }
}

export default {
    createFollowUp,
    getPatientFollowUps,
    getFollowUpTemplates,
};
