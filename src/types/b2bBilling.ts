// TypeScript interfaces for B2B Billing System (Client Portal)
// Matches backend models from apps/b2b_billing/models.py

export type InvoiceType = 'reimbursement' | 'saas_fee' | 'aggregated_snapshot';

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
  source_order_id?: string;
  
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

export interface SetupIntentResponse {
  setup_intent_id: string;
  client_secret: string;
  status: string;
}

export interface B2BPaymentMethodResponse {
  text: string;
}

export interface B2BInvoiceListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: B2BInvoice[];
}
