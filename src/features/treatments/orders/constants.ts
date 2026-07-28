export const CLINICAL_STATUS_LABELS: Record<string, string> = {
    prescription_pending: 'Awaiting prescription',
    clinical_review_required: 'Clinical review',
    settlement_pending: 'Prescription processing',
    awaiting_prescription: 'Awaiting prescription',
    clinical_review: 'Clinical review',
    prescription_settling: 'Prescription processing',
    prescription_settled: 'Prescription complete',
};

export const CLINICAL_STATUS_CLASSES: Record<string, string> = {
    prescription_pending: 'km-badge km-badge-gray',
    clinical_review_required: 'km-badge km-badge-amber',
    settlement_pending: 'km-badge km-badge-blue',
    awaiting_prescription: 'km-badge km-badge-gray',
    clinical_review: 'km-badge km-badge-amber',
    prescription_settling: 'km-badge km-badge-blue',
    prescription_settled: 'km-badge km-badge-green',
};

export const SETTLEMENT_STATUS_LABELS: Record<string, string> = {
    not_started: 'Not started',
    pending: 'Processing',
    patient_settled: 'Payment processed',
    reimbursement_pending: 'Processing',
    settled: 'Complete',
    manual_action: 'Under review',
    superseded: 'Replaced by a newer prescription',
};

export const TREATMENT_LIFECYCLE_LABELS: Record<string, string> = {
    pending: 'Preparing treatment',
    awaiting_labs: 'Waiting for required labs',
    visit_pending: 'Preparing provider review',
    reauthorization_required: 'Payment authorization required',
    withdrawn: 'Treatment withdrawn',
};

export const LAB_GATE_STATUS_LABELS: Record<string, string> = {
    awaiting_results: 'Awaiting results',
    partial_results: 'Partial results',
    results_ready: 'Results complete',
    recollection_required: 'Redraw required',
    failed: 'Support is reviewing',
};

export const PROVIDER_REVIEW_STATUS_LABELS: Record<string, string> = {
    not_required: 'No provider review gate',
    held_for_labs: 'Provider review begins after labs',
    ready_for_submission: 'Ready for provider review',
    submitted: 'Submitted for provider review',
    complete: 'Provider review complete',
};

export const RECOLLECTION_ACTION_LABELS: Record<string, string> = {
    view_collection_instructions: 'A no-charge replacement is ready. Follow the collection instructions in Labs.',
    wait_for_replacement: 'Your no-charge replacement is being prepared.',
    contact_support: 'Support is reconciling the replacement order. You will not be charged again.',
};
