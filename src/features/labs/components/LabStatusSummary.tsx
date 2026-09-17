import { AlertTriangle, Clock3, ChevronRight } from 'lucide-react';
import type { LabSubmission } from '../api';

interface SummaryCardProps {
  tone: 'attention' | 'progress';
  title: string;
  emptyMessage: string;
  orders: LabSubmission[];
  onOpen: (order: LabSubmission) => void;
}

function SummaryCard({ tone, title, emptyMessage, orders, onOpen }: SummaryCardProps) {
  const Icon = tone === 'attention' ? AlertTriangle : Clock3;
  return (
    <section className={`km-lab-summary-card is-${tone}`}>
      <header><Icon size={14} /><span>{title}</span></header>
      {orders.length === 0 ? <p>{emptyMessage}</p> : <div className="km-lab-summary-items">
        {orders.slice(0, 3).map((order) => <button type="button" key={order.id} onClick={() => onOpen(order)}>
          <span><strong>{order.lab_panel_name || 'Lab panel'}</strong><small>{order.stage_display || order.stage || 'Processing'}</small></span>
          <ChevronRight size={14} />
        </button>)}
      </div>}
    </section>
  );
}

interface Props {
  attention: LabSubmission[];
  inProgress: LabSubmission[];
  onOpen: (order: LabSubmission) => void;
}

export default function LabStatusSummary({ attention, inProgress, onOpen }: Props) {
  return <div className="km-lab-summary-grid">
    <SummaryCard tone="attention" title="Needs your attention" emptyMessage="Nothing needs your attention." orders={attention} onOpen={onOpen} />
    <SummaryCard tone="progress" title="In progress" emptyMessage="Nothing in progress." orders={inProgress} onOpen={onOpen} />
  </div>;
}
