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
  impact?: "good" | "bad" | "neutral"
}

export interface LiveSummary {
  activeCarts: number
  checkingOut: number
  purchased: number
}

export interface PatientSummary {
  active_patients: number
  inactive_patients: number
  dropoff_patients: number
  calculated_at?: string
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
  patientSummary?: PatientSummary
  salesChartData: ChartDataPoint[]
  revenueChartData: ChartDataPoint[]
  newPatientChartData?: ChartDataPoint[]  // Optional for backward compatibility
  newClientChartData: ChartDataPoint[]
  orderHistory: OrderHistoryItem[]
  payments: PaymentItem[]
}
