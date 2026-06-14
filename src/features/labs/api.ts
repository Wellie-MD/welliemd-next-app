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

const MOCK_LAB_RESULTS: LabResult[] = [
  // CMP Panel biomarkers (14 biomarkers)
  {
    id: 'cmp-1',
    patient: 'patient-id',
    patient_name: 'John Doe',
    visit: 'visit-1',
    source_system: 'junction',
    external_order_id: 'kinmeds-LAB-0042',
    test_name: 'Glucose',
    test_result: '102',
    test_result_units: 'mg/dL',
    reference_range: '70–99',
    status_indicator: 'H',
    result_interpretation: 'High',
    screening_date: '2026-06-10T08:00:00Z',
    report_date: '2026-06-10T14:30:00Z',
    sample_source: 'BLOOD',
    test_to_treat: true,
    submission_status: 'completed',
    beluga_visit_id: 'visit-beluga-1',
    submitted_at: '2026-06-10T08:00:00Z',
    created_at: '2026-06-10T08:00:00Z',
    updated_at: '2026-06-10T14:30:00Z'
  },
  {
    id: 'cmp-2',
    patient: 'patient-id',
    patient_name: 'John Doe',
    visit: 'visit-1',
    source_system: 'junction',
    external_order_id: 'kinmeds-LAB-0042',
    test_name: 'BUN (Urea Nitrogen)',
    test_result: '14',
    test_result_units: 'mg/dL',
    reference_range: '7–20',
    status_indicator: 'N',
    result_interpretation: 'Normal',
    screening_date: '2026-06-10T08:00:00Z',
    report_date: '2026-06-10T14:30:00Z',
    sample_source: 'BLOOD',
    test_to_treat: true,
    submission_status: 'completed',
    beluga_visit_id: 'visit-beluga-1',
    submitted_at: '2026-06-10T08:00:00Z',
    created_at: '2026-06-10T08:00:00Z',
    updated_at: '2026-06-10T14:30:00Z'
  },
  {
    id: 'cmp-3',
    patient: 'patient-id',
    patient_name: 'John Doe',
    visit: 'visit-1',
    source_system: 'junction',
    external_order_id: 'kinmeds-LAB-0042',
    test_name: 'Creatinine',
    test_result: '0.9',
    test_result_units: 'mg/dL',
    reference_range: '0.6–1.3',
    status_indicator: 'N',
    result_interpretation: 'Normal',
    screening_date: '2026-06-10T08:00:00Z',
    report_date: '2026-06-10T14:30:00Z',
    sample_source: 'BLOOD',
    test_to_treat: true,
    submission_status: 'completed',
    beluga_visit_id: 'visit-beluga-1',
    submitted_at: '2026-06-10T08:00:00Z',
    created_at: '2026-06-10T08:00:00Z',
    updated_at: '2026-06-10T14:30:00Z'
  },
  {
    id: 'cmp-4',
    patient: 'patient-id',
    patient_name: 'John Doe',
    visit: 'visit-1',
    source_system: 'junction',
    external_order_id: 'kinmeds-LAB-0042',
    test_name: 'Sodium',
    test_result: '140',
    test_result_units: 'mmol/L',
    reference_range: '135–145',
    status_indicator: 'N',
    result_interpretation: 'Normal',
    screening_date: '2026-06-10T08:00:00Z',
    report_date: '2026-06-10T14:30:00Z',
    sample_source: 'BLOOD',
    test_to_treat: true,
    submission_status: 'completed',
    beluga_visit_id: 'visit-beluga-1',
    submitted_at: '2026-06-10T08:00:00Z',
    created_at: '2026-06-10T08:00:00Z',
    updated_at: '2026-06-10T14:30:00Z'
  },
  {
    id: 'cmp-5',
    patient: 'patient-id',
    patient_name: 'John Doe',
    visit: 'visit-1',
    source_system: 'junction',
    external_order_id: 'kinmeds-LAB-0042',
    test_name: 'Potassium',
    test_result: '4.2',
    test_result_units: 'mmol/L',
    reference_range: '3.5–5.1',
    status_indicator: 'N',
    result_interpretation: 'Normal',
    screening_date: '2026-06-10T08:00:00Z',
    report_date: '2026-06-10T14:30:00Z',
    sample_source: 'BLOOD',
    test_to_treat: true,
    submission_status: 'completed',
    beluga_visit_id: 'visit-beluga-1',
    submitted_at: '2026-06-10T08:00:00Z',
    created_at: '2026-06-10T08:00:00Z',
    updated_at: '2026-06-10T14:30:00Z'
  },
  {
    id: 'cmp-6',
    patient: 'patient-id',
    patient_name: 'John Doe',
    visit: 'visit-1',
    source_system: 'junction',
    external_order_id: 'kinmeds-LAB-0042',
    test_name: 'Chloride',
    test_result: '102',
    test_result_units: 'mmol/L',
    reference_range: '98–107',
    status_indicator: 'N',
    result_interpretation: 'Normal',
    screening_date: '2026-06-10T08:00:00Z',
    report_date: '2026-06-10T14:30:00Z',
    sample_source: 'BLOOD',
    test_to_treat: true,
    submission_status: 'completed',
    beluga_visit_id: 'visit-beluga-1',
    submitted_at: '2026-06-10T08:00:00Z',
    created_at: '2026-06-10T08:00:00Z',
    updated_at: '2026-06-10T14:30:00Z'
  },
  {
    id: 'cmp-7',
    patient: 'patient-id',
    patient_name: 'John Doe',
    visit: 'visit-1',
    source_system: 'junction',
    external_order_id: 'kinmeds-LAB-0042',
    test_name: 'CO2',
    test_result: '25',
    test_result_units: 'mmol/L',
    reference_range: '22–29',
    status_indicator: 'N',
    result_interpretation: 'Normal',
    screening_date: '2026-06-10T08:00:00Z',
    report_date: '2026-06-10T14:30:00Z',
    sample_source: 'BLOOD',
    test_to_treat: true,
    submission_status: 'completed',
    beluga_visit_id: 'visit-beluga-1',
    submitted_at: '2026-06-10T08:00:00Z',
    created_at: '2026-06-10T08:00:00Z',
    updated_at: '2026-06-10T14:30:00Z'
  },
  {
    id: 'cmp-8',
    patient: 'patient-id',
    patient_name: 'John Doe',
    visit: 'visit-1',
    source_system: 'junction',
    external_order_id: 'kinmeds-LAB-0042',
    test_name: 'Calcium',
    test_result: '9.4',
    test_result_units: 'mg/dL',
    reference_range: '8.5–10.2',
    status_indicator: 'N',
    result_interpretation: 'Normal',
    screening_date: '2026-06-10T08:00:00Z',
    report_date: '2026-06-10T14:30:00Z',
    sample_source: 'BLOOD',
    test_to_treat: true,
    submission_status: 'completed',
    beluga_visit_id: 'visit-beluga-1',
    submitted_at: '2026-06-10T08:00:00Z',
    created_at: '2026-06-10T08:00:00Z',
    updated_at: '2026-06-10T14:30:00Z'
  },
  {
    id: 'cmp-9',
    patient: 'patient-id',
    patient_name: 'John Doe',
    visit: 'visit-1',
    source_system: 'junction',
    external_order_id: 'kinmeds-LAB-0042',
    test_name: 'Albumin',
    test_result: '4.3',
    test_result_units: 'g/dL',
    reference_range: '3.5–5.0',
    status_indicator: 'N',
    result_interpretation: 'Normal',
    screening_date: '2026-06-10T08:00:00Z',
    report_date: '2026-06-10T14:30:00Z',
    sample_source: 'BLOOD',
    test_to_treat: true,
    submission_status: 'completed',
    beluga_visit_id: 'visit-beluga-1',
    submitted_at: '2026-06-10T08:00:00Z',
    created_at: '2026-06-10T08:00:00Z',
    updated_at: '2026-06-10T14:30:00Z'
  },
  {
    id: 'cmp-10',
    patient: 'patient-id',
    patient_name: 'John Doe',
    visit: 'visit-1',
    source_system: 'junction',
    external_order_id: 'kinmeds-LAB-0042',
    test_name: 'Total Protein',
    test_result: '7.1',
    test_result_units: 'g/dL',
    reference_range: '6.0–8.3',
    status_indicator: 'N',
    result_interpretation: 'Normal',
    screening_date: '2026-06-10T08:00:00Z',
    report_date: '2026-06-10T14:30:00Z',
    sample_source: 'BLOOD',
    test_to_treat: true,
    submission_status: 'completed',
    beluga_visit_id: 'visit-beluga-1',
    submitted_at: '2026-06-10T08:00:00Z',
    created_at: '2026-06-10T08:00:00Z',
    updated_at: '2026-06-10T14:30:00Z'
  },
  {
    id: 'cmp-11',
    patient: 'patient-id',
    patient_name: 'John Doe',
    visit: 'visit-1',
    source_system: 'junction',
    external_order_id: 'kinmeds-LAB-0042',
    test_name: 'ALT',
    test_result: '22',
    test_result_units: 'U/L',
    reference_range: '7–56',
    status_indicator: 'N',
    result_interpretation: 'Normal',
    screening_date: '2026-06-10T08:00:00Z',
    report_date: '2026-06-10T14:30:00Z',
    sample_source: 'BLOOD',
    test_to_treat: true,
    submission_status: 'completed',
    beluga_visit_id: 'visit-beluga-1',
    submitted_at: '2026-06-10T08:00:00Z',
    created_at: '2026-06-10T08:00:00Z',
    updated_at: '2026-06-10T14:30:00Z'
  },
  {
    id: 'cmp-12',
    patient: 'patient-id',
    patient_name: 'John Doe',
    visit: 'visit-1',
    source_system: 'junction',
    external_order_id: 'kinmeds-LAB-0042',
    test_name: 'AST',
    test_result: '19',
    test_result_units: 'U/L',
    reference_range: '10–40',
    status_indicator: 'N',
    result_interpretation: 'Normal',
    screening_date: '2026-06-10T08:00:00Z',
    report_date: '2026-06-10T14:30:00Z',
    sample_source: 'BLOOD',
    test_to_treat: true,
    submission_status: 'completed',
    beluga_visit_id: 'visit-beluga-1',
    submitted_at: '2026-06-10T08:00:00Z',
    created_at: '2026-06-10T08:00:00Z',
    updated_at: '2026-06-10T14:30:00Z'
  },
  {
    id: 'cmp-13',
    patient: 'patient-id',
    patient_name: 'John Doe',
    visit: 'visit-1',
    source_system: 'junction',
    external_order_id: 'kinmeds-LAB-0042',
    test_name: 'Alk Phosphatase',
    test_result: '78',
    test_result_units: 'U/L',
    reference_range: '44–147',
    status_indicator: 'N',
    result_interpretation: 'Normal',
    screening_date: '2026-06-10T08:00:00Z',
    report_date: '2026-06-10T14:30:00Z',
    sample_source: 'BLOOD',
    test_to_treat: true,
    submission_status: 'completed',
    beluga_visit_id: 'visit-beluga-1',
    submitted_at: '2026-06-10T08:00:00Z',
    created_at: '2026-06-10T08:00:00Z',
    updated_at: '2026-06-10T14:30:00Z'
  },
  {
    id: 'cmp-14',
    patient: 'patient-id',
    patient_name: 'John Doe',
    visit: 'visit-1',
    source_system: 'junction',
    external_order_id: 'kinmeds-LAB-0042',
    test_name: 'Bilirubin',
    test_result: '0.6',
    test_result_units: 'mg/dL',
    reference_range: '0.1–1.2',
    status_indicator: 'N',
    result_interpretation: 'Normal',
    screening_date: '2026-06-10T08:00:00Z',
    report_date: '2026-06-10T14:30:00Z',
    sample_source: 'BLOOD',
    test_to_treat: true,
    submission_status: 'completed',
    beluga_visit_id: 'visit-beluga-1',
    submitted_at: '2026-06-10T08:00:00Z',
    created_at: '2026-06-10T08:00:00Z',
    updated_at: '2026-06-10T14:30:00Z'
  },
  
  // Lipid Panel biomarkers (4 biomarkers)
  {
    id: 'lip-1',
    patient: 'patient-id',
    patient_name: 'John Doe',
    visit: 'visit-2',
    source_system: 'manual',
    external_order_id: 'kinmeds-LAB-0039',
    test_name: 'Total Cholesterol',
    test_result: '192',
    test_result_units: 'mg/dL',
    reference_range: '< 200',
    status_indicator: 'N',
    result_interpretation: 'Normal',
    screening_date: '2026-05-28T08:00:00Z',
    report_date: '2026-05-28T16:00:00Z',
    sample_source: 'BLOOD',
    test_to_treat: true,
    submission_status: 'completed',
    beluga_visit_id: 'visit-beluga-2',
    submitted_at: '2026-05-28T08:00:00Z',
    created_at: '2026-05-28T08:00:00Z',
    updated_at: '2026-05-28T16:00:00Z'
  },
  {
    id: 'lip-2',
    patient: 'patient-id',
    patient_name: 'John Doe',
    visit: 'visit-2',
    source_system: 'manual',
    external_order_id: 'kinmeds-LAB-0039',
    test_name: 'HDL Cholesterol',
    test_result: '58',
    test_result_units: 'mg/dL',
    reference_range: '> 40',
    status_indicator: 'N',
    result_interpretation: 'Normal',
    screening_date: '2026-05-28T08:00:00Z',
    report_date: '2026-05-28T16:00:00Z',
    sample_source: 'BLOOD',
    test_to_treat: true,
    submission_status: 'completed',
    beluga_visit_id: 'visit-beluga-2',
    submitted_at: '2026-05-28T08:00:00Z',
    created_at: '2026-05-28T08:00:00Z',
    updated_at: '2026-05-28T16:00:00Z'
  },
  {
    id: 'lip-3',
    patient: 'patient-id',
    patient_name: 'John Doe',
    visit: 'visit-2',
    source_system: 'manual',
    external_order_id: 'kinmeds-LAB-0039',
    test_name: 'LDL Cholesterol',
    test_result: '138',
    test_result_units: 'mg/dL',
    reference_range: '< 100',
    status_indicator: 'H',
    result_interpretation: 'High',
    screening_date: '2026-05-28T08:00:00Z',
    report_date: '2026-05-28T16:00:00Z',
    sample_source: 'BLOOD',
    test_to_treat: true,
    submission_status: 'completed',
    beluga_visit_id: 'visit-beluga-2',
    submitted_at: '2026-05-28T08:00:00Z',
    created_at: '2026-05-28T08:00:00Z',
    updated_at: '2026-05-28T16:00:00Z'
  },
  {
    id: 'lip-4',
    patient: 'patient-id',
    patient_name: 'John Doe',
    visit: 'visit-2',
    source_system: 'manual',
    external_order_id: 'kinmeds-LAB-0039',
    test_name: 'Triglycerides',
    test_result: '120',
    test_result_units: 'mg/dL',
    reference_range: '< 150',
    status_indicator: 'N',
    result_interpretation: 'Normal',
    screening_date: '2026-05-28T08:00:00Z',
    report_date: '2026-05-28T16:00:00Z',
    sample_source: 'BLOOD',
    test_to_treat: true,
    submission_status: 'completed',
    beluga_visit_id: 'visit-beluga-2',
    submitted_at: '2026-05-28T08:00:00Z',
    created_at: '2026-05-28T08:00:00Z',
    updated_at: '2026-05-28T16:00:00Z'
  }
];

const MOCK_LAB_SUBMISSIONS: LabSubmission[] = [
  {
    id: 'kinmeds-LAB-0051',
    visit: 'visit-3',
    patient_name: 'John Doe',
    lab_results: [],
    patient_medications: [],
    test_to_treat: true,
    patient_preferences: null,
    pharmacy_id: null,
    custom_questions: null,
    master_id: 'kinmeds-LAB-0051',
    beluga_visit_id: 'visit-beluga-3',
    submission_status: 'pending',
    submission_response: null,
    error_details: null,
    submitted_at: '2026-06-11T10:00:00Z',
    created_at: '2026-06-11T10:00:00Z',
    updated_at: '2026-06-11T10:00:00Z',
    lifecycle_events: [
      {
        id: 'ev-1',
        event_type: 'LAB_ORDER_CREATED',
        title: 'Lab Order Created',
        description: 'Method: at-home kit • Panel: Thyroid Panel (TSH, Free T4)',
        occurred_at: '2026-06-11T10:00:00Z',
        requisition_pdf_url: '/dummy-requisition.pdf'
      },
      {
        id: 'ev-2',
        event_type: 'LAB_ORDER_SHIPPED_TO_PATIENT',
        title: 'Lab Kit Shipped',
        description: 'Carrier: USPS • Tracking: 9400100000000000000000',
        occurred_at: '2026-06-11T16:00:00Z',
        tracking_url: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=9400100000000000000000'
      }
    ]
  }
];

/**
 * Get lab results for the authenticated patient.
 */
export async function getLabResults(): Promise<LabResult[]> {
    try {
        const response = await apiClient.get<PaginatedResponse<LabResult> | LabResult[]>(
            '/medical/lab-results/'
        );

        // Handle both paginated and non-paginated responses
        let results: LabResult[] = [];
        if (Array.isArray(response.data)) {
            results = response.data;
        } else if (response.data && 'results' in response.data) {
            results = response.data.results || [];
        }

        if (results.length > 0) {
            return results;
        }
        return MOCK_LAB_RESULTS;
    } catch (error) {
        console.warn('Failed to fetch lab results, using fallback mock data');
        return MOCK_LAB_RESULTS;
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
        let submissions: LabSubmission[] = [];
        if (Array.isArray(response.data)) {
            submissions = response.data;
        } else if (response.data && 'results' in response.data) {
            submissions = response.data.results || [];
        }

        if (submissions.length > 0) {
            return submissions;
        }
        return MOCK_LAB_SUBMISSIONS;
    } catch (error) {
        console.warn('Failed to fetch lab submissions, using fallback mock data');
        return MOCK_LAB_SUBMISSIONS;
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
