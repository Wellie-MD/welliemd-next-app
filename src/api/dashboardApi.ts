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
export async function getAdminDashboardOverview(): Promise<DashboardData> {
  try {
    const { data } = await axiosInstance.get<DashboardData>('/admin/dashboard/overview/');
    return data;
  } catch (error: any) {
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

export interface AdminOrder {
  id: string;
  display_id: string;
  order_id?: string | null;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  product_name: string;
  pharmacy_name: string;
  status: string;
  status_display: string;
  amount: number;
  discount_amount: number;
  payment_status: 'paid' | 'pending' | 'failed';
  created_at: string;
  prescribed_at: string | null;
  shipped_at: string | null;
  tracking_number: string;
  client_name: string;
  client_id: string;
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
  date_from?: string;
  date_to?: string;
}

/**
 * Fetch paginated orders list from all tenants.
 * 
 * @param params - Query parameters for filtering and pagination
 * @returns Promise<OrdersListResponse> - Paginated orders data
 * @throws Error if request fails
 */
export async function getAdminOrders(params: OrdersQueryParams = {}): Promise<OrdersListResponse> {
  try {
    const { data } = await axiosInstance.get<OrdersListResponse>('/admin/dashboard/orders/', {
      params
    });
    return data;
  } catch (error: any) {
    console.error('Failed to fetch admin orders:', error);
    throw new Error(
      error.response?.data?.error ||
      'Failed to load orders. Please try again.'
    );
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
