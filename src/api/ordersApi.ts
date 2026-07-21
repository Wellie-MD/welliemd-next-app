import api from './axiosInstance'

export interface OrderPatientSummary {
  id: string
  user_id?: string
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
  prescribed_name?: string
  strength?: string
  price?: string | number | null
  refills?: string
  quantity?: string
  medId?: string
  rxId?: string
  shipping_fee?: string | number | null
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

export interface OrderActivityEvent {
  id: string
  event_type: string
  status: string
  title: string
  description: string
  source: string
  occurred_at: string
  payload?: Record<string, unknown>
}

export interface OrderSettlementTransaction {
  id: string
  processor?: string
  status?: string
  amount?: string
  settlement_role?: string
  processor_transaction_id?: string
  created_at?: string | null
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
  paymentProcessorTransactionId?: string | null
  payment_settlement_state?: "pending" | "authorized" | "captured" | "failed" | null
  payment_settlement_basis?: "requested" | "prescribed" | null
  payment_settlement_product_id?: number | string | null
  payment_settlement_amount?: string | number | null
  payment_settlement_trace_id?: string | null
  payment_recovery_state?: "recovery_pending" | null
  remaining_supplemental_amount?: string | null
  prescribed_final_amount?: string | null
  base_capture_amount?: string | null
  supplemental_delta_amount?: string | null
  base_captured_amount?: string | null
  supplemental_captured_amount?: string | null
  payment_settlement_transactions?: OrderSettlementTransaction[]
  totalRefunded?: string | null
  netCollected?: string | null
  refundableAmount?: string | null
  baseRefundableAmount?: string | null
  supplementalRefundableAmount?: string | null
  rx_revision_tag?: string | null
  rx_revision_refund_required_amount?: string | null
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
  paymentUpdatedAt?: string | null
  mrn?: string | null
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
  product_image?: string | null
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
  billing_pending_reason?: string | null
  activity_events?: OrderActivityEvent[]
  episode_id?: string | null
}

export interface PaginatedOrdersResponse {
  count: number
  next: string | null
  previous: string | null
  results: Order[]
}

export interface OrderRefundRequest {
  amount?: string | number
  refund_target?: "auto" | "base" | "supplemental"
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

export interface RetryPaymentPayload {
  saved_payment_method_id?: string
  payment_method_id?: string
  payment_token?: string
  card_meta?: Record<string, unknown>
}

export interface RetryPaymentResponse {
  success: boolean
  error?: string
  detail?: string
  message?: string
  order_id?: string
  order_display_id?: string
  status?: string
  payment_settlement_state?: string
  transaction_id?: string
  transaction_status?: string
  reason_code?: string
  retryable?: boolean
}

export interface SendCheckoutLinkResponse {
  success: boolean
  code?: string
  message?: string
  order_id?: string
  order_display_id?: string
}

export interface ResendReceiptResponse {
  success: boolean
  message?: string
  recipient_email?: string
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

export const fetchOrder = async (id: string, forceFresh = false): Promise<Order> => {
  try {
    const { data } = await api.get<Order>(`${ENDPOINT}${id}/`, {
      params: forceFresh ? { _ts: Date.now() } : undefined,
    })
    return data
  } catch (error) {
    console.error(`Failed to fetch order ${id}:`, error)
    throw error
  }
}

export const fetchOrderByOrderId = async (orderId: string, forceFresh = false): Promise<Order> => {
  try {
    const { data } = await api.get<Order>(`${ENDPOINT}by_order_id/${encodeURIComponent(orderId)}/`, {
      params: forceFresh ? { _ts: Date.now() } : undefined,
    })
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

export const retryPayment = async (id: string, payload: RetryPaymentPayload): Promise<RetryPaymentResponse> => {
  try {
    const { data } = await api.post<RetryPaymentResponse>(`${ENDPOINT}${id}/retry-payment/`, payload)
    return data
  } catch (error) {
    console.error(`Failed to retry payment for order ${id}:`, error)
    throw error
  }
}

export const sendCheckoutLink = async (id: string): Promise<SendCheckoutLinkResponse> => {
  try {
    const { data } = await api.post<SendCheckoutLinkResponse>(`${ENDPOINT}${id}/send-checkout-link/`)
    return data
  } catch (error) {
    console.error(`Failed to send checkout link for order ${id}:`, error)
    throw error
  }
}

export const resendReceipt = async (id: string): Promise<ResendReceiptResponse> => {
  try {
    const { data } = await api.post<ResendReceiptResponse>(`${ENDPOINT}${id}/receipt/resend/`)
    return data
  } catch (error) {
    console.error(`Failed to resend receipt for order ${id}:`, error)
    throw error
  }
}

export const downloadReceipt = async (id: string): Promise<Blob> => {
  try {
    const { data } = await api.get(`${ENDPOINT}${id}/receipt/download/`, {
      responseType: "blob",
    })
    return data
  } catch (error) {
    console.error(`Failed to download receipt for order ${id}:`, error)
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

export interface FilterOption {
  id: string | number
  name: string
}

const extractResults = (data: unknown): FilterOption[] => {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && 'results' in data && Array.isArray((data as any).results)) return (data as any).results
  return []
}

export const fetchCategories = async (): Promise<FilterOption[]> => {
  try {
    const { data } = await api.get('/products/categories/')
    return extractResults(data)
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }
}

export const fetchPharmacies = async (): Promise<FilterOption[]> => {
  try {
    const { data } = await api.get('/products/pharmacies/')
    return extractResults(data)
  } catch (error) {
    console.error('Failed to fetch pharmacies:', error)
    return []
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
  retryPayment,
  sendCheckoutLink,
  resendReceipt,
  downloadReceipt,
  changeProduct,
  updateOrderQuestionnaireImages,
  fetchCategories,
  fetchPharmacies,
}
