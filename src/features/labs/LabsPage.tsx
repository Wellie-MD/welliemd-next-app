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
import { Search } from 'lucide-react';
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
  type GroupedLabPanel,
} from './utils/index';
import LabResultModal from './components/LabResultModal';
import LabBookingModal from './components/LabBookingModal';
import LabOrderDetailModal from './components/LabOrderDetailModal';
import LabResultCard from './components/LabResultCard';
import LabStatusSummary from './components/LabStatusSummary';
import LabResultsToolbar, { type ResultFilter, type ResultSort } from './components/LabResultsToolbar';
import { panelFlaggedCount, panelReportedTimestamp } from './utils/resultPresentation';

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
  const [selectedOrder, setSelectedOrder] = useState<LabSubmission | null>(null);
  const [selectedPanel, setSelectedPanel] = useState<GroupedLabPanel | null>(null);
  const [bookingSubmission, setBookingSubmission] = useState<(LabSubmission & any) | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');
  const [resultSort, setResultSort] = useState<ResultSort>('newest');

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
      orderId: r.display_id || r.order_id,
      standaloneOrderId: r.order_id,
      name: r.lab_panel_name || 'Lab Panel',
      lab: r.lab_provider || '—',
      collectionMethod: r.collection_method || '',
      collectedDate: r.collected_at || '',
      reportedDate: r.reported_at || '',
      status: r.status === 'critical' ? 'Critical' : String(r.status || '').toLowerCase().includes('partial') ? 'Partial Results' : 'Results Ready',
      amount: r.amount || { amount: '0.00', currency: 'USD' },
      pdfAvailable: r.pdf_available ?? false,
      appointmentDetails: r.appointment_details,
      biomarkers: (r.biomarkers || []).map((bm, idx) => ({
        id: `${r.order_id}-${idx}`,
        patient: '', patient_name: '', visit: null,
        source_system: 'junction' as const,
        external_order_id: r.display_id || r.order_id,
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
      master_id: s.master_id || s.id,
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
      booking_url: s.booking_url,
      appointment_details: s.appointment_details,
      lab_panel_name: s.lab_panel_name,
      lab_provider: s.lab_provider,
      collection_method: s.collection_method,
      collection_method_display: s.collection_method_display,
      stage: s.stage,
      stage_display: s.stage_display,
      bucket: s.bucket,
      amount: s.amount,
      results_status: s.results_status,
      results_available: s.results_available,
      pdf_available: s.pdf_available,
      result_count: s.result_count,
      flagged_count: s.flagged_count,
      panel_tests: s.panel_tests,
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
      const name = (s.lab_panel_name || '').toLowerCase();
      return s.id.toLowerCase().includes(q) || (s.master_id || '').toLowerCase().includes(q) || name.includes(q);
    });
  }, [allSubmissions, q]);

  // Buckets
  const needsAttention = filteredSubmissions.filter(s => {
    const bucket = (s.bucket || '').toLowerCase();
    const stage = (s.stage || '').toLowerCase();
    return bucket === 'needs_attention' || stage.includes('appointment_pending') || stage.includes('kit_delivered') || s.submission_status === 'failed';
  });
  const inProgress = filteredSubmissions.filter(s => {
    const bucket = (s.bucket || '').toLowerCase();
    const stage = (s.stage || '').toLowerCase();
    return bucket === 'in_progress' || (!bucket && !stage.includes('appointment_pending') && !stage.includes('kit_delivered') && s.submission_status !== 'failed');
  });
  const visibleResults = useMemo(() => filteredPanels
    .filter((panel) => resultFilter === 'all' || (resultFilter === 'flagged' ? panelFlaggedCount(panel) > 0 : panelFlaggedCount(panel) === 0))
    .sort((left, right) => (panelReportedTimestamp(right) - panelReportedTimestamp(left)) * (resultSort === 'newest' ? 1 : -1)), [filteredPanels, resultFilter, resultSort]);

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
    <div className="pg" id="pg-labs">
      <h1 className="km-page-title">Labs</h1>
      <p className="km-page-sub">View your lab results</p>

      {/* Search */}
      <div className="km-swrap km-fade" style={{ marginBottom: 14 }}>
        <Search size={16} />
        <input className="km-sinp" placeholder="Search lab results…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div id="labResultsPanel">
        <LabStatusSummary attention={needsAttention} inProgress={inProgress} onOpen={setSelectedOrder} />
        <LabResultsToolbar count={visibleResults.length} filter={resultFilter} sort={resultSort} onFilter={setResultFilter} onSort={setResultSort} />
        <div id="labDone">
          {visibleResults.length === 0 ? <EmptyBucket /> : (
            <div className="km-lab-card-list">
              {visibleResults.map(panel => (
                <LabResultCard
                  key={panel.orderId}
                  panel={panel}
                  onOpen={() => setSelectedPanel(panel)}
                />
              ))}
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
      <LabBookingModal
        submission={bookingSubmission}
        onClose={() => setBookingSubmission(null)}
        onDownloadRequisition={handleDownloadRequisition}
      />
      <LabOrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onBookAppointment={() => {
          const order = selectedOrder;
          setSelectedOrder(null);
          if (order) setBookingSubmission(order);
        }}
        onDownloadRequisition={() => {
          const order = selectedOrder;
          setSelectedOrder(null);
          if (order) void handleDownloadRequisition(order.id);
        }}
      />
    </div>
  );
}

export { LabsPage };
