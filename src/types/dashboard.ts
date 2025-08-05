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
  kpis: Metric[]
  messages: Message[]
  liveSummary: LiveSummary
  salesChartData: ChartDataPoint[]
  revenueChartData: ChartDataPoint[]
  newPatientChartData: ChartDataPoint[]
  orderHistory: OrderHistoryItem[]
  payments: PaymentItem[]
}