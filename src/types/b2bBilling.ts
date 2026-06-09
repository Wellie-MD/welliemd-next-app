export type InvoiceType = 'reimbursement' | 'credit_note' | 'saas_fee' | 'aggregated_snapshot';

export type InvoiceStatus =
  | 'draft'
  | 'pending'
  | 'authorized'
  | 'authorization_failed'
  | 'due'
  | 'paid'
  | 'overdue'
  | 'failed'
  | 'canceled'
  | 'refunded';

export type InvoiceItemType =
  | 'active_patient'
  | 'consultation'
  | 'medication_reimbursement'
  | 'saas_base_monthly'
  | 'saas_usage_patient'
  | 'shipping_cost'
  | 'adjustment'
  | 'refund'
  | 'other';

export type ProviderNetwork = 'beluga_health' | 'stratusMD' | 'rxcompound' | '';

export interface B2BInvoiceItem {
  id: string;
  item_type: InvoiceItemType;
  description: string;
  quantity: number;
  unit_price: string;
  total_amount: string;
  refund_required?: boolean;
  refund_required_amount?: string;
  refund_required_reason?: string;
  refund_required_at?: string | null;
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

export interface B2BInvoice {
  id: string;
  invoice_number: string;
  client: string; // Client UUID
  invoice_type: InvoiceType;
  status: InvoiceStatus;
  is_overdue?: boolean;
  total_amount: string;

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
  payment_method_status?: 'no_customer' | 'no_payment_method' | 'active';
  payment_method?: {
    id: string; // Stripe payment method ID
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    is_expired: boolean;
  };
  subscription_status?: 'inactive' | 'active' | 'past_due' | 'canceled';
  cancel_at_period_end?: boolean;
  cancel_requested_at?: string | null;
  subscription_started_at?: string | null;
  canceled_at?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  next_billing_date?: string;
  billing_anchor_day?: number;
  billing_timezone?: string;
  lock_state?: 'locked' | 'unlocked';
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
  status: 'no_customer' | 'no_payment_method' | 'active';
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

export type LockState = 'unlocked' | 'locked';

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
