interface SubscriptionManagerProps {
  clientId: string;
  hasPaymentMethod: boolean;
  paymentMethodStatus?: "no_customer" | "no_payment_method" | "active";
}

/**
 * Legacy Stripe-managed subscription UI is intentionally hidden.
 * Custom B2B billing config + activation flow is the supported path.
 */
export function SubscriptionManager(_props: SubscriptionManagerProps) {
  return null;
}

