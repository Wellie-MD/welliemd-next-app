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
    questionnaire__name?: string;
    questionnaire__treatment_type?: string;
    status: 'CREATED' | 'VIEWED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
    created_at: string;
    expires_at: string | null;
    link_expires_at?: string | null;
    link_expiry_label?: string | null;
    link_expiry_policy?: string;
    due_date?: string | null;
    completed_at: string | null;
    follow_up_url?: string;
}

export interface CreateFollowUpRequest {
    patient_id: string;
    questionnaire_id: string;
    parent_visit_id?: string;
    expiry_hours?: number;
    expiry_days?: number;
    allow_manual_expiry_override?: boolean;
    episode_id?: string | null;
    context_order_id?: string | null;
    onboarding_template_id?: string | null;
}

export interface FollowUpOrderCandidate {
    id: string;
    order_id?: string | null;
    display_id?: string | null;
    status?: string;
    product_name?: string | null;
    prescribed_at?: string | null;
    episode_id?: string | null;
}

export interface CreateFollowUpResponse {
    success: boolean;
    session_id: string;
    follow_up_url: string;
    expires_at: string | null;
    link_expires_at?: string | null;
    link_expiry_label?: string | null;
    status: string;
    warnings?: Array<{ code: string; message: string }>;
    code?: string;
    order_candidates?: FollowUpOrderCandidate[];
    error?: string;
}

export interface FollowUpTemplate {
    id: string;
    name: string;
    treatment_type: string;
    questionnaire_type: string;
}

export interface OnboardingTemplate {
    id: string;
    name: string;
    treatment_type: string;
    questionnaire_type: string;
    default_followup_template?: string | null;
}

export interface SendFollowUpNotificationRequest {
    template_type?: string;
    channels?: Array<'email' | 'sms'>;
    idempotency_key?: string;
    expiry_hours?: number;
    expiry_days?: number;
    allow_manual_expiry_override?: boolean;
}

export interface SendFollowUpNotificationResponse {
    success: boolean;
    session_id: string;
    skipped_duplicate?: boolean;
    warnings?: Array<{ code: string; message: string }>;
    notification_result?: {
        email?: string;
        sms?: string;
        follow_up_url?: string;
    };
    error?: string;
}

export interface GetOrderCandidatesResponse {
    success: boolean;
    order_candidates: FollowUpOrderCandidate[];
    error?: string;
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
            expires_at: null,
            status: 'error',
            code: error.response?.data?.code,
            order_candidates: error.response?.data?.order_candidates || [],
            error: error.response?.data?.error || error.message || 'Failed to create follow-up',
        };
    }
}

export async function getFollowUpOrderCandidates(patientId: string): Promise<GetOrderCandidatesResponse> {
    try {
        const response = await axiosInstance.get<GetOrderCandidatesResponse>(
            '/questionnaires/follow-ups/order-candidates/',
            { params: { patient_id: patientId } }
        );
        return response.data;
    } catch (error: any) {
        console.error('Error fetching follow-up order candidates:', error);
        return {
            success: false,
            order_candidates: [],
            error: error.response?.data?.error || error.message || 'Failed to fetch order candidates',
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

/**
 * Get available onboarding questionnaire templates.
 */
export async function getOnboardingTemplates(): Promise<OnboardingTemplate[]> {
    try {
        const response = await axiosInstance.get<{
            count: number;
            next: string | null;
            previous: string | null;
            results: OnboardingTemplate[]
        }>(
            '/questionnaires/templates/',
            { params: { questionnaire_type: 'onboarding' } }
        );
        return response.data.results || [];
    } catch (error) {
        console.error('Error fetching onboarding templates:', error);
        return [];
    }
}

export async function sendFollowUpNotification(
    followUpId: string,
    data: SendFollowUpNotificationRequest
): Promise<SendFollowUpNotificationResponse> {
    try {
        const response = await axiosInstance.post<SendFollowUpNotificationResponse>(
            `/questionnaires/follow-ups/${followUpId}/send_notification/`,
            data
        );
        return response.data;
    } catch (error: any) {
        console.error('Error sending follow-up notification:', error);
        return {
            success: false,
            session_id: followUpId,
            error: error.response?.data?.error || error.message || 'Failed to send follow-up notification',
        };
    }
}

export default {
    createFollowUp,
    getPatientFollowUps,
    getFollowUpTemplates,
    getOnboardingTemplates,
    getFollowUpOrderCandidates,
    sendFollowUpNotification,
};
