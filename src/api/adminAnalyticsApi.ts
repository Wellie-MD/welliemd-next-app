import axiosInstance from './axiosInstance';

export interface ClientAnalyticsKPIs {
  total_orders: number;
  total_sales: number;
  total_patients: number;
  active_patients: number;
  inactive_patients: number;
  dropoff_patients: number;
  total_visits: number;
  avg_order_value: number;
  product_cost: number;
  shipping_cost: number;
}

export interface ClientRevenue {
  saas_fees: number;
  patient_fees: number;
  reimbursement: number;
  total: number;
}

export interface ClientAnalyticsRow {
  client_id: string;
  client_name: string;
  is_active: boolean;
  created_at: string;
  kpis: ClientAnalyticsKPIs;
  revenue: ClientRevenue;
  orders_by_month: Array<{ month: string; count: number }>;
}

export interface ClientAnalyticsResponse {
  period: { start: string; end: string };
  partial: boolean;
  clients: ClientAnalyticsRow[];
  platform_totals: {
    total_orders: number;
    total_sales: number;
    total_clients_active: number;
    total_patients: number;
    total_revenue: number;
    avg_order_value: number;
  };
  orders_trend: Array<{ month: string; count: number }>;
  revenue_trend: Array<{ month: string; value: number }>;
}

export interface ClientAnalyticsParams {
  start_date?: string;
  end_date?: string;
  client_id?: string;
}

/**
 * Fetch cross-tenant client performance analytics
 */
export async function getClientAnalytics(params?: ClientAnalyticsParams): Promise<ClientAnalyticsResponse> {
  try {
    const { data } = await axiosInstance.get<ClientAnalyticsResponse>('/admin/dashboard/analytics/clients/', {
      params
    });
    return data;
  } catch (error: any) {
    console.error('Failed to fetch client analytics:', error);
    throw new Error(
      error.response?.data?.error ||
      'Failed to load client performance data. Please try again.'
    );
  }
}
