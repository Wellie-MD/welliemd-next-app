export type InvoiceType =
  "reimbursement" | "credit_note" | "saas_fee" | "aggregated_snapshot";

export type InvoiceStatus =
  | "draft"
  | "pending"
  | "authorized"
  | "authorization_failed"
  | "due"
  | "paid"
  | "overdue"
  | "failed"
  | "canceled"
  | "refunded";

export type InvoiceItemType =
  | "active_patient"
  | "consultation"
  | "medication_reimbursement"
  | "saas_base_monthly"
  | "saas_usage_patient"
  | "shipping_cost"
  | "adjustment"
  | "refund"
  | "other";

export type ProviderNetwork = "beluga_health" | "stratusMD" | "rxcompound" | "";

export interface B2BInvoiceItem {
  id: string;
  item_type: InvoiceItemType;
  description: string;
  quantity: number;
  unit_price: string;
  total_amount: string;
  client_order_number?: string;
  patient_id?: string;
  patient_name?: string;
  patient_email?: string;
  order_display_id?: string;
  product_name?: string;
  pharmacy_name?: string;
  provider_network?: ProviderNetwork;
  order_status?: string;
  shipping_state?: string;
  service_date?: string;
  metadata?: Record<string, any>;
  notes?: string;
  created_at: string;
}

export interface InvoiceTreatmentPrescription {
  contract_version?: string;
  treatment_case_id?: string;
  requested_set: Array<{ product_id?: string | number; source_product_id?: string | number; med_id?: string; name?: string; quantity?: number }>;
  prescribed_set: Array<{ product_id?: string | number; source_product_id?: string | number; med_id?: string; name?: string; quantity?: number }>;
  settlement_flow?: string;
  requested_authorized_amount?: string;
  prescribed_final_amount?: string;
  base_capture_amount?: string;
  supplemental_delta_amount?: string;
  trace_id?: string;
  invoice_status?: string;
}

export interface B2BInvoice {
  id: string;
  invoice_number: string;
  client: string; // Client UUID
  invoice_type: InvoiceType;
  status: InvoiceStatus;
  is_overdue?: boolean;
  total_amount: string;
  client_id?: string;
  refund_required?: boolean;
  refund_required_amount?: string;
  refund_required_reason?: string;
  refund_required_at?: string | null;

  // Breakdown for aggregated snapshots
  active_patients_fee?: string;
  active_patients_count?: number;
  consults_fee?: string;
  consults_count?: number;
  medication_reimbursement_amount?: string;
  medication_reimbursement_count?: number;
  monthly_saas_base_fee?: string;

  // Payment processing
  stripe_payment_intent_id?: string;
  stripe_invoice_id?: string;
  external_payment_reference?: string;
  external_invoice_link?: string;
  payment_method?: string;

  intended_authorization_amount?: string;
  authorization_retry_count?: number;
  authorization_retry_exhausted_at?: string | null;
  authorization_last_error_code?: string;
  authorization_last_error_message?: string;
  authorization_next_retry_at?: string | null;
  requested_breakdown?: {
    product_name?: string;
    medication_amount?: string;
    shipping_amount?: string;
    product_total?: string;
    consultation_amount?: string;
    consult_mode?: string;
    prescribed_differs?: boolean;
    original_requested_product_name?: string;
    original_requested_medication_amount?: string;
    original_requested_shipping_amount?: string;
    original_requested_product_total?: string;
  } | null;
  revision_adjustments?: Array<{
    id: string;
    invoice_number: string;
    kind: "supplemental_charge" | "credit_note";
    status: string;
    revision_number?: number | string | null;
    product_name?: string;
    medication_amount: string;
    shipping_amount: string;
    product_total: string;
    adjustment_amount: string;
    created_at?: string | null;
  }>;
  adjustment_summary?: {
    invoice_total: string;
    supplemental_charges: string;
    credit_notes: string;
    net_adjustment: string;
    adjusted_total: string;
  } | null;
  treatment_prescription?: InvoiceTreatmentPrescription | null;

  // Source tracking
  source_tenant_order_display_id?: string;
  client_order_number?: string;
  source_order_id?: string;
  is_supplemental_split_capture?: boolean;
  supplemental_parent_invoice_id?: string | null;
  supplemental_parent_invoice_number?: string | null;
  supplemental_invoices?: Array<{
    id: string;
    invoice_number: string;
    status: string;
    total_amount: string;
    issued_at?: string | null;
    created_at?: string | null;
  }>;

  // Billing period
  billing_period_start?: string;
  billing_period_end?: string;

  // Dates
  issued_at?: string;
  due_date?: string;
  paid_at?: string;
  sent_date?: string;

  // Notes
  description?: string;
  notes?: string;
  discrepancy_note?: string;

  // Administrative
  is_manual: boolean;
  created_by?: string;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Line items
  line_items?: B2BInvoiceItem[];
}

export interface B2BBillingStatus {
  client_id?: string;
  has_payment_method: boolean;
  payment_method_status?: "no_customer" | "no_payment_method" | "active";
  payment_method?: {
    id: string; // Stripe payment method ID
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    is_expired: boolean;
  };
  subscription_status?: "inactive" | "active" | "past_due" | "canceled";
  cancel_at_period_end?: boolean;
  cancel_requested_at?: string | null;
  subscription_started_at?: string | null;
  canceled_at?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  next_billing_date?: string;
  billing_anchor_day?: number;
  billing_timezone?: string;
  lock_state?: "locked" | "unlocked";
  lock_reason_code?: string;
  blocking_invoice_count?: number;
  blocking_balance?: string;
  last_saas_invoice?: {
    id: string;
    invoice_number: string;
    status: string;
    total_amount: string;
    issued_at?: string | null;
  } | null;
  recent_invoices?: B2BInvoice[];
  total_outstanding?: string;
}

export interface SetupIntentResponse {
  setup_intent_id: string;
  client_secret: string;
  status: string;
}

export interface B2BPaymentMethodResponse {
  status: "no_customer" | "no_payment_method" | "active";
  payment_method?: {
    id: string; // Stripe payment method ID
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    is_expired: boolean;
  } | null;
  billing_details?: {
    name: string;
    email: string;
    address: string;
  } | null;
}

export interface B2BInvoiceListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: B2BInvoice[];
}

// ============================================================================
// NEW: Custom Billing Engine Types
// ============================================================================

export type LockState = "unlocked" | "locked";

export interface BillingConfig {
  b2b_base_fee: string;
  b2b_patient_fee_rate: string;
  b2b_patient_fee_enabled: boolean;
  b2b_billing_anchor_day: number;
  b2b_billing_timezone: string;
  activate_subscription_now?: boolean;
}

export interface BlockingInvoice {
  id: string;
  invoice_number: string;
  invoice_type: string;
  total_amount: string;
  status: string;
  created_at: string;
}

export interface BillingLockStatus {
  client_id: string;
  lock_state: LockState;
  locked_at: string | null;
  lock_reason_code: string;
  blocking_balance: string;
  blocking_invoice_count: number;
  blocking_invoices: BlockingInvoice[];
}

export interface PayNowResult {
  success: boolean;
  invoice_id?: string;
  processor_ref?: string;
  lock_state?: string;
  error?: string;
  failure_code?: string;
  failure_message?: string;
}

// ============================================================================
// Product-Level Billing Configuration (Milestone 5)
// ============================================================================

export type MedicationReimbursementMode = "inherit" | "charge" | "no_charge";
export type ShippingReimbursementMode = "inherit" | "charge" | "no_charge";
export type ConfigurationStatus =
  "default" | "override" | "unconfigured" | "archived";

export interface ProductBillingConfig {
  id: string;
  client_id: string;
  admin_product_id: number;
  source_product_id: number;
  tenant_product_id: number;
  medication_reimbursement_mode: MedicationReimbursementMode;
  medication_reimbursement_amount: string | null;
  shipping_reimbursement_mode: ShippingReimbursementMode;
  shipping_reimbursement_amount: string | null;
  configuration_status: ConfigurationStatus;
  is_archived: boolean;
  is_archived_for_client: boolean;
  archived_at: string | null;
  product_name: string;
  pharmaceutical_name: string;
  sku: string;
  category: string;
  pharmacy_name: string;
  welliemd_product_cost: string | null;
  welliemd_shipping_cost: string | null;
  welliemd_product_cost_display: string;
  welliemd_shipping_cost_display: string;
  medication_reimbursement_amount_display: string;
  medication_reimbursement_label: "inherited" | "custom" | "not charging";
  shipping_reimbursement_amount_display: string;
  shipping_reimbursement_label: "inherited" | "custom" | "not charging";
  charge_medication_effective: boolean;
  charge_shipping_effective: boolean;
  is_unconfigured: boolean;
  unconfigured_reasons: string[];
  last_updated_at: string;
  last_updated_by: string | null;
}

export interface ProductBillingSummary {
  total_products: number;
  with_overrides: number;
  using_client_default: number;
  unconfigured: number;
  archived_count: number;
  client_default_medication_reimbursement_enabled: boolean;
  client_default_shipping_reimbursement_enabled: boolean;
  display_text: string;
}

export interface ProductBillingListResponse {
  count: number;
  page: number;
  page_size: number;
  results: ProductBillingConfig[];
}

export interface BulkUpdatePayload {
  admin_product_ids: number[];
  action:
    | "charge_medication"
    | "no_charge_medication"
    | "charge_shipping"
    | "no_charge_shipping"
    | "reset"
    | "archive"
    | "unarchive";
  medication_reimbursement_amount?: string;
  shipping_reimbursement_amount?: string;
}

export interface BulkUpdateResponse {
  success: boolean;
  updated_count: number;
}

export interface SingleProductOverridePayload {
  medication_reimbursement_mode?: MedicationReimbursementMode;
  medication_reimbursement_amount?: string | null;
  shipping_reimbursement_mode?: ShippingReimbursementMode;
  shipping_reimbursement_amount?: string | null;
}

export const MEDICATION_REIMBURSEMENT_MODE_OPTIONS = [
  { value: "inherit" as const, label: "Inherit" },
  { value: "charge" as const, label: "Charge" },
  { value: "no_charge" as const, label: "No Charge" },
];

export const SHIPPING_REIMBURSEMENT_MODE_OPTIONS = [
  { value: "inherit" as const, label: "Inherit" },
  { value: "charge" as const, label: "Charge" },
  { value: "no_charge" as const, label: "No Charge" },
];
