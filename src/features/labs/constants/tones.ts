export function labSubmissionBadgeTone(status?: string) {
  if (status === 'completed') return 'km-badge-green';
  if (status === 'submitted') return 'km-badge-blue';
  if (status === 'pending') return 'km-badge-amber';
  if (status === 'failed') return 'km-badge-red';
  return 'km-badge-amber';
}
