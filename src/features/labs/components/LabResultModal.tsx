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
      <DialogContent className="max-w-xl km-billing-dialog" style={{ padding: 24 }}>
        {selectedPanel && (() => {
          const flagged = selectedPanel.biomarkers.filter(
            bm => bm.status_indicator === 'H' || bm.status_indicator === 'L',
          ).length;
          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18, borderBottom: '1px solid var(--km-b)', paddingBottom: 12 }}>
                <TestTube size={15} style={{ color: 'var(--km-tm)' }} />
                <span style={{ fontSize: 12, color: 'var(--km-tm)', fontFamily: 'monospace', fontWeight: 600 }}>
                  {selectedPanel.orderId}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: 'var(--km-s2)', borderRadius: 12, marginBottom: 14, border: '1px solid var(--km-b)' }}>
                <div style={{ width: 50, height: 50, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, border: '1px solid var(--km-b)', background: 'var(--km-s1)' }}>🧪</div>
                <div style={{ flex: 1, minWidth: 0 }}>
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
                <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 8, fontSize: 12, color: 'var(--km-am)', fontWeight: 600 }}>
                  Remaining markers still processing.
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'Collected', value: formatDate(selectedPanel.collectedDate) },
                  { label: 'Reported', value: formatDate(selectedPanel.reportedDate) },
                  {
                    label: 'Flagged',
                    value: flagged > 0 ? `${flagged} of ${selectedPanel.biomarkers.length}` : `0 of ${selectedPanel.biomarkers.length}`,
                    color: flagged > 0 ? 'var(--km-re)' : 'var(--km-gr)',
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ flex: 1, background: 'var(--km-s2)', border: '1px solid var(--km-b)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, color: 'var(--km-tm)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 700 }}>{label}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 2, ...(color ? { color } : {}) }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'var(--km-s2)', border: '1px solid var(--km-b)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr .8fr 1fr .8fr', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--km-b)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--km-tm)', fontWeight: 700 }}>
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
                      <div key={bm.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr .8fr 1fr .8fr', gap: 8, alignItems: 'center', padding: '11px 14px', borderBottom: '1px solid var(--km-b)' }}>
                        <div style={{ fontSize: 12.5, fontWeight: isCritical ? 700 : 500, color: isCritical ? '#991b1b' : 'inherit' }}>{bm.test_name}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: col }}>
                          {bm.test_result} <span style={{ fontSize: 9, color: isCritical ? '#ef4444' : 'var(--km-tm)', fontWeight: 500 }}>{bm.test_result_units}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--km-tm)' }}>{bm.reference_range || 'N/A'}</div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={`km-badge ${badgeCls}`} style={{ fontSize: 9, padding: '2px 6px', fontWeight: isCritical ? 800 : undefined, border: isCritical ? '1px solid #fca5a5' : 'none' }}>
                            {isCritical ? 'Critical' : isHigh ? 'High' : isLow ? 'Low' : 'Normal'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p style={{ fontSize: 11.5, color: 'var(--km-tm)', marginTop: 14, lineHeight: 1.5 }}>
                These results have also been shared with your ordering provider.
              </p>
              <button
                className="km-btn km-btn-primary"
                style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}
                onClick={() => onDownloadPdf(selectedPanel)}
                disabled={downloadingPdf}
              >
                <Download size={14} /> {downloadingPdf ? 'Downloading...' : `${selectedPanel.status === 'Partial Results' ? 'Download partial results' : 'Download results'} (PDF)`}
              </button>
            </div>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}
