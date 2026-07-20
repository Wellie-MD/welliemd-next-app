export const CLINICAL_STATUS_LABELS: Record<string, string> = {
    awaiting_prescription: 'Awaiting prescription',
    clinical_review: 'Clinical review',
    prescription_settling: 'Prescription processing',
    prescription_settled: 'Prescription complete',
};

export const CLINICAL_STATUS_CLASSES: Record<string, string> = {
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
};
