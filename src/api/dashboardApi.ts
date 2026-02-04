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
  salesChartData: ChartDataPoint[];
  revenueChartData: ChartDataPoint[];
  newPatientChartData: ChartDataPoint[];
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
