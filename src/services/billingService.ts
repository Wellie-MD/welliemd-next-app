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
    type: "reimbursement" | "saas",
    page = 1,
    pageSize = 25
  ): Promise<InvoiceListResponse> {
    try {
      const params = { page, page_size: pageSize } as any;
      const { data } = await api.get<unknown>(`/billing/invoices/${type}/`, { params });
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
};

export default billingService;
