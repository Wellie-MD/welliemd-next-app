// Reports API Service for Aggregate Data
import axiosInstance from './axiosInstance';
import { fetchOrders } from './ordersApi';
import { parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export interface AggregateByState {
  state: string;
  totalOrders: number;
  totalSales: number;
  averageOrderValue: number;
  completedOrders: number;
  pendingOrders: number;
}

export interface AggregateByPharmacy {
  pharmacy: string;
  pharmacyId?: string;
  totalOrders: number;
  totalSales: number;
  averageOrderValue: number;
  completedOrders: number;
  pendingOrders: number;
}

export interface AggregateByVariant {
  variant: string;
  variantId?: string;
  productName?: string;
  totalOrders: number;
  totalQuantity: number;
  totalSales: number;
  averagePrice: number;
}

export interface AggregatesData {
  byState: AggregateByState[];
  byPharmacy: AggregateByPharmacy[];
  byVariant: AggregateByVariant[];
  summary: {
    totalStates: number;
    totalPharmacies: number;
    totalVariants: number;
    totalOrders: number;
    totalSales: number;
  };
}

export interface AggregatesParams {
  start_date?: string;
  end_date?: string;
  state?: string;
  pharmacy_id?: string;
  variant_id?: string;
}

const ORDERS_PAGE_SIZE = 500;

async function fetchAllOrders(params?: Record<string, unknown>) {
  let page = 1;
  let allResults: any[] = [];
  let count = 0;
  let hasNext = true;

  while (hasNext) {
    const response = await fetchOrders({
      ...params,
      page,
      page_size: ORDERS_PAGE_SIZE,
    });

    const results = response.results || [];
    allResults = allResults.concat(results);
    count = response.count || count;
    hasNext = Boolean(response.next) && results.length > 0;
    page += 1;

    if (results.length === 0) break;
    if (allResults.length >= count && count > 0) break;
  }

  return {
    count,
    results: allResults,
  };
}

/**
 * Fetch aggregate reports data
 */
export const getAggregates = async (params?: AggregatesParams): Promise<AggregatesData> => {
  try {
    // Build order filters (best-effort server-side), with full client-side pagination aggregation.
    const orderFilters: any = {
      ...(params?.start_date && { created_at__gte: params.start_date }),
      ...(params?.end_date && { created_at__lte: params.end_date }),
    };

    // Fetch ALL order pages so aggregates are complete and not limited to first page.
    const ordersResponse = await fetchAllOrders(orderFilters);
    const rawOrders = ordersResponse.results || [];

    let orders = rawOrders;

    if (params?.start_date && params?.end_date) {
      const filterStart = startOfDay(parseISO(params.start_date));
      const filterEnd = endOfDay(parseISO(params.end_date));

      orders = rawOrders.filter((order: any) => {
        if (!order.created_at) return false;
        const orderDate = parseISO(order.created_at);
        return isWithinInterval(orderDate, { start: filterStart, end: filterEnd });
      });
    }

    const byState = aggregateByState(orders, params);
    const byPharmacy = aggregateByPharmacy(orders, params);
    const byVariant = aggregateByVariant(orders, params);

    // Calculate summary
    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, order) => {
      const total = parseFloat(order.orderTotal || order.amount || '0');
      return sum + total;
    }, 0);

    return {
      byState,
      byPharmacy,
      byVariant,
      summary: {
        totalStates: byState.length,
        totalPharmacies: byPharmacy.length,
        totalVariants: byVariant.length,
        totalOrders,
        totalSales,
      },
    };
  } catch (error) {
    console.error('Failed to fetch aggregates:', error);
    return {
      byState: [],
      byPharmacy: [],
      byVariant: [],
      summary: {
        totalStates: 0,
        totalPharmacies: 0,
        totalVariants: 0,
        totalOrders: 0,
        totalSales: 0,
      },
    };
  }
};

/**
 * Aggregate orders by state
 */
function aggregateByState(orders: any[], params?: AggregatesParams): AggregateByState[] {
  const stateMap = new Map<string, {
    totalOrders: number;
    totalSales: number;
    completed: number;
    pending: number;
  }>();

  orders.forEach(order => {
    // Extract state from shipping address or billing address
    const state = order.patient_state ||
      order.shipping_state ||
      order.billing_state ||
      order.state ||
      order.shipping_address?.state ||
      order.billing_address?.state ||
      'Unknown';
    const normalizedState = String(state).trim();

    // Skip if filtering by specific state and this doesn't match
    if (params?.state && normalizedState !== params.state) {
      return;
    }

    const amount = parseFloat(order.orderTotal || order.amount || order.total || '0');
    const status = (order.order_status || order.status || '').toLowerCase();
    const isCompleted = ['completed', 'shipped', 'delivered'].includes(status);
    const isPending = ['pending', 'processing'].includes(status);

    if (!stateMap.has(normalizedState)) {
      stateMap.set(normalizedState, {
        totalOrders: 0,
        totalSales: 0,
        completed: 0,
        pending: 0,
      });
    }

    const current = stateMap.get(normalizedState)!;
    current.totalOrders += 1;
    current.totalSales += amount;
    if (isCompleted) current.completed += 1;
    if (isPending) current.pending += 1;
  });

  return Array.from(stateMap.entries())
    .map(([state, data]) => ({
      state,
      totalOrders: data.totalOrders,
      totalSales: data.totalSales,
      averageOrderValue: data.totalOrders > 0 ? data.totalSales / data.totalOrders : 0,
      completedOrders: data.completed,
      pendingOrders: data.pending,
    }))
    .sort((a, b) => b.totalSales - a.totalSales);
}

/**
 * Aggregate orders by pharmacy
 */
function aggregateByPharmacy(orders: any[], params?: AggregatesParams): AggregateByPharmacy[] {
  const pharmacyMap = new Map<string, {
    id?: string;
    totalOrders: number;
    totalSales: number;
    completed: number;
    pending: number;
  }>();

  orders.forEach(order => {
    const pharmacyId = String(order.pharmacy_id || order.pharmacy || 'unknown');
    const pharmacyName = order.pharmacy_name || order.pharmacy_display_name || `Pharmacy ${pharmacyId}`;

    // Skip if filtering by specific pharmacy and this doesn't match
    if (params?.pharmacy_id && String(pharmacyId) !== String(params.pharmacy_id)) {
      return;
    }

    const amount = parseFloat(order.orderTotal || order.amount || order.total || '0');
    const status = (order.order_status || order.status || '').toLowerCase();
    const isCompleted = ['completed', 'shipped', 'delivered'].includes(status);
    const isPending = ['pending', 'processing'].includes(status);

    if (!pharmacyMap.has(pharmacyName)) {
      pharmacyMap.set(pharmacyName, {
        id: pharmacyId,
        totalOrders: 0,
        totalSales: 0,
        completed: 0,
        pending: 0,
      });
    }

    const current = pharmacyMap.get(pharmacyName)!;
    current.totalOrders += 1;
    current.totalSales += amount;
    if (isCompleted) current.completed += 1;
    if (isPending) current.pending += 1;
  });

  return Array.from(pharmacyMap.entries())
    .map(([pharmacy, data]) => ({
      pharmacy,
      pharmacyId: data.id,
      totalOrders: data.totalOrders,
      totalSales: data.totalSales,
      averageOrderValue: data.totalOrders > 0 ? data.totalSales / data.totalOrders : 0,
      completedOrders: data.completed,
      pendingOrders: data.pending,
    }))
    .sort((a, b) => b.totalSales - a.totalSales);
}

/**
 * Aggregate orders by variant
 */
function aggregateByVariant(orders: any[], params?: AggregatesParams): AggregateByVariant[] {
  const variantMap = new Map<string, {
    id?: string;
    productName?: string;
    totalOrders: number;
    totalQuantity: number;
    totalSales: number;
  }>();

  orders.forEach(order => {
    // 1. Prioritize selected_medicines
    let items = [];
    if (order.selected_medicines && order.selected_medicines.length > 0) {
      items = order.selected_medicines;
    } else {
      items = order.items || order.line_items || order.order_items || [];
    }

    if (items.length === 0) {
      // If no items array, try to get variant from order itself
      const variantId = order.variant_id || order.product_variant_id || 'unknown';
      const variantName = order.variant_name || order.product_name || `Variant ${variantId}`;

      // Skip if filtering by specific variant and this doesn't match
      if (params?.variant_id && variantId !== params.variant_id) {
        return;
      }

      const amount = parseFloat(order.orderTotal || order.amount || order.total || '0');
      const quantity = parseInt(order.quantity || '1', 10);

      if (!variantMap.has(variantName)) {
        variantMap.set(variantName, {
          id: variantId,
          productName: order.product_name,
          totalOrders: 0,
          totalQuantity: 0,
          totalSales: 0,
        });
      }

      const current = variantMap.get(variantName)!;
      current.totalOrders += 1;
      current.totalQuantity += quantity;
      current.totalSales += amount;
    } else {
      items.forEach((item: any) => {
        const variantId = item.variant_id || item.product_variant_id || 'unknown';
        const variantName = item.variant_name || item.name || `Variant ${variantId}`;

        // Skip if filtering by specific variant and this doesn't match
        if (params?.variant_id && variantId !== params.variant_id) {
          return;
        }

        const amount = parseFloat(item.total || item.price || item.amount || '0');
        const quantity = parseInt(item.quantity || '1', 10);

        if (!variantMap.has(variantName)) {
          variantMap.set(variantName, {
            id: variantId,
            productName: order.product_name || item.name,
            totalOrders: 0,
            totalQuantity: 0,
            totalSales: 0,
          });
        }

        const current = variantMap.get(variantName)!;
        current.totalOrders += 1;
        current.totalQuantity += quantity;
        current.totalSales += amount;
      });
    }
  });

  return Array.from(variantMap.entries())
    .map(([variant, data]) => ({
      variant,
      variantId: data.id,
      productName: data.productName,
      totalOrders: data.totalOrders,
      totalQuantity: data.totalQuantity,
      totalSales: data.totalSales,
      averagePrice: data.totalQuantity > 0 ? data.totalSales / data.totalQuantity : 0,
    }))
    .sort((a, b) => b.totalSales - a.totalSales);
}

/**
 * Get list of states from orders
 */
export const getStates = async (): Promise<string[]> => {
  try {
    const ordersResponse = await fetchAllOrders();
    const orders = ordersResponse.results || [];

    const states = new Set<string>();
    orders.forEach((order: any) => {
    const state = order.shipping_state ||
        order.billing_state ||
        order.state ||
        order.shipping_address?.state ||
        order.billing_address?.state;
      if (state) states.add(String(state).trim());
    });

    return Array.from(states).sort();
  } catch (error) {
    console.error('Failed to fetch states:', error);
    return [];
  }
};

/**
 * Get list of pharmacies
 */
export const getPharmacies = async (): Promise<Array<{ id: string; name: string }>> => {
  try {
    const response = await axiosInstance.get('products/pharmacies/');
    const rows = response.data?.results || response.data || [];
    const seen = new Set<string>();
    return (rows as Array<{ id: string; name: string }>).filter((item: any) => {
      const id = String(item?.id ?? "").trim();
      const name = String(item?.name ?? "").trim();
      const key = `${id}::${name}`;
      if (!id || !name || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch (error) {
    console.error('Failed to fetch pharmacies:', error);
    return [];
  }
};

/**
 * Get list of variants
 */
export const getVariants = async (): Promise<Array<{ id: string; name: string }>> => {
  try {
    const response = await axiosInstance.get('products/product-variants/');
    const rows = response.data?.results || response.data || [];
    const seen = new Set<string>();
    return (rows as Array<{ id: string; name: string }>).filter((item: any) => {
      const id = String(item?.id ?? "").trim();
      const name = String(item?.name ?? "").trim();
      const key = `${id}::${name}`;
      if (!id || !name || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch (error) {
    console.error('Failed to fetch variants:', error);
    return [];
  }
};
