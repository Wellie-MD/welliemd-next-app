export type PaymentGateway = 'stripe' | 'nmi' | 'authorize_net';

export interface PaymentConfig {
  active_gateway: PaymentGateway;
  payment_method_limit?: number;
  stripe_publishable_key?: string;
  nmi_client_key?: string;
  nmi_script_url?: string;
  authorize_net_client_key?: string;
  authorize_net_api_login?: string;
  authorize_net_script_url?: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  processor: string;
  masked_card_number?: string;
  card_brand?: string;
  card_expiry_month?: string | number | null;
  card_expiry_year?: string | number | null;
  billing_postal_code?: string | null;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePaymentMethodPayload {
  user_id: string;
  payment_method_id?: string;
  payment_token?: string;
  card_meta?: Record<string, unknown>;
  opaqueDataDescriptor?: string;
  opaqueDataValue?: string;
  postal_code?: string;
}
