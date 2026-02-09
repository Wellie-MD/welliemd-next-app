// src/api/clientApi.ts
import axiosInstance from './axiosInstance';

export interface Client {
  id: string;
  name: string;
  admin_panel_domain: string;
  patient_portal_domain?: string;
  api_endpoint: string;
  questionnaire_url?: string;
  domain?: string;
  subdomain?: string;
  master_id_prefix?: string;
  beluga_company?: string;
  database_name: string;
  database_host?: string;
  default_template_id?: string;
  allowed_iframe_domains?: string[];
  branding_config?: Record<string, unknown>;
  token_expiry_minutes?: number;
  patient_fee?: number;
  async_consult_fee_to_client?: number;
  async_consult_cost?: number;
  sync_video_consult_fee_to_client?: number;
  sync_consult_cost?: number;
  monthly_saas_fee?: number;
  first_next_saas_fees_billing_date?: string;
  include_cost_to_client_in_reimbursement?: boolean;
  include_shipping_cost_to_client_in_reimbursement?: boolean;
  b2b_dunning_enabled?: boolean;
  b2b_grace_period_days?: number;
  b2b_manual_pay_enabled?: boolean;
  payment_gateway: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  product_count: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone: string;
    is_active: boolean;
  } | null;
  card_holder_name: string;
  card_last_four: string;
  stripe_subscription_id: string | null;
  deployment_password?: string;
}

export interface ClientCreatePayload {
  // User Information
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  password?: string;

  // Client Basic Information
  name: string;
  domain?: string;
  subdomain?: string;
  master_id_prefix?: string;
  beluga_company?: string;
  admin_panel_domain: string;
  patient_portal_domain?: string;
  api_endpoint?: string;
  questionnaire_url?: string;

  // Configuration
  allowed_iframe_domains?: string[];
  default_template_id?: string;
  branding_config?: Record<string, unknown>;
  token_expiry_minutes?: number;

  // Database Configuration (optional - backend will auto-generate)
  database_host?: string;
  database_name?: string;

  // Billing Settings
  patient_fee?: number;
  async_consult_fee_to_client?: number;
  async_consult_cost?: number;
  sync_video_consult_fee_to_client?: number;
  sync_consult_cost?: number;
  monthly_saas_fee?: number;
  first_next_saas_fees_billing_date?: string;
  include_cost_to_client_in_reimbursement?: boolean;
  include_shipping_cost_to_client_in_reimbursement?: boolean;
  b2b_dunning_enabled?: boolean;
  b2b_grace_period_days?: number;
  b2b_manual_pay_enabled?: boolean;

  // Payment Gateway
  payment_gateway?: string;

  // Status
  is_active?: boolean;
}

export interface ClientUpdatePayload {
  // User Information (optional)
  first_name?: string;
  last_name?: string;
  phone?: string;
  password?: string;

  // Client Information
  name?: string;
  domain?: string;
  subdomain?: string;
  master_id_prefix?: string;
  beluga_company?: string;
  admin_panel_domain?: string;
  patient_portal_domain?: string;
  api_endpoint?: string;
  questionnaire_url?: string;

  // Configuration
  allowed_iframe_domains?: string[];
  default_template_id?: string;
  branding_config?: Record<string, unknown>;
  token_expiry_minutes?: number;

  // Database Configuration
  database_host?: string;
  database_name?: string;

  // Billing Settings
  patient_fee?: number;
  async_consult_fee_to_client?: number;
  async_consult_cost?: number;
  sync_video_consult_fee_to_client?: number;
  sync_consult_cost?: number;
  monthly_saas_fee?: number;
  first_next_saas_fees_billing_date?: string;
  include_cost_to_client_in_reimbursement?: boolean;
  include_shipping_cost_to_client_in_reimbursement?: boolean;
  b2b_dunning_enabled?: boolean;
  b2b_grace_period_days?: number;
  b2b_manual_pay_enabled?: boolean;

  // Payment Gateway
  payment_gateway?: string;

  // Status
  is_active?: boolean;
}

export interface ClientCreateResponse {
  success: boolean;
  message: string;
  client: Client;
  user: {
    id: string;
    email: string;
    full_name: string;
  };
  deployment_password: string;
  warning: string;
}

export interface ClientUpdateResponse {
  success: boolean;
  message: string;
  client: Client;
  user?: {
    id: string;
    email: string;
    full_name: string;
  };
}

export interface PasswordRegenerateResponse {
  success: boolean;
  message: string;
  client_id: string;
  client_name: string;
  new_password: string;
  warning: string;
}

export interface EmailUpdateResponse {
  success: boolean;
  client_id: string;
  old_email: string;
  new_email: string;
  message: string;
}

export interface PaymentMethodInfo {
  gateway: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_expired: boolean;
  status: string;
  display_name: string;
  expiry_display: string;
  gateway_display: string;
}

export interface PaymentMethodResponse {
  success: boolean;
  payment_method: PaymentMethodInfo | null;
  status?: string;
}

export const clientApi = {
  list: async (): Promise<Client[]> => {
    const { data } = await axiosInstance.get('/clients/');
    const results = Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data)
        ? data
        : [];

    // ensure `user` is either an object or null
    return results.map((c: unknown) => ({
      ...c,
      user: c?.user ?? null,
    })) as Client[];
  },

  get: async (id: string): Promise<Client> => {
    const { data } = await axiosInstance.get(`/clients/${id}/`);
    return {
      ...data,
      user: data?.user ?? null,
    } as Client;
  },

  create: async (payload: ClientCreatePayload): Promise<ClientCreateResponse> => {
    const { data } = await axiosInstance.post('/clients/', payload);
    return data;
  },

  update: async (id: string, payload: ClientUpdatePayload): Promise<ClientUpdateResponse> => {
    const { data } = await axiosInstance.put(`/clients/${id}/`, payload);
    return data;
  },

  regeneratePassword: async (id: string): Promise<PasswordRegenerateResponse> => {
    const { data } = await axiosInstance.post(`/clients/${id}/regenerate-password/`);
    return data;
  },

  updateEmail: async (id: string, newEmail: string): Promise<EmailUpdateResponse> => {
    const { data } = await axiosInstance.post(`/clients/${id}/update-email/`, {
      email: newEmail,
    });
    return data;
  },

  getPaymentMethod: async (id: string): Promise<PaymentMethodResponse> => {
    const { data } = await axiosInstance.get(`/internal/clients/${id}/payment-method/`);
    return data;
  },

  // LEGACY: Stripe-managed subscription creation path.
  // Prefer custom billing config + billing activation APIs.
  createSubscription: async (
    clientId: string,
    payload: { price_id?: string; base_price_id?: string; metered_price_id?: string; payment_method_id: string }
  ): Promise<unknown> => {
    const { data } = await axiosInstance.post('/stripe/admin/subscriptions/', {
      client_id: clientId,
      ...payload,
    });
    return data;
  },

  listStripePrices: async (): Promise<unknown> => {
    const { data } = await axiosInstance.get('/stripe/admin/prices/');
    return data;
  },

  // B2B Billing Methods
  getB2BBillingStatus: async (clientId: string): Promise<import('../types/b2bBilling').B2BBillingStatus> => {
    // Fetch payment method and recent invoices
    const [paymentMethodRes, invoicesRes] = await Promise.all([
      axiosInstance.get(`/internal/clients/${clientId}/payment-method/`),
      axiosInstance.get(`/internal/invoices/`, {
        params: { page_size: 5, ordering: '-issued_at', client_id: clientId, invoice_type: 'reimbursement' }
      })
    ]);

    const paymentMethodStatus = paymentMethodRes.data.status || 'no_customer';
    const hasPaymentMethod = paymentMethodStatus === 'active';

    // Backend now returns structured payment_method object
    const paymentMethod = paymentMethodRes.data.payment_method || undefined;

    return {
      has_payment_method: hasPaymentMethod,
      payment_method_status: paymentMethodStatus,
      payment_method: paymentMethod,
      recent_invoices: invoicesRes.data.results || [],
      total_outstanding: '0.00' // TODO: Calculate from pending invoices
    };
  },

  getB2BInvoices: async (
    clientId: string,
    invoiceType?: 'reimbursement' | 'saas_fee' | 'aggregated_snapshot',
    params?: Record<string, unknown>
  ): Promise<import('../types/b2bBilling').B2BInvoiceListResponse> => {
    const mergedParams = { ...(params || {}), client_id: clientId } as Record<string, unknown>;
    if (invoiceType) mergedParams.invoice_type = invoiceType;
    const { data } = await axiosInstance.get(`/internal/invoices/`, {
      params: mergedParams
    });
    return data;
  },

  getAllB2BInvoices: async (
    params?: Record<string, unknown>
  ): Promise<import('../types/b2bBilling').B2BInvoiceListResponse> => {
    const { data } = await axiosInstance.get(`/internal/invoices/`, {
      params: params || {}
    });
    return data;
  },

  createB2BSetupIntent: async (clientId: string): Promise<import('../types/b2bBilling').SetupIntentResponse> => {
    const { data } = await axiosInstance.post(`/internal/clients/${clientId}/setup-intent/`);
    return data;
  },

  getB2BPaymentMethod: async (clientId: string): Promise<import('../types/b2bBilling').B2BPaymentMethodResponse> => {
    const { data } = await axiosInstance.get(`/internal/clients/${clientId}/payment-method/`);
    return data;
  },

  // ==========================================================================
  // NEW: Custom Billing Engine APIs
  // ==========================================================================

  /**
   * Get billing lock status for a client.
   */
  getBillingLockStatus: async (clientId: string): Promise<import('../types/b2bBilling').BillingLockStatus> => {
    const { data } = await axiosInstance.get(`/internal/clients/${clientId}/lock-status/`);
    return data;
  },

  /**
   * Get billing config for a client.
   */
  getBillingConfig: async (clientId: string): Promise<import('../types/b2bBilling').BillingConfig> => {
    const { data } = await axiosInstance.get(`/internal/clients/${clientId}/billing/config/`);
    return data;
  },

  /**
   * Update billing config for a client.
   */
  updateBillingConfig: async (
    clientId: string,
    config: Partial<import('../types/b2bBilling').BillingConfig>
  ): Promise<import('../types/b2bBilling').BillingConfig> => {
    const { data } = await axiosInstance.patch(`/internal/clients/${clientId}/billing/config/`, config);
    return data;
  },

  /**
   * Admin pay a specific invoice for a client.
   */
  payInvoiceNow: async (clientId: string, invoiceId: string): Promise<import('../types/b2bBilling').PayNowResult> => {
    const { data } = await axiosInstance.post(`/internal/clients/${clientId}/invoices/${invoiceId}/pay-now/`);
    return data;
  },

  /**
   * Admin pay all outstanding blocking invoices for a client.
   */
  payAllOutstanding: async (clientId: string): Promise<import('../types/b2bBilling').PayNowResult> => {
    const { data } = await axiosInstance.post(`/internal/clients/${clientId}/pay-all/`);
    return data;
  },

  /**
   * Trigger initial SaaS access charge for a client (custom billing engine).
   */
  activateBilling: async (clientId: string): Promise<any> => {
    const { data } = await axiosInstance.post(`/internal/clients/${clientId}/billing/activate/`);
    return data;
  },
};
