/**
 * Patient Orders Page
 * 
 * Displays a list of the patient's orders with status badges, tracking info,
 * and a modal for viewing order details.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Package, ExternalLink, RefreshCw, AlertCircle, Truck, CheckCircle2, Clock, XCircle, Pill } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { getOrders, PatientOrder } from '@/shared/api/ordersApi';

// Status badge configuration
const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Package }> = {
  created: { label: 'Created', variant: 'secondary', icon: Clock },
  processing: { label: 'Processing', variant: 'secondary', icon: Clock },
  visit_pending: { label: 'Pending Review', variant: 'secondary', icon: Clock },
  visit_failed: { label: 'Visit Failed', variant: 'destructive', icon: XCircle },
  consult_canceled: { label: 'Canceled', variant: 'destructive', icon: XCircle },
  referred: { label: 'Referred', variant: 'outline', icon: AlertCircle },
  prescribed: { label: 'Prescribed', variant: 'default', icon: Pill },
  billing_pending: { label: 'Billing Pending', variant: 'secondary', icon: Clock },
  rx_sent: { label: 'Rx Sent', variant: 'default', icon: CheckCircle2 },
  shipped: { label: 'Shipped', variant: 'default', icon: Truck },
  canceled: { label: 'Canceled', variant: 'destructive', icon: XCircle },
};

function OrderStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, variant: 'outline' as const, icon: Package };
  const Icon = config.icon;
  
  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function OrderCard({ order, onClick }: { order: PatientOrder; onClick: () => void }) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{order.display_id}</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-sm text-gray-600">{order.product_name}</p>
            {order.pharmacy_name && (
              <p className="text-xs text-gray-500">{order.pharmacy_name}</p>
            )}
          </div>
          <div className="text-right">
            <p className="font-medium text-gray-900">${order.amount}</p>
            <p className="text-xs text-gray-500">
              {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        {order.status === 'shipped' && order.tracking_number && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="h-4 w-4" />
                <span>Tracking: {order.tracking_number}</span>
              </div>
              {order.tracking_url && (
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OrderDetailModal({ 
  order, 
  open, 
  onClose 
}: { 
  order: PatientOrder | null; 
  open: boolean; 
  onClose: () => void;
}) {
  if (!order) return null;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order {order.display_id}
          </DialogTitle>
          <DialogDescription>
            Order details and tracking information
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Status</span>
            <OrderStatusBadge status={order.status} />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Product</span>
            <span className="text-sm font-medium">{order.product_name}</span>
          </div>
          
          {order.pharmacy_name && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Pharmacy</span>
              <span className="text-sm font-medium">{order.pharmacy_name}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Amount</span>
            <span className="text-sm font-medium">${order.amount}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Ordered</span>
            <span className="text-sm font-medium">
              {new Date(order.created_at).toLocaleDateString()}
            </span>
          </div>
          
          {order.prescribed_at && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Prescribed</span>
              <span className="text-sm font-medium">
                {new Date(order.prescribed_at).toLocaleDateString()}
              </span>
            </div>
          )}
          
          {order.shipped_at && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Shipped</span>
              <span className="text-sm font-medium">
                {new Date(order.shipped_at).toLocaleDateString()}
              </span>
            </div>
          )}
          
          {order.tracking_number && (
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tracking Number</p>
                  <p className="text-sm font-medium">{order.tracking_number}</p>
                </div>
                {order.tracking_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Track
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrdersEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Package className="h-12 w-12 text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
      <p className="text-gray-600 text-sm">
        Your orders will appear here once you make a purchase.
      </p>
    </div>
  );
}

function OrdersLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState<PatientOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PatientOrder | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

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

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Simple polling: Auto-refresh orders every 60 seconds for background updates
  // This is more reliable than WebSocket for healthcare apps
  useEffect(() => {
    const pollInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing orders (60s polling)...');
      fetchOrders(page);
    }, 60000); // 60 seconds

    return () => clearInterval(pollInterval);
  }, [fetchOrders, page]);

  const handleOrderClick = (order: PatientOrder) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedOrder(null);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchOrders(page + 1, true);
    }
  };

  const handleRefresh = () => {
    fetchOrders(1, false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalCount > 0 ? `${totalCount} order${totalCount !== 1 ? 's' : ''}` : 'View your order history'}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3 text-red-800">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-auto">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && orders.length === 0 ? (
        <OrdersLoadingSkeleton />
      ) : orders.length === 0 ? (
        <Card>
          <CardContent>
            <OrdersEmptyState />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onClick={() => handleOrderClick(order)} 
              />
            ))}
          </div>
          
          {hasMore && (
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      )}

      <OrderDetailModal 
        order={selectedOrder} 
        open={modalOpen} 
        onClose={handleModalClose} 
      />
    </div>
  );
}
