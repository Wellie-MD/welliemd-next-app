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
}

export interface PatientListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Patient[];
}

export const patientService = {
    /**
     * Fetch all patients from the backend
     */
    getPatients: async (): Promise<Patient[]> => {
        try {
            const response = await api.get<PatientListResponse>('/medical/patients/');

            // If the response is paginated, return the results array
            if (response.data.results) {
                return response.data.results;
            }

            // If it's a direct array, return it
            return response.data as unknown as Patient[];
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
};
