/**
 * Order Detail Sub-Page — kinmeds3 design system
 * 
 * Full-page order detail view with back navigation,
 * product info, status timeline, and tracking.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Package, Truck, CheckCircle2, Clock,
  XCircle, Pill, AlertCircle, CreditCard, ExternalLink,
} from 'lucide-react';

import { getOrder, PatientOrder } from '@/shared/api/ordersApi';

// Status badge mapping
const STATUS_CONFIG: Record<string, { label: string; css: string; icon: typeof Package }> = {
  created:          { label: 'Created',        css: 'km-badge km-badge-gray',   icon: Clock },
  processing:       { label: 'Processing',     css: 'km-badge km-badge-gray',   icon: Clock },
  visit_pending:    { label: 'Pending Review',  css: 'km-badge km-badge-amber',  icon: Clock },
  visit_failed:     { label: 'Visit Failed',    css: 'km-badge km-badge-red',    icon: XCircle },
  consult_canceled: { label: 'Canceled',        css: 'km-badge km-badge-red',    icon: XCircle },
  referred:         { label: 'Referred',        css: 'km-badge km-badge-purple', icon: AlertCircle },
  prescribed:       { label: 'Prescribed',      css: 'km-badge km-badge-blue',   icon: Pill },
  billing_pending:  { label: 'Billing Pending', css: 'km-badge km-badge-amber',  icon: CreditCard },
  rx_sent:          { label: 'Rx Sent',         css: 'km-badge km-badge-green',  icon: CheckCircle2 },
  shipped:          { label: 'Shipped',         css: 'km-badge km-badge-green',  icon: Truck },
  canceled:         { label: 'Canceled',        css: 'km-badge km-badge-red',    icon: XCircle },
};

const STATUS_ICON_BG: Record<string, { bg: string; color: string }> = {
  created:          { bg: 'var(--km-s3)', color: 'var(--km-tm)' },
  processing:       { bg: 'var(--km-s3)', color: 'var(--km-tm)' },
  visit_pending:    { bg: 'var(--km-amp)', color: 'var(--km-am)' },
  visit_failed:     { bg: 'var(--km-rep)', color: 'var(--km-re)' },
  consult_canceled: { bg: 'var(--km-rep)', color: 'var(--km-re)' },
  referred:         { bg: 'var(--km-pup)', color: 'var(--km-pu)' },
  prescribed:       { bg: 'var(--km-acp)', color: 'var(--km-ac)' },
  billing_pending:  { bg: 'var(--km-amp)', color: 'var(--km-am)' },
  rx_sent:          { bg: 'var(--km-grp)', color: 'var(--km-gr)' },
  shipped:          { bg: 'var(--km-grp)', color: 'var(--km-gr)' },
  canceled:         { bg: 'var(--km-rep)', color: 'var(--km-re)' },
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Build timeline events from order data
function buildTimeline(order: PatientOrder) {
  const events: { label: string; date: string | null; icon: typeof Clock; bg: string; color: string; active: boolean }[] = [];

  events.push({
    label: 'Order Created',
    date: order.created_at,
    icon: Clock,
    bg: 'var(--km-s3)',
    color: 'var(--km-tm)',
    active: true,
  });

  if (order.prescribed_at) {
    events.push({
      label: 'Prescribed',
      date: order.prescribed_at,
      icon: Pill,
      bg: 'var(--km-acp)',
      color: 'var(--km-ac)',
      active: true,
    });
  }

  if (order.shipped_at) {
    events.push({
      label: 'Shipped',
      date: order.shipped_at,
      icon: Truck,
      bg: 'var(--km-grp)',
      color: 'var(--km-gr)',
      active: true,
    });
  }

  if (order.status === 'canceled' || order.status === 'consult_canceled' || order.status === 'visit_failed') {
    events.push({
      label: STATUS_CONFIG[order.status]?.label || order.status,
      date: order.updated_at,
      icon: XCircle,
      bg: 'var(--km-rep)',
      color: 'var(--km-re)',
      active: true,
    });
  }

  return events;
}

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<PatientOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const statusConfig = STATUS_CONFIG[order.status] || { label: order.status, css: 'km-badge km-badge-gray', icon: Package };
  const iconStyle = STATUS_ICON_BG[order.status] || { bg: 'var(--km-s3)', color: 'var(--km-tm)' };
  const timeline = buildTimeline(order);

  return (
    <div className="pg" id="pg-orderdetail">
      {/* Back header */}
      <div className="km-fade" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => navigate('/dashboard/orders')}
          className="km-btn km-btn-outline"
          style={{ width: 34, height: 34, borderRadius: 9, padding: 0, justifyContent: 'center' }}
          aria-label="Back to Orders"
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--km-tm)', fontWeight: 600, fontFamily: 'monospace' }}>
            {ref}
          </div>
          <div style={{ marginTop: 3 }}>
            <span className={statusConfig.css} style={{ fontSize: 11 }}>
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* Product hero */}
      <div className="km-fade" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: 'var(--km-s1)', borderRadius: 12, marginBottom: 12, border: '1px solid var(--km-b)' }}>
        <div style={{ width: 64, height: 64, borderRadius: 14, background: iconStyle.bg, color: iconStyle.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--km-b)', fontSize: 32 }}>
          {order.product_name?.toLowerCase().includes('wegovy') || order.product_name?.toLowerCase().includes('ozempic') ? '💉' : '💊'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.5, marginBottom: 0 }}>
            {order.product_name}
          </div>
        </div>
      </div>

      {/* Pharmacy row */}
      {order.pharmacy_name && (
        <div className="km-fade fd" style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--km-s1)', border: '1px solid var(--km-b)', borderRadius: 10, padding: '11px 14px', marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--km-acp)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
             <Package size={18} style={{ color: 'var(--km-ac)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 1 }}>{order.pharmacy_name}</div>
            <div style={{ fontSize: 11, color: 'var(--km-tm)' }}>Fulfilling pharmacy</div>
          </div>
        </div>
      )}

      {/* Tracking Info */}
      {order.tracking_number && (
        <div className="km-fade km-vbox km-vbox-green" style={{ marginBottom: 12 }}>
          <Truck size={16} style={{ color: 'var(--km-gr)', flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: 'var(--km-t)', marginBottom: 2, fontSize: 13 }}>
              Tracking: {order.tracking_number}
            </div>
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
      <div className="km-fade" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--km-tm)', marginBottom: 10 }}>
          Activity Log
        </div>
        <div id="mActivityLog">
          {timeline.map((event, i) => (
            <div key={i} className="km-alog-item">
              <div className="km-alog-dot" style={{ background: event.bg, color: event.color }}>
                <event.icon size={13} />
              </div>
              <div className="km-alog-body">
                <div className="km-alog-title">{event.label}</div>
                <div className="km-alog-time">{formatDate(event.date)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail rows */}
      <div className="km-fade" style={{ background: 'var(--km-s1)', borderRadius: 12, border: '1px solid var(--km-b)', overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--km-b)' }}>
          <span style={{ fontSize: 13, color: 'var(--km-tm)' }}>Order ID</span>
          <span style={{ fontSize: 12, fontWeight: 600, textAlign: 'right', fontFamily: 'monospace', color: 'var(--km-tm)' }}>{ref}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--km-b)' }}>
          <span style={{ fontSize: 13, color: 'var(--km-tm)' }}>Prescribed by</span>
          <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>Healthcare Professional</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--km-b)' }}>
          <span style={{ fontSize: 13, color: 'var(--km-tm)' }}>Amount</span>
          <span style={{ fontSize: 16, fontWeight: 800, textAlign: 'right' }}>${order.amount}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px' }}>
          <span style={{ fontSize: 13, color: 'var(--km-tm)' }}>Ordered</span>
          <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{formatDate(order.created_at)}</span>
        </div>
      </div>

      <div className="km-fade" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="km-btn km-btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/dashboard/orders')}>
          Return to Orders
        </button>
        <button className="km-btn km-btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/dashboard/messages')}>
          Message Support
        </button>
      </div>
    </div>
  );
}
