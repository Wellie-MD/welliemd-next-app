export const TREATMENT_CLINICAL_STATUS_LABELS: Record<string, string> = {
  prescription_pending: "Awaiting prescription",
  clinical_review_required: "Clinical review",
  settlement_pending: "Prescription settling",
  awaiting_prescription: "Awaiting prescription",
  clinical_review: "Clinical review",
  prescription_settling: "Prescription settling",
  prescription_settled: "Prescription settled",
}

export const TREATMENT_CLINICAL_STATUS_STYLES: Record<string, string> = {
  prescription_pending:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
  clinical_review_required:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200",
  settlement_pending:
    "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200",
  awaiting_prescription:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
  clinical_review:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200",
  prescription_settling:
    "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200",
  prescription_settled:
    "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200",
}

export const SETTLEMENT_STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  pending: "Pending",
  patient_settled: "Patient settled",
  reimbursement_pending: "Reimbursement pending",
  settled: "Settled",
  manual_action: "Manual review",
  superseded: "Superseded",
}

export const SUPPORT_OWNER_LABELS: Record<string, string> = {
  clinical_support: "Clinical support",
  payment_support: "Payment support",
  billing_support: "Billing support",
  reconciliation_support: "Reconciliation support",
}

export const SUPPORT_PENDING_REASON_LABELS: Record<string, string> = {
  clinical_facts_unresolved: "Provider facts require clinical resolution",
  patient_settlement_pending: "Patient settlement is pending",
  reimbursement_pending: "Client reimbursement is pending",
  manual_reconciliation: "Manual reconciliation is required",
}

export const LAB_GATE_STATUS_LABELS: Record<string, string> = {
  awaiting_results: "Awaiting results",
  partial_results: "Partial results",
  results_ready: "Results complete",
  recollection_required: "Redraw required",
  failed: "Needs support",
}

export const PROVIDER_REVIEW_STATUS_LABELS: Record<string, string> = {
  not_required: "No provider review gate",
  held_for_labs: "Provider review held for labs",
  ready_for_submission: "Ready for provider review",
  submitted: "Submitted for provider review",
  complete: "Provider review complete",
}

export const RECOLLECTION_ACTION_LABELS: Record<string, string> = {
  view_collection_instructions: "Replacement submitted; patient can follow collection instructions",
  wait_for_replacement: "No-charge replacement is being prepared",
  contact_support: "Support reconciliation required",
}
