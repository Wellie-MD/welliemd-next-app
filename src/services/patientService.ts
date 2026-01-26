import api from '../api/axiosInstance';

export interface Patient {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone: string;
    date_of_birth: string;
    sex: 'Male' | 'Female' | 'Other';
    address: string;
    city: string;
    state: string;
    zip_code: string;
    allergies: string;
    medical_conditions: string;
    self_reported_meds: string;
    created_at: string;
    updated_at: string;
    orders_count?: number;
    last_order_at?: string | null;
    last_order_display_id?: string | null;
}

export interface PatientListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Patient[];
}

export interface PatientListParams {
    page?: number;
    page_size?: number;
    search?: string;
    ordering?: string;
}

export const patientService = {
    /**
     * Fetch patients with server-side pagination
     */
    getPatients: async (params: PatientListParams = {}): Promise<PatientListResponse> => {
        try {
            const { page = 1, page_size = 20, search, ordering } = params;

            const queryParams = new URLSearchParams();
            queryParams.append('page', page.toString());
            queryParams.append('page_size', page_size.toString());
            if (search) queryParams.append('search', search);
            if (ordering) queryParams.append('ordering', ordering);

            const response = await api.get<PatientListResponse>(`/medical/patients/?${queryParams.toString()}`);
            return response.data;
        } catch (error: any) {
            console.error('Failed to fetch patients:', error);
            throw new Error(
                error.response?.data?.detail ||
                error.response?.data?.message ||
                'Failed to fetch patients from the server'
            );
        }
    },

    /**
     * Fetch a single patient by ID
     */
    getPatient: async (id: string): Promise<Patient> => {
        try {
            const response = await api.get<Patient>(`/medical/patients/${id}/`);
            return response.data;
        } catch (error: any) {
            console.error(`Failed to fetch patient ${id}:`, error);
            throw new Error(
                error.response?.data?.detail ||
                error.response?.data?.message ||
                'Failed to fetch patient details'
            );
        }
    },

    /**
     * Update a patient (partial update)
     */
    updatePatient: async (id: string, payload: Partial<Patient>): Promise<Patient> => {
        try {
            const response = await api.patch<Patient>(`/medical/patients/${id}/`, payload);
            return response.data;
        } catch (error: any) {
            console.error(`Failed to update patient ${id}:`, error);
            throw new Error(
                error.response?.data?.detail ||
                error.response?.data?.message ||
                'Failed to update patient'
            );
        }
    },

    /**
     * Delete a patient
     */
    deletePatient: async (id: string): Promise<void> => {
        try {
            await api.delete(`/medical/patients/${id}/`);
        } catch (error: any) {
            console.error(`Failed to delete patient ${id}:`, error);
            throw new Error(
                error.response?.data?.detail ||
                error.response?.data?.message ||
                'Failed to delete patient'
            );
        }
    },
};
