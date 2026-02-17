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
    stripe_webhook_secret?: string | null;

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
    description: string;  // Help text shown in tooltip
    type?: 'text' | 'password' | 'select';
    options?: { value: string; label: string }[];
    required?: boolean;
}

export const GATEWAY_FIELDS: Record<PaymentGatewayType, GatewayFieldConfig[]> = {
    stripe: [
        {
            key: 'stripe_publishable_key',
            label: 'Publishable Key',
            placeholder: 'pk_live_...',
            description: 'Your Stripe publishable key starts with "pk_live_" (production) or "pk_test_" (sandbox). Find it in Stripe Dashboard → Developers → API keys.',
            type: 'text',
            required: true
        },
        {
            key: 'stripe_secret_key',
            label: 'Secret Key',
            placeholder: 'sk_live_...',
            description: 'Your Stripe secret key starts with "sk_live_" (production) or "sk_test_" (sandbox). Keep this secure and never expose it publicly.',
            type: 'password',
            required: true
        },
        {
            key: 'stripe_webhook_secret',
            label: 'Webhook Secret',
            placeholder: 'whsec_...',
            description: 'Stripe webhook signing secret from Dashboard → Developers → Webhooks → (your endpoint) → Signing secret. Used to verify incoming Stripe webhook signatures.',
            type: 'password',
            required: true
        },
    ],
    nmi: [
        {
            key: 'nmi_security_key',
            label: 'Security Key',
            placeholder: 'Enter NMI Security Key',
            description: 'Your NMI Security Key for server-side API calls. Found in NMI Control Panel → Settings → Security Keys. This is required for processing payments.',
            type: 'password',
            required: true
        },
        {
            key: 'nmi_api_key',
            label: 'API Key',
            placeholder: 'Enter NMI API Key',
            description: 'NMI API Key for additional authentication. This may be the same as the Security Key depending on your NMI account setup.',
            type: 'password'
        },
        {
            key: 'nmi_public_key',
            label: 'Public Key (Tokenization Key)',
            placeholder: 'Enter NMI Public Key',
            description: 'NMI Public Key for Collect.js tokenization in the browser. Found in NMI Control Panel → Settings → Security Keys → Public Security Key.',
            type: 'text'
        },
        // Base URL is hardcoded in backend (default: https://secure.networkmerchants.com/api/transact.php)
    ],
    authorize_net: [
        {
            key: 'authorize_net_api_login_id',
            label: 'API Login ID',
            placeholder: 'Enter API Login ID',
            description: 'Your Authorize.Net API Login ID. Found in Merchant Interface → Account → Settings → API Credentials & Keys.',
            type: 'text',
            required: true
        },
        {
            key: 'authorize_net_transaction_key',
            label: 'Transaction Key',
            placeholder: 'Enter Transaction Key',
            description: 'Your Authorize.Net Transaction Key for server-side API authentication. Found in Merchant Interface → Account → Settings → API Credentials & Keys.',
            type: 'password',
            required: true
        },
        {
            key: 'authnet_client_key',
            label: 'Client Key',
            placeholder: 'Enter Client Key',
            description: 'Authorize.Net Client Key for Accept.js tokenization in the browser. Found in Merchant Interface → Account → Settings → Manage Public Client Key.',
            type: 'text'
        },
        // Base URL is hardcoded in backend based on environment selection
        {
            key: 'authorize_net_environment',
            label: 'Environment',
            placeholder: 'Select environment',
            description: 'Select "Sandbox" for testing with test credentials or "Production" for live payment processing.',
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
