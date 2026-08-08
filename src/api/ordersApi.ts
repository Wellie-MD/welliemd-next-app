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
  documents?: QuestionnaireDocument[]
  [key: string]: unknown
}

export interface QuestionnairePhoto {
  question?: string
  question_id?: string
  mime?: string
  data?: string
}

export interface QuestionnaireDocument {
  question?: string
  question_id?: string
  mime?: string
  filename?: string
  upload_type?: string
  data?: string
}

// Prescribed medication from RX_WRITTEN webhook (PrescriptionEvent.medications)
export interface PrescriptionMedication {
  id?: string | number
  product_id?: string | number
  source_product_id?: string | number
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

export interface IntakeResponseSummary {
  source: "phase_ii"
  program?: { id?: string | null; name?: string; release_version?: number | null }
  sections: Array<{
    title: string
    responses: Array<{
      question_id: string
      question: string
      answer: unknown
      answer_type?: string
      label_unavailable?: boolean
    }>
  }>
  consents?: unknown[]
}

export interface ShippingAddressSnapshot {
  address1?: string
  address2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  formatted?: string
  source: "checkout_snapshot"

export interface PrescriptionHistoryMedication {
  product_name?: string
  medication?: string
  pharmacy_name?: string
  quantity?: string
  refills?: string
  strength?: string
  rx_id?: string
  med_id?: string
}

export interface PrescriptionHistoryEvent {
  kind: 'requested_at_checkout' | 'rx_written'
  label: string
  occurred_at?: string | null
  actor_name?: string | null
  actor_role?: string | null
  medications: PrescriptionHistoryMedication[]
  event_id?: string | null
}

export interface PrescriptionHistoryResponse {
  order_id?: string | null
  patient_name?: string | null
  prescription_event_count: number
  revision_count: number
  events: PrescriptionHistoryEvent[]
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
  discount_amount?: string
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

export interface OrderLineItem {
  id: string
  product_id?: number | null
  product_name?: string | null
  product_image?: string | null
  item_type?: string
  quantity?: string | number
  unit_patient_price?: string | number
  unit_shipping_fee?: string | number
  line_total?: string | number
  status?: string
  is_included?: boolean
  parent_line_item?: string | null
  source_supply_relation_id?: number | null
  patient_price_snapshot?: Record<string, unknown>
  reimbursement_amount_snapshot?: Record<string, unknown> | null
  prescription_status?: string
  fulfilment_status?: string
  shipment_status?: string
  refund_status?: string
  duration_days?: number | null
  provider_product_id?: string | null
  tracking_number?: string | null
  tracking_url?: string | null
  shipment_provider?: string | null
  prescription_event_id?: string | null
  prescribed_at?: string | null
  fulfilled_at?: string | null
  shipped_at?: string | null
  cancelled_at?: string | null
  refunded_amount?: string | number
  lifecycle_snapshot?: Record<string, unknown>
  created_at?: string | null
  updated_at?: string | null
}

export interface TreatmentCaseSummary {
  id: string
  treatment_type_id?: string
  treatment_type_key?: string | null
  beluga_dispatch_status?: string | null
  beluga_dispatch_reason?: string | null
  beluga_dispatch_attempt_count?: number | null
  program_id?: string | null
  release_id?: string | null
  release_version?: number | null
  release_checksum?: string | null
  status?: string
  lifecycle_status?: string
  visit_id?: string | null
  visit_status?: string | null
  beluga_dispatch_status?: string | null
  treatment_total?: string
  reimbursement_total?: string
  common_answers?: Record<string, unknown>
  scoped_answers?: Record<string, unknown>
  consents?: unknown[]
}

export interface CombinedSubmissionSummary {
  id: string
  status?: string
  release_id?: string | null
  release_version?: number | null
  release_checksum?: string
  runtime_session_id?: string
  pricing_snapshot?: Record<string, unknown>
  checkout_total?: Record<string, unknown>
  combined_payment_id?: string | null
  combined_payment?: {
    id: string
    status?: string
    currency?: string
    authorized_amount?: string
    captured_amount?: string
    refunded_amount?: string
    allocations?: Array<{
      id: string
      order_id: string
      treatment_case_id: string
      status?: string
      allocated_amount?: string
      captured_amount?: string
      refunded_amount?: string
    }>
  } | null
  orders?: Array<{
    order_id: string
    order_display_id?: string | null
    treatment_case_id: string
    treatment_type_id?: string
    treatment_type_key?: string | null
    status?: string
    beluga_dispatch_status?: string | null
    beluga_dispatch_reason?: string | null
    beluga_dispatch_attempt_count?: number | null
    treatment_total?: string
    payment_allocation?: {
      id: string
      status?: string
      allocated_amount?: string
      captured_amount?: string
      refunded_amount?: string
    } | null
  }>
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

export interface TreatmentAggregateProduct {
  product_id?: string | number | null
  source_product_id?: string | number | null
  med_id?: string | null
  name?: string | null
  quantity?: string | number | null
  days_supply?: number | null
  product_role?: string | null
  choice_group?: string | null
}

export interface TreatmentOrderAggregate {
  clinical_status: string
  patient_message?: string | null
  treatment_case_id: string
  lifecycle: {
    status: string
    can_withdraw: boolean
    reauthorization_required: boolean
    support_recovery_required: boolean
  }
  authority: {
    state: string
    version: number
    fingerprint?: string | null
    updated_at?: string | null
  }
  treatment_type: {
    id: string
    key?: string | null
    name?: string | null
  }
  visit: {
    id?: string | null
    status?: string | null
    master_id?: string | null
  }
  lab_gate: {
    required: boolean
    ready_for_provider_review: boolean
    has_partial_results: boolean
    recollection_required: boolean
    provider_review_state: string
    items: Array<{
      lab_order_id: string
      display_id?: string | null
      panel_name?: string | null
      required: boolean
      status: string
      results_status: string
      result_count: number
      results_complete: boolean
      partial_results: boolean
      recollection_required: boolean
      result_pdf_url?: string | null
      junction_order_id?: string | null
      failure_reason?: string | null
      recollection?: {
        status: string
        patient_charge_amount: string
        patient_action?: string | null
        replacement_lab_order_id?: string | null
      } | null
    }>
  }
  reconciliation: {
    version?: number | null
    status: string
    requested_set: TreatmentAggregateProduct[]
    prescribed_set: TreatmentAggregateProduct[]
    factual_differences: {
      unchanged_product_ids?: Array<string | number>
      prescribed_addition_product_ids?: Array<string | number>
      requested_absence_product_ids?: Array<string | number>
      absence_is_authoritative?: boolean
    }
    unresolved_facts?: Array<Record<string, unknown>>
    created_at?: string | null
    revision_id?: string
    source_event_id?: string
    is_complete_snapshot?: boolean
  }
  settlement: {
    status: string
    patient_settled_at?: string | null
    reimbursement_settled_at?: string | null
    settled_at?: string | null
    patient_action_required: boolean
    refund_pending: boolean
    refund_required_amount: string
    operation_id?: string
    patient_attempts?: number
    reimbursement_attempts?: number
    last_error_code?: string
  }
  support?: {
    owner?: string | null
    pending_reason?: string | null
    retry_allowed: boolean
    last_error_code?: string
    last_error_detail?: string
  }
  siblings: Array<{
    order_id: string
    order_display_id?: string | null
    treatment_case_id: string
    treatment_type_id: string
    treatment_type_key?: string | null
    treatment_type_name?: string | null
    status?: string | null
    lifecycle_status?: string | null
  }>
}

export interface Order {
  id: string
  combined_submission_id?: string | null
  treatment_case_id?: string | null
  treatment_type_id?: string | null
  treatment_type_key?: string | null
  combined_payment_id?: string | null
  payment_allocation_id?: string | null
  product?: number | string | null
  display_id?: string
  order_id?: string | null
  coupon_code?: string | null
  patient?: OrderPatientSummary | null
  amount?: string
  status?: string
  prescribed_at?: string | null
  rx_sent_at?: string | null
  shipped_at?: string | null
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
  base_authorization_amount?: string | null
  payment_settlement_transactions?: OrderSettlementTransaction[]
  totalRefunded?: string | null
  netCollected?: string | null
  refundableAmount?: string | null
  baseRefundableAmount?: string | null
  supplementalRefundableAmount?: string | null
  rx_revision_count?: number | null
  rx_revision_tag?: string | null
  rx_revision_refund_required_amount?: string | null
  created_at?: string
  updated_at?: string
  updatedAt?: string
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
  shipping_carrier?: string | null
  patient_responses?: PatientResponses | null
  intake_response_summary?: IntakeResponseSummary | null
  shipping_address_snapshot?: ShippingAddressSnapshot | null
  checkout_url?: string | null
  is_archived?: boolean
  archived_at?: string | null
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
  line_items?: OrderLineItem[]
  treatment_case_summary?: TreatmentCaseSummary | null
  combined_payment_summary?: {
    id: string
    status?: string
    currency?: string
    authorized_amount?: string
    captured_amount?: string
    refunded_amount?: string
    allocation_total?: string
    allocation?: { id: string; status?: string; allocated_amount?: string; captured_amount?: string; refunded_amount?: string }
    allocations?: Array<{ id: string; order_id: string; treatment_case_id: string; status?: string; allocated_amount?: string; captured_amount?: string; refunded_amount?: string }>
  } | null
  combined_submission_summary?: CombinedSubmissionSummary | null
  beluga_dispatch_status?: string | null
  beluga_dispatch_reason?: string | null
  beluga_dispatch_attempt_count?: number | null
  treatment_aggregate?: TreatmentOrderAggregate | null
  transaction_id?: string | number | null
}

export interface PaginatedOrdersResponse {
  count: number
  next: string | null
  previous: string | null
  results: Order[]
}

const normalizePaginatedOrders = (payload: unknown): PaginatedOrdersResponse => {
  if (Array.isArray(payload)) {
    return {
      count: payload.length,
      next: null,
      previous: null,
      results: payload as Order[],
    }
  }

  const data = payload && typeof payload === "object"
    ? payload as Record<string, unknown>
    : {}
  const nested = data.data && typeof data.data === "object"
    ? data.data as Record<string, unknown>
    : null
  const rawResults = data.results ?? nested?.results
  const results = Array.isArray(rawResults)
    ? rawResults.filter((item): item is Order => Boolean(item && typeof item === "object"))
    : []
  const rawCount = data.count ?? nested?.count
  const parsedCount = Number(rawCount)

  return {
    count: Number.isFinite(parsedCount) ? parsedCount : results.length,
    next: typeof (data.next ?? nested?.next) === "string"
      ? String(data.next ?? nested?.next)
      : null,
    previous: typeof (data.previous ?? nested?.previous) === "string"
      ? String(data.previous ?? nested?.previous)
      : null,
    results,
  }
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
    const { data } = await api.get<unknown>(ENDPOINT, { params })
    return normalizePaginatedOrders(data)
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    throw error
  }
}

export const fetchOrdersByPatient = async (patientId: string, params?: Record<string, unknown>): Promise<PaginatedOrdersResponse> => {
  try {
    const { data } = await api.get<unknown>(ENDPOINT, { params: { ...params, patient_id: patientId } })
    return normalizePaginatedOrders(data)
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

export const fetchPrescriptionHistory = async (id: string): Promise<PrescriptionHistoryResponse> => {
  try {
    const { data } = await api.get<PrescriptionHistoryResponse>(`${ENDPOINT}${id}/prescription-history/`)
    return data
  } catch (error) {
    console.error(`Failed to fetch prescription history for order ${id}:`, error)
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

export const archiveOrder = async (id: string): Promise<Order> => {
  try {
    const { data } = await api.post<Order>(`${ENDPOINT}${id}/archive/`)
    return data
  } catch (error) {
    console.error(`Failed to archive order ${id}:`, error)
    throw error
  }
}

export const unarchiveOrder = async (id: string): Promise<Order> => {
  try {
    const { data } = await api.post<Order>(`${ENDPOINT}${id}/unarchive/`)
    return data
  } catch (error) {
    console.error(`Failed to unarchive order ${id}:`, error)
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
): Promise<Record<string, unknown>> => {
  const { data } = await api.post<Record<string, unknown>>(`/orders/${orderId}/change-product/`, {
    new_product_id: newProductId,
    ...(quantity !== undefined ? { quantity } : {}),
    ...(dryRun ? { dry_run: true } : {}),
  })
  const nested = data.data
  return nested && typeof nested === 'object' && !Array.isArray(nested)
    ? nested as Record<string, unknown>
    : data
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
  if (data && typeof data === 'object' && 'results' in data) {
    const results = (data as { results?: unknown }).results
    if (Array.isArray(results)) return results as FilterOption[]
  }
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
  fetchPrescriptionHistory,
  createOrder,
  updateOrder,
  archiveOrder,
  unarchiveOrder,
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
