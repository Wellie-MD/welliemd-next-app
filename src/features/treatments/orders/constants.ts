export const TREATMENT_CLINICAL_STATUS_LABELS: Record<string, string> = {
  awaiting_prescription: "Awaiting prescription",
  clinical_review: "Clinical review",
  prescription_settling: "Prescription settling",
  prescription_settled: "Prescription settled",
}

export const TREATMENT_CLINICAL_STATUS_STYLES: Record<string, string> = {
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
}
