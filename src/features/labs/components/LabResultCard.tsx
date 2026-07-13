import { ChevronRight, FlaskConical } from 'lucide-react';
import type { GroupedLabPanel } from '../utils/index';
import { formatDate, formatMoney } from '../utils/index';

interface Props {
  panel: GroupedLabPanel;
  onOpen: () => void;
  onDownload: () => void;
}

export default function LabResultCard({ panel, onOpen, onDownload }: Props) {
  const flagged = panel.biomarkers.filter(b => ['H', 'L'].includes(b.status_indicator || '')).length;
  const status = panel.status === 'Partial Results' ? 'Partial results' : panel.status === 'Critical' ? 'Critical results' : 'Results ready';
  const statusTone = panel.status === 'Partial Results' || panel.status === 'Critical' || flagged > 0
    ? 'is-attention'
    : 'is-results';

  return (
    <article className="km-lab-order-card" onClick={onOpen}>
      <div className="km-oimg km-lab-result-icon"><FlaskConical size={17} /></div>
      <div className="km-oileft">
        <div className="km-oinm">{panel.name}</div>
        <div className="km-oiph">{panel.lab} · {panel.collectionMethod || '—'} · #{panel.orderId}</div>
        <div className={`km-oi-status ${statusTone}`}>
          {flagged ? `${flagged} result${flagged === 1 ? '' : 's'} to review` : `All ${panel.biomarkers.length} results normal`}
        </div>
      </div>
      <div className="km-lab-order-actions">
        <div className="km-lab-order-action-row">
          <button type="button" className="km-btn km-btn-outline" onClick={event => { event.stopPropagation(); onDownload(); }}>
            Download results
          </button>
        </div>
      </div>
      <div className="km-lab-order-price-wrap">
        <div className="km-lab-order-price">{formatMoney(panel.amount)}</div>
        <div className="km-oidt">{formatDate(panel.collectedDate)}</div>
      </div>
      <ChevronRight size={16} className="km-oichev" />
      <span className="sr-only">{status}</span>
    </article>
  );
}
