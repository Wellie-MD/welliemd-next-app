export const LAB_RESULT_STATUSES = new Set(['partial_results', 'results_ready', 'critical']);

export function hasLabResults(status?: string, resultsAvailable?: boolean) {
  return resultsAvailable === true || LAB_RESULT_STATUSES.has(String(status || '').toLowerCase());
}

export function labStatusTone(stage?: string, resultsStatus?: string) {
  const value = `${stage || ''} ${resultsStatus || ''}`.toLowerCase();
  if (value.includes('critical') || value.includes('partial')) return 'is-attention';
  if (value.includes('results_ready')) return 'is-results';
  if (value.includes('appointment_pending') || value.includes('requisition')) return 'is-attention';
  return 'is-progress';
}
