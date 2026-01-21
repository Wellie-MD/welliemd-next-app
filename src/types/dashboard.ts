export interface Metric {
  title: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
}

export interface Message {
  id: number
  name: string
  time: string
  avatar: string
}

export interface LiveSummary {
  active_carts: number
  checking_out: number
  purchased: number
}

export interface ChartDataPoint {
  month?: string
  day?: string
  [key: string]: string | number | undefined
}

export interface OrderHistoryItem {
  date: string
  deliveryDate: string
  orderNumber: string
  name: string
  product: string
  pharmacy: string
  amount: string
}

export interface PaymentItem {
  date: string
  patientId: string
  patientName: string
  orderNumber: string
  totalAmount: string
  discount: string
  amountPaid: string
}

export interface DashboardMetrics {
  total_patients: number
  total_revenue: number
  total_profit: number
  total_expenses: number
  total_sales: number
  total_orders: number
  growth_percentage: number
  live_summary: LiveSummary
}

export interface DashboardData {
  kpis: Metric[]
  messages: Message[]
  liveSummary: LiveSummary
  salesChartData: ChartDataPoint[]
  revenueChartData: ChartDataPoint[]
  newPatientChartData: ChartDataPoint[]
  orderHistory: OrderHistoryItem[]
  payments: PaymentItem[]
}
