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
  prescription_pending: "border-slate-200 bg-slate-100 text-slate-700",
  clinical_review_required: "border-amber-200 bg-amber-50 text-amber-800",
  settlement_pending: "border-blue-200 bg-blue-50 text-blue-800",
  awaiting_prescription: "border-slate-200 bg-slate-100 text-slate-700",
  clinical_review: "border-amber-200 bg-amber-50 text-amber-800",
  prescription_settling: "border-blue-200 bg-blue-50 text-blue-800",
  prescription_settled: "border-green-200 bg-green-50 text-green-800",
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
