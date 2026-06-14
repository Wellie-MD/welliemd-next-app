import { useState, useEffect, useMemo } from 'react';
import {
  TestTube,
  Calendar,
  Search,
  Download,
  ExternalLink
} from 'lucide-react';
import { getLabResults, getLabSubmissions, type LabResult, type LabSubmission } from './api';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

interface TimelineAction {
  label: string;
  url: string;
}

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  occurredAt: string | null;
  sortTimestamp: number;
  sortOrder: number;
  actions: TimelineAction[];
}

function toSafeUrl(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getEventType(event: Record<string, any>): string {
  return (event.event_type || event.event || event.type || event.name || '').toUpperCase();
}

function getEventTimestamp(event: Record<string, any>): string | null {
  if (event.occurred_at || event.created_at || event.timestamp) {
    return event.occurred_at || event.created_at || event.timestamp || null;
  }
  return null;
}

function getEventTitle(event: Record<string, any>): string {
  if (event.title) return event.title;
  const eventType = getEventType(event);
  if (eventType === 'LAB_ORDER_REQUISITION_CREATED') return 'In-Person Lab Requisition Ready';
  if (eventType.length > 0) return eventType.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return 'Lab Update';
}

function getEventDescription(event: Record<string, any>): string {
  if (event.description) return event.description;
  const eventType = getEventType(event);
  if (eventType === 'LAB_ORDER_RESULTS') {
    return event.payload?.resultSummary || event.payload?.testResult || 'Lab results were posted.';
  }
  if (eventType === 'LAB_ORDER_SHIPPED_TO_PATIENT' || eventType === 'LAB_ORDER_SHIPPED_TO_LAB') {
    const carrier = event.payload?.carrier || event.payload?.info?.carrier;
    const tracking = event.payload?.trackingNumber || event.payload?.tracking || event.payload?.info?.tracking;
    if (carrier && tracking) return `Carrier: ${carrier} • Tracking: ${tracking}`;
    if (carrier) return `Carrier: ${carrier}`;
    if (tracking) return `Tracking: ${tracking}`;
  }
  return event.status ? `Status: ${event.status}` : 'Lab update received.';
}

function eventActions(event: Record<string, any>): TimelineAction[] {
  const actions: TimelineAction[] = [];
  const payload = event.payload || {};
  
  const rawLabReqPdf = payload.labReqPdf;
  const requisitionFromBase64 = rawLabReqPdf && !rawLabReqPdf.startsWith('http') && !rawLabReqPdf.startsWith('data:')
    ? `data:application/pdf;base64,${rawLabReqPdf}`
    : rawLabReqPdf;
  const requisitionUrl = toSafeUrl(event.requisition_pdf_url) || toSafeUrl(event.requisition_url) || toSafeUrl(event.requisition_link)
    || toSafeUrl(payload.requisitionPdfUrl) || toSafeUrl(requisitionFromBase64);
  const bookingUrl = toSafeUrl(event.booking_link) || toSafeUrl(event.booking_url) || toSafeUrl(event.result_booking_link) || toSafeUrl(event.result_booking_url)
    || toSafeUrl(payload.resultBookingLink) || toSafeUrl(payload.bookingLink) || toSafeUrl(payload.booking_url);
  const trackingUrl = toSafeUrl(event.tracking_url) || toSafeUrl(event.tracking_link) || toSafeUrl(event.tracking_link_url)
    || toSafeUrl(payload.trackingUrl) || toSafeUrl(payload.info?.trackingUrl);

  if (requisitionUrl) actions.push({ label: 'Download Requisition', url: requisitionUrl });
  if (bookingUrl) actions.push({ label: 'Book Appointment', url: bookingUrl });
  if (trackingUrl) actions.push({ label: 'Track Shipment', url: trackingUrl });

  return actions;
}

function normalizeTimeline(submission: LabSubmission): TimelineItem[] {
  const events = [
    ...(submission.events ?? []),
    ...(submission.lifecycle_events ?? []),
    ...(submission.activity_events ?? []),
  ];

  const seen = new Set<string>();
  const timeline: TimelineItem[] = [];

  events.forEach((event, index) => {
    const eventType = getEventType(event);
    const occurredAt = getEventTimestamp(event);
    const identity = [
      event.id || '',
      eventType,
      occurredAt || '',
      event.title || '',
      event.description || '',
    ].join('|');

    if (seen.has(identity)) return;
    seen.add(identity);

    const timestamp = occurredAt ? Date.parse(occurredAt) : Date.parse(submission.created_at);
    timeline.push({
      id: event.id || `${submission.id}-event-${index}`,
      title: getEventTitle(event),
      description: getEventDescription(event),
      occurredAt,
      sortTimestamp: Number.isFinite(timestamp) ? timestamp : 0,
      sortOrder: 5,
      actions: eventActions(event),
    });
  });

  const existingActionLabels = new Set(
    timeline.flatMap((item) => item.actions.map((action) => action.label))
  );
  const submissionActions: TimelineAction[] = [];
  const requisitionUrl = toSafeUrl(submission.requisition_pdf_url);
  const bookingUrl = toSafeUrl(submission.booking_link) || toSafeUrl(submission.booking_url);
  if (requisitionUrl && !existingActionLabels.has('Download Requisition')) {
    submissionActions.push({ label: 'Download Requisition', url: requisitionUrl });
  }
  if (bookingUrl && !existingActionLabels.has('Book Appointment')) {
    submissionActions.push({ label: 'Book Appointment', url: bookingUrl });
  }

  if (submissionActions.length > 0) {
    timeline.push({
      id: `${submission.id}-links`,
      title: 'Lab Order Links',
      description: 'Quick access to requisition and booking resources.',
      occurredAt: submission.created_at,
      sortTimestamp: Date.parse(submission.created_at),
      sortOrder: 100,
      actions: submissionActions,
    });
  }

  return timeline.sort((a, b) => b.sortTimestamp - a.sortTimestamp);
}

interface GroupedLabPanel {
  orderId: string;
  name: string;
  lab: string;
  collectedDate: string;
  reportedDate: string;
  biomarkers: LabResult[];
  status: string;
}

export default function LabsPage() {
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [labSubmissions, setLabSubmissions] = useState<LabSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'results' | 'submissions'>('results');
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [selectedPanel, setSelectedPanel] = useState<GroupedLabPanel | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [results, submissions] = await Promise.all([
        getLabResults(),
        getLabSubmissions(),
      ]);
      setLabResults(results);
      setLabSubmissions(submissions);
    } catch (err) {
      setError('Failed to load lab data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Group individual biomarkers into panels
  const groupedPanels = useMemo(() => {
    const groups: Record<string, LabResult[]> = {};
    labResults.forEach(r => {
      const key = r.external_order_id || r.visit || 'kinmeds-LAB-0042';
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });

    return Object.entries(groups).map(([orderId, list]) => {
      const names = list.map(r => r.test_name.toLowerCase());
      let name = 'Lab Test Panel';
      let lab = 'Quest Diagnostics'; 
      if (names.some(n => n.includes('cholesterol') || n.includes('lipid') || n.includes('hdl') || n.includes('ldl') || n.includes('triglyceride'))) {
        name = 'Lipid Panel';
        lab = 'LabCorp';
      } else if (names.some(n => n.includes('glucose') || n.includes('bun') || n.includes('creatinine') || n.includes('sodium') || n.includes('potassium') || n.includes('alt') || n.includes('ast'))) {
        name = 'Comprehensive Metabolic Panel';
        lab = 'Quest Diagnostics';
      } else if (names.some(n => n.includes('tsh') || n.includes('thyroid') || n.includes('t4') || n.includes('t3'))) {
        name = 'Thyroid Panel (TSH, Free T4)';
        lab = 'Quest Diagnostics';
      } else if (list.length > 0) {
        name = list[0].test_name;
      }

      const collectedDate = list[0]?.screening_date || list[0]?.created_at || '';
      const reportedDate = list[0]?.report_date || list[0]?.updated_at || '';

      return {
        orderId,
        name,
        lab,
        collectedDate,
        reportedDate,
        biomarkers: list,
        status: 'Results Ready'
      };
    });
  }, [labResults]);

  // Filter panels based on search term
  const filteredPanels = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return groupedPanels;
    return groupedPanels.filter(panel => 
      panel.name.toLowerCase().includes(term) ||
      panel.orderId.toLowerCase().includes(term) ||
      panel.lab.toLowerCase().includes(term) ||
      panel.biomarkers.some(bm => bm.test_name.toLowerCase().includes(term))
    );
  }, [groupedPanels, searchTerm]);

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return labSubmissions;
    return labSubmissions.filter(sub => {
      const matchesId = sub.id.toLowerCase().includes(term);
      const matchesMaster = (sub.master_id || '').toLowerCase().includes(term);
      const matchesResults = sub.lab_results.some(r => r.test_name.toLowerCase().includes(term));
      return matchesId || matchesMaster || matchesResults;
    });
  }, [labSubmissions, searchTerm]);

  const toggleSubmission = (id: string) => {
    setExpandedSubmission(expandedSubmission === id ? null : id);
  };

  const handleDownloadPdfDummy = (panelName: string) => {
    alert(`Downloading official clinical PDF report for ${panelName}...`);
  };

  if (loading) {
    return (
      <div className="pg">
        <div className="km-fade" style={{ marginBottom: 20 }}>
          <h1 className="km-page-title">Labs</h1>
          <p className="km-page-sub">View your lab results and submissions</p>
        </div>
        <div className="km-sc">
          <div className="km-empty">
            <div className="km-et">Loading lab data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pg">
        <div className="km-fade" style={{ marginBottom: 20 }}>
          <h1 className="km-page-title">Labs</h1>
          <p className="km-page-sub">View your lab results and submissions</p>
        </div>
        <div className="km-sc">
          <div className="km-empty">
            <div className="km-et" style={{ color: 'var(--km-re)' }}>Error Loading Labs</div>
            <div className="km-es">{error}</div>
            <button
              onClick={loadData}
              className="km-btn km-btn-primary"
              style={{ marginTop: 12 }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pg">
      <div className="km-fade" style={{ marginBottom: 20 }}>
        <h1 className="km-page-title">Labs</h1>
        <p className="km-page-sub">View your lab results and submissions</p>
      </div>

      {/* SEARCH BAR */}
      <div className="km-swrap km-fade" style={{ marginBottom: 14 }}>
        <Search size={16} />
        <input
          className="km-sinp"
          placeholder="Search lab results..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TABS CONTAINER */}
      <div className="km-tabs km-fade" style={{ marginBottom: 16 }}>
        <button
          className={`km-tab ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          Lab Results ({filteredPanels.length})
        </button>
        <button
          className={`km-tab ${activeTab === 'submissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('submissions')}
        >
          Submissions ({filteredSubmissions.length})
        </button>
      </div>

      {/* LAB RESULTS TAB */}
      {activeTab === 'results' && (
        <div className="km-fade">
          {filteredPanels.length > 0 ? (
            <div className="km-dash-card">
              {filteredPanels.map((panel) => {
                const flagged = panel.biomarkers.filter(
                  (bm) => bm.status_indicator === 'H' || bm.status_indicator === 'L'
                ).length;

                return (
                  <div
                    key={panel.orderId}
                    className="km-oitem"
                    onClick={() => setSelectedPanel(panel)}
                  >
                    <div className="km-oimg" style={{ background: 'rgba(34,197,94,0.1)' }}>
                      🧪
                    </div>
                    <div className="km-oileft">
                      <div className="km-oiid">
                        {panel.orderId}{' '}
                        <span className="km-badge km-badge-green" style={{ fontSize: 10, marginLeft: 6 }}>
                          Results Ready
                        </span>
                      </div>
                      <div className="km-oinm">{panel.name}</div>
                      <div className="km-oiph">
                        {panel.lab} • {panel.biomarkers.length} biomarkers
                      </div>
                    </div>
                    <div className="km-oiright">
                      {flagged > 0 ? (
                        <div className="km-oiamt" style={{ fontSize: 12, color: 'var(--km-re)' }}>
                          {flagged} flagged
                        </div>
                      ) : (
                        <div className="km-oiamt" style={{ fontSize: 12, color: 'var(--km-gr)' }}>
                          Normal
                        </div>
                      )}
                      <div className="km-oidt">{formatDate(panel.collectedDate)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="km-sc">
              <div className="km-empty">
                <div className="km-eic">🧪</div>
                <div className="km-et">No lab results found</div>
                <div className="km-es">
                  {searchTerm
                    ? 'No results match your search criteria.'
                    : "You don't have any lab results yet."}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBMISSIONS TAB */}
      {activeTab === 'submissions' && (
        <div className="km-fade">
          {filteredSubmissions.length > 0 ? (
            <div className="km-dash-card">
              {filteredSubmissions.map((sub) => {
                const isExpanded = expandedSubmission === sub.id;
                const timelineItems = normalizeTimeline(sub);
                
                return (
                  <div key={sub.id} style={{ borderBottom: '1px solid var(--km-b)' }} className="last:border-b-0">
                    <div
                      className="km-oitem"
                      onClick={() => toggleSubmission(sub.id)}
                    >
                      <div className="km-oimg" style={{ background: 'rgba(245,158,11,0.1)' }}>
                        🧪
                      </div>
                      <div className="km-oileft">
                        <div className="km-oiid">
                          {sub.id.substring(0, 16).toUpperCase()}{' '}
                          <span className={`km-badge ${
                            sub.submission_status === 'completed'
                              ? 'km-badge-green'
                              : sub.submission_status === 'submitted'
                              ? 'km-badge-blue'
                              : sub.submission_status === 'pending'
                              ? 'km-badge-amber'
                              : 'km-badge-red'
                          }`} style={{ fontSize: 10, marginLeft: 6 }}>
                            {sub.submission_status}
                          </span>
                        </div>
                        <div className="km-oinm">
                          {sub.lab_results?.length > 0
                            ? sub.lab_results[0].test_name
                            : 'Thyroid Panel (TSH, Free T4)'}
                        </div>
                        <div className="km-oiph">
                          Quest Diagnostics • at-home kit
                        </div>
                      </div>
                      <div className="km-oiright">
                        <div className="km-oiamt" style={{ fontSize: 12, color: 'var(--km-tm)' }}>
                          Awaiting lab
                        </div>
                        <div className="km-oidt">
                          {formatDate(sub.created_at)}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: '16px 20px', background: 'var(--km-s2)' }}>
                        {/* Summary Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 16 }}>
                          <div>
                            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--km-tm)', letterSpacing: '.5px', marginBottom: 2 }}>Test to Treat</div>
                            <div style={{ fontSize: 13, fontWeight: 650 }}>{sub.test_to_treat ? 'Yes' : 'No'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--km-tm)', letterSpacing: '.5px', marginBottom: 2 }}>Master ID</div>
                            <div style={{ fontSize: 12, fontWeight: 650, fontFamily: 'monospace' }}>{sub.master_id || 'N/A'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--km-tm)', letterSpacing: '.5px', marginBottom: 2 }}>Visit ID</div>
                            <div style={{ fontSize: 12, fontWeight: 650, fontFamily: 'monospace' }}>{sub.beluga_visit_id || 'N/A'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--km-tm)', letterSpacing: '.5px', marginBottom: 2 }}>Submitted At</div>
                            <div style={{ fontSize: 13, fontWeight: 650 }}>{formatDate(sub.submitted_at)}</div>
                          </div>
                        </div>

                        {/* Timeline */}
                        {timelineItems.length > 0 && (
                          <div style={{ borderTop: '1px solid var(--km-b)', paddingTop: 14 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--km-tm)', letterSpacing: '.5px', marginBottom: 12 }}>Timeline & Actions</div>
                            <div className="space-y-0">
                              {timelineItems.map((item, index) => {
                                const isLast = index === timelineItems.length - 1;
                                return (
                                  <div key={item.id} style={{ position: 'relative', paddingLeft: 24, paddingBottom: isLast ? 0 : 20 }}>
                                    {!isLast && (
                                      <div style={{ position: 'absolute', left: 4, top: 16, bottom: -4, width: '1.5px', background: 'var(--km-b)' }} />
                                    )}
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
                                          <a
                                            key={idx}
                                            href={act.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="km-btn km-btn-outline"
                                            style={{ fontSize: 11, padding: '5px 12px' }}
                                          >
                                            {act.label}
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="km-sc">
              <div className="km-empty">
                <div className="km-eic">📅</div>
                <div className="km-et">No submissions found</div>
                <div className="km-es">
                  {searchTerm
                    ? 'No submissions match your search criteria.'
                    : "You don't have any active lab submissions."}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LAB RESULTS MODAL (using Radix-based Dialog styled exactly like Patient Portal.html) */}
      <Dialog open={selectedPanel !== null} onOpenChange={(open) => { if(!open) setSelectedPanel(null); }}>
        <DialogContent className="max-w-xl km-billing-dialog" style={{ padding: 24 }}>
          {selectedPanel && (
            <div>
              {/* Modal Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18, borderBottom: '1px solid var(--km-b)', paddingBottom: 12 }}>
                <TestTube size={15} style={{ color: 'var(--km-tm)' }} />
                <span style={{ fontSize: 12, color: 'var(--km-tm)', fontFamily: 'monospace', fontWeight: 600 }}>
                  {selectedPanel.orderId}
                </span>
              </div>

              {/* Test Panel Info Card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: 'var(--km-s2)', borderRadius: 12, marginBottom: 14, border: '1px solid var(--km-b)' }}>
                <div style={{ width: 50, height: 50, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, border: '1px solid var(--km-b)', background: 'var(--km-s1)' }}>🧪</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--km-t)', marginBottom: 2 }}>{selectedPanel.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--km-tm)' }}>{selectedPanel.lab} · {selectedPanel.biomarkers.length} biomarkers</div>
                </div>
                <span className="km-badge km-badge-green" style={{ fontSize: 11 }}>Results Ready</span>
              </div>

              {/* Stats Row */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <div style={{ flex: 1, background: 'var(--km-s2)', border: '1px solid var(--km-b)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 9, color: 'var(--km-tm)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 750 }}>Collected</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>{formatDate(selectedPanel.collectedDate)}</div>
                </div>
                <div style={{ flex: 1, background: 'var(--km-s2)', border: '1px solid var(--km-b)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 9, color: 'var(--km-tm)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 750 }}>Reported</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>{formatDate(selectedPanel.reportedDate)}</div>
                </div>
                <div style={{ flex: 1, background: 'var(--km-s2)', border: '1px solid var(--km-b)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 9, color: 'var(--km-tm)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 750 }}>Flagged</div>
                  {selectedPanel.biomarkers.filter(bm => bm.status_indicator === 'H' || bm.status_indicator === 'L').length > 0 ? (
                    <div style={{ fontSize: 12.5, fontWeight: 650, marginTop: 2, color: 'var(--km-re)' }}>
                      {selectedPanel.biomarkers.filter(bm => bm.status_indicator === 'H' || bm.status_indicator === 'L').length} of {selectedPanel.biomarkers.length}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12.5, fontWeight: 650, marginTop: 2, color: 'var(--km-gr)' }}>
                      0 of {selectedPanel.biomarkers.length}
                    </div>
                  )}
                </div>
              </div>

              {/* Biomarkers Table */}
              <div style={{ background: 'var(--km-s2)', border: '1px solid var(--km-b)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr .8fr 1fr .8fr', gap: '8px', padding: '10px 14px', borderBottom: '1px solid var(--km-b)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--km-tm)', fontWeight: 700 }}>
                  <div>Biomarker</div>
                  <div>Result</div>
                  <div>Reference</div>
                  <div style={{ textAlign: 'right' }}>Flag</div>
                </div>
                
                <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {selectedPanel.biomarkers.map((bm) => {
                    const isHigh = bm.status_indicator === 'H' || bm.result_interpretation?.toLowerCase().includes('high');
                    const isLow = bm.status_indicator === 'L' || bm.result_interpretation?.toLowerCase().includes('low');
                    const col = isHigh ? 'var(--km-re)' : isLow ? 'var(--km-am)' : 'var(--km-t)';
                    const badgeClass = isHigh ? 'km-badge-red' : isLow ? 'km-badge-amber' : 'km-badge-green';
                    const badgeText = isHigh ? 'High' : isLow ? 'Low' : 'Normal';

                    return (
                      <div key={bm.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr .8fr 1fr .8fr', gap: '8px', alignItems: 'center', padding: '11px 14px', borderBottom: '1px solid var(--km-b)' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500 }}>{bm.test_name}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: col }}>
                          {bm.test_result} <span style={{ fontSize: 9, color: 'var(--km-tm)', fontWeight: 500 }}>{bm.test_result_units}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--km-tm)', fontWeight: 500 }}>{bm.reference_range || 'N/A'}</div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={`km-badge ${badgeClass}`} style={{ fontSize: 9, padding: '2px 6px' }}>{badgeText}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p style={{ fontSize: 11.5, color: 'var(--km-tm)', marginTop: 14, lineHeight: 1.5 }}>
                These results have also been shared with your ordering provider. Reach out via Messages if you have any questions.
              </p>

              <button
                className="km-btn km-btn-primary"
                style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}
                onClick={() => handleDownloadPdfDummy(selectedPanel.name)}
              >
                <Download size={14} /> Download report (PDF)
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
export { LabsPage };
