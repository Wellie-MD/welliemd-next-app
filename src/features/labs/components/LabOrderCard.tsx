import { ChevronRight, FlaskConical } from 'lucide-react';
import type { LabSubmission } from '../api/index';
import { hasLabResults, labStatusTone } from '../constants/results';
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
  const stage = order.stage_display || order.stage || 'Ordered';
  const hasResults = hasLabResults(order.results_status, order.results_available);
  const hasBooking = Boolean(order.booking_link || order.booking_url || order.appointment_details);
  const hasRequisition = Boolean(order.requisition_pdf_url || order.requisition_available);
  const appointmentStatus = String(order.appointment_details?.status || order.stage || '').toLowerCase();
  const isScheduled = ['scheduled', 'confirmed', 'completed'].includes(appointmentStatus) || appointmentStatus.includes('scheduled');
  const displayId = order.master_id || order.id;

  return (
    <article className="km-lab-order-card" onClick={onOpen}>
      <div className="km-oimg km-lab-order-icon"><FlaskConical size={17} /></div>
      <div className="km-oileft">
        <div className="km-oinm">{panelName}</div>
        <div className="km-oiph">{provider} · {collection} · #{displayId}</div>
        <div className={`km-oi-status ${labStatusTone(order.stage, order.results_status)}`}>{stage}</div>
      </div>
      <div className="km-lab-order-actions">
        <div className="km-lab-order-action-row">
          {hasResults && (
            <button type="button" className="km-btn km-btn-outline" onClick={event => { event.stopPropagation(); onDownloadResults(); }}>
              Download results
            </button>
          )}
          {!hasResults && hasBooking && (
            <button type="button" className="km-btn km-btn-primary" onClick={event => { event.stopPropagation(); onBookAppointment(); }}>
              {isScheduled ? 'View appointment' : 'Book appointment'}
            </button>
          )}
          {!hasResults && hasRequisition && (
            <button type="button" className="km-btn km-btn-outline" onClick={event => { event.stopPropagation(); onDownloadRequisition(); }}>
              Download requisition
            </button>
          )}
        </div>
      </div>
      <div className="km-lab-order-price-wrap">
        <div className="km-lab-order-price">{formatMoney(order.amount)}</div>
        <div className="km-oidt">{formatDate(order.created_at || order.submitted_at)}</div>
      </div>
      <ChevronRight size={16} className="km-oichev" />
    </article>
  );
}
