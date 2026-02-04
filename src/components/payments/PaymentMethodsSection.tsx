import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRBAC } from '@/shared/hooks/use-rbac';
import type { PaymentConfig, PaymentGateway, PaymentMethod } from '@/features/payment-methods/types/payment-methods.types';
import { PaymentMethodsService } from '@/features/payment-methods/services/payment-methods.service';
import { StripeCardForm, type StripeCardFormHandle } from './StripeCardForm';
import { NmiCollectForm, type NmiCollectFormHandle } from './NmiCollectForm';
import { AuthorizeNetAcceptForm, type AuthorizeNetAcceptFormHandle } from './AuthorizeNetAcceptForm';
import { PERMISSIONS } from '@/features/auth/types/auth.types';

interface PaymentMethodsSectionProps {
  userId?: string;
}

export function PaymentMethodsSection({ userId }: PaymentMethodsSectionProps) {
  const { can } = useRBAC();

  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const stripeRef = useRef<StripeCardFormHandle | null>(null);
  const nmiRef = useRef<NmiCollectFormHandle | null>(null);
  const authnetRef = useRef<AuthorizeNetAcceptFormHandle | null>(null);

  const canList = can(PERMISSIONS.PAYMENT_METHOD_LIST);
  const canCreate = can(PERMISSIONS.PAYMENT_METHOD_CREATE);
  const canUpdate = can(PERMISSIONS.PAYMENT_METHOD_UPDATE);
  const canDelete = can(PERMISSIONS.PAYMENT_METHOD_DELETE);

  const activeGateway: PaymentGateway | null = config?.active_gateway ?? null;
  const paymentMethodLimit = config?.payment_method_limit ?? null;
  const limitReached = paymentMethodLimit !== null && methods.length >= paymentMethodLimit;

  const activeGatewayLabel = useMemo(() => {
    switch (activeGateway) {
      case 'stripe':
        return 'Stripe';
      case 'nmi':
        return 'NMI';
      case 'authorize_net':
        return 'Authorize.Net';
      default:
        return 'Unknown';
    }
  }, [activeGateway]);

  const loadConfig = async () => {
    try {
      const cfg = await PaymentMethodsService.getPaymentConfig();
      setConfig(cfg);
      return cfg;
    } catch (error: any) {
      toast.error(error?.error || error?.message || 'Failed to load payment configuration');
      return null;
    }
  };

  const loadMethods = async (gateway: PaymentGateway) => {
    try {
      const list = await PaymentMethodsService.listPaymentMethods(gateway);
      setMethods(list || []);
    } catch (error: any) {
      toast.error(error?.error || error?.message || 'Failed to load payment methods');
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoading(true);
      const cfg = await loadConfig();
      if (!mounted) return;
      if (cfg?.active_gateway) {
        await loadMethods(cfg.active_gateway);
      }
      setLoading(false);
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    if (!activeGateway) return;
    if (!userId) {
      toast.error('User profile not loaded');
      return;
    }
    if (limitReached) {
      toast.error(`Card limit reached (${paymentMethodLimit}). Remove a card before adding another.`);
      return;
    }

    try {
      setSaving(true);

      if (activeGateway === 'stripe') {
        const paymentData = await stripeRef.current?.getPaymentData();
        if (!paymentData) throw new Error('Stripe payment method data not available');
        await PaymentMethodsService.createPaymentMethod(activeGateway, {
          user_id: userId,
          payment_method_id: paymentData.payment_method_id,
          postal_code: paymentData.postal_code,
        });
      } else if (activeGateway === 'nmi') {
        const paymentData = await nmiRef.current?.getPaymentData();
        if (!paymentData) throw new Error('NMI payment method data not available');
        await PaymentMethodsService.createPaymentMethod(activeGateway, {
          user_id: userId,
          payment_token: paymentData.payment_token,
          postal_code: paymentData.postal_code,
        });
      } else if (activeGateway === 'authorize_net') {
        const paymentData = await authnetRef.current?.getPaymentData();
        if (!paymentData) throw new Error('Authorize.Net payment method data not available');
        await PaymentMethodsService.createPaymentMethod(activeGateway, {
          user_id: userId,
          opaqueDataDescriptor: paymentData.opaqueDataDescriptor,
          opaqueDataValue: paymentData.opaqueDataValue,
          postal_code: paymentData.postal_code,
        });
      }

      toast.success('Payment method saved');
      await loadMethods(activeGateway);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save payment method');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    if (!activeGateway) return;
    try {
      await PaymentMethodsService.setDefaultPaymentMethod(activeGateway, methodId);
      toast.success('Default payment method updated');
      await loadMethods(activeGateway);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update default payment method');
    }
  };

  const handleDelete = async (methodId: string) => {
    if (!activeGateway) return;
    try {
      await PaymentMethodsService.deletePaymentMethod(activeGateway, methodId);
      toast.success('Payment method removed');
      await loadMethods(activeGateway);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to remove payment method');
    }
  };

  if (!canList) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-primary">Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">You do not have access to manage payment methods.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium text-primary">Payment Methods</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading payment methods…</p>
        ) : (
          <>
            {limitReached && (
              <p className="text-xs text-muted-foreground">
                You have reached the maximum of {paymentMethodLimit} saved cards. Remove a card before adding another.
              </p>
            )}
            <div className="space-y-3">
              {methods.length === 0 && (
                <p className="text-sm text-muted-foreground">No payment methods on file.</p>
              )}
              {methods.map((method) => (
                <div key={method.id} className="flex flex-wrap items-center justify-between gap-4 rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium capitalize">{method.card_brand || method.processor}</p>
                    <p className="text-xs text-muted-foreground">
                      {method.masked_card_number || '••••'}
                      {method.card_expiry_month && method.card_expiry_year
                        ? ` • Exp ${method.card_expiry_month}/${method.card_expiry_year}`
                        : ''}
                      {method.billing_postal_code ? ` • ZIP ${method.billing_postal_code}` : ''}
                    </p>
                    {method.is_default && <span className="text-xs text-primary">Default</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.is_default && canUpdate && (
                      <Button variant="outline" size="sm" onClick={() => handleSetDefault(method.id)}>
                        Make Default
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(method.id)}>
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-5">
              <div className="mb-3">
                <p className="text-sm font-medium">Add new payment method</p>
                <p className="text-xs text-muted-foreground">Gateway: {activeGatewayLabel}</p>
              </div>

              {activeGateway === 'stripe' && (
                <StripeCardForm ref={stripeRef} publishableKey={config?.stripe_publishable_key} />
              )}

              {activeGateway === 'nmi' && (
                <NmiCollectForm ref={nmiRef} clientKey={config?.nmi_client_key} scriptUrl={config?.nmi_script_url} />
              )}

              {activeGateway === 'authorize_net' && (
                <AuthorizeNetAcceptForm
                  ref={authnetRef}
                  clientKey={config?.authorize_net_client_key}
                  apiLoginId={config?.authorize_net_api_login}
                  scriptUrl={config?.authorize_net_script_url}
                />
              )}

              {!activeGateway && (
                <p className="text-sm text-muted-foreground">No active gateway configured.</p>
              )}

              <div className="mt-4">
                <Button disabled={!canCreate || saving || !activeGateway || limitReached} onClick={handleSave}>
                  {saving ? 'Saving…' : 'Save payment method'}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
