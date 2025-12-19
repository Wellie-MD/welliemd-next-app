/**
 * Payment Gateway Configuration Types
 * 
 * TypeScript interfaces for payment gateway configuration
 * Maps to: welliemd/apps/clients/api/serializers.py - ClientPaymentConfigSerializer
 */

export type PaymentGatewayType = 'stripe' | 'nmi' | 'authorize_net';

export interface PaymentGatewayConfig {
    // Gateway selection
    payment_gateway: PaymentGatewayType;

    // NMI fields
    nmi_security_key?: string | null;
    nmi_api_key?: string | null;
    nmi_base_url?: string | null;
    nmi_public_key?: string | null;

    // Stripe fields
    stripe_secret_key?: string | null;
    stripe_publishable_key?: string | null;
    stripe_subscription_id?: string | null;

    // Authorize.Net fields
    authorize_net_api_login_id?: string | null;
    authorize_net_transaction_key?: string | null;
    authorize_net_base_url?: string | null;
    authorize_net_environment?: 'sandbox' | 'production' | null;
    authnet_client_key?: string | null;
}

export interface PaymentGatewayConfigResponse {
    success: boolean;
    payment_config: PaymentGatewayConfig;
}

// Gateway field configurations for dynamic form rendering
export interface GatewayFieldConfig {
    key: keyof PaymentGatewayConfig;
    label: string;
    placeholder: string;
    type?: 'text' | 'password' | 'select';
    options?: { value: string; label: string }[];
    required?: boolean;
}

export const GATEWAY_FIELDS: Record<PaymentGatewayType, GatewayFieldConfig[]> = {
    stripe: [
        { key: 'stripe_publishable_key', label: 'Publishable Key', placeholder: 'pk_live_...', type: 'text', required: true },
        { key: 'stripe_secret_key', label: 'Secret Key', placeholder: 'sk_live_...', type: 'password', required: true },
    ],
    nmi: [
        { key: 'nmi_security_key', label: 'Security Key', placeholder: 'Enter NMI Security Key', type: 'password', required: true },
        { key: 'nmi_api_key', label: 'API Key', placeholder: 'Enter NMI API Key', type: 'password' },
        { key: 'nmi_public_key', label: 'Public Key', placeholder: 'Enter NMI Public Key', type: 'text' },
        { key: 'nmi_base_url', label: 'Base URL', placeholder: 'https://secure.networkmerchants.com/api/transact.php', type: 'text' },
    ],
    authorize_net: [
        { key: 'authorize_net_api_login_id', label: 'API Login ID', placeholder: 'Enter API Login ID', type: 'text', required: true },
        { key: 'authorize_net_transaction_key', label: 'Transaction Key', placeholder: 'Enter Transaction Key', type: 'password', required: true },
        { key: 'authnet_client_key', label: 'Client Key', placeholder: 'Enter Client Key', type: 'text' },
        { key: 'authorize_net_base_url', label: 'Base URL', placeholder: 'https://api.authorize.net/xml/v1/request.api', type: 'text' },
        {
            key: 'authorize_net_environment',
            label: 'Environment',
            placeholder: 'Select environment',
            type: 'select',
            options: [
                { value: 'sandbox', label: 'Sandbox (Testing)' },
                { value: 'production', label: 'Production (Live)' },
            ],
            required: true
        },
    ],
};

export const GATEWAY_OPTIONS: { value: PaymentGatewayType; label: string }[] = [
    { value: 'stripe', label: 'Stripe' },
    { value: 'nmi', label: 'NMI' },
    { value: 'authorize_net', label: 'Authorize.Net' },
];
