/**
 * Order Detail Sub-Page — kinmeds3 design system
 * 
 * Full-page order detail view with back navigation,
 * product info, Requested→Prescribed diff, status timeline, and tracking.
 * Matches the kinmeds3.html reference exactly.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Truck, CheckCircle2, Clock,
  XCircle, AlertCircle, ExternalLink,
  MessageSquare, CreditCard, Calendar, Stethoscope,
} from 'lucide-react';

import { getOrder, PatientOrder, OrderActivityEvent } from '@/shared/api/ordersApi';

// ---------- Product icon (SVG-based per kinmeds3) ----------
function ProductIcon({ productName }: { productName: string }) {
  const lc = (productName || '').toLowerCase();

  if (lc.includes('wegovy') || lc.includes('semaglutide') || lc.includes('glp')) {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5">
        <path d="M18.5 2.5a2.121 2.121 0 013 3L7 20l-4 1 1-4L18.5 2.5z" />
      </svg>
    );
  }
  if (lc.includes('injection') || lc.includes('sermorelin') || lc.includes('nad')) {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4f8ef7" strokeWidth="1.5">
        <path d="M18 2l4 4-14 14H4v-4L18 2z" />
        <path d="M14 6l4 4" />
        <path d="M4 20l-2 2" />
      </svg>
    );
  }
  if (lc.includes('sildenafil') || lc.includes('tabs') || lc.includes('tablet')) {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5">
        <ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-45 12 12)" />
        <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" />
      </svg>
    );
  }
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8M12 8v8" />
    </svg>
  );
}

function getProductIconBg(productName: string): string {
  const lc = (productName || '').toLowerCase();
  if (lc.includes('wegovy') || lc.includes('semaglutide') || lc.includes('glp') || lc.includes('sildenafil') || lc.includes('tabs') || lc.includes('tablet')) {
    return 'rgba(167,139,250,0.15)';
  }
  if (lc.includes('injection') || lc.includes('sermorelin') || lc.includes('nad')) {
    return 'rgba(79,142,247,0.15)';
  }
  return 'rgba(34,197,94,0.15)';
}

// ---------- Status badge mapping (full kinmeds3 set) ----------
const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  created:            { label: 'Order Created',      badgeClass: 'km-badge km-badge-gray' },
  processing:         { label: 'Processing',         badgeClass: 'km-badge km-badge-gray' },
  visit_pending:      { label: 'Visit Pending',      badgeClass: 'km-badge km-badge-amber' },
  visit_scheduled:    { label: 'Visit Scheduled',    badgeClass: 'km-badge km-badge-blue' },
  visit_rescheduled:  { label: 'Visit Rescheduled',  badgeClass: 'km-badge km-badge-amber' },
  consult_scheduled:  { label: 'Consult Scheduled',  badgeClass: 'km-badge km-badge-blue' },
  consult_rescheduled:{ label: 'Consult Rescheduled',badgeClass: 'km-badge km-badge-amber' },
  visit_failed:       { label: 'Visit Cancelled',    badgeClass: 'km-badge km-badge-red' },
  consult_canceled:   { label: 'Visit Cancelled',    badgeClass: 'km-badge km-badge-red' },
  no_show:            { label: 'No Show',            badgeClass: 'km-badge km-badge-red' },
  referred:           { label: 'Referred',           badgeClass: 'km-badge km-badge-amber' },
  prescribed:         { label: 'Prescribed',         badgeClass: 'km-badge km-badge-green' },
  billing_pending:    { label: 'Billing Pending',    badgeClass: 'km-badge km-badge-amber' },
  rx_sent:            { label: 'Rx Sent',            badgeClass: 'km-badge km-badge-green' },
  in_fulfillment:     { label: 'In Fulfillment',     badgeClass: 'km-badge km-badge-blue' },
  shipped:            { label: 'Shipped',            badgeClass: 'km-badge km-badge-green' },
  in_transit:         { label: 'In Transit',         badgeClass: 'km-badge km-badge-blue' },
  out_for_delivery:   { label: 'Out for Delivery',   badgeClass: 'km-badge km-badge-amber' },
  delivered:          { label: 'Delivered',          badgeClass: 'km-badge km-badge-green' },
  delivery_failed:    { label: 'Delivery Failed',    badgeClass: 'km-badge km-badge-red' },
  canceled:           { label: 'Cancelled',          badgeClass: 'km-badge km-badge-red' },
  refunded:           { label: 'Refunded',           badgeClass: 'km-badge km-badge-purple' },
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ---------- Full timeline per kinmeds3 logic ----------
type TimelineStep = {
  type: 'done' | 'money' | 'warn' | 'pending' | 'bad' | 'voided';
  label: string;
  sub: string;
  iconKind?: 'shipping' | 'clinical' | 'schedule' | 'payment' | 'error' | 'pending' | 'success';
};

function buildTimeline(order: PatientOrder): TimelineStep[] {
  const ordered = formatDate(order.created_at);
  const prescribed = formatDate(order.prescribed_at);
  const amount = `$${order.chargeable_amount || order.amount}`;

  // Map backend status → kinmeds3 display status
  const statusMap: Record<string, string> = {
    created: 'Order Created',
    processing: 'Order Created',
    visit_pending: 'Visit Pending',
    visit_scheduled: 'Visit Scheduled',
    visit_rescheduled: 'Visit Rescheduled',
    consult_scheduled: 'Visit Scheduled',
    consult_rescheduled: 'Visit Rescheduled',
    visit_failed: 'Visit Cancelled',
    consult_canceled: 'Visit Cancelled',
    no_show: 'No Show',
    referred: 'Referred',
    prescribed: 'Prescribed',
    billing_pending: 'Prescribed',
    rx_sent: 'Prescribed',
    in_fulfillment: 'In Fulfillment',
    shipped: 'Shipped',
    delivered: 'Delivered',
    canceled: 'Cancelled',
    refunded: 'Refunded',
  };

  const displayStatus = statusMap[order.status] || 'Order Created';

  const logs: Record<string, TimelineStep[]> = {
    'Order Created': [
      { type: 'done', label: 'Order placed', sub: ordered },
      { type: 'pending', label: 'Payment pending', sub: 'No charge until prescription is issued' },
    ],
    'Visit Pending': [
      { type: 'done', label: 'Order placed', sub: ordered },
      { type: 'money', label: 'Payment authorized', sub: 'Amount held, not yet captured' },
      { type: 'warn', label: 'Awaiting provider review', sub: 'Provider has not yet reviewed' },
    ],
    'Visit Scheduled': [
      { type: 'done', label: 'Order placed', sub: ordered },
      { type: 'money', label: 'Payment authorized', sub: 'Amount held, not yet captured' },
      { type: 'done', label: 'Visit scheduled', sub: 'Appointment confirmed' },
    ],
    'Visit Rescheduled': [
      { type: 'done', label: 'Order placed', sub: ordered },
      { type: 'money', label: 'Payment authorized', sub: 'Amount held, not yet captured' },
      { type: 'done', label: 'Visit scheduled', sub: 'Initial appointment confirmed' },
      { type: 'warn', label: 'Visit rescheduled', sub: 'Appointment moved to new time' },
    ],
    'Visit Cancelled': [
      { type: 'done', label: 'Order placed', sub: ordered },
      { type: 'money', label: 'Payment authorized', sub: 'Amount held, not yet captured' },
      { type: 'done', label: 'Visit scheduled', sub: 'Appointment was confirmed' },
      { type: 'bad', label: 'Visit cancelled', sub: 'Appointment cancelled' },
      { type: 'voided', label: 'Authorization voided', sub: 'No charge applied' },
    ],
    'Prescribed': [
      { type: 'done', label: 'Order placed', sub: ordered },
      { type: 'money', label: 'Payment authorized', sub: 'Amount held' },
      { type: 'done', label: 'Provider reviewed', sub: 'Case reviewed by provider' },
      { type: 'done', label: 'Prescribed', sub: order.prescribed_at ? `Prescribed on ${prescribed}` : 'Prescription issued' },
      { type: 'money', label: 'Payment captured', sub: `${amount} charged to card on file` },
      { type: 'warn', label: 'Rx sent to pharmacy', sub: 'Awaiting dispatch from pharmacy' },
    ],
    'Shipped': [
      { type: 'done', label: 'Order placed', sub: ordered },
      { type: 'money', label: 'Payment authorized', sub: 'Amount held' },
      { type: 'done', label: 'Provider reviewed', sub: 'Case reviewed by provider' },
      { type: 'done', label: 'Prescribed', sub: 'Prescription issued' },
      { type: 'money', label: 'Payment captured', sub: `${amount} charged to card on file` },
      { type: 'done', label: 'Rx sent to pharmacy', sub: 'Prescription received by pharmacy' },
      { type: 'done', label: 'Shipped', sub: 'Order dispatched to pharmacy' },
    ],
    'Referred': [
      { type: 'done', label: 'Order placed', sub: ordered },
      { type: 'money', label: 'Payment authorized', sub: 'Amount held, not yet captured' },
      { type: 'done', label: 'Provider reviewed', sub: 'Case reviewed by provider' },
      { type: 'bad', label: 'Referred', sub: 'Patient not eligible for this treatment' },
      { type: 'voided', label: 'Authorization voided', sub: 'No charge applied' },
    ],
    'Refunded': [
      { type: 'done', label: 'Order placed', sub: ordered },
      { type: 'money', label: 'Payment authorized', sub: 'Amount held' },
      { type: 'done', label: 'Prescribed', sub: 'Prescription issued' },
      { type: 'money', label: 'Payment captured', sub: `${amount} charged to card on file` },
      { type: 'bad', label: 'Refunded', sub: 'Payment refunded to original method' },
    ],
    'No Show': [
      { type: 'done', label: 'Order placed', sub: ordered },
      { type: 'money', label: 'Payment authorized', sub: 'Amount held, not yet captured' },
      { type: 'done', label: 'Visit scheduled', sub: 'Appointment confirmed' },
      { type: 'bad', label: 'No show', sub: 'Patient did not attend scheduled visit' },
      { type: 'voided', label: 'Authorization voided', sub: 'No charge applied' },
    ],
    'Cancelled': [
      { type: 'done', label: 'Order placed', sub: ordered },
      { type: 'bad', label: 'Cancelled', sub: 'Order was cancelled' },
      { type: 'voided', label: 'Authorization voided', sub: 'No charge applied' },
    ],
  };

  return logs[displayStatus] || [{ type: 'done', label: 'Order placed', sub: ordered }];
}

function buildTimelineFromEvents(events?: OrderActivityEvent[]): TimelineStep[] {
  if (!Array.isArray(events) || events.length === 0) return [];
  const getSortOrder = (evt: OrderActivityEvent): number => {
    const normalized = (evt.payload?._normalized || {}) as Record<string, unknown>;
    const explicit = normalized.sort_order;
    if (typeof explicit === 'number') return explicit;

    const title = (evt.title || '').toLowerCase();
    const eventType = (evt.event_type || '').toLowerCase();
    const status = (evt.status || '').toLowerCase();
    if (title.includes('lab order created') || eventType.endsWith('labtest.order.created')) return 0;
    if (title.includes('requisition') || title.includes('lab order updated') || eventType.endsWith('labtest.order.updated')) return 1;
    if (title.includes('appointment') || eventType.includes('appointment')) return 2;
    if (title.includes('parsing started') || eventType.includes('parsing_job.created')) return 3;
    if (title.includes('parsing updated') || eventType.includes('parsing_job.updated')) return 4;
    if (title.includes('critical') || status.includes('critical') || eventType.endsWith('labtest.result.critical')) return 5;
    return 99;
  };

  return [...events]
    .sort((a, b) => {
      const aTime = Date.parse(a.occurred_at || '');
      const bTime = Date.parse(b.occurred_at || '');
      if (aTime !== bTime) return aTime - bTime;
      const aSort = getSortOrder(a);
      const bSort = getSortOrder(b);
      if (aSort !== bSort) return aSort - bSort;
      return (a.id || '').localeCompare(b.id || '');
    })
    .map((evt) => {
    const status = (evt.status || '').toLowerCase();
    const eventType = (evt.event_type || '').toLowerCase();
    let type: TimelineStep['type'] = 'done';
    let iconKind: TimelineStep['iconKind'] = 'success';
    if (status.includes('pending')) type = 'pending';
    if (status.includes('failed') || status.includes('canceled') || status.includes('no_show')) type = 'bad';
    if (status.includes('payment') || eventType.includes('payment')) type = 'money';

    if (status.includes('shipped') || status.includes('delivered') || status.includes('fulfillment') || eventType.includes('pharmacy')) {
      iconKind = 'shipping';
    } else if (status.includes('prescribed') || status.includes('rx_sent') || status.includes('referred')) {
      iconKind = 'clinical';
    } else if (status.includes('scheduled') || status.includes('rescheduled') || status.includes('visit')) {
      iconKind = 'schedule';
    } else if (status.includes('payment') || eventType.includes('payment')) {
      iconKind = 'payment';
    } else if (status.includes('failed') || status.includes('canceled') || status.includes('no_show')) {
      iconKind = 'error';
    } else if (status.includes('pending') || status.includes('billing')) {
      iconKind = 'pending';
    }

    return {
      type,
      label: evt.title || evt.event_type.replace(/\./g, ' '),
      sub: new Date(evt.occurred_at).toLocaleString(),
      iconKind,
    };
    });
}

function StatusIcon({ status }: { status: string }) {
  const s = (status || '').toLowerCase();
  if (s.includes('shipped') || s.includes('delivered') || s.includes('fulfillment')) {
    return <Truck size={12} />;
  }
  if (s.includes('prescribed') || s.includes('rx_sent') || s.includes('referred')) {
    return <Stethoscope size={12} />;
  }
  if (s.includes('scheduled') || s.includes('rescheduled')) {
    return <Calendar size={12} />;
  }
  if (s.includes('failed') || s.includes('cancel') || s.includes('no_show')) {
    return <XCircle size={12} />;
  }
  if (s.includes('pending') || s.includes('billing')) {
    return <AlertCircle size={12} />;
  }
  if (s.includes('captured') || s.includes('completed') || s.includes('refunded')) {
    return <CheckCircle2 size={12} />;
  }
  return <Clock size={12} />;
}

// ---------- Timeline step icon ----------
function StepIcon({ step }: { step: TimelineStep }) {
  if (step.iconKind === 'shipping') return <Truck size={12} />;
  if (step.iconKind === 'clinical') return <Stethoscope size={12} />;
  if (step.iconKind === 'schedule') return <Calendar size={12} />;
  if (step.iconKind === 'payment') return <CreditCard size={12} />;
  if (step.iconKind === 'error') return <XCircle size={12} />;
  if (step.iconKind === 'pending') return <AlertCircle size={12} />;
  if (step.iconKind === 'success') return <CheckCircle2 size={12} />;

  const { type } = step;
  if (type === 'done' || type === 'money') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  if (type === 'bad' || type === 'voided') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
  }
  // warn / pending
  return (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="6" />
    </svg>
  );
}

function stepDotStyle(type: TimelineStep['type']): React.CSSProperties {
  const base: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  switch (type) {
    case 'done':
      return { ...base, background: 'var(--km-grp)', color: 'var(--km-gr)' };
    case 'money':
      return { ...base, background: 'var(--km-acp)', color: 'var(--km-ac)' };
    case 'warn':
      return { ...base, background: 'var(--km-amp)', color: 'var(--km-am)' };
    case 'pending':
      return { ...base, background: 'var(--km-s3)', color: 'var(--km-tm)' };
    case 'bad':
      return { ...base, background: 'var(--km-rep)', color: 'var(--km-re)' };
    case 'voided':
      return { ...base, background: 'var(--km-rep)', color: 'var(--km-re)' };
    default:
      return { ...base, background: 'var(--km-s3)', color: 'var(--km-tm)' };
  }
}

// ---------- Component ----------
export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<PatientOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productImageFailed, setProductImageFailed] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getOrder(orderId);
        setOrder(data);
      } catch (err) {
        console.error('Failed to fetch order:', err);
        setError('Order not found or failed to load.');
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  if (loading) {
    return (
      <div>
        <button className="km-back-btn" onClick={() => navigate('/dashboard/orders')}>
          <ArrowLeft size={14} /> Back to Orders
        </button>
        <div className="km-card" style={{ padding: 14 }}>
          <div className="km-skel" style={{ width: '50%', height: 22, marginBottom: 12 }} />
          <div className="km-skel" style={{ width: '100%', height: 14, marginBottom: 8 }} />
          <div className="km-skel" style={{ width: '80%', height: 14, marginBottom: 8 }} />
          <div className="km-skel" style={{ width: '60%', height: 14 }} />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <button className="km-back-btn" onClick={() => navigate('/dashboard/orders')}>
          <ArrowLeft size={14} /> Back to Orders
        </button>
        <div className="km-card">
          <div className="km-empty">
            <AlertCircle size={36} style={{ color: 'var(--km-re)', marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--km-t)', marginBottom: 4 }}>
              {error || 'Order not found'}
            </div>
            <button className="km-btn km-btn-outline" style={{ marginTop: 8 }} onClick={() => navigate('/dashboard/orders')}>
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  const ref = order.order_id || order.display_id;
  const statusConfig = STATUS_CONFIG[order.status] || { label: order.status, badgeClass: 'km-badge km-badge-gray' };
  const timelineFromEvents = buildTimelineFromEvents(order.activity_events);
  const timeline = timelineFromEvents.length > 0 ? timelineFromEvents : buildTimeline(order);
  const requestedMedicineName = order.requested_medicine_name || order.product_name;
  const rawPrescribedMedicineName = order.prescribed_medicine_name || null;
  const prescribedNameNormalized = rawPrescribedMedicineName?.trim().toLowerCase();
  const prescribedMedicineName =
    prescribedNameNormalized === 'same med' ||
      prescribedNameNormalized === 'same medicine' ||
      prescribedNameNormalized === 'same medication'
      ? requestedMedicineName
      : rawPrescribedMedicineName;
  const displayAmount = order.chargeable_amount || order.amount;
  const showProductImage = Boolean(order.product_image) && !productImageFailed;
  const hasBeenPrescribed =
    Boolean(order.prescribed_at) ||
    ['prescribed', 'billing_pending', 'rx_sent', 'shipped'].includes(order.status);
  let prescribedBy = hasBeenPrescribed ? (order.doctor_name || '').trim() : '';
  if (prescribedBy === 'Healthcare Professional') {
    prescribedBy = '';
  }
  const canContinueCheckout = order.status === 'payment_pending' && Boolean(order.checkout_url);

  return (
    <div className="pg" id="pg-orderdetail">
      {/* Back header */}
      <div className="km-fade" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => navigate('/dashboard/orders')}
          style={{
            width: 34, height: 34, borderRadius: 9,
            border: '1px solid var(--km-b)', background: 'var(--km-s2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, color: 'var(--km-tm)',
            fontFamily: "'Outfit', sans-serif",
          }}
          aria-label="Back to Orders"
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--km-tm)', fontWeight: 600, fontFamily: 'monospace' }}>
            {ref}
          </div>
          <div style={{ marginTop: 3 }}>
            <span className={statusConfig.badgeClass} style={{ fontSize: 11 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <StatusIcon status={order.status} />
              {statusConfig.label}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Product hero */}
      <div className="km-fade" style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: 16, background: 'var(--km-s1)', borderRadius: 12, marginBottom: 10, border: '1px solid var(--km-b)' }}>
        {showProductImage ? (
          <div style={{
            width: 56, height: 56, borderRadius: 12,
            background: 'var(--km-s3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, border: '1px solid var(--km-b)', overflow: 'hidden',
          }}>
            <img
              src={order.product_image || ''}
              alt={prescribedMedicineName || requestedMedicineName}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={() => setProductImageFailed(true)}
            />
          </div>
        ) : (
          <div style={{
            width: 56, height: 56, borderRadius: 12,
            background: getProductIconBg(prescribedMedicineName || requestedMedicineName),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, border: '1px solid var(--km-b)',
          }}>
            <ProductIcon productName={prescribedMedicineName || requestedMedicineName} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Main Product Title - Hide ONLY if diff shown (per kinmeds3) */}
          {(order.status === 'prescribed' || order.status === 'rx_sent' || order.status === 'shipped') ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', marginTop: 2 }}>
              <div style={{
                background: 'var(--km-rep)',
                borderRadius: 8,
                padding: '8px 12px',
                border: '1px solid rgba(239, 68, 68, 0.15)'
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--km-re)', marginBottom: 2 }}>
                  Requested
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--km-re)', lineHeight: 1.35 }}>
                  {requestedMedicineName}
                </div>
              </div>

              <div style={{ paddingLeft: 12 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--km-tm)' }}>
                  <line x1="12" y1="4" x2="12" y2="20" />
                  <polyline points="18 14 12 20 6 14" />
                </svg>
              </div>

              <div style={{
                background: 'var(--km-grp)',
                borderRadius: 8,
                padding: '8px 12px',
                border: '1px solid rgba(34, 197, 94, 0.15)'
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--km-gr)', marginBottom: 2 }}>
                  Prescribed
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--km-gr)', lineHeight: 1.35 }}>
                  {prescribedMedicineName || 'Awaiting provider decision'}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4, marginBottom: 4 }}>
              {requestedMedicineName}
            </div>
          )}

          {order.status === 'visit_pending' && (
            <span style={{
              display: 'inline-block', marginTop: 6,
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.3px',
              padding: '3px 8px', borderRadius: 5,
              background: 'var(--km-amp)', color: 'var(--km-am)',
            }}>
              Awaiting Review
            </span>
          )}
        </div>
      </div>

      {/* Pharmacy row */}
      {order.pharmacy_name && (
        <div className="km-fade fd" style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--km-s1)', border: '1px solid var(--km-b)', borderRadius: 10, padding: '11px 14px', marginBottom: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--km-acp)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--km-ac)" strokeWidth="1.8">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 1 }}>{order.pharmacy_name}</div>
            <div style={{ fontSize: 11, color: 'var(--km-tm)' }}>Fulfilling pharmacy</div>
          </div>
        </div>
      )}

      {/* Tracking Info */}
      {order.tracking_number && (
        <div className="km-fade km-vbox km-vbox-green" style={{ marginBottom: 10 }}>
          <Truck size={16} style={{ color: 'var(--km-gr)', flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: 'var(--km-t)', marginBottom: 2, fontSize: 13 }}>
              Tracking: {order.tracking_number}
            </div>
            {order.shipping_carrier && (
              <div style={{ fontSize: 11, color: 'var(--km-tm)' }}>
                Carrier: {order.shipping_carrier}
              </div>
            )}
            {order.tracking_url && (
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="km-btn km-btn-outline"
                style={{ marginTop: 8, fontSize: 11, padding: '5px 12px' }}
              >
                <ExternalLink size={12} />
                Track Package
              </a>
            )}
          </div>
        </div>
      )}

      {/* Activity Log */}
      <div className="km-fade" style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--km-tm)', marginBottom: 10 }}>
          Activity Log
        </div>
        <div id="mActivityLog">
          {timeline.map((step, i) => (
            <div key={i} className="km-alog-item">
              <div className="km-alog-dot" style={stepDotStyle(step.type)}>
                <StepIcon step={step} />
              </div>
              <div className="km-alog-body">
                <div className="km-alog-title">{step.label}</div>
                <div className="km-alog-time">{step.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail rows */}
      <div className="km-fade" style={{ background: 'var(--km-s1)', borderRadius: 10, border: '1px solid var(--km-b)', overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: '1px solid var(--km-b)' }}>
          <span style={{ fontSize: 13, color: 'var(--km-tm)' }}>Order ID</span>
          <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace', color: 'var(--km-tm)' }}>{ref}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: '1px solid var(--km-b)' }}>
          <span style={{ fontSize: 13, color: 'var(--km-tm)' }}>Prescribed by</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{prescribedBy}</span>
        </div>
        {(order.booking_scheduled_at || order.booking_location) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: '1px solid var(--km-b)' }}>
            <span style={{ fontSize: 13, color: 'var(--km-tm)' }}>Consult</span>
            <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>
              {order.booking_scheduled_at ? new Date(order.booking_scheduled_at).toLocaleString() : 'Scheduled'}
              {order.booking_location ? (
                <a href={order.booking_location} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8 }}>
                  Join
                </a>
              ) : null}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: '1px solid var(--km-b)' }}>
          <span style={{ fontSize: 13, color: 'var(--km-tm)' }}>Amount</span>
          <span style={{ fontSize: 15, fontWeight: 800 }}>${displayAmount}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px' }}>
          <span style={{ fontSize: 13, color: 'var(--km-tm)' }}>Ordered</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{formatDate(order.created_at)}</span>
        </div>
      </div>

      {/* Action buttons — using km-btn classes */}
      <div className="km-fade" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {canContinueCheckout && (
          <button
            className="km-btn km-btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px 16px' }}
            onClick={() => {
              window.location.assign(order.checkout_url as string);
            }}
          >
            <CreditCard size={14} />
            Continue to Checkout
          </button>
        )}
        <button
          className={canContinueCheckout ? 'km-btn km-btn-outline' : 'km-btn km-btn-primary'}
          style={{ width: '100%', justifyContent: 'center', padding: '12px 16px' }}
          onClick={() => {
            const orderRef = ref || order.id;
            const prefillMsg = `Hi, I have a question about my order ${orderRef} (${order.product_name}).`;
            navigate(`/dashboard/messages?order_ref=${encodeURIComponent(orderRef)}&prefill=${encodeURIComponent(prefillMsg)}`);
          }}
        >
          <MessageSquare size={14} />
          Message about this order
        </button>
        <button
          className="km-btn km-btn-outline"
          style={{ width: '100%', justifyContent: 'center', padding: '12px 16px' }}
          onClick={() => navigate('/dashboard/orders')}
        >
          <ArrowLeft size={14} />
          Return to Orders
        </button>
      </div>
    </div>
  );
}
