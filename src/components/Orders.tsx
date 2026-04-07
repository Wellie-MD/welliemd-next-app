/**
 * Patient Orders Page — kinmeds3 design system
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Package, RefreshCw, AlertCircle, Truck,
} from 'lucide-react';

import { getOrders, PatientOrder } from '@/shared/api/ordersApi';

const getOrderReference = (order: PatientOrder) => order.order_id || order.display_id;

// Status badge mapping → km-badge-* classes (text only, no icons)
const STATUS_CONFIG: Record<string, { label: string; css: string }> = {
  created:            { label: 'Created',            css: 'km-badge km-badge-gray' },
  order_created:      { label: 'Order Created',      css: 'km-badge km-badge-gray' },
  processing:         { label: 'Processing',         css: 'km-badge km-badge-gray' },
  visit_pending:      { label: 'Visit Pending',      css: 'km-badge km-badge-amber' },
  visit_scheduled:    { label: 'Visit Scheduled',    css: 'km-badge km-badge-blue' },
  visit_rescheduled:  { label: 'Visit Rescheduled',  css: 'km-badge km-badge-amber' },
  visit_failed:       { label: 'Visit Failed',       css: 'km-badge km-badge-red' },
  visit_cancelled:    { label: 'Visit Cancelled',    css: 'km-badge km-badge-red' },
  consult_canceled:   { label: 'Canceled',           css: 'km-badge km-badge-red' },
  referred:           { label: 'Referred',           css: 'km-badge km-badge-orange' },
  prescribed:         { label: 'Prescribed',         css: 'km-badge km-badge-orange' },
  billing_pending:    { label: 'Billing Pending',    css: 'km-badge km-badge-amber' },
  rx_sent:            { label: 'Rx Sent',            css: 'km-badge km-badge-green' },
  shipped:            { label: 'Shipped',            css: 'km-badge km-badge-green' },
  refunded:           { label: 'Refunded',           css: 'km-badge km-badge-green' },
  no_show:            { label: 'No Show',            css: 'km-badge km-badge-red' },
  canceled:           { label: 'Cancelled',          css: 'km-badge km-badge-red' },
  cancelled:          { label: 'Cancelled',          css: 'km-badge km-badge-red' },
};

function OrderStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, css: 'km-badge km-badge-gray' };
  return <span className={config.css}>{config.label}</span>;
}

function OrderListItem({ order, onClick }: { order: PatientOrder; onClick: () => void }) {
  const ref = getOrderReference(order);

  return (
    <div onClick={onClick} style={{ cursor: "pointer" }}>
      <div className="km-oitem">
        <div className="km-oimg" style={{ background: 'var(--km-s3)', fontSize: 20 }}>
          💊
        </div>
        <div className="km-oileft">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span className="km-oiid" style={{ marginBottom: 0 }}>{ref}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="km-oinm">{order.product_name}</div>
          <div className="km-oiph">{order.pharmacy_name || '—'}</div>
        </div>
        <div className="km-oiright">
          <div className="km-oiamt">${order.amount}</div>
          <div className="km-oidt">{new Date(order.created_at).toLocaleDateString()}</div>
        </div>
      </div>

      {order.status === 'shipped' && order.tracking_number && (
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
      const response = await getOrders(pageNum);
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

  // Polling
  useEffect(() => {
    const timer = setInterval(() => fetchOrders(page), 10000);
    return () => clearInterval(timer);
  }, [fetchOrders, page]);

  const handleOrderClick = (order: PatientOrder) => {
    navigate(`/dashboard/orders/${order.id}`);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) fetchOrders(page + 1, true);
  };

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
            {orders.map((order) => (
              <OrderListItem key={order.id} order={order} onClick={() => handleOrderClick(order)} />
            ))}
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
