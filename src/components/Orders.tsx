/**
 * Patient Orders Page — kinmeds3 design system
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Package, RefreshCw, AlertCircle, Truck, Clock, Calendar, XCircle, CheckCircle2, Stethoscope,
} from 'lucide-react';

import { getOrders, PatientOrder } from '@/shared/api/ordersApi';
import { PatientTreatmentAggregate } from '@/features/treatments/orders/PatientTreatmentAggregate';

const getOrderReference = (order: PatientOrder) => order.order_id || order.display_id;

// Status badge mapping → km-badge-* classes (text only, no icons)
const STATUS_CONFIG: Record<string, { label: string; css: string }> = {
  created:            { label: 'Created',            css: 'km-badge km-badge-gray' },
  order_created:      { label: 'Order Created',      css: 'km-badge km-badge-gray' },
  processing:         { label: 'Processing',         css: 'km-badge km-badge-gray' },
  payment_authorized:{ label: 'Payment Authorized', css: 'km-badge km-badge-blue' },
  payment_captured:  { label: 'Payment Captured',   css: 'km-badge km-badge-blue' },
  payment_pending:   { label: 'Payment Pending',    css: 'km-badge km-badge-amber' },
  payment_failed:     { label: 'Payment Failed',    css: 'km-badge km-badge-red' },
  partial:            { label: 'Partially Complete', css: 'km-badge km-badge-amber' },
  visit_pending:      { label: 'Visit Pending',      css: 'km-badge km-badge-amber' },
  consult_scheduled:  { label: 'Consult Scheduled',  css: 'km-badge km-badge-blue' },
  consult_rescheduled:{ label: 'Consult Rescheduled',css: 'km-badge km-badge-amber' },
  visit_scheduled:    { label: 'Visit Scheduled',    css: 'km-badge km-badge-blue' },
  visit_rescheduled:  { label: 'Visit Rescheduled',  css: 'km-badge km-badge-amber' },
  visit_failed:       { label: 'Visit Failed',       css: 'km-badge km-badge-red' },
  visit_cancelled:    { label: 'Visit Cancelled',    css: 'km-badge km-badge-red' },
  consult_canceled:   { label: 'Canceled',           css: 'km-badge km-badge-red' },
  referred:           { label: 'Referred',          css: 'km-badge km-badge-purple' },
  prescribed:         { label: 'Prescribed',         css: 'km-badge km-badge-blue' },
  billing_pending:    { label: 'Billing Pending',    css: 'km-badge km-badge-amber' },
  rx_sent:            { label: 'Rx Sent',            css: 'km-badge km-badge-green' },
  in_transit:         { label: 'In Transit',        css: 'km-badge km-badge-blue' },
  out_for_delivery:   { label: 'Out for Delivery',   css: 'km-badge km-badge-amber' },
  delivered:          { label: 'Delivered',          css: 'km-badge km-badge-green' },
  delivery_failed:    { label: 'Delivery Failed',    css: 'km-badge km-badge-red' },
  shipped:            { label: 'Shipped',            css: 'km-badge km-badge-green' },
  completed:          { label: 'Completed',          css: 'km-badge km-badge-green' },
  refunded:           { label: 'Refunded',           css: 'km-badge km-badge-green' },
  no_show:            { label: 'No Show',            css: 'km-badge km-badge-red' },
  canceled:           { label: 'Cancelled',          css: 'km-badge km-badge-red' },
  cancelled:          { label: 'Cancelled',          css: 'km-badge km-badge-red' },
  failed:             { label: 'Failed',            css: 'km-badge km-badge-red' },
};

function getProductIcon(productName: string): string {
  const name = productName?.toLowerCase() || '';
  
  // Pen injectors (GLP-1 medications)
  if (name.includes('wegovy') || name.includes('ozempic') || name.includes('rybelsus') || name.includes('trulicity') || name.includes('mounjaro') || name.includes('zepbound')) return '🖊️';
  // Injection vials
  if (name.includes('sermorelin') || name.includes('nad+') || name.includes('bpc-157') || name.includes('tb-500') || name.includes('injection')) return '💉';
  // Capsules/pills
  if (name.includes('glutathione') || name.includes('semaglutide') || name.includes('glp-1') || name.includes('lipotropic') || name.includes('vitamin')) return '💊';
  // Tablets
  if (name.includes('sildenafil') || name.includes('viagra') || name.includes('tadalafil') || name.includes('cialis') || name.includes('finasteride') || name.includes('propecia')) return '💊';
  // Topical
  if (name.includes('cream') || name.includes('gel') || name.includes('topical')) return '🧴';
  // Supplements
  if (name.includes(' NAC ') || name.includes('coq10') || name.includes('magnesium') || name.includes('zinc') || name.includes('b-complex')) return '🌿';
  
  return '💊'; // Default
}

function OrderStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, css: 'km-badge km-badge-gray' };
  const s = (status || '').toLowerCase();
  const icon = s.includes('shipped') || s.includes('delivered')
    ? <Truck size={12} />
    : s.includes('prescribed') || s.includes('rx_sent') || s.includes('referred')
      ? <Stethoscope size={12} />
      : s.includes('scheduled') || s.includes('rescheduled')
        ? <Calendar size={12} />
        : s.includes('failed') || s.includes('cancel') || s.includes('no_show')
          ? <XCircle size={12} />
          : s.includes('pending') || s.includes('billing')
            ? <AlertCircle size={12} />
            : s.includes('captured') || s.includes('completed') || s.includes('refunded')
              ? <CheckCircle2 size={12} />
              : <Clock size={12} />;
  return (
    <span className={config.css} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      {icon}
      {config.label}
    </span>
  );
}

function OrderListItem({ order, onClick }: { order: PatientOrder; onClick: () => void }) {
  const ref = getOrderReference(order);
  const icon = getProductIcon(order.product_name);
  const displayAmount = order.chargeable_amount || order.amount;
  const hasProductImage = Boolean(order.product_image);
  const treatmentCount = order.combined_submission_summary?.orders?.length || 0;

  return (
    <div className="km-order-row" onClick={onClick} style={{ cursor: "pointer" }}>
      <div className="km-oitem">
        {hasProductImage ? (
          <div className="km-oimg km-oimg-photo">
            <img src={order.product_image || ''} alt={order.product_name} className="km-oimg-photo-el" />
          </div>
        ) : (
          <div className="km-oimg" style={{ background: 'var(--km-s3)', fontSize: 20 }}>
            {icon}
          </div>
        )}
        <div className="km-oileft">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span className="km-oiid" style={{ marginBottom: 0 }}>{ref}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="km-oinm">{treatmentCount > 1 ? `${treatmentCount} treatments` : order.product_name}</div>
          <div className="km-oiph">{order.pharmacy_name || '—'}</div>
        </div>
        <div className="km-oiright">
          <div className="km-oiamt">${displayAmount}</div>
          <div className="km-oidt">{new Date(order.created_at).toLocaleDateString()}</div>
        </div>
      </div>

      {order.treatment_aggregate && <PatientTreatmentAggregate aggregate={order.treatment_aggregate} compact />}

      {!order.treatment_aggregate && order.line_items && order.line_items.length > 1 && (
        <div style={{ padding: '0 14px 12px', color: 'var(--km-tm)', fontSize: 11 }}>
          {order.line_items.length} products · {order.line_items.filter((item) => item.prescription_status === 'prescribed').length} prescribed
        </div>
      )}

      {['shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(order.status) && order.tracking_number && (
        <div style={{ padding: '0 14px 14px' }}>
          <div className="km-vbox km-vbox-amber" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Truck size={14} style={{ color: 'var(--km-am)', flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 12 }}>
              <span style={{ fontWeight: 600 }}>Tracking: </span>
              <span style={{ color: 'var(--km-tm)', fontFamily: 'monospace' }}>{order.tracking_number}</span>
              {order.tracking_url && (
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--km-ac)', marginLeft: 8, fontWeight: 600 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Track package →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CombinedOrderGroup({ orders, onClick }: { orders: PatientOrder[]; onClick: (order: PatientOrder) => void }) {
  const summary = orders[0]?.combined_submission_summary;
  const payment = orders[0]?.combined_payment_summary;
  const checkoutTotal = summary?.checkout_total?.grand_total;
  const total = typeof checkoutTotal === 'string' || typeof checkoutTotal === 'number'
    ? checkoutTotal
    : payment?.authorized_amount || '0.00';

  return (
    <div className="km-combined-order-group" style={{ borderBottom: '1px solid var(--km-b)' }}>
      <div style={{ padding: '14px 14px 8px', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--km-t)' }}>Combined checkout</div>
          <div style={{ fontSize: 11, color: 'var(--km-tm)', marginTop: 2 }}>
            {orders.length} treatment orders · one payment · {payment?.status || summary?.status || 'pending'}
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--km-t)' }}>${total}</div>
      </div>
      {orders.map((order) => (
        <div key={order.id} style={{ borderTop: '1px solid var(--km-b)' }}>
          <OrderListItem order={order} onClick={() => onClick(order)} />
        </div>
      ))}
    </div>
  );
}

function OrdersLoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="km-card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="km-skel" style={{ width: 36, height: 36, borderRadius: 10 }} />
            <div style={{ flex: 1 }}>
              <div className="km-skel" style={{ width: '60%', height: 14, marginBottom: 6 }} />
              <div className="km-skel" style={{ width: '40%', height: 10 }} />
            </div>
            <div>
              <div className="km-skel" style={{ width: 50, height: 14, marginBottom: 6, marginLeft: 'auto' }} />
              <div className="km-skel" style={{ width: 60, height: 10, marginLeft: 'auto' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Orders() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PatientOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const orderIdFromUrl = searchParams.get('order_id');
  const fetchedOrderRef = useRef<string | null>(null);

  const fetchOrders = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getOrders(pageNum, 12); // Load 12 orders per batch
      setOrders(prev => append ? [...prev, ...response.results] : response.results);
      setHasMore(response.next !== null);
      setTotalCount(response.count);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Handle order_id from URL → navigate to detail sub-page
  useEffect(() => {
    if (orderIdFromUrl && fetchedOrderRef.current !== orderIdFromUrl) {
      fetchedOrderRef.current = orderIdFromUrl;
      navigate(`/dashboard/orders/${orderIdFromUrl}`, { replace: true });
    }
  }, [orderIdFromUrl, navigate]);

  // Polling — reload all pages that have been loaded so far to keep the list intact
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const allResults: PatientOrder[] = [];
        for (let p = 1; p <= page; p++) {
          const response = await getOrders(p, 12);
          allResults.push(...response.results);
          if (p === page) {
            setHasMore(response.next !== null);
            setTotalCount(response.count);
          }
        }
        setOrders(allResults);
      } catch (err) {
        // Silently fail polling — don't overwrite existing data
        console.warn('Polling refresh failed:', err);
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [page]);

  const handleOrderClick = (order: PatientOrder) => {
    navigate(`/dashboard/orders/${order.id}`);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) fetchOrders(page + 1, true);
  };

  const orderGroups = useMemo(() => {
    const groups = new Map<string, PatientOrder[]>();
    for (const order of orders) {
      const key = order.combined_submission_summary?.id || order.id;
      const group = groups.get(key) || [];
      group.push(order);
      groups.set(key, group);
    }
    return Array.from(groups.entries());
  }, [orders]);

  return (
    <div id="pg-orders">
      {/* Header */}
      <div className="km-fade" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <p className="km-page-title">Orders</p>
          <p className="km-page-sub">
            {totalCount > 0 ? `${totalCount} orders` : 'View your order history'}
          </p>
        </div>
        <button
          className="km-btn km-btn-ghost"
          onClick={() => fetchOrders(1, false)}
          disabled={loading}
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="km-vbox km-vbox-red km-fade" style={{ marginBottom: 14 }}>
          <AlertCircle size={14} style={{ color: 'var(--km-re)', flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <div style={{ color: 'var(--km-t)', fontWeight: 600, marginBottom: 2 }}>Sync error</div>
            <div style={{ color: 'var(--km-tm)', fontSize: 12 }}>{error}</div>
          </div>
          <button className="km-btn km-btn-ghost" style={{ fontSize: 11, padding: '2px 0' }} onClick={() => fetchOrders(1)}>
            Retry
          </button>
        </div>
      )}

      {/* Body */}
      {loading && orders.length === 0 ? (
        <OrdersLoadingSkeleton />
      ) : orders.length === 0 ? (
        <div className="km-sc km-fade">
          <div className="km-empty" style={{ padding: '36px 18px' }}>
            <div className="km-eic">
              <Package size={20} />
            </div>
            <div className="km-et">No orders yet</div>
            <div className="km-es">Your orders will appear here once you make a purchase.</div>
          </div>
        </div>
      ) : (
        <>
          <div className="km-sc km-fade fd">
            {orderGroups.map(([groupKey, group]) => {
              if (group.length > 1) {
                return <CombinedOrderGroup key={groupKey} orders={group} onClick={handleOrderClick} />;
              }
              const order = group[0];
              return order ? (
                <OrderListItem key={groupKey} order={order} onClick={() => handleOrderClick(order)} />
              ) : null;
            })}
          </div>

          {hasMore && (
            <div className="km-fade" style={{ textAlign: 'center', marginTop: 16 }}>
              <span
                onClick={handleLoadMore}
                style={{ fontSize: 13, color: 'var(--km-ac)', fontWeight: 600, cursor: loading ? 'wait' : 'pointer' }}
              >
                {loading ? 'Loading...' : 'Load more orders →'}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
