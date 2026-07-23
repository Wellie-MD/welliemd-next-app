import type { GroupedLabPanel } from '../utils/index';
import { panelFlaggedCount } from '../utils/resultPresentation';
import { formatDate, formatMoney } from '../utils/index';

interface Props {
  panel: GroupedLabPanel;
  onOpen: () => void;
  onDownloadResults: () => void;
  onDownloadRequisition: () => void;
  onViewAppointment: () => void;
}

export default function LabResultCard({
  panel,
  onOpen,
  onDownloadResults,
  onDownloadRequisition,
  onViewAppointment,
}: Props) {
  const flagged = panelFlaggedCount(panel);
  
  // Normalise status
  const s = panel.status === 'results_ready' ? 'Results Ready' : panel.status === 'partial_results' ? 'Partial Results' : panel.status;
  
  const hasFlags = flagged > 0;
  
  // labTone logic
  let tone = ['var(--km-acp)', 'var(--km-ac)'];
  if (s === 'Results Ready') {
    tone = hasFlags ? ['var(--km-amp)', 'var(--km-am)'] : ['var(--km-grp)', 'var(--km-gr)'];
  } else if (s === 'Requisition Created' || s === 'Appointment Pending' || s === 'Partial Results') {
    tone = ['var(--km-amp)', 'var(--km-am)'];
  }

  // status label (matching it.note || patLabLabel(s))
  let status = '';
  if (s === 'Results Ready') {
    if (flagged > 0) {
      const flaggedBiomarkers = panel.biomarkers.filter(b => b.status_indicator === 'H' || b.status_indicator === 'L');
      if (flaggedBiomarkers.length === 1) {
        const bm = flaggedBiomarkers[0];
        const flagLabel = bm.status_indicator === 'H' ? 'high' : 'low';
        status = `1 result to review · ${bm.test_name} ${flagLabel}`;
      } else {
        status = `${flagged} results to review`;
      }
    } else {
      status = `All ${panel.biomarkers.length} results normal`;
    }
  } else if (s === 'Partial Results') {
    status = 'Partial results';
  } else {
    const statusMap: Record<string, string> = {
      'Requisition Created': 'Requisition ready — book or walk in',
      'requisition_created': 'Requisition ready — book or walk in',
      'Appointment Pending': 'Appointment pending',
      'appointment_pending': 'Appointment pending',
      'Appointment Scheduled': 'Appointment booked',
      'appointment_scheduled': 'Appointment booked',
      'Sample Collected': 'Sample collected',
      'sample_collected': 'Sample collected',
      'At Lab': 'Sample in transit to lab',
      'at_lab': 'Sample in transit to lab',
      'Kit Shipped': 'Kit shipped',
      'kit_shipped': 'Kit shipped',
      'Kit Delivered': 'Kit delivered',
      'kit_delivered': 'Kit delivered',
    };
    status = statusMap[s] || s;
  }

  const price = panel.amount;
  const date = panel.reportedDate || panel.collectedDate;

  const canDownloadResults = s === 'Results Ready' || s === 'Partial Results';
  const canDownloadRequisition = Boolean(panel.standaloneOrderId && panel.requisitionAvailable);
  const canViewAppointment = Boolean(panel.standaloneOrderId && (panel.bookingUrl || panel.appointmentDetails));

  const btns = [];
  if (canDownloadResults) {
    btns.push(
      <button
        key="dl-res"
        className="btn btn-o"
        style={{ fontSize: '12px', padding: '6px 12px', whiteSpace: 'nowrap' }}
        onClick={event => {
          event.stopPropagation();
          onDownloadResults();
        }}
      >
        Download results
      </button>
    );
  }
  if (canDownloadRequisition) {
    btns.push(
      <button
        key="dl-req"
        className="btn btn-o"
        style={{ fontSize: '12px', padding: '6px 12px', whiteSpace: 'nowrap' }}
        onClick={event => {
          event.stopPropagation();
          onDownloadRequisition();
        }}
      >
        Download requisition
      </button>
    );
  }
  if (canViewAppointment) {
    btns.push(
      <button
        key="view-apt"
        className="btn btn-o"
        style={{ fontSize: '12px', padding: '6px 12px', whiteSpace: 'nowrap' }}
        onClick={event => {
          event.stopPropagation();
          onViewAppointment();
        }}
      >
        View Appointment
      </button>
    );
  }

  const actionsHtml = btns.length ? (
    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
      {btns}
    </div>
  ) : null;

  const priceFormatted = price ? formatMoney(price) : '';
  const dateFormatted = date ? formatDate(date) : '';
  const pdHtml = (price || date) ? (
    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '6px', minWidth: '74px' }}>
      <div style={{ fontWeight: 700, fontSize: '14px' }}>{priceFormatted}</div>
      <div style={{ fontSize: '11px', color: 'var(--km-tm)' }}>{dateFormatted}</div>
    </div>
  ) : null;

  return (
    <div
      className="card card-p"
      style={{ display: 'flex', alignItems: 'center', gap: '13px', marginBottom: '12px', cursor: 'pointer' }}
      onClick={onOpen}
    >
      {/* Icon */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '11px',
          background: tone[0],
          color: tone[1],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M9 3v6.5L5 17a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 17l-4-7.5V3M8 3h8M9 12h6" />
        </svg>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{panel.name}</div>
        <div style={{ fontSize: '11.5px', color: 'var(--km-tm)' }}>
          {panel.lab} · {panel.collectionMethod || 'Walk-in'} · #{panel.orderId}
        </div>
        <div style={{ fontSize: '11.5px', color: tone[1], fontWeight: 600, marginTop: '2px' }}>
          {status}
        </div>
      </div>

      {/* Actions & Price/Date */}
      {actionsHtml}
      {pdHtml}

      {/* Chevron */}
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="var(--km-tm)"
        strokeWidth="2"
        style={{ flexShrink: 0, marginLeft: '4px' }}
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  );
}
