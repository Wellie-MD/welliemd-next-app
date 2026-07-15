/**
 * TypeScript contracts for the labs feature API layer.
 * Interfaces match the Django backend's serializer output.
 */

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
    requisition_available?: boolean;
    booking_link?: string | null;
    booking_url?: string | null;
    appointment_details?: LabAppointmentDetails | null;
    lab_panel_name?: string;
    lab_provider?: string;
    collection_method?: string;
    collection_method_display?: string;
    stage?: string;
    stage_display?: string;
    bucket?: string;
    panel_tests?: string[];
    amount?: { amount: string; currency: string };
    results_status?: string;
    results_available?: boolean;
    pdf_available?: boolean;
    result_count?: number;
    flagged_count?: number;
}

// ---------------------------------------------------------------------------
// Standalone Junction lab storefront orders (post-checkout history + results)
// ---------------------------------------------------------------------------

export interface StandaloneLabResultRow {
    id: string;
    biomarker: string;
    result: string;
    units: string;
    reference_range: string;
    flag: 'normal' | 'high' | 'low' | 'abnormal' | 'critical' | 'unknown';
    interpretation: string;
    loinc: string;
    provider_id: string;
    collected_at: string | null;
    reported_at: string | null;
}

export interface StandaloneLabResult {
    id: string;
  order_id: string;
  display_id: string;
    lab_panel_id: string;
    lab_panel_name: string;
    lab_provider: string;
    collection_method?: string;
    status: string;
    amount?: { amount: string; currency: string };
    flagged_count: number;
    collected_at: string | null;
    reported_at: string | null;
    pdf_url: string | null;
    pdf_available?: boolean;
    biomarkers: StandaloneLabResultRow[];
    lifecycle_events?: Array<Record<string, unknown>>;
    appointment_details?: LabAppointmentDetails | null;
    booking_url?: string | null;
    requisition_available?: boolean;
}

export interface StandaloneLabSubmission {
    id: string;
    master_id?: string | null;
    patient_name: string;
    lab_panel_name: string;
    lab_provider: string;
    submission_status: string;
    submitted_at: string | null;
    requisition_pdf_url: string | null;
    requisition_available?: boolean;
    booking_link: string | null;
    booking_url?: string | null;
    appointment_details?: LabAppointmentDetails | null;
    amount?: { amount: string; currency: string };
    results_status?: string;
    results_available?: boolean;
    pdf_available?: boolean;
    result_count?: number;
    flagged_count?: number;
    panel_tests?: string[];
    collection_method?: string;
    collection_method_display?: string;
    stage?: string;
    stage_display?: string;
    bucket?: string;
    lifecycle_events: Array<Record<string, unknown>>;
}

export interface LabAppointmentDetails {
    id: string;
    status: string;
    provider: string;
    scheduled_start: string | null;
    scheduled_end: string | null;
    timezone: string;
    view_url: string | null;
    can_reschedule: boolean;
}

export interface PaginatedResponse<T> {
    results: T[];
    count?: number;
    next?: string | null;
    previous?: string | null;
}
