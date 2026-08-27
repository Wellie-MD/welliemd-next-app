/**
 * Admin Dashboard API Client
 *
 * Provides functions to fetch aggregated dashboard data from the Control Plane.
 */
import axiosInstance from './axiosInstance';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface DashboardPeriod {
  start: string;
  end: string;
  previous_start: string;
  previous_end: string;
}

export interface Metric {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  impact?: 'good' | 'bad' | 'neutral';
}

export interface LiveSummary {
  activeCarts: number;
  checkingOut: number;
  purchased: number;
}

export interface PatientSummary {
  active_patients: number;
  inactive_patients: number;
  dropoff_patients: number;
  calculated_at?: string;
}

export interface ChartDataPoint {
  month?: string;
  day?: string;
  [key: string]: any;
}

export interface OrderHistoryItem {
  date: string;
  deliveryDate: string;
  orderNumber: string;
  name: string;
  product: string;
  pharmacy: string;
  amount: string;
}

export interface PaymentItem {
  date: string;
  patientId: string;
  patientName: string;
  orderNumber: string;
  totalAmount: string;
  discount: string;
  amountPaid: string;
}

export interface DashboardData {
  period: DashboardPeriod;
  partial?: boolean;
  kpis: Metric[];
  liveSummary: LiveSummary;
  patientSummary?: PatientSummary;
  salesChartData: ChartDataPoint[];
  revenueChartData: ChartDataPoint[];
  newClientChartData: ChartDataPoint[];
  orderHistory: OrderHistoryItem[];
  payments: PaymentItem[];
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch aggregated dashboard overview data.
 * 
 * This endpoint aggregates metrics from all tenant databases and returns
 * a complete dashboard view. Data is cached for 5 minutes on the backend.
 * 
 * @returns Promise<DashboardData> - Complete dashboard data
 * @throws Error if request fails
 */
export interface DashboardOverviewParams {
  start_date?: string;
  end_date?: string;
  client_id?: string;
}

export async function getAdminDashboardOverview(params?: DashboardOverviewParams): Promise<DashboardData> {
  const start = performance.now();
  try {
    const { data } = await axiosInstance.get<DashboardData>('/admin/dashboard/overview/', { params });
    const duration = performance.now() - start;
    const existing = (window as any).__perfMetrics || {};
    (window as any).__perfMetrics = { ...existing, dashboard_api_ms: duration };
    return data;
  } catch (error: any) {
    const duration = performance.now() - start;
    const existing = (window as any).__perfMetrics || {};
    (window as any).__perfMetrics = { ...existing, dashboard_api_ms: duration };
    console.error('Failed to fetch admin dashboard overview:', error);
    throw new Error(
      error.response?.data?.error ||
      'Failed to load dashboard data. Please try again.'
    );
  }
}

/**
 * Helper function to format currency values
 */
export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numValue);
}

/**
 * Helper function to format percentage values
 */
export function formatPercentage(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return `${numValue.toFixed(1)}%`;
}

/**
 * Helper function to parse metric value
 */
export function parseMetricValue(value: string): number {
  // Remove currency symbols, commas, and percentage signs
  return parseFloat(value.replace(/[$,%]/g, ''));
}

// ============================================================================
// Orders API
// ============================================================================

export interface AdminOrderSummary {
  id: string;
  display_id: string;
  order_id?: string | null;
  master_id?: string | null;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  product_name: string;
  pharmacy_name: string;
  status: string;
  status_display: string;
  visit_status?: string | null;
  amount: number;
  payment_recovery_state?: 'recovery_pending' | null;
  remaining_supplemental_amount?: string | null;
  chargeable_amount?: string | number | null;
  chargeable_amount_source?: 'requested_medicine' | 'prescribed_medicine' | 'requested_medicine_fallback' | null;
  discount_amount: number;
  coupon_code?: string | null;
  original_price?: string | number | null;
  payment_settlement_state?: string | null;
  payment_settlement_basis?: string | null;
  payment_settlement_amount?: string | number | null;
  prescribed_final_amount?: string | number | null;
  base_capture_amount?: string | number | null;
  supplemental_delta_amount?: string | number | null;
  base_captured_amount?: string | number | null;
  supplemental_captured_amount?: string | number | null;
  total_patient_captured?: string | number | null;
  total_patient_refunded?: string | number | null;
  requested_medicine_name?: string | null;
  prescribed_medicine_name?: string | null;
  doctor_name?: string | null;
  payment_status: 'paid' | 'partially_paid' | 'pending' | 'failed' | 'refunded' | string;
  created_at: string;
  prescribed_at: string | null;
  shipped_at: string | null;
  tracking_number: string;
  client_name: string;
  client_id: string;
  treatment_aggregate?: TreatmentOrderAggregate | null;
}

export interface AdminOrderLineItem {
  id: string;
  product_id?: number | null;
  product_name?: string | null;
  item_type?: string | null;
  quantity?: string | number | null;
  unit_patient_price?: string | number | null;
  unit_shipping_fee?: string | number | null;
  line_total?: string | number | null;
  is_included?: boolean;
  parent_line_item?: string | null;
  source_supply_relation_id?: number | null;
  status?: string | null;
  prescription_status?: string | null;
  fulfilment_status?: string | null;
  shipment_status?: string | null;
  refund_status?: string | null;
  duration_days?: number | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  shipment_provider?: string | null;
}

export interface AdminProductPaymentReservation {
  id: string;
  line_item_id: string;
  product_id?: number | string | null;
  product_name?: string | null;
  amount?: string | number | null;
  currency?: string | null;
  authorized_amount?: string | number | null;
  captured_amount?: string | number | null;
  voided_amount?: string | number | null;
  refunded_amount?: string | number | null;
  status?: string | null;
  processor?: string | null;
  provider_transaction_id?: string | null;
  patient_action?: "do_not_resubmit" | "complete_required_action" | "contact_support" | null;
  safe_to_retry?: boolean;
}

export interface AdminOrderActivityEvent {
  id: string;
  event_type: string;
  status: string;
  title: string;
  description: string;
  source: string;
  occurred_at: string;
  payload?: Record<string, unknown>;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  line_items: AdminOrderLineItem[];
  product_payment_reservations?: AdminProductPaymentReservation[];
  activity_events: AdminOrderActivityEvent[];
  requested_medicines?: Array<Record<string, unknown>>;
  prescribed_medicines?: Array<Record<string, unknown>>;
  prescription_medications?: Array<Record<string, unknown>>;
  shipping_address_snapshot?: {
    formatted?: string | null;
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
    source: "checkout_snapshot";
  } | null;
  shipping_address?: string | null;
  address?: string | null;
  pharmacy?: {
    id?: string | number | null;
    name?: string | null;
    store_name?: string | null;
    npi?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
  pharmacy_npi?: string | null;
  pharmacy_phone?: string | null;
  pharmacy_address?: string | null;
  pharmacy_fulfillment_status?: string | null;
  allowed_status_transitions?: Array<{ value: string; label: string }>;
  tracking_url?: string | null;
  paymentProcessor?: string | null;
  paymentTransactionId?: string | null;
  paymentProcessorTransactionId?: string | null;
  payment_settlement_transactions?: Array<{
    id: string;
    processor?: string | null;
    status?: string | null;
    amount?: string | number | null;
    processor_transaction_id?: string | null;
    created_at?: string | null;
  }>;
  pricing?: {
    medication_subtotal?: string | number | null;
    supplies_subtotal?: string | number | null;
    shipping_total?: string | number | null;
    discount_total?: string | number | null;
    grand_total?: string | number | null;
    payable_amount?: string | number | null;
    currency?: string | null;
  } | null;
  grand_total?: string | number | null;
  payable_amount?: string | number | null;
  totalRefunded?: string | number | null;
  notes?: string | null;
  coupon_code?: string | null;
  medication_cost_to_client?: string | number | null;
  consult_cost_to_client?: string | number | null;
  shipping_fee_to_client?: string | number | null;
  consult_type?: string | null;
  billing_pending_reason?: string | null;
}

/** Backward-compatible list-row alias. Rich drawer components require AdminOrderDetail. */
export type AdminOrder = AdminOrderSummary;

export interface TreatmentAggregateProduct {
  product_id?: string | number | null;
  source_product_id?: string | number | null;
  med_id?: string | null;
  name?: string | null;
  quantity?: number | null;
  days_supply?: number | null;
  product_role?: string | null;
  choice_group?: string | null;
}

export interface TreatmentOrderAggregate {
  clinical_status: string;
  patient_message?: string | null;
  treatment_case_id: string;
  authority: {
    state: string;
    version: number;
    fingerprint?: string | null;
    updated_at?: string | null;
  };
  treatment_type: { id: string; key: string; name: string };
  reconciliation: {
    version?: number | null;
    status: string;
    requested_set: TreatmentAggregateProduct[];
    prescribed_set: TreatmentAggregateProduct[];
    factual_differences?: {
      prescribed_addition_product_ids?: Array<string | number>;
      requested_absence_product_ids?: Array<string | number>;
      absence_is_authoritative?: boolean;
    };
    is_complete_snapshot?: boolean;
    unresolved_facts?: unknown[];
    source_event_id?: string;
    fingerprint?: string;
  };
  settlement: {
    status: string;
    operation_id?: string;
    patient_attempts?: number;
    reimbursement_attempts?: number;
    last_error_code?: string;
    settled_at?: string | null;
  };
  support?: {
    owner?: string | null;
    pending_reason?: string | null;
    retry_allowed: boolean;
    last_error_code?: string;
    last_error_detail?: string;
  };
  siblings: Array<{
    order_id: string;
    order_display_id?: string | null;
    treatment_case_id: string;
    treatment_type_key: string;
    treatment_type_name?: string | null;
    status: string;
    lifecycle_status?: string;
  }>;
}

export interface OrdersListResponse {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  orders: AdminOrder[];
}

export interface OrdersQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  product__category__id?: string | number;
  pharmacy__id?: string;
  payment_status?: string;
  client_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface FilterOption {
  id: string | number;
  name: string;
}

export interface OrderFilterOptions {
  categories: FilterOption[];
  pharmacies: FilterOption[];
}

/**
 * Fetch paginated orders list from all tenants.
 * 
 * @param params - Query parameters for filtering and pagination
 * @returns Promise<OrdersListResponse> - Paginated orders data
 * @throws Error if request fails
 */
export async function getAdminOrders(
  params: OrdersQueryParams = {},
  signal?: AbortSignal
): Promise<OrdersListResponse> {
  const start = performance.now();
  try {
    const { data } = await axiosInstance.get<OrdersListResponse>('/admin/dashboard/orders/', {
      params,
      signal,
    });
    const duration = performance.now() - start;
    const existing = (window as any).__perfMetrics || {};
    (window as any).__perfMetrics = { ...existing, orders_api_ms: duration };
    return data;
  } catch (error: any) {
    // Re-throw cancellation errors without wrapping or recording perf
    if (error.name === 'CanceledError') {
      throw error;
    }
    const duration = performance.now() - start;
    const existing = (window as any).__perfMetrics || {};
    (window as any).__perfMetrics = { ...existing, orders_api_ms: duration };
    console.error('Failed to fetch admin orders:', error);
    throw new Error(
      error.response?.data?.error ||
      'Failed to load orders. Please try again.'
    );
  }
}

/**
 * Fetch aggregated filter options (categories and pharmacies) from all tenants.
 * Used to populate filter dropdowns in the admin orders page.
 *
 * @returns Promise<OrderFilterOptions> - Aggregated categories and pharmacies
 */
export async function getOrderFilterOptions(): Promise<OrderFilterOptions> {
  try {
    const { data } = await axiosInstance.get<OrderFilterOptions>('/admin/dashboard/order-filter-options/');
    return data;
  } catch (error) {
    console.error('Failed to fetch order filter options:', error);
    return { categories: [], pharmacies: [] };
  }
}

export interface OrderUpdatePayload {
  client_id: string;
  status?: string;
  tracking_number?: string;
}

export interface OrderUpdateResponse {
  success?: boolean;
  order?: AdminOrder;
  status?: 'queued' | 'processing';
  attempt_id?: string;
  message?: string;
  error?: string;
}

/**
 * Update an order's status and/or tracking number via the control plane.
 *
 * Sends an Idempotency-Key header (UUID v4) so duplicate requests are
 * deduplicated server-side.  The backend returns 202 when the update is
 * queued for async processing, or 200 when replaying a cached result.
 */
/**
 * Fetch full order detail from the control plane.
 * Returns the same shape as AdminOrder but may include richer fields
 * such as line_items, requested_medicines, linked_supplies, etc.
 */
export async function fetchAdminOrderDetail(orderId: string, clientId: string): Promise<AdminOrderDetail> {
  try {
    const { data } = await axiosInstance.get<AdminOrderDetail>(
      `/admin/dashboard/orders/${orderId}/`,
      { params: { client_id: clientId } }
    );
    return data;
  } catch (error: any) {
    console.error('Failed to fetch order detail:', error);
    throw new Error(
      error.response?.data?.error ||
      'Failed to load order details. Please try again.'
    );
  }
}

export async function updateAdminOrder(
  orderId: string,
  payload: OrderUpdatePayload
): Promise<OrderUpdateResponse> {
  try {
    const idempotencyKey = crypto.randomUUID();
    const { data } = await axiosInstance.patch<OrderUpdateResponse>(
      `/admin/dashboard/orders/${orderId}/`,
      payload,
      { headers: { 'Idempotency-Key': idempotencyKey } }
    );
    return data;
  } catch (error: any) {
    console.error('Failed to update order:', error);
    throw new Error(
      error.response?.data?.error ||
      'Failed to update order. Please try again.'
    );
  }
}
