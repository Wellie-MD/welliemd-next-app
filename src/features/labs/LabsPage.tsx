/**
 * Labs page — patient portal.
 *
 * Prototype layout: three buckets (no tabs):
 *   1. Needs your attention
 *   2. In progress
 *   3. Recent results
 *
 * Source: Patient_Portal (1).html — pg-labs div with #labAttn, #labProg, #labDone
 */
import { useState, useEffect, useMemo } from 'react';
import { Search, Download } from 'lucide-react';
import {
  getLabResults,
  getLabSubmissions,
  getStandaloneLabSubmissions,
  getStandaloneLabResults,
  downloadStandaloneLabResultPdf,
  downloadStandaloneLabRequisitionPdf,
  type LabResult,
  type LabSubmission,
  type StandaloneLabResult,
  type StandaloneLabSubmission,
} from './api/index';
import {
  formatDate,
  normalizeTimeline,
  type GroupedLabPanel,
} from './utils/index';
import LabResultModal from './components/LabResultModal';

// ── helpers ──────────────────────────────────────────────────────────────────

const COLLECTION_LABELS: Record<string, string> = {
  at_home_phlebotomy: 'At-home phlebotomy',
  walk_in_test: 'Walk-in lab draw',
  testkit: 'At-home test kit',
  on_site_collection: 'On-site collection',
};

function collectionLabel(method?: string) {
  return method ? (COLLECTION_LABELS[method] ?? method.replace(/_/g, ' ')) : '—';
}

const STAGE_LABELS: Record<string, string> = {
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

function stageLabel(stage?: string) {
  const key = (stage ?? '').toLowerCase().replace(/ /g, '_');
  return STAGE_LABELS[key] ?? key.replace(/_/g, ' ');
}

// Badge class based on submission_status
function statusBadgeCls(status?: string) {
  if (status === 'completed') return 'km-badge-green';
  if (status === 'submitted') return 'km-badge-blue';
  if (status === 'pending') return 'km-badge-amber';
  if (status === 'failed') return 'km-badge-red';
  return 'km-badge-amber';
}

// ── sub-components ────────────────────────────────────────────────────────────

function BucketLabel({ children }: { children: string }) {
  return (
    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--km-tm)', fontWeight: 700, margin: '2px 0 9px' }}>
      {children}
    </div>
  );
}

function EmptyBucket() {
  return <div style={{ fontSize: 12, color: 'var(--km-tm)', paddingBottom: 8 }}>None at the moment.</div>;
}

// ── main component ────────────────────────────────────────────────────────────

export default function LabsPage() {
  // Visit-based (Beluga) data
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [labSubmissions, setLabSubmissions] = useState<LabSubmission[]>([]);
  // Standalone Junction data
  const [standaloneResults, setStandaloneResults] = useState<StandaloneLabResult[]>([]);
  const [standaloneSubmissions, setStandaloneSubmissions] = useState<StandaloneLabSubmission[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [selectedPanel, setSelectedPanel] = useState<GroupedLabPanel | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [results, submissions, sResults, sSubmissions] = await Promise.all([
        getLabResults(),
        getLabSubmissions(),
        getStandaloneLabResults(),
        getStandaloneLabSubmissions(),
      ]);
      setLabResults(results);
      setLabSubmissions(submissions);
      setStandaloneResults(sResults);
      setStandaloneSubmissions(sSubmissions);
    } catch {
      setError('Failed to load lab data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── data transforms ──────────────────────────────────────────────────────

  // Group visit-based biomarker rows into panels (each external_order_id = one panel)
  const visitPanels = useMemo<GroupedLabPanel[]>(() => {
    const groups: Record<string, LabResult[]> = {};
    labResults.forEach(r => {
      const key = r.external_order_id || r.visit || r.id;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return Object.entries(groups).map(([orderId, list]) => ({
      orderId,
      name: list[0]?.test_name || 'Lab Panel',
      // Use real lab from first result's source system field if available
      lab: list[0]?.source_system === 'junction' ? (list[0] as any).lab_provider || 'Junction Lab' : 'Lab',
      collectedDate: list[0]?.screening_date || list[0]?.created_at || '',
      reportedDate: list[0]?.report_date || list[0]?.updated_at || '',
      biomarkers: list,
      status: 'Results Ready',
    }));
  }, [labResults]);

  // Standalone results mapped to GroupedLabPanel shape
  const standalonePanels = useMemo<GroupedLabPanel[]>(() => {
    return standaloneResults.map(r => ({
      orderId: r.order_id,
      standaloneOrderId: r.order_id,
      name: r.lab_panel_name || 'Lab Panel',
      lab: r.lab_provider || '—',
      collectedDate: r.collected_at || '',
      reportedDate: r.reported_at || '',
      status: r.status === 'critical' ? 'Critical' : 'Results Ready',
      biomarkers: (r.biomarkers || []).map((bm, idx) => ({
        id: `${r.order_id}-${idx}`,
        patient: '', patient_name: '', visit: null,
        source_system: 'junction' as const,
        external_order_id: r.order_id,
        test_name: bm.biomarker,
        test_result: bm.result,
        test_result_units: bm.units || '',
        reference_range: bm.reference_range || '',
        status_indicator: (bm.flag === 'high' || bm.flag === 'critical' ? 'H' : bm.flag === 'low' ? 'L' : 'N') as 'H' | 'L' | 'N',
        result_interpretation: bm.interpretation || '',
        screening_date: r.collected_at || '',
        report_date: r.reported_at || '',
        sample_source: 'BLOOD' as const,
        test_to_treat: false,
        submission_status: r.status,
        beluga_visit_id: null,
        submitted_at: r.reported_at,
        created_at: r.collected_at || '',
        updated_at: r.reported_at || '',
      } as LabResult)),
    }));
  }, [standaloneResults]);

  // All panels for "Recent results" bucket
  const allPanels = useMemo(() => [...standalonePanels, ...visitPanels], [standalonePanels, visitPanels]);

  // All submissions for "Needs attention" and "In progress" buckets
  const allSubmissions = useMemo<LabSubmission[]>(() => {
    const standaloneMapped: LabSubmission[] = standaloneSubmissions.map(s => ({
      id: s.id,
      visit: '',
      patient_name: s.patient_name,
      lab_results: [],
      patient_medications: [],
      test_to_treat: false,
      patient_preferences: null,
      pharmacy_id: null,
      custom_questions: null,
      master_id: s.id,
      beluga_visit_id: null,
      submission_status: (s.submission_status as LabSubmission['submission_status']) || 'pending',
      submission_response: null,
      error_details: null,
      submitted_at: s.submitted_at,
      created_at: s.submitted_at || new Date().toISOString(),
      updated_at: s.submitted_at || new Date().toISOString(),
      lifecycle_events: s.lifecycle_events || [],
      requisition_pdf_url: s.requisition_pdf_url,
      requisition_available: s.requisition_available,
      booking_link: s.booking_link,
      // Carry through provider + collection info from standalone
      _lab_panel_name: (s as any).lab_panel_name,
      _lab_provider: (s as any).lab_provider,
      _collection_method: (s as any).collection_method,
      _collection_method_display: (s as any).collection_method_display,
      _stage: (s as any).stage,
      _stage_display: (s as any).stage_display,
      _bucket: (s as any).bucket,
    } as any));
    return [...standaloneMapped, ...labSubmissions];
  }, [standaloneSubmissions, labSubmissions]);

  // ── search filter ────────────────────────────────────────────────────────

  const q = searchTerm.toLowerCase().trim();

  const filteredPanels = useMemo(() => {
    if (!q) return allPanels;
    return allPanels.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.orderId.toLowerCase().includes(q) ||
      p.lab.toLowerCase().includes(q),
    );
  }, [allPanels, q]);

  const filteredSubmissions = useMemo(() => {
    if (!q) return allSubmissions;
    return allSubmissions.filter(s => {
      const name = ((s as any)._lab_panel_name || '').toLowerCase();
      return s.id.toLowerCase().includes(q) || (s.master_id || '').toLowerCase().includes(q) || name.includes(q);
    });
  }, [allSubmissions, q]);

  // Buckets
  const needsAttention = filteredSubmissions.filter(s => {
    const bucket = ((s as any)._bucket || '').toLowerCase();
    const stage = ((s as any)._stage || '').toLowerCase();
    return bucket === 'needs_attention' || stage.includes('appointment_pending') || stage.includes('kit_delivered') || s.submission_status === 'failed';
  });
  const inProgress = filteredSubmissions.filter(s => {
    const bucket = ((s as any)._bucket || '').toLowerCase();
    const stage = ((s as any)._stage || '').toLowerCase();
    return bucket === 'in_progress' || (!bucket && !stage.includes('appointment_pending') && !stage.includes('kit_delivered') && s.submission_status !== 'failed');
  });

  // ── handlers ─────────────────────────────────────────────────────────────

  const handleDownloadPdf = async (panel: GroupedLabPanel) => {
    if (!panel.standaloneOrderId) {
      alert('A downloadable PDF is not available for this result.');
      return;
    }
    setDownloadingPdf(true);
    try {
      const blob = await downloadStandaloneLabResultPdf(panel.standaloneOrderId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lab-result-${panel.orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download the result PDF. Please try again or contact support.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadRequisition = async (orderId: string) => {
    try {
      const blob = await downloadStandaloneLabRequisitionPdf(orderId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lab-requisition-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download the requisition PDF. Please try again or contact support.');
    }
  };

  // ── render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="pg">
        <h1 className="km-page-title">Labs</h1>
        <p className="km-page-sub">View your lab results</p>
        <div className="km-sc"><div className="km-empty"><div className="km-et">Loading lab data…</div></div></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pg">
        <h1 className="km-page-title">Labs</h1>
        <div className="km-sc">
          <div className="km-empty">
            <div className="km-et" style={{ color: 'var(--km-re)' }}>Error Loading Labs</div>
            <div className="km-es">{error}</div>
            <button onClick={loadData} className="km-btn km-btn-primary" style={{ marginTop: 12 }}>Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pg">
      <h1 className="km-page-title">Labs</h1>
      <p className="km-page-sub">View your lab results</p>

      {/* Search */}
      <div className="km-swrap km-fade" style={{ marginBottom: 14 }}>
        <Search size={16} />
        <input className="km-sinp" placeholder="Search lab results…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div id="labResultsPanel">
        {/* Bucket 1: Needs your attention */}
        <BucketLabel>Needs your attention</BucketLabel>
        <div id="labAttn">
          {needsAttention.length === 0 ? <EmptyBucket /> : (
            <div className="km-dash-card" style={{ marginBottom: 18 }}>
              {needsAttention.map(sub => (
                <SubmissionCard
                  key={sub.id}
                  sub={sub}
                  expanded={expandedSubmission === sub.id}
                  onToggle={() => setExpandedSubmission(v => v === sub.id ? null : sub.id)}
                  onDownloadRequisition={handleDownloadRequisition}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bucket 2: In progress */}
        <BucketLabel>In progress</BucketLabel>
        <div id="labProg">
          {inProgress.length === 0 ? <EmptyBucket /> : (
            <div className="km-dash-card" style={{ marginBottom: 18 }}>
              {inProgress.map(sub => (
                <SubmissionCard
                  key={sub.id}
                  sub={sub}
                  expanded={expandedSubmission === sub.id}
                  onToggle={() => setExpandedSubmission(v => v === sub.id ? null : sub.id)}
                  onDownloadRequisition={handleDownloadRequisition}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bucket 3: Recent results */}
        <BucketLabel>Recent results</BucketLabel>
        <div id="labDone">
          {filteredPanels.length === 0 ? <EmptyBucket /> : (
            <div className="km-dash-card">
              {filteredPanels.map(panel => {
                const flagged = panel.biomarkers.filter(b => b.status_indicator === 'H' || b.status_indicator === 'L').length;
                return (
                  <div key={panel.orderId} className="km-oitem" onClick={() => setSelectedPanel(panel)}>
                    <div className="km-oimg" style={{ background: 'rgba(34,197,94,0.1)' }}>🧪</div>
                    <div className="km-oileft">
                      <div className="km-oiid">
                        {panel.orderId}{' '}
                        <span className="km-badge km-badge-green" style={{ fontSize: 10, marginLeft: 6 }}>Results Ready</span>
                      </div>
                      <div className="km-oinm">{panel.name}</div>
                      {/* Use backend lab + biomarker count — never hardcode */}
                      <div className="km-oiph">{panel.lab} · {panel.biomarkers.length} biomarkers</div>
                    </div>
                    <div className="km-oiright">
                      {flagged > 0
                        ? <div className="km-oiamt" style={{ fontSize: 12, color: 'var(--km-re)' }}>{flagged} flagged</div>
                        : <div className="km-oiamt" style={{ fontSize: 12, color: 'var(--km-gr)' }}>Normal</div>}
                      <div className="km-oidt">{formatDate(panel.collectedDate)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <LabResultModal
        selectedPanel={selectedPanel}
        onClose={() => setSelectedPanel(null)}
        downloadingPdf={downloadingPdf}
        onDownloadPdf={handleDownloadPdf}
      />
    </div>
  );
}

export { LabsPage };

// ── SubmissionCard sub-component ──────────────────────────────────────────────

function SubmissionCard({ sub, expanded, onToggle, onDownloadRequisition }: {
  sub: LabSubmission & any;
  expanded: boolean;
  onToggle: () => void;
  onDownloadRequisition: (orderId: string) => void;
}) {
  const timelineItems = normalizeTimeline(sub);
  const panelName = sub._lab_panel_name || (sub.lab_results?.[0]?.test_name) || 'Lab Panel';
  const provider = sub._lab_provider || '—';
  const collection = sub._collection_method_display || collectionLabel(sub._collection_method);
  const stage = sub._stage_display || stageLabel(sub._stage || sub.submission_status);

  return (
    <div style={{ borderBottom: '1px solid var(--km-b)' }}>
      <div className="km-oitem" onClick={onToggle}>
        <div className="km-oimg" style={{ background: 'rgba(245,158,11,0.1)' }}>🧪</div>
        <div className="km-oileft">
          <div className="km-oiid">
            {sub.id.substring(0, 16).toUpperCase()}{' '}
            <span className={`km-badge ${statusBadgeCls(sub.submission_status)}`} style={{ fontSize: 10, marginLeft: 6 }}>
              {stage}
            </span>
          </div>
          <div className="km-oinm">{panelName}</div>
          {/* Use backend lab_provider + collection_method_display — never hardcode */}
          <div className="km-oiph">{provider}{collection ? ` · ${collection}` : ''}</div>
        </div>
        <div className="km-oiright">
          <div className="km-oidt">{formatDate(sub.created_at)}</div>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '16px 20px', background: 'var(--km-s2)' }}>
          {/* Requisition / booking links */}
          {(sub.requisition_pdf_url || sub.requisition_available || sub.booking_link || sub.booking_url) && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {(sub.requisition_pdf_url || sub.requisition_available) && (
                <button type="button" onClick={() => onDownloadRequisition(sub.id)} className="km-btn km-btn-outline" style={{ fontSize: 11, padding: '5px 12px' }}>
                  Download requisition
                </button>
              )}
              {(sub.booking_link || sub.booking_url) && (
                <a href={sub.booking_link || sub.booking_url} target="_blank" rel="noreferrer" className="km-btn km-btn-outline" style={{ fontSize: 11, padding: '5px 12px' }}>
                  📅 Book appointment
                </a>
              )}
            </div>
          )}

          {/* Timeline */}
          {timelineItems.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--km-tm)', letterSpacing: '.5px', marginBottom: 12 }}>Timeline</div>
              {timelineItems.map((item, index) => {
                const isLast = index === timelineItems.length - 1;
                return (
                  <div key={item.id} style={{ position: 'relative', paddingLeft: 24, paddingBottom: isLast ? 0 : 20 }}>
                    {!isLast && <div style={{ position: 'absolute', left: 4, top: 16, bottom: -4, width: '1.5px', background: 'var(--km-b)' }} />}
                    <div style={{ position: 'absolute', left: 1, top: 6, width: 8, height: 8, borderRadius: '50%', background: 'var(--km-ac)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--km-t)', lineHeight: 1.2 }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--km-tm)', marginTop: 4, lineHeight: 1.4 }}>{item.description}</div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--km-tm)', fontWeight: 500, whiteSpace: 'nowrap' }}>{formatDate(item.occurredAt)}</div>
                    </div>
                    {item.actions.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                        {item.actions.map((act, idx) => (
                          act.label === 'Download Requisition' ? (
                            <button key={idx} type="button" onClick={() => onDownloadRequisition(sub.id)} className="km-btn km-btn-outline" style={{ fontSize: 11, padding: '5px 12px' }}>
                              {act.label}
                            </button>
                          ) : (
                            <a key={idx} href={act.url} target="_blank" rel="noreferrer" className="km-btn km-btn-outline" style={{ fontSize: 11, padding: '5px 12px' }}>
                              {act.label}
                            </a>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
