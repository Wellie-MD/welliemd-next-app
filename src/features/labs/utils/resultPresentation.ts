import type { GroupedLabPanel } from './types';

const FLAGGED_VALUES = new Set(['h', 'l', 'high', 'low', 'abnormal', 'critical']);

export function panelFlaggedCount(panel: GroupedLabPanel): number {
  return panel.biomarkers.filter((result) => {
    const indicator = String(result.status_indicator || '').toLowerCase();
    const interpretation = String(result.result_interpretation || '').toLowerCase();
    return FLAGGED_VALUES.has(indicator) || /high|low|abnormal|critical/.test(interpretation);
  }).length;
}

export function panelReportedTimestamp(panel: GroupedLabPanel): number {
  return new Date(panel.reportedDate || panel.collectedDate || 0).getTime() || 0;
}
