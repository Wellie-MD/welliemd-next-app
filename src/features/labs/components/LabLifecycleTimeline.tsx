import type { LabSubmission } from '../api/index';
import { formatDate } from '../utils/index';

type TimelineStep = { key: string; label: string; match: string[] };

const KIT_STEPS: TimelineStep[] = [
  { key: 'requisition_created', label: 'Requisition created', match: ['requisition'] },
  { key: 'kit_shipped', label: 'Kit shipped', match: ['kit shipped', 'shipped'] },
  { key: 'kit_delivered', label: 'Kit delivered', match: ['kit delivered', 'delivered'] },
  { key: 'sample_collected', label: 'Sample collected', match: ['sample collected', 'collected'] },
  { key: 'at_lab', label: 'At the lab', match: ['at lab'] },
  { key: 'results_ready', label: 'Results ready', match: ['results', 'result'] },
];

const APPOINTMENT_STEPS: TimelineStep[] = [
  { key: 'requisition_created', label: 'Requisition created', match: ['requisition'] },
  { key: 'appointment', label: 'Appointment booked', match: ['appointment', 'booked', 'scheduled'] },
  { key: 'sample_collected', label: 'Sample collected', match: ['sample collected', 'collected'] },
  { key: 'at_lab', label: 'At the lab', match: ['at lab'] },
  { key: 'results_ready', label: 'Results ready', match: ['results', 'result'] },
];

function currentRank(order: LabSubmission, steps: TimelineStep[], eventTexts: string[]) {
  const value = String(order.stage || order.order_status || '').toLowerCase();
  if (order.results_status === 'partial_results' || order.results_status === 'results_ready' || order.results_status === 'critical') return steps.length - 1;
  const stageIndex = steps.findIndex(step => value.includes(step.key) || (step.key === 'appointment' && value.includes('appointment')));
  const eventIndex = steps.reduce((highest, step, index) => (
    eventTexts.some(text => step.match.some(match => text.includes(match))) ? Math.max(highest, index) : highest
  ), -1);
  return Math.max(stageIndex, eventIndex, 0);
}

export default function LabLifecycleTimeline({ order }: { order: LabSubmission }) {
  const isKit = String(order.collection_method || '').toLowerCase().includes('kit');
  const steps = isKit ? KIT_STEPS : APPOINTMENT_STEPS;
  const events = [...(order.lifecycle_events || []), ...(order.events || []), ...(order.activity_events || [])].map(event => ({
    text: String(event.title || event.event_type || '').toLowerCase(),
    date: String(event.occurred_at || event.created_at || event.timestamp || ''),
  }));
  const rank = currentRank(order, steps, events.map(event => event.text));

  return (
    <div className="km-lab-timeline">
      {steps.map((step, index) => {
        const event = events.find(candidate => step.match.some(match => candidate.text.includes(match)));
        const completed = index < rank;
        const active = index === rank;
        return (
          <div key={step.key} className={`km-lab-timeline-item ${completed ? 'is-complete' : ''} ${active ? 'is-active' : ''}`}>
            <div className="km-lab-timeline-marker">{completed ? '✓' : ''}</div>
            <div className="km-lab-timeline-copy">
              <div className="km-lab-timeline-label">{step.label}</div>
              {event?.date && <div className="km-lab-timeline-date">{formatDate(event.date)}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
