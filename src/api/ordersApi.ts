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

export interface QuestionnairePhoto {
  question?: string
  question_id?: string
  mime?: string
  data?: string
}

// Prescribed medication from RX_WRITTEN webhook (PrescriptionEvent.medications)
export interface PrescriptionMedication {
  name?: string
  strength?: string
  refills?: string
  quantity?: string
  medId?: string
  rxId?: string
}

export interface OrderPricingSupplyLineItem {
  id?: string | number
  name?: string
  quantity?: number
  unit_price?: string
  shipping_fee?: string
  is_included?: boolean
}

export interface OrderPricing {
  medication_subtotal?: string
  supplies_subtotal?: string
  shipping_total?: string
  subtotal_before_discount?: string
  discount_total?: string
  gross_total?: string
  grand_total?: string
  payable_amount?: string
  currency?: string
  supply_line_items?: OrderPricingSupplyLineItem[]
}

export interface Order {
  id: string
  product?: number | string | null
  display_id?: string
  order_id?: string | null
  coupon_code?: string | null
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
  pharmacy_name?: string | null
  orderDate?: string | null
  datePrescribed?: string | null
  datePrintedShipped?: string | null
  paymentDate?: string | null
  mrn?: string | null
  product_name?: string
  paymentStatus?: string | null
  visitStatus?: string | null
  address?: string | null
  orderStatus?: string | null
  orderTotal?: string | null
  grand_total?: string | null
  payable_amount?: string | null
  pricing?: OrderPricing | null
  original_price?: string | null
  discount_amount?: string | null
  shipping_fee?: string | null
  tracking_number?: string | null
  patient_responses?: PatientResponses | null
  checkout_url?: string | null
  provider_network?: string | null
  notes?: string | null
  // Detail page: from PrescriptionEvent / Visit
  product_name?: string | null
  treatment_type?: string | null
  treatment?: string | null
  doctor_name?: string | null
  requested_medicines?: PrescriptionMedication[]
  prescribed_medicines?: PrescriptionMedication[]
  chargeable_amount_source?: "requested_medicine" | "prescribed_medicine" | "requested_medicine_fallback" | null
  booking_scheduled_at?: string | null
  booking_location?: string | null
  prescription_medications?: PrescriptionMedication[]
  prescription_source_event_id?: string | null
  prescription_source_received_at?: string | null
  prescription_source_created_at?: string | null
  // Shipping address (patient address)
  shipping_address?: string | null
  // B2B reimbursement cost fields
  medication_cost_to_client?: string | null
  consult_cost_to_client?: string | null
  consult_type?: 'async' | 'sync' | null
  shipping_fee_to_client?: string | null
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

export interface UpdateQuestionnaireImagesPayload {
  photos: QuestionnairePhoto[]
}

export interface UpdateQuestionnaireImagesResponse {
  success: boolean
  photos: QuestionnairePhoto[]
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

export const fetchOrdersByPatient = async (patientId: string, params?: Record<string, unknown>): Promise<PaginatedOrdersResponse> => {
  try {
    const { data } = await api.get<PaginatedOrdersResponse>(ENDPOINT, { params: { ...params, patient_id: patientId } })
    return data
  } catch (error) {
    console.error(`Failed to fetch orders for patient ${patientId}:`, error)
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

export const fetchOrderByOrderId = async (orderId: string): Promise<Order> => {
  try {
    const { data } = await api.get<Order>(`${ENDPOINT}by_order_id/${encodeURIComponent(orderId)}/`)
    return data
  } catch (error) {
    console.error(`Failed to fetch order by order_id ${orderId}:`, error)
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

export const changeProduct = async (
  orderId: string,
  newProductId: number | string,
  quantity?: number | string,
  dryRun?: boolean
): Promise<any> => {
  const { data } = await api.post(`/orders/${orderId}/change-product/`, {
    new_product_id: newProductId,
    ...(quantity !== undefined ? { quantity } : {}),
    ...(dryRun ? { dry_run: true } : {}),
  })
  return (data?.data || data)
}

export const updateOrderQuestionnaireImages = async (
  id: string,
  payload: UpdateQuestionnaireImagesPayload
): Promise<UpdateQuestionnaireImagesResponse> => {
  try {
    const { data } = await api.post<UpdateQuestionnaireImagesResponse>(
      `${ENDPOINT}${id}/update-questionnaire-images/`,
      payload
    )
    return data
  } catch (error) {
    console.error(`Failed to update questionnaire images for order ${id}:`, error)
    throw error
  }
}

export const ordersApi = {
  fetchOrders,
  fetchOrdersByPatient,
  fetchOrder,
  fetchOrderByOrderId,
  createOrder,
  updateOrder,
  deleteOrder,
  searchOrders,
  refundOrder,
  changeProduct,
  updateOrderQuestionnaireImages,
}
