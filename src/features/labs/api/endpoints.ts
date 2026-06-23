/**
 * Labs API endpoint functions for the patient portal.
 * All calls are made via the authenticated apiClient (JWT-backed).
 */
import { apiClient } from '@/shared/api/client';
import { MOCK_LAB_RESULTS, MOCK_LAB_SUBMISSIONS } from './mocks';
import type {
    LabResult,
    LabSubmission,
    PaginatedResponse,
    StandaloneLabResult,
    StandaloneLabSubmission,
} from './types';

// ---------- Beluga/visit-based lab results ----------

export async function getLabResults(): Promise<LabResult[]> {
    try {
        const response = await apiClient.get<PaginatedResponse<LabResult> | LabResult[]>(
            '/medical/lab-results/'
        );
        const results = Array.isArray(response.data)
            ? response.data
            : response.data?.results ?? [];
        return results.length > 0 ? results : MOCK_LAB_RESULTS;
    } catch {
        console.warn('Failed to fetch lab results, using fallback mock data');
        return MOCK_LAB_RESULTS;
    }
}

export async function getLabSubmissions(): Promise<LabSubmission[]> {
    try {
        const response = await apiClient.get<PaginatedResponse<LabSubmission> | LabSubmission[]>(
            '/medical/lab-submissions/'
        );
        const submissions = Array.isArray(response.data)
            ? response.data
            : response.data?.results ?? [];
        return submissions.length > 0 ? submissions : MOCK_LAB_SUBMISSIONS;
    } catch {
        console.warn('Failed to fetch lab submissions, using fallback mock data');
        return MOCK_LAB_SUBMISSIONS;
    }
}

export async function getPatientLabResults(patientId: string): Promise<LabResult[]> {
    try {
        const response = await apiClient.get<PaginatedResponse<LabResult> | LabResult[]>(
            `/medical/lab-results/?patient_id=${patientId}`
        );
        if (Array.isArray(response.data)) return response.data;
        return response.data?.results ?? [];
    } catch {
        console.warn('Failed to fetch patient lab results');
        return [];
    }
}

// ---------- Standalone Junction lab orders (post-checkout history) ----------

export async function getStandaloneLabSubmissions(): Promise<StandaloneLabSubmission[]> {
    try {
        const response = await apiClient.get<
            PaginatedResponse<StandaloneLabSubmission> | StandaloneLabSubmission[]
        >('/patient/labs/submissions/');
        if (Array.isArray(response.data)) return response.data;
        return response.data?.results ?? [];
    } catch {
        console.warn('Failed to fetch standalone lab submissions');
        return [];
    }
}

export async function getStandaloneLabResults(): Promise<StandaloneLabResult[]> {
    try {
        const response = await apiClient.get<
            PaginatedResponse<StandaloneLabResult> | StandaloneLabResult[]
        >('/patient/labs/results/');
        if (Array.isArray(response.data)) return response.data;
        return response.data?.results ?? [];
    } catch {
        console.warn('Failed to fetch standalone lab results');
        return [];
    }
}

/**
 * Download result PDF via the WellieMD proxy.
 * Never uses the raw Junction URL directly.
 * GET /patient/labs/results/{orderId}/pdf/
 */
export async function downloadStandaloneLabResultPdf(orderId: string): Promise<Blob> {
    const response = await apiClient.get(`/patient/labs/results/${orderId}/pdf/`, {
        responseType: 'blob',
    });
    return response.data as Blob;
}
