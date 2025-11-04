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
  database_name: string;
  database_host?: string;
  default_template_id?: string;
  allowed_iframe_domains?: string[];
  branding_config?: Record<string, any>;
  token_expiry_minutes?: number;
  patient_fee?: number;
  async_consult_fee_to_client?: number;
  async_consult_cost?: number;
  sync_video_consult_fee_to_client?: number;
  sync_consult_cost?: number;
  monthly_saas_fee?: number;
  first_next_saas_fees_billing_date?: string;
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
}

export interface ClientCreatePayload {
  // User Information
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  
  // Client Basic Information
  name: string;
  domain?: string;
  subdomain?: string;
  master_id_prefix?: string;
  admin_panel_domain: string;
  patient_portal_domain?: string;
  api_endpoint?: string;
  questionnaire_url?: string;
  
  // Configuration
  allowed_iframe_domains?: string[];
  default_template_id?: string;
  branding_config?: Record<string, any>;
  token_expiry_minutes?: number;
  
  // Database Configuration
  database_host?: string;
  database_name: string;
  
  // Billing Settings
  patient_fee?: number;
  async_consult_fee_to_client?: number;
  async_consult_cost?: number;
  sync_video_consult_fee_to_client?: number;
  sync_consult_cost?: number;
  monthly_saas_fee?: number;
  first_next_saas_fees_billing_date?: string;
  
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
  
  // Client Information
  name?: string;
  domain?: string;
  subdomain?: string;
  master_id_prefix?: string;
  admin_panel_domain?: string;
  patient_portal_domain?: string;
  api_endpoint?: string;
  questionnaire_url?: string;
  
  // Configuration
  allowed_iframe_domains?: string[];
  default_template_id?: string;
  branding_config?: Record<string, any>;
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
};
