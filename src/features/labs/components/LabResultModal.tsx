/**
 * LabResultModal — patient lab results dialog.
 * Extracted from LabsPage to stay under 600 lines.
 */
import { Download, TestTube } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { type GroupedLabPanel } from '../utils/index';
import { formatDate, formatMoney } from '../utils/index';
import { labCollectionMethodLabel } from '../constants/collectionMethods';

interface Props {
  selectedPanel: GroupedLabPanel | null;
  onClose: () => void;
  downloadingPdf: boolean;
  onDownloadPdf: (panel: GroupedLabPanel) => void;
}

export default function LabResultModal({ selectedPanel, onClose, downloadingPdf, onDownloadPdf }: Props) {
  return (
    <Dialog open={selectedPanel !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="km-billing-dialog km-lab-result-dialog" style={{ padding: 0 }}>
        {selectedPanel && (() => {
          const flagged = selectedPanel.biomarkers.filter(
            bm => bm.status_indicator === 'H' || bm.status_indicator === 'L',
          ).length;
          return (
            <div className="km-lab-result-content">
              <div className="km-lab-result-header">
                <TestTube size={15} style={{ color: 'var(--km-tm)' }} />
                <span style={{ fontSize: 12, color: 'var(--km-tm)', fontFamily: 'monospace', fontWeight: 600 }}>
                  {selectedPanel.orderId}
                </span>
              </div>

              <div className="km-lab-result-summary">
                <div className="km-lab-result-icon-box">🧪</div>
                <div className="km-lab-result-summary-copy">
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--km-t)', marginBottom: 2 }}>{selectedPanel.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--km-tm)' }}>
                    {selectedPanel.lab} · {labCollectionMethodLabel(selectedPanel.collectionMethod)} · {formatMoney(selectedPanel.amount)}
                  </div>
                </div>
                {selectedPanel.status === 'Partial Results' ? (
                  <span className="km-badge km-badge-amber" style={{ fontSize: 11 }}>Partial Results</span>
                ) : selectedPanel.status === 'Critical' ? (
                  <span className="km-badge km-badge-red" style={{ fontSize: 11 }}>Critical</span>
                ) : (
                  <span className="km-badge km-badge-green" style={{ fontSize: 11 }}>Results Ready</span>
                )}
              </div>

              {selectedPanel.status === 'Partial Results' && (
                <div className="km-lab-result-notice">
                  Remaining markers still processing.
                </div>
              )}

              {selectedPanel.appointmentDetails?.scheduled_start && (
                <div className="km-lab-result-appointment">
                  <strong style={{ color: 'var(--km-t)' }}>Collection appointment:</strong>{' '}
                  {new Intl.DateTimeFormat(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: selectedPanel.appointmentDetails.timezone || undefined,
                  }).format(new Date(selectedPanel.appointmentDetails.scheduled_start))}
                  {selectedPanel.appointmentDetails.timezone ? ` (${selectedPanel.appointmentDetails.timezone})` : ''}
                  {selectedPanel.appointmentDetails.provider ? ` · ${selectedPanel.appointmentDetails.provider}` : ''}
                  {selectedPanel.appointmentDetails.status ? ` · ${selectedPanel.appointmentDetails.status}` : ''}
                </div>
              )}

              <div className="km-lab-result-meta">
                {[
                  { label: 'Collected', value: formatDate(selectedPanel.collectedDate) },
                  { label: 'Reported', value: formatDate(selectedPanel.reportedDate) },
                  {
                    label: 'Flagged',
                    value: flagged > 0 ? `${flagged} of ${selectedPanel.biomarkers.length}` : `0 of ${selectedPanel.biomarkers.length}`,
                    color: flagged > 0 ? 'var(--km-re)' : 'var(--km-gr)',
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="km-lab-result-meta-card">
                    <div style={{ fontSize: 9, color: 'var(--km-tm)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 700 }}>{label}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 2, ...(color ? { color } : {}) }}>{value}</div>
                  </div>
                ))}
              </div>

              <div className="km-lab-result-table">
                <div className="km-lab-result-table-header">
                  <div>Biomarker</div><div>Result</div><div>Reference</div><div style={{ textAlign: 'right' }}>Flag</div>
                </div>
                <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {selectedPanel.biomarkers.map((bm) => {
                    const indicator = String(bm.status_indicator || '').toLowerCase();
                    const interpretation = bm.result_interpretation?.toLowerCase() || '';
                    const isCritical = (indicator === 'h' && interpretation.includes('critical')) || indicator === 'critical' || interpretation.includes('critical');
                    const isHigh = !isCritical && (bm.status_indicator === 'H' || bm.result_interpretation?.toLowerCase().includes('high'));
                    const isLow = bm.status_indicator === 'L' || bm.result_interpretation?.toLowerCase().includes('low');
                    const col = isCritical ? '#991b1b' : isHigh ? 'var(--km-re)' : isLow ? 'var(--km-am)' : 'var(--km-t)';
                    const badgeCls = isCritical ? 'km-badge-red' : isHigh ? 'km-badge-red' : isLow ? 'km-badge-amber' : 'km-badge-green';
                    return (
                      <div key={bm.id} className="km-lab-result-table-row">
                        <div className="km-lab-result-name" style={{ fontWeight: isCritical ? 700 : 500, color: isCritical ? '#991b1b' : 'inherit' }}>{bm.test_name}</div>
                        <div className="km-lab-result-value" style={{ color: col }}>
                          {bm.test_result} <span style={{ fontSize: 9, color: isCritical ? '#ef4444' : 'var(--km-tm)', fontWeight: 500 }}>{bm.test_result_units}</span>
                        </div>
                        <div className="km-lab-result-reference">{bm.reference_range || 'N/A'}</div>
                        <div className="km-lab-result-flag">
                          <span className={`km-badge ${badgeCls}`} style={{ fontSize: 9, padding: '2px 6px', fontWeight: isCritical ? 800 : undefined, border: isCritical ? '1px solid #fca5a5' : 'none' }}>
                            {isCritical ? 'Critical' : isHigh ? 'High' : isLow ? 'Low' : 'Normal'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="km-lab-result-disclaimer">
                These results have also been shared with your ordering provider.
              </p>
              {selectedPanel.pdfAvailable && <button
                className="km-btn km-btn-primary"
                style={{ width: '100%', marginTop: 16, justifyContent: 'center', minHeight: 42 }}
                onClick={() => onDownloadPdf(selectedPanel)}
                disabled={downloadingPdf}
              >
                <Download size={14} /> {downloadingPdf ? 'Downloading...' : `${selectedPanel.status === 'Partial Results' ? 'Download partial results' : 'Download results'} (PDF)`}
              </button>}
            </div>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}
