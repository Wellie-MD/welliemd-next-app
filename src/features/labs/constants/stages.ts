export const LAB_STAGE_LABELS: Record<string, string> = {
  ordered: 'Ordered',
  requisition_created: 'Requisition created',
  appointment_pending: 'Appointment pending',
  appointment_scheduled: 'Appointment booked',
  sample_collected: 'Sample collected',
  at_lab: 'At the lab',
  partial_results: 'Partial results',
  results_ready: 'Results ready',
  critical: 'Results ready',
  kit_shipped: 'Kit shipped',
  kit_delivered: 'Kit delivered',
  junction_submitted: 'Ordered',
  failed: 'Failed',
};

export function labStageLabel(stage?: string) {
  const key = (stage ?? '').toLowerCase().replace(/ /g, '_');
  return LAB_STAGE_LABELS[key] ?? key.replace(/_/g, ' ');
}
