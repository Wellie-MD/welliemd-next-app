export interface DashboardPeriod {
  start: string
  end: string
  previous_start: string
  previous_end: string
}

export interface Metric {
  title: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
}

export interface LiveSummary {
  activeCarts: number
  checkingOut: number
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

export interface DashboardData {
  period: DashboardPeriod
  partial?: boolean
  kpis: Metric[]
  liveSummary: LiveSummary
  salesChartData: ChartDataPoint[]
  revenueChartData: ChartDataPoint[]
  newPatientChartData: ChartDataPoint[]
  orderHistory: OrderHistoryItem[]
  payments: PaymentItem[]
}