import type { LabSubmission } from '../api/index';
import { hasLabResults } from '../constants/results';
import { labCollectionMethodLabel } from '../constants/collectionMethods';
import { formatDate, formatMoney } from '../utils/index';

interface Props {
  order: LabSubmission;
  onOpen: () => void;
  onDownloadResults: () => void;
  onDownloadRequisition: () => void;
  onBookAppointment: () => void;
}

export default function LabOrderCard({
  order,
  onOpen,
  onDownloadResults,
  onDownloadRequisition,
  onBookAppointment,
}: Props) {
  const panelName = order.lab_panel_name || order.lab_results?.[0]?.test_name || 'Lab Panel';
  const provider = order.lab_provider || '—';
  const collection = order.collection_method_display || labCollectionMethodLabel(order.collection_method);
  const rawStage = order.stage || 'Ordered';
  
  // Normalise stage
  let s = rawStage;
  if (rawStage === 'requisition_created' || rawStage === 'Requisition Created') s = 'Requisition Created';
  else if (rawStage === 'appointment_pending' || rawStage === 'Appointment Pending') s = 'Appointment Pending';
  else if (rawStage === 'appointment_scheduled' || rawStage === 'Appointment Scheduled') s = 'Appointment Scheduled';
  else if (rawStage === 'sample_collected' || rawStage === 'Sample Collected') s = 'Sample Collected';
  else if (rawStage === 'at_lab' || rawStage === 'At Lab') s = 'At Lab';
  else if (rawStage === 'partial_results' || rawStage === 'Partial Results') s = 'Partial Results';
  else if (rawStage === 'results_ready' || rawStage === 'Results Ready') s = 'Results Ready';
  else if (rawStage === 'kit_shipped' || rawStage === 'Kit Shipped') s = 'Kit Shipped';
  else if (rawStage === 'kit_delivered' || rawStage === 'Kit Delivered') s = 'Kit Delivered';

  const flagged = order.flagged_count || 0;
  const hasFlags = flagged > 0;
  
  const hasResults = hasLabResults(order.results_status, order.results_available);
  const hasBooking = Boolean(order.booking_link || order.booking_url || order.appointment_details);
  const hasRequisition = Boolean(order.requisition_pdf_url || order.requisition_available);
  const appointmentStatus = String(order.appointment_details?.status || order.stage || '').toLowerCase();
  const isScheduled = ['scheduled', 'confirmed', 'completed'].includes(appointmentStatus) || appointmentStatus.includes('scheduled');
  const displayId = order.master_id || order.id;

  // tone logic
  let tone = ['var(--km-acp)', 'var(--km-ac)'];
  if (s === 'Results Ready') {
    tone = hasFlags ? ['var(--km-amp)', 'var(--km-am)'] : ['var(--km-grp)', 'var(--km-gr)'];
  } else if (s === 'Requisition Created' || s === 'Appointment Pending' || s === 'Partial Results') {
    tone = ['var(--km-amp)', 'var(--km-am)'];
  }

  // status label mapping
  let status = '';
  if (s === 'Results Ready') {
    status = flagged > 0 ? `${flagged} results to review` : `All results normal`;
  } else if (s === 'Partial Results') {
    status = 'Partial results';
  } else {
    const statusMap: Record<string, string> = {
      'Requisition Created': 'Requisition ready — book or walk in',
      'Appointment Pending': 'Appointment pending',
      'Appointment Scheduled': 'Appointment booked',
      'Sample Collected': 'Sample collected',
      'At Lab': 'Sample in transit to lab',
      'Kit Shipped': 'Kit shipped',
      'Kit Delivered': 'Kit delivered',
    };
    status = statusMap[s] || s;
  }

  const price = order.amount;
  const date = order.created_at || order.submitted_at;

  const btns = [];
  if (hasResults) {
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
  } else {
    if (hasBooking) {
      btns.push(
        <button
          key="book-apt"
          className={`btn ${isScheduled ? 'btn-o' : 'btn-p'}`}
          style={{ fontSize: '12px', padding: '6px 12px', whiteSpace: 'nowrap' }}
          onClick={event => {
            event.stopPropagation();
            onBookAppointment();
          }}
        >
          {isScheduled ? 'View Appointment' : 'Book Appointment'}
        </button>
      );
    }
    if (hasRequisition) {
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
        <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{panelName}</div>
        <div style={{ fontSize: '11.5px', color: 'var(--km-tm)' }}>
          {provider} · {collection} · #{displayId}
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
