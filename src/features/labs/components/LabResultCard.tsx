import { CalendarDays, ChevronRight, Download, FlaskConical } from 'lucide-react';
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
  const status = panel.status === 'Partial Results' ? 'Partial results' : panel.status === 'Critical' ? 'Critical results' : 'Results ready';
  const statusTone = panel.status === 'Partial Results' || panel.status === 'Critical' || flagged > 0
    ? 'is-attention'
    : 'is-results';
  const appointment = panel.appointmentDetails;
  const appointmentLabel = appointment?.scheduled_start
    ? `Collection ${appointment.status || 'scheduled'} · ${new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: appointment.timezone || undefined,
      }).format(new Date(appointment.scheduled_start))}`
    : null;
  const canDownloadResults = Boolean(panel.standaloneOrderId);
  const canDownloadRequisition = Boolean(panel.standaloneOrderId && panel.requisitionAvailable);
  const canViewAppointment = Boolean(panel.standaloneOrderId && (panel.bookingUrl || panel.appointmentDetails));

  return (
    <div className="km-lab-result-card-container">
      <article className="km-lab-order-card km-lab-result-card" onClick={onOpen}>
        <div className="km-oimg km-lab-result-icon"><FlaskConical size={17} /></div>
        <div className="km-oileft">
          <div className="km-oinm">{panel.name}</div>
          <div className="km-oiph">{panel.lab} · {panel.collectionMethod || '—'} · #{panel.orderId}</div>
          <div className={`km-oi-status ${statusTone}`}>
            {flagged ? `${flagged} result${flagged === 1 ? '' : 's'} to review` : `All ${panel.biomarkers.length} results normal`}
          </div>
          {appointmentLabel && <div className="km-oiph">{appointmentLabel}</div>}
        </div>
        <div className="km-lab-order-actions">
          <div className="km-lab-order-action-row">
            {canViewAppointment && (
              <button type="button" className="km-btn km-btn-outline" onClick={event => { event.stopPropagation(); onViewAppointment(); }}>
                <CalendarDays size={13} /> View appointment
              </button>
            )}
            {canDownloadRequisition && (
              <button type="button" className="km-btn km-btn-outline" onClick={event => { event.stopPropagation(); onDownloadRequisition(); }}>
                <Download size={13} /> Download requisition
              </button>
            )}
            {canDownloadResults && (
              <button type="button" className="km-btn km-lab-action-primary" onClick={event => { event.stopPropagation(); onDownloadResults(); }}>
                <Download size={13} /> Download results
              </button>
            )}
          </div>
        </div>
        <div className="km-lab-order-price-wrap">
          <div className="km-lab-order-price">{formatMoney(panel.amount)}</div>
          <div className="km-oidt">{formatDate(panel.reportedDate || panel.collectedDate)}</div>
        </div>
        <ChevronRight size={16} className="km-oichev" />
        <span className="sr-only">{status}</span>
      </article>
    </div>
  );
}
