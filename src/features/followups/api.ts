/**
 * Follow-up API service for patient portal.
 * 
 * Provides methods to:
 * - List patient's follow-up questionnaires
 * - Start a follow-up questionnaire
 * - Get follow-up status
 */
import { apiClient } from '@/shared/api/client';

export interface FollowUp {
    id: string;
    questionnaire_name: string;
    treatment_type: string;
    status: 'CREATED' | 'VIEWED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
    created_at: string;
    expires_at: string;
    completed_at: string | null;
}

export interface FollowUpListResponse {
    success: boolean;
    followups: FollowUp[];
}

export interface FollowUpStartResponse {
    success: boolean;
    follow_up_url: string;
    error?: string;
}

/**
 * Get list of follow-ups for the authenticated patient.
 */
export async function getPatientFollowUps(): Promise<FollowUp[]> {
    try {
        // Note: baseURL already includes /api/v1, so we only need the path after that
        const response = await apiClient.get<FollowUpListResponse>(
            '/questionnaires/follow-ups/my_followups/'
        );

        if (response.data.success && response.data.followups) {
            // Transform backend response to frontend format
            return response.data.followups.map((f: any) => ({
                id: f.id,
                questionnaire_name: f.questionnaire__name || 'Follow-Up Questionnaire',
                treatment_type: f.questionnaire__treatment_type || '',
                status: f.status,
                created_at: f.created_at,
                expires_at: f.expires_at,
                completed_at: f.completed_at,
            }));
        }

        return [];
    } catch (error) {
        console.error('Error fetching follow-ups:', error);
        return [];
    }
}

/**
 * Start a follow-up questionnaire.
 * Creates a short-lived access token and returns the questionnaire URL.
 * 
 * NOTE: This calls Admin backend because FollowUpSession records live there.
 * The session was created by Admin when the follow-up was assigned to patient.
 */
export async function startFollowUp(followUpId: string): Promise<FollowUpStartResponse> {
    try {
        // FollowUpSession lives in Admin DB, so call Admin backend
        const response = await apiClient.post<FollowUpStartResponse>(
            `/questionnaires/follow-ups/${followUpId}/start_portal/`
        );

        return response.data;
    } catch (error: any) {
        console.error('Error starting follow-up:', error);
        return {
            success: false,
            follow_up_url: '',
            error: error.message || 'Failed to start follow-up',
        };
    }
}

/**
 * Get questionnaire app URL with follow-up session.
 * The backend generates this URL securely - we never build tokens client-side.
 */
export function getFollowUpUrl(followUpId: string, questionnaireAppUrl: string): string {
    // This should be fetched from backend, but providing fallback
    return `${questionnaireAppUrl}/follow-up/${followUpId}`;
}

export default {
    getPatientFollowUps,
    startFollowUp,
    getFollowUpUrl,
};
