/**
 * Labs API service for patient portal.
 * 
 * Provides methods to:
 * - Get lab results for the authenticated patient
 * - Get lab submissions/history for the patient
 */
import { apiClient } from '@/shared/api/client';

export interface LabResult {
    id: string;
    patient: string;
    patient_name: string;
    visit: string | null;
    source_system?: 'beluga' | 'junction' | 'manual' | 'import' | '';
    external_order_id?: string | null;
    external_result_key?: string | null;
    test_name: string;
    test_result: string;
    test_result_units: string;
    reference_range: string;
    status_indicator: 'H' | 'L' | 'N' | '' | null;
    result_interpretation?: string | null;
    loinc?: string | null;
    loinc_slug?: string | null;
    provider_id?: string | null;
    screening_date: string;
    report_date: string;
    sample_source: 'URINE' | 'BLOOD' | 'SALIVA' | 'VAGINAL' | 'RECTAL' | 'SEMEN' | '';
    sample_information_snapshot?: Record<string, unknown> | null;
    test_to_treat: boolean;
    submission_status: string | null;
    beluga_visit_id: string | null;
    submitted_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface PatientMedication {
    id: string;
    name: string;
    strength: string;
    quantity: string;
    refills: string;
    med_id: string;
    created_at: string;
}

export interface LabSubmission {
    id: string;
    visit: string;
    patient_name: string;
    lab_results: LabResult[];
    patient_medications: PatientMedication[];
    test_to_treat: boolean;
    patient_preferences: Record<string, unknown> | null;
    pharmacy_id: string | null;
    custom_questions: Record<string, unknown> | null;
    master_id: string | null;
    beluga_visit_id: string | null;
    submission_status: 'pending' | 'submitted' | 'failed' | 'completed';
    submission_response: Record<string, unknown> | null;
    error_details: string | null;
    submitted_at: string | null;
    created_at: string;
    updated_at: string;
    lifecycle_events?: Array<Record<string, unknown>>;
    events?: Array<Record<string, unknown>>;
    activity_events?: Array<Record<string, unknown>>;
    requisition_pdf_url?: string | null;
    booking_link?: string | null;
    booking_url?: string | null;
}

interface PaginatedResponse<T> {
    results: T[];
    count?: number;
    next?: string | null;
    previous?: string | null;
}

/**
 * Get lab results for the authenticated patient.
 */
export async function getLabResults(): Promise<LabResult[]> {
    try {
        const response = await apiClient.get<PaginatedResponse<LabResult> | LabResult[]>(
            '/medical/lab-results/'
        );

        // Handle both paginated and non-paginated responses
        if (Array.isArray(response.data)) {
            return response.data;
        }
        
        if (response.data && 'results' in response.data) {
            return response.data.results || [];
        }

        return [];
    } catch (error) {
        console.warn('Failed to fetch lab results');
        return [];
    }
}

/**
 * Get lab submissions for the authenticated patient.
 */
export async function getLabSubmissions(): Promise<LabSubmission[]> {
    try {
        const response = await apiClient.get<PaginatedResponse<LabSubmission> | LabSubmission[]>(
            '/medical/lab-submissions/'
        );

        // Handle both paginated and non-paginated responses
        if (Array.isArray(response.data)) {
            return response.data;
        }
        
        if (response.data && 'results' in response.data) {
            return response.data.results || [];
        }

        return [];
    } catch (error) {
        console.warn('Failed to fetch lab submissions');
        return [];
    }
}

/**
 * Get lab results filtered by patient_id (for admin/provider views).
 */
export async function getPatientLabResults(patientId: string): Promise<LabResult[]> {
    try {
        const response = await apiClient.get<PaginatedResponse<LabResult> | LabResult[]>(
            `/medical/lab-results/?patient_id=${patientId}`
        );

        // Handle both paginated and non-paginated responses
        if (Array.isArray(response.data)) {
            return response.data;
        }
        
        if (response.data && 'results' in response.data) {
            return response.data.results || [];
        }

        return [];
    } catch (error) {
        console.warn('Failed to fetch patient lab results');
        return [];
    }
}

export default {
    getLabResults,
    getLabSubmissions,
    getPatientLabResults,
};
