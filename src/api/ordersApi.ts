import api from './axiosInstance'

export interface OrderPatientSummary {
  id: string
  full_name: string
}

// Patient information from beluga payload
export interface PatientInfo {
  firstName?: string
  lastName?: string
  email?: string
  dateOfBirth?: string
  sex?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  allergies?: string
  medicalConditions?: string
  currentMedications?: string
  height?: string
  weight?: string
  bmi?: string | number
}

// Questionnaire item structure
export interface QuestionnaireItem {
  question?: string
  answer?: string
  [key: string]: unknown
}

// Beluga payload structure
export interface PatientResponses {
  company?: string
  formObj?: Record<string, unknown>  // Q1/A1, Q2/A2 format from Beluga
  patientInfo?: PatientInfo
  questionnaireItems?: QuestionnaireItem[] | Record<string, unknown>
  medications?: unknown[]
  photos?: unknown[]
  [key: string]: unknown
}

export interface Order {
  id: string
  display_id?: string
  patient?: OrderPatientSummary | null
  amount?: string
  status?: string
  paymentProcessor?: string | null
  paymentTransactionId?: string | null
  totalRefunded?: string | null
  refundableAmount?: string | null
  created_at?: string
  updated_at?: string
  name?: string
  email?: string
  phone?: string
  pharmacy_display?: string | null
  orderDate?: string | null
  datePrescribed?: string | null
  datePrintedShipped?: string | null
  paymentDate?: string | null
  mrn?: string | null
  paymentStatus?: string | null
  visitStatus?: string | null
  address?: string | null
  orderStatus?: string | null
  orderTotal?: string | null
  tracking_number?: string | null
  patient_responses?: PatientResponses | null
}

export interface PaginatedOrdersResponse {
  count: number
  next: string | null
  previous: string | null
  results: Order[]
}

export interface OrderRefundRequest {
  amount?: string | number
  reason: string
  reason_description?: string
  notes?: string
}

export interface OrderRefundResponse {
  action: 'voided' | 'refunded'
  transaction?: Record<string, unknown>
  refund?: Record<string, unknown> | null
  remaining_refundable?: string
}

const ENDPOINT = '/orders/'

export const fetchOrders = async (params?: Record<string, unknown>): Promise<PaginatedOrdersResponse> => {
  try {
    const { data } = await api.get<PaginatedOrdersResponse>(ENDPOINT, { params })
    return data
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    throw error
  }
}

export const fetchOrder = async (id: string): Promise<Order> => {
  try {
    const { data } = await api.get<Order>(`${ENDPOINT}${id}/`)
    return data
  } catch (error) {
    console.error(`Failed to fetch order ${id}:`, error)
    throw error
  }
}

export const createOrder = async (payload: Partial<Order>): Promise<Order> => {
  try {
    const { data } = await api.post<Order>(ENDPOINT, payload)
    return data
  } catch (error) {
    console.error('Failed to create order:', error)
    throw error
  }
}

export const updateOrder = async (id: string, payload: Partial<Order>): Promise<Order> => {
  try {
    const { data } = await api.patch<Order>(`${ENDPOINT}${id}/`, payload)
    return data
  } catch (error) {
    console.error(`Failed to update order ${id}:`, error)
    throw error
  }
}

export const deleteOrder = async (id: string): Promise<void> => {
  try {
    await api.delete(`${ENDPOINT}${id}/`)
  } catch (error) {
    console.error(`Failed to delete order ${id}:`, error)
    throw error
  }
}

export const searchOrders = async (query: string): Promise<PaginatedOrdersResponse> => {
  try {
    const { data } = await api.get<PaginatedOrdersResponse>(ENDPOINT, { params: { search: query } })
    return data
  } catch (error) {
    console.error('Failed to search orders:', error)
    throw error
  }
}

export const refundOrder = async (id: string, payload: OrderRefundRequest): Promise<OrderRefundResponse> => {
  try {
    const { data } = await api.post<OrderRefundResponse>(`${ENDPOINT}${id}/refund/`, payload)
    return data
  } catch (error) {
    console.error(`Failed to refund order ${id}:`, error)
    throw error
  }
}

export const ordersApi = {
  fetchOrders,
  fetchOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  searchOrders,
  refundOrder,
}
