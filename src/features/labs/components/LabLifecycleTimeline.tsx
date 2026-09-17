import { AlertTriangle, Check, Circle } from 'lucide-react';
import type { LabSubmission } from '../api/index';
import { formatDate } from '../utils/index';

const eventText = (event: Record<string, unknown>) =>
  `${event.status || ''} ${event.title || ''} ${event.event_type || ''}`.toLowerCase();

export default function LabLifecycleTimeline({ order }: { order: LabSubmission }) {
  const events = [...(order.lifecycle_events || []), ...(order.events || []), ...(order.activity_events || [])]
    .filter((event, index, all) => all.findIndex(candidate => String(candidate.id || candidate.source_event_id) === String(event.id || event.source_event_id)) === index)
    .sort((left, right) => String(left.occurred_at || left.created_at || '').localeCompare(String(right.occurred_at || right.created_at || '')));

  if (events.length === 0) return <p className="km-lab-timeline-empty">No provider lifecycle updates received yet.</p>;

  return <div className="km-lab-timeline">
    {events.map((event, index) => {
      const text = eventText(event);
      const attention = /failed|cancel|problem|blocked|lost|redraw/.test(text);
      const terminal = /completed|results ready/.test(text);
      const Icon = attention ? AlertTriangle : terminal ? Check : Circle;
      return <div key={String(event.id || event.source_event_id || `${event.event_type}-${index}`)} className={`km-lab-timeline-item ${attention ? 'is-attention' : terminal ? 'is-complete' : 'is-active'}`}>
        <div className="km-lab-timeline-marker"><Icon size={11} /></div>
        <div className="km-lab-timeline-copy">
          <div className="km-lab-timeline-label">{String(event.title || event.status || 'Lab update')}</div>
          {Boolean(event.description) && <div className="km-lab-timeline-description">{String(event.description)}</div>}
          {Boolean(event.occurred_at || event.created_at) && <div className="km-lab-timeline-date">{formatDate(String(event.occurred_at || event.created_at))}</div>}
        </div>
      </div>;
    })}
  </div>;
}
