// src/api/clientApi.ts
import axiosInstance from './axiosInstance';

export type LifecycleState =
  | 'draft'
  | 'provisioning'
  | 'ready'
  | 'repairing'
  | 'teardown_pending'
  | 'tearing_down'
  | 'infra_removed'
  | 'error';

export type ProvisioningStatus =
  | 'idle'
  | 'pending'
  | 'running'
  | 'partial_failed'
  | 'failed'
  | 'ready';

export type TeardownStatus =
  | 'idle'
  | 'previewed'
  | 'requested'
  | 'scheduled'
  | 'running'
  | 'cancel_requested'
  | 'cancelled'
  | 'blocked'
  | 'failed'
  | 'completed';

export interface LifecycleStep {
  id: string;
  name: string;
  display_name: string;
  step_order: number;
  status: string;
  is_required: boolean;
  attempts: number;
  input_payload: Record<string, unknown>;
  output_payload: Record<string, unknown>;
  error_payload: Record<string, unknown>;
  logs: string;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LifecycleJob {
  id: string;
  operation_type: 'provision' | 'repair' | 'verify' | 'teardown';
  status: string;
  requested_by?: Client['user'];
  task_id?: string | null;
  current_step_name?: string;
  request_payload: Record<string, unknown>;
  summary: Record<string, unknown>;
  error_payload: Record<string, unknown>;
  preview_expires_at?: string | null;
  grace_period_until?: string | null;
  cancel_requested_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  steps: LifecycleStep[];
}

export interface InfraResource {
  id: string;
  provider: string;
  region: string;
  resource_type: string;
  external_id: string;
  human_label: string;
  ownership_tags: Record<string, string>;
  creation_source: string;
  delete_strategy: string;
  teardown_status: string;
  metadata: Record<string, unknown>;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  admin_panel_domain: string;
  patient_portal_domain?: string;
  api_endpoint: string;
  questionnaire_url?: string;
  domain?: string;
  subdomain?: string;
  custom_domain?: string;
  pending_custom_domain?: string | null;
  domain_provisioning_status?: 'idle' | 'pending' | 'provisioned' | 'failed';
  domain_provisioning_error?: {
    step?: string;
    error?: string;
  } | null;
  master_id_prefix?: string;
  beluga_company?: string;
  database_name: string;
  database_host?: string;
  default_template_id?: string;
  allowed_iframe_domains?: string[];
  branding_config?: Record<string, unknown>;
  token_expiry_minutes?: number;
  async_consult_fee_to_client?: number;
  async_consult_cost?: number;
  sync_video_consult_fee_to_client?: number;
  sync_consult_cost?: number;
  include_cost_to_client_in_reimbursement?: boolean;
  include_shipping_cost_to_client_in_reimbursement?: boolean;
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
  b2b_subscription_status?: 'inactive' | 'active' | 'past_due' | 'canceled';
  b2b_cancel_at_period_end?: boolean;
  deployment_password?: string;
  lifecycle_state?: LifecycleState;
  provisioning_status?: ProvisioningStatus;
  teardown_status?: TeardownStatus;
  latest_lifecycle_job_id?: string | null;
  latest_lifecycle_job_status?: string | null;
  latest_lifecycle_job_operation_type?: string | null;
  last_lifecycle_error?: Record<string, unknown> | null;
  infra_removed_at?: string | null;
  infra_removed_reason?: string;
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
  custom_domain?: string;
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
  async_consult_fee_to_client?: number;
  async_consult_cost?: number;
  sync_video_consult_fee_to_client?: number;
  sync_consult_cost?: number;
  include_cost_to_client_in_reimbursement?: boolean;
  include_shipping_cost_to_client_in_reimbursement?: boolean;

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
  custom_domain?: string;
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
  async_consult_fee_to_client?: number;
  async_consult_cost?: number;
  sync_video_consult_fee_to_client?: number;
  sync_consult_cost?: number;
  include_cost_to_client_in_reimbursement?: boolean;
  include_shipping_cost_to_client_in_reimbursement?: boolean;

  // Payment Gateway
  payment_gateway?: string;

  // Status
  is_active?: boolean;
}

export interface AccessUserSyncStatus {
  id: string;
  client: string;
  client_name: string;
  status: 'pending' | 'success' | 'failed' | 'skipped';
  last_error: string;
  last_attempt_at: string | null;
  synced_at: string | null;
  updated_at: string;
}

export interface CrossTenantAccessUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_active: boolean;
  sync_scope: 'all_clients' | 'selected_clients';
  target_client_ids: string[];
  tenant_role: string;
  sync_status_summary?: Record<string, number>;
  sync_statuses?: AccessUserSyncStatus[];
  created_at: string;
  updated_at: string;
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
  lifecycle_state: LifecycleState;
  provisioning_status: ProvisioningStatus;
  latest_lifecycle_job_id?: string | null;
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

export interface ClientLifecycleResponse {
  client: Client;
  latest_job: LifecycleJob | null;
  jobs: LifecycleJob[];
  active_resources: InfraResource[];
}

export interface LifecycleActionResponse {
  success: boolean;
  job: LifecycleJob;
}

export type TeardownS3Mode = "archive" | "purge";
export type TeardownRdsSnapshotMode = "retain" | "purge";

export interface TeardownOptionsPayload {
  archive_bucket?: string;
  reason?: string;
  s3_mode?: TeardownS3Mode;
  rds_snapshot_mode?: TeardownRdsSnapshotMode;
  delete_client_record?: boolean;
}

export interface TeardownRequestPayload extends TeardownOptionsPayload {
  preview_job_id?: string;
  confirmation_text: string;
}

export const clientApi = {
  list: async (): Promise<Client[]> => {
    const allResults: unknown[] = [];
    let url: string | null = '/clients/';
    const params: Record<string, string> = { page_size: '500' };
    while (url) {
      const isFullUrl = url.startsWith('http');
      const { data } = await axiosInstance.get(isFullUrl ? url : '/clients/', isFullUrl ? {} : { params });
      const results = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
      allResults.push(...results);
      url = data?.next && typeof data.next === 'string' ? data.next : null;
    }

    return allResults.map((c: unknown) => ({
      ...c,
      user: (c as { user?: unknown })?.user ?? null,
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

  getLifecycle: async (id: string): Promise<ClientLifecycleResponse> => {
    const { data } = await axiosInstance.get(`/clients/${id}/lifecycle/`);
    return data;
  },

  retryProvisioning: async (id: string): Promise<LifecycleActionResponse> => {
    const { data } = await axiosInstance.post(`/clients/${id}/provisioning/retry/`);
    return data;
  },

  retryProvisioningStep: async (id: string, stepName: string): Promise<LifecycleActionResponse> => {
    const { data } = await axiosInstance.post(`/clients/${id}/provisioning/steps/${stepName}/retry/`);
    return data;
  },

  runVerification: async (id: string): Promise<LifecycleActionResponse> => {
    const { data } = await axiosInstance.post(`/clients/${id}/verification/run/`);
    return data;
  },

  previewTeardown: async (
    id: string,
    payload: TeardownOptionsPayload
  ): Promise<LifecycleActionResponse> => {
    const { data } = await axiosInstance.post(`/clients/${id}/teardown/preview/`, payload);
    return data;
  },

  requestTeardown: async (
    id: string,
    payload: TeardownRequestPayload
  ): Promise<LifecycleActionResponse> => {
    const { data } = await axiosInstance.post(`/clients/${id}/teardown/request/`, payload);
    return data;
  },

  cancelTeardown: async (
    id: string,
    payload: { job_id?: string } = {}
  ): Promise<LifecycleActionResponse> => {
    const { data } = await axiosInstance.post(`/clients/${id}/teardown/cancel/`, payload);
    return data;
  },

  retryTeardown: async (
    id: string,
    payload: TeardownOptionsPayload = {}
  ): Promise<LifecycleActionResponse> => {
    const { data } = await axiosInstance.post(`/clients/${id}/teardown/retry/`, payload);
    return data;
  },

  changeDomain: async (id: string, newDomain: string): Promise<{ success: boolean; message: string; task_id: string; old_domain: string; new_domain: string }> => {
    const { data } = await axiosInstance.post(`/clients/${id}/change-domain/`, {
      new_domain: newDomain,
    });
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
    const { data } = await axiosInstance.get(`/internal/clients/${clientId}/billing/status/`);
    return data;
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
  activateBilling: async (clientId: string): Promise<unknown> => {
    const { data } = await axiosInstance.post(`/internal/clients/${clientId}/billing/activate/`);
    return data;
  },

  cancelBilling: async (clientId: string, mode: 'immediate' | 'period_end'): Promise<unknown> => {
    const { data } = await axiosInstance.post(`/internal/clients/${clientId}/billing/cancel/`, { mode });
    return data;
  },

  listAccessUsers: async (): Promise<CrossTenantAccessUser[]> => {
    const { data } = await axiosInstance.get('/admin/access-users/');
    return data;
  },

  sendMasterKeyEmail: async (): Promise<{ message: string }> => {
    const { data } = await axiosInstance.post('/admin/send-masterkey-email/');
    return data;
  },

  accessMasterKey: async (token: string): Promise<{
    email: string;
    password: string;
    consumed_at: string;
    requested_by: string | null;
  }> => {
    const { data } = await axiosInstance.get(`/admin/masterkey/access/${token}/`);
    return data;
  },

  createAccessUser: async (payload: Partial<CrossTenantAccessUser>): Promise<{
    access_user: CrossTenantAccessUser;
    queued: boolean;
    queued_tenants: number;
    task_id: string;
    request_id: string;
  }> => {
    const { data } = await axiosInstance.post('/admin/access-users/', payload);
    return data;
  },

  updateAccessUser: async (
    accessUserId: string,
    payload: Partial<CrossTenantAccessUser>
  ): Promise<CrossTenantAccessUser> => {
    const { data } = await axiosInstance.patch(`/admin/access-users/${accessUserId}/`, payload);
    return data;
  },

  deactivateAccessUser: async (
    accessUserId: string,
    clientIds?: string[]
  ): Promise<{ queued: boolean; task_id: string; request_id: string }> => {
    const { data } = await axiosInstance.post(`/admin/access-users/${accessUserId}/deactivate/`, {
      client_ids: clientIds,
    });
    return data;
  },

  syncAccessUser: async (
    accessUserId: string,
    clientIds?: string[]
  ): Promise<{ queued: boolean; task_id: string; request_id: string; queued_tenants?: number }> => {
    const { data } = await axiosInstance.post(`/admin/access-users/${accessUserId}/sync/`, {
      client_ids: clientIds,
    });
    return data;
  },

  inviteAccessUser: async (
    accessUserId: string
  ): Promise<{ success: boolean; message: string }> => {
    const { data } = await axiosInstance.post(`/admin/access-users/${accessUserId}/invite/`);
    return data;
  },
};
