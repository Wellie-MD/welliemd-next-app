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
    nmi_base_url?: string | null;
    nmi_public_key?: string | null;
    nmi_test_mode?: boolean | null;

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
    ],
    nmi: [
        {
            key: 'nmi_security_key',
            label: 'API Security Key',
            placeholder: 'Enter NMI API Security Key',
            description: 'Private merchant API security key used for server-side transact.php payment requests. Generate it from the merchant account Security Keys page. Do not use Partner Portal / v4 boarding keys here.',
            type: 'password',
            required: true
        },
        {
            key: 'nmi_public_key',
            label: 'Tokenization Key (Collect.js)',
            placeholder: 'Enter NMI Tokenization Key',
            description: 'Public tokenization key used only for Collect.js in the browser. Generate it from the merchant account Security Keys page using the Tokenization key type. Do not use Partner Portal / v4 keys here.',
            type: 'text',
            required: true
        },
        {
            key: 'nmi_test_mode',
            label: 'NMI Environment',
            placeholder: 'Select NMI environment',
            description: 'Use Sandbox for test credentials (routes to sandbox.nmi.com). Use Production for live credentials.',
            type: 'select',
            options: [
                { value: 'true', label: 'Sandbox (Testing)' },
                { value: 'false', label: 'Production (Live)' },
            ],
            required: true
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
