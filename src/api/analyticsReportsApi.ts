// Reports API Service for Aggregate Data
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

function normalizeText(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeCaseInsensitive(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function parseOrderAmount(order: any): number {
  return parseFloat(order.orderTotal || order.amount || order.total || '0');
}

function getOrderState(order: any): string {
  const state = order.patient_state ||
    order.shipping_state ||
    order.billing_state ||
    order.state ||
    order.shipping_address?.state ||
    order.billing_address?.state ||
    'Unknown';
  const normalized = normalizeText(state);
  return normalized || 'Unknown';
}

function getOrderPharmacy(order: any): { key: string; name: string } {
  const pharmacyId = normalizeText(order.pharmacy_id ?? order.pharmacy);
  const pharmacyName = normalizeText(order.pharmacy_name || order.pharmacy_display_name || order.pharmacy_display || '');

  if (pharmacyId) {
    return {
      key: `id:${pharmacyId}`,
      name: pharmacyName || `Pharmacy ${pharmacyId}`,
    };
  }

  const fallbackName = pharmacyName || 'Unknown';
  return {
    key: `name:${normalizeCaseInsensitive(fallbackName)}`,
    name: fallbackName,
  };
}

function getOrderVariantEntries(order: any): Array<{ key: string; id?: string; variant: string; productName?: string; quantity: number; amount: number }> {
  const variants: Array<{ key: string; id?: string; variant: string; productName?: string; quantity: number; amount: number }> = [];
  const productName = normalizeText(order.product_name) || undefined;

  let items: any[] = [];
  if (Array.isArray(order.selected_medicines) && order.selected_medicines.length > 0) {
    items = order.selected_medicines;
  } else if (Array.isArray(order.items) && order.items.length > 0) {
    items = order.items;
  } else if (Array.isArray(order.line_items) && order.line_items.length > 0) {
    items = order.line_items;
  } else if (Array.isArray(order.order_items) && order.order_items.length > 0) {
    items = order.order_items;
  }

  if (items.length === 0) {
    const rawId = normalizeText(order.variant_id || order.product_variant_id);
    const rawName = normalizeText(order.variant_name || order.product_name || 'Unknown');
    const key = rawId ? `id:${rawId}` : `name:${normalizeCaseInsensitive(rawName)}`;
    variants.push({
      key,
      id: rawId || undefined,
      variant: rawName || 'Unknown',
      productName,
      quantity: parseInt(order.quantity || '1', 10) || 1,
      amount: parseOrderAmount(order),
    });
    return variants;
  }

  items.forEach((item) => {
    const rawId = normalizeText(item?.variant_id || item?.product_variant_id);
    const rawName = normalizeText(item?.variant_name || item?.name || order.product_name || 'Unknown');
    const key = rawId ? `id:${rawId}` : `name:${normalizeCaseInsensitive(rawName)}`;
    variants.push({
      key,
      id: rawId || undefined,
      variant: rawName || 'Unknown',
      productName: productName || normalizeText(item?.product_name) || undefined,
      quantity: parseInt(item?.quantity || '1', 10) || 1,
      amount: parseFloat(item?.total || item?.price || item?.amount || '0') || 0,
    });
  });

  return variants;
}

function orderMatchesReportFilters(order: any, params?: AggregatesParams): boolean {
  if (!params) return true;

  if (params.state) {
    const orderState = getOrderState(order);
    if (normalizeCaseInsensitive(orderState) !== normalizeCaseInsensitive(params.state)) {
      return false;
    }
  }

  if (params.pharmacy_id) {
    const pharmacy = getOrderPharmacy(order);
    if (pharmacy.key !== params.pharmacy_id) {
      return false;
    }
  }

  if (params.variant_id) {
    const variants = getOrderVariantEntries(order);
    const hasVariant = variants.some((variant) => variant.key === params.variant_id);
    if (!hasVariant) {
      return false;
    }
  }

  return true;
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

    // Apply report filters globally so all cards/tables represent the same dataset.
    orders = orders.filter((order: any) => orderMatchesReportFilters(order, params));

    const byState = aggregateByState(orders);
    const byPharmacy = aggregateByPharmacy(orders);
    const byVariant = aggregateByVariant(orders);

    // Calculate summary
    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, order) => {
      const total = parseOrderAmount(order);
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
function aggregateByState(orders: any[]): AggregateByState[] {
  const stateMap = new Map<string, {
    totalOrders: number;
    totalSales: number;
    completed: number;
    pending: number;
  }>();

  orders.forEach(order => {
    // Extract state from shipping address or billing address
    const normalizedState = getOrderState(order);

    const amount = parseOrderAmount(order);
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
function aggregateByPharmacy(orders: any[]): AggregateByPharmacy[] {
  const pharmacyMap = new Map<string, {
    id: string;
    name: string;
    totalOrders: number;
    totalSales: number;
    completed: number;
    pending: number;
  }>();

  orders.forEach(order => {
    const pharmacy = getOrderPharmacy(order);

    const amount = parseOrderAmount(order);
    const status = (order.order_status || order.status || '').toLowerCase();
    const isCompleted = ['completed', 'shipped', 'delivered'].includes(status);
    const isPending = ['pending', 'processing'].includes(status);

    if (!pharmacyMap.has(pharmacy.key)) {
      pharmacyMap.set(pharmacy.key, {
        id: pharmacy.key,
        name: pharmacy.name,
        totalOrders: 0,
        totalSales: 0,
        completed: 0,
        pending: 0,
      });
    }

    const current = pharmacyMap.get(pharmacy.key)!;
    current.totalOrders += 1;
    current.totalSales += amount;
    if (isCompleted) current.completed += 1;
    if (isPending) current.pending += 1;
  });

  return Array.from(pharmacyMap.entries())
    .map(([, data]) => ({
      pharmacy: data.name,
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
function aggregateByVariant(orders: any[]): AggregateByVariant[] {
  const variantMap = new Map<string, {
    id?: string;
    variant: string;
    productName?: string;
    totalOrders: number;
    totalQuantity: number;
    totalSales: number;
  }>();

  orders.forEach(order => {
    const variants = getOrderVariantEntries(order);
    variants.forEach((variant) => {
      if (!variantMap.has(variant.key)) {
        variantMap.set(variant.key, {
          id: variant.id,
          variant: variant.variant,
          productName: variant.productName,
          totalOrders: 0,
          totalQuantity: 0,
          totalSales: 0,
        });
      }

      const current = variantMap.get(variant.key)!;
      current.totalOrders += 1;
      current.totalQuantity += variant.quantity;
      current.totalSales += variant.amount;
      if (!current.productName && variant.productName) {
        current.productName = variant.productName;
      }
    });
  });

  return Array.from(variantMap.entries())
    .map(([, data]) => ({
      variant: data.variant,
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
      const state = getOrderState(order);
      if (state) states.add(state);
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
    const ordersResponse = await fetchAllOrders();
    const orders = ordersResponse.results || [];
    const seen = new Set<string>();
    const pharmacies: Array<{ id: string; name: string }> = [];

    orders.forEach((order: any) => {
      const pharmacy = getOrderPharmacy(order);
      if (!pharmacy.name || seen.has(pharmacy.key)) return;
      seen.add(pharmacy.key);
      pharmacies.push({ id: pharmacy.key, name: pharmacy.name });
    });

    return pharmacies.sort((a, b) => a.name.localeCompare(b.name));
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
    const ordersResponse = await fetchAllOrders();
    const orders = ordersResponse.results || [];
    const seen = new Set<string>();
    const variants: Array<{ id: string; name: string }> = [];

    orders.forEach((order: any) => {
      getOrderVariantEntries(order).forEach((variant) => {
        if (!variant.variant || seen.has(variant.key)) return;
        seen.add(variant.key);
        variants.push({ id: variant.key, name: variant.variant });
      });
    });

    return variants.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Failed to fetch variants:', error);
    return [];
  }
};
