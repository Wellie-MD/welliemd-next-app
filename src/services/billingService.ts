import api from "../api/axiosInstance";

export interface PaymentMethodSummary {
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
}

export interface BillingProfile {
  client_name?: string;
  payment_method?: PaymentMethodSummary | null;
  next_invoice_date?: string | null;
}

export interface BillingSubscriptionStatus {
  client_id: string;
  subscription_status: "inactive" | "active" | "past_due" | "canceled";
  cancel_at_period_end: boolean;
  current_period_start?: string | null;
  current_period_end?: string | null;
  next_billing_date?: string | null;
  lock_state?: "locked" | "unlocked";
  lock_reason_code?: string;
}

export interface InvoiceItem {
  id: string;
  order_id?: string | null;
  description?: string;
  quantity?: number;
  unit_price?: string | number;
  subtotal?: string | number;
}

export interface Invoice {
  id: string;
  invoice_number?: string;
  invoice_type?: string;
  amount?: string | number;
  status?: string;
  is_overdue?: boolean;
  external_invoice_link?: string;
  period_start?: string;
  period_end?: string;
  line_items?: InvoiceItem[];
  created_at?: string;
}

export interface InvoiceListResponse {
  results: Invoice[];
  count: number;
  next: string | null;
  previous: string | null;
}

// ============================================================================
// Custom Billing Engine Types
// ============================================================================

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
  lock_state: "unlocked" | "locked";
  locked_at: string | null;
  lock_reason_code: string;
  blocking_balance: string;
  blocking_invoice_count: number;
  blocking_invoices: BlockingInvoice[];
}

export interface PayInvoiceNowResponse {
  success: boolean;
  message?: string;
  invoice_id?: string;
  payment_intent_id?: string;
  requires_action?: boolean;
  client_secret?: string;
  error_code?: string;
  processor_ref?: string;
  lock_state?: string;
  error?: string;
  failure_code?: string;
  failure_message?: string;
}

export interface PayAllOutstandingResponse {
  success: boolean;
  message?: string;
  invoice_id?: string;
  processor_ref?: string;
  lock_state?: string;
  error?: string;
  failure_code?: string;
  failure_message?: string;
}

const billingService = {
  // getProfile removed: endpoint /billing/profile/ does not exist anymore.

  async postSetupIntent(): Promise<{ client_secret?: string } | null> {
    try {
      const { data } = await api.post("/billing/setup-intent/");
      return data;
    } catch (err) {
      console.warn("postSetupIntent failed", err);
      return null;
    }
  },

  async confirmSetupIntent(setupIntentId: string): Promise<boolean> {
    try {
      await api.post("/billing/setup-intent/confirm/", {
        setup_intent_id: setupIntentId,
      });
      return true;
    } catch (err) {
      console.warn("confirmSetupIntent failed", err);
      return false;
    }
  },

  async getPaymentMethodText(): Promise<string | null> {
    try {
      const { data } = await api.get<any>("/billing/payment-method/");
      if (data && typeof data.text === 'string') return data.text;
      return null;
    } catch (err) {
      console.warn('getPaymentMethodText failed', err);
      return null;
    }
  },

  async getPaymentMethodStatus(): Promise<{
    status: string;
    payment_method?: {
      id?: string;
      brand?: string;
      last4?: string;
      exp_month?: number;
      exp_year?: number;
      is_expired?: boolean;
    } | null;
    billing_details?: {
      name?: string;
      email?: string;
      address?: string;
    } | null;
  } | null> {
    try {
      const { data } = await api.get<any>("/billing/payment-method/");
      if (data && data.status) {
        return {
          status: data.status,
          payment_method: data.payment_method || null,
          billing_details: data.billing_details || null,
        };
      }
      return null;
    } catch (err) {
      console.warn('getPaymentMethodStatus failed', err);
      return null;
    }
  },

  async getInvoices(
    type: "reimbursement" | "saas" | "all",
    page = 1,
    pageSize = 25,
    paramsOverride?: Record<string, unknown>
  ): Promise<InvoiceListResponse> {
    try {
      const params = { page, page_size: pageSize, ...(paramsOverride || {}) } as any;
      if (type === "reimbursement") params.invoice_type = "reimbursement";
      if (type === "saas") params.invoice_type = "saas_fee";
      const path = "/billing/invoices/";
      const { data } = await api.get<unknown>(path, { params });
      // API returns paginated shape: { count, next, previous, results: [...] }
      if (data && Array.isArray(data.results)) return data as InvoiceListResponse;
      // If backend returns array directly, map into paginated shape
      if (Array.isArray(data))
        return { results: data as Invoice[], count: data.length, next: null, previous: null };
      return { results: [], count: 0, next: null, previous: null };
    } catch (err) {
      console.warn(`getInvoices(${type}) failed`, err);
      return { results: [], count: 0, next: null, previous: null };
    }
  },

  // ==========================================================================
  // Custom Billing Engine APIs
  // ==========================================================================

  /**
   * Get current billing lock status for the client.
   * Returns lock state, blocking invoices, and total balance owed.
   */
  async getLockStatus(): Promise<BillingLockStatus | null> {
    try {
      const { data } = await api.get<BillingLockStatus>("/billing/lock-status/");
      return data;
    } catch (err) {
      console.warn("getLockStatus failed", err);
      return null;
    }
  },

  async getSubscriptionStatus(): Promise<BillingSubscriptionStatus | null> {
    try {
      const { data } = await api.get<BillingSubscriptionStatus>("/billing/status/");
      return data;
    } catch (err) {
      console.warn("getSubscriptionStatus failed", err);
      return null;
    }
  },

  /**
   * Pay a specific invoice manually.
   * Used for invoice-level Pay Now buttons.
   * Supports 3D Secure authentication flow via payment_intent_id parameter.
   */
  async payInvoiceNow(invoiceId: string, paymentIntentId?: string): Promise<PayInvoiceNowResponse> {
    try {
      const payload = paymentIntentId ? { payment_intent_id: paymentIntentId } : {};
      const { data } = await api.post(`/billing/invoices/${invoiceId}/pay-now/`, payload);
      return data as PayInvoiceNowResponse;
    } catch (err: any) {
      const status = err?.response?.status;
      const responseData = err?.response?.data || {};
      
      // Handle 402 Payment Required - indicates 3D Secure required
      if (status === 402) {
        return {
          success: false,
          requires_action: true,
          message: responseData?.message || "Additional authentication required",
          payment_intent_id: responseData?.payment_intent_id,
          client_secret: responseData?.client_secret,
          invoice_id: responseData?.invoice_id,
          error_code: responseData?.error_code,
        };
      }
      
      // Handle other errors
      return {
        success: false,
        message: responseData?.message || responseData?.error || "Failed to process payment",
        invoice_id: responseData?.invoice_id,
        error_code: responseData?.error_code,
        error: responseData?.error || "Payment failed",
        failure_message: responseData?.failure_message || err?.message,
      };
    }
  },

  /**
   * Pay all outstanding blocking invoices at once.
   * Used for "Pay All" button when account is locked.
   */
  async payAllOutstanding(): Promise<PayAllOutstandingResponse> {
    try {
      const { data } = await api.post<PayAllOutstandingResponse>("/billing/pay-all/");
      return data;
    } catch (err: any) {
      console.warn("payAllOutstanding failed", err);
      return {
        success: false,
        error: err?.response?.data?.error || "Payment failed",
        failure_message: err?.response?.data?.failure_message || err?.message,
      };
    }
  },
};

export default billingService;