import { FlaskConical, TestTube, X } from 'lucide-react';
import type { LabSubmission } from '../api/index';
import { labCollectionMethodLabel } from '../constants/collectionMethods';
import { hasLabResults } from '../constants/results';
import { formatMoney } from '../utils/index';
import LabLifecycleTimeline from './LabLifecycleTimeline';

interface Props {
  order: LabSubmission | null;
  onClose: () => void;
  onBookAppointment: () => void;
  onDownloadRequisition: () => void;
}

export default function LabOrderDetailModal({ order, onClose, onBookAppointment, onDownloadRequisition }: Props) {
  if (!order) return null;

  const panelName = order.lab_panel_name || order.lab_results?.[0]?.test_name || 'Lab Panel';
  const hasResults = hasLabResults(order.results_status, order.results_available);
  const hasBooking = Boolean(order.booking_link || order.booking_url || order.appointment_details);
  const hasRequisition = Boolean(order.requisition_pdf_url || order.requisition_available);
  const appointmentStatus = String(order.appointment_details?.status || order.stage || '').toLowerCase();
  const scheduled = ['scheduled', 'confirmed', 'completed'].includes(appointmentStatus) || appointmentStatus.includes('scheduled');

  return (
    <div className="km-lab-modal-backdrop" role="dialog" aria-modal="true" aria-label="Lab order details" onClick={onClose}>
      <div className="km-lab-order-modal" onClick={event => event.stopPropagation()}>
        <header className="km-lab-modal-header">
          <span className="km-lab-modal-id"><TestTube size={14} /> {order.master_id || order.id}</span>
          <button type="button" className="km-lab-modal-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </header>

        <section className="km-lab-order-summary">
          <div className="km-lab-summary-icon"><FlaskConical size={22} /></div>
          <div className="km-lab-summary-copy">
            <strong>{panelName}</strong>
            <span>{order.lab_provider || '—'} · {labCollectionMethodLabel(order.collection_method)} · {formatMoney(order.amount)}</span>
          </div>
          <span className={`km-badge ${hasResults ? 'km-badge-green' : 'km-badge-amber'}`}>{order.stage_display || 'Ordered'}</span>
        </section>

        <LabLifecycleTimeline order={order} />

        {!hasResults && order.panel_tests && order.panel_tests.length > 0 && (
          <section className="km-lab-panel-includes">
            <div className="km-lab-panel-label">Panel includes ({order.panel_tests.length} biomarkers)</div>
            <div className="km-lab-panel-chips">
              {order.panel_tests.map(test => <span key={test}>{test}</span>)}
            </div>
          </section>
        )}

        {!hasResults && (
          <div className="km-lab-order-modal-footer">
            {hasBooking && (
              <button type="button" className="km-btn km-lab-action-primary" onClick={onBookAppointment}>
                {scheduled ? 'View appointment' : 'Book appointment'}
              </button>
            )}
            {hasRequisition && (
              <button type="button" className="km-btn km-btn-outline" onClick={onDownloadRequisition}>Download requisition</button>
            )}
            {!hasBooking && !hasRequisition && <p>We&apos;ll notify you here as soon as your results are ready.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
