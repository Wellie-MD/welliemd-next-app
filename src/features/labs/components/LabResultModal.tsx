/**
 * LabResultModal — patient lab results dialog.
 * Extracted from LabsPage to stay under 600 lines.
 */
import { Download, TestTube } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { type GroupedLabPanel } from '../utils/index';
import { formatDate } from '../utils/index';

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
                    {selectedPanel.lab} · {selectedPanel.biomarkers.length} biomarkers
                  </div>
                </div>
                <span className="km-badge km-badge-green" style={{ fontSize: 11 }}>Results Ready</span>
              </div>

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
                    const isHigh = bm.status_indicator === 'H' || bm.result_interpretation?.toLowerCase().includes('high');
                    const isLow = bm.status_indicator === 'L' || bm.result_interpretation?.toLowerCase().includes('low');
                    const col = isHigh ? 'var(--km-re)' : isLow ? 'var(--km-am)' : 'var(--km-t)';
                    const badgeCls = isHigh ? 'km-badge-red' : isLow ? 'km-badge-amber' : 'km-badge-green';
                    return (
                      <div key={bm.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr .8fr 1fr .8fr', gap: 8, alignItems: 'center', padding: '11px 14px', borderBottom: '1px solid var(--km-b)' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500 }}>{bm.test_name}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: col }}>
                          {bm.test_result} <span style={{ fontSize: 9, color: 'var(--km-tm)', fontWeight: 500 }}>{bm.test_result_units}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--km-tm)' }}>{bm.reference_range || 'N/A'}</div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={`km-badge ${badgeCls}`} style={{ fontSize: 9, padding: '2px 6px' }}>
                            {isHigh ? 'High' : isLow ? 'Low' : 'Normal'}
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
                <Download size={14} /> {downloadingPdf ? 'Downloading...' : 'Download report (PDF)'}
              </button>
            </div>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}
