import { ChevronRight, FlaskConical } from 'lucide-react';
import type { GroupedLabPanel } from '../utils/index';
import { panelFlaggedCount } from '../utils/resultPresentation';

interface Props {
  panel: GroupedLabPanel;
  onOpen: () => void;
}

export default function LabResultCard({ panel, onOpen }: Props) {
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

  return (
    <article className="km-lab-order-card" onClick={onOpen}>
      <div className="km-oimg km-lab-result-icon"><FlaskConical size={17} /></div>
      <div className="km-oileft">
        <div className="km-oinm">{panel.name}</div>
        <div className="km-oiph">{panel.lab} · {panel.collectionMethod || '—'} · #{panel.orderId}</div>
        <div className={`km-oi-status ${statusTone}`}>
          {flagged ? `${flagged} result${flagged === 1 ? '' : 's'} to review` : `All ${panel.biomarkers.length} results normal`}
        </div>
        {appointmentLabel && <div className="km-oiph">{appointmentLabel}</div>}
      </div>
      <ChevronRight size={16} className="km-oichev" />
      <span className="sr-only">{status}</span>
    </article>
  );
}
