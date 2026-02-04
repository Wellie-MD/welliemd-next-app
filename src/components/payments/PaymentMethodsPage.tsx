import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Sparkles, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useProfile } from '@/features/profile';
import { useRBAC } from '@/shared/hooks/use-rbac';
import { PERMISSIONS } from '@/features/auth/types/auth.types';
import { PaymentMethodsService } from '@/features/payment-methods/services/payment-methods.service';
import type { PaymentConfig, PaymentGateway, PaymentMethod } from '@/features/payment-methods/types/payment-methods.types';
import { StripeCardForm, type StripeCardFormHandle } from './StripeCardForm';
import { NmiCollectForm, type NmiCollectFormHandle } from './NmiCollectForm';
import { AuthorizeNetAcceptForm, type AuthorizeNetAcceptFormHandle } from './AuthorizeNetAcceptForm';
import { toast } from 'sonner';
import visaLogo from '@/assets/icons/payment-methods/visa.svg';
import mastercardLogo from '@/assets/icons/payment-methods/mastercard.svg';
import amexLogo from '@/assets/icons/payment-methods/american-express.svg';
import discoverLogo from '@/assets/icons/payment-methods/discover.svg';
import dinersLogo from '@/assets/icons/payment-methods/diners-club.svg';
import genericCardLogo from '@/assets/icons/payment-methods/generic-card.svg';

const resolveCardIcon = (brand?: string) => {
  const normalized = (brand || '').toLowerCase().trim();
  if (normalized.includes('visa')) return visaLogo;
  if (normalized.includes('mastercard') || normalized.includes('master card')) return mastercardLogo;
  if (normalized.includes('amex') || normalized.includes('american express') || normalized.includes('americanexpress')) return amexLogo;
  if (normalized.includes('discover')) return discoverLogo;
  if (normalized.includes('diners')) return dinersLogo;
  if (normalized.includes('jcb')) return genericCardLogo;
  if (normalized.includes('unionpay') || normalized.includes('union pay')) return genericCardLogo;
  return genericCardLogo;
};

export default function PaymentMethodsPage() {
  const { userProfile } = useProfile();
  const { can } = useRBAC();

  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const gatewayLabel = useMemo(() => {
    if (activeGateway === 'stripe') return 'Stripe';
    if (activeGateway === 'nmi') return 'NMI';
    if (activeGateway === 'authorize_net') return 'Authorize.Net';
    return 'Unknown';
  }, [activeGateway]);

  const defaultMethods = methods.filter((m) => m.is_default);
  const otherMethods = methods.filter((m) => !m.is_default);

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
      if (mounted) setLoading(false);
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    if (!activeGateway) return;
    if (!userProfile?.id) {
      toast.error('User profile not loaded');
      return;
    }

    try {
      setSaving(true);

      if (activeGateway === 'stripe') {
        const data = await stripeRef.current?.getPaymentData();
        if (!data) throw new Error('Stripe payment method data not available');
        await PaymentMethodsService.createPaymentMethod(activeGateway, {
          user_id: userProfile.id,
          payment_method_id: data.payment_method_id,
          postal_code: data.postal_code,
        });
      } else if (activeGateway === 'nmi') {
        const data = await nmiRef.current?.getPaymentData();
        if (!data) throw new Error('NMI payment method data not available');
        await PaymentMethodsService.createPaymentMethod(activeGateway, {
          user_id: userProfile.id,
          payment_token: data.payment_token,
          postal_code: data.postal_code,
        });
      } else if (activeGateway === 'authorize_net') {
        const data = await authnetRef.current?.getPaymentData();
        if (!data) throw new Error('Authorize.Net payment method data not available');
        await PaymentMethodsService.createPaymentMethod(activeGateway, {
          user_id: userProfile.id,
          opaqueDataDescriptor: data.opaqueDataDescriptor,
          opaqueDataValue: data.opaqueDataValue,
          postal_code: data.postal_code,
        });
      }

      toast.success('Payment method saved');
      setDialogOpen(false);
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
      const detail = error?.response?.data?.detail || error?.error || error?.message;
      toast.error(detail || 'Failed to remove payment method');
    }
  };

  const renderGatewayForm = () => {
    if (!activeGateway) return null;
    if (activeGateway === 'stripe') {
      return <StripeCardForm ref={stripeRef} publishableKey={config?.stripe_publishable_key} />;
    }
    if (activeGateway === 'nmi') {
      return <NmiCollectForm ref={nmiRef} clientKey={config?.nmi_client_key} scriptUrl={config?.nmi_script_url} />;
    }
    if (activeGateway === 'authorize_net') {
      return (
        <AuthorizeNetAcceptForm
          ref={authnetRef}
          clientKey={config?.authorize_net_client_key}
          apiLoginId={config?.authorize_net_api_login}
          scriptUrl={config?.authorize_net_script_url}
        />
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen px-4 py-10 md:px-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost">
            <Link to="/dashboard/settings" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Settings
            </Link>
          </Button>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Secure billing</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle className="text-3xl">Payment methods</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Keep your cards up to date for uninterrupted treatment deliveries and plan renewals.
                </p>
              </div>
              {canCreate && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" disabled={limitReached}>
                      <Pencil className="h-4 w-4" />
                      Add another card
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">Add a new card</DialogTitle>
                      <DialogDescription>
                        We use {gatewayLabel} to safely store your payment method.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 space-y-4">
                      {renderGatewayForm()}
                      <Button onClick={handleSave} disabled={saving || !activeGateway} className="w-full">
                        {saving ? 'Saving…' : 'Save card'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {limitReached && (
              <div className="rounded-lg border border-dashed border-border bg-background p-3 text-xs text-muted-foreground">
                You have reached the maximum of {paymentMethodLimit} saved cards. Remove a card before adding another.
              </div>
            )}
            {!canList ? (
              <div className="rounded-lg border border-border bg-background p-6 text-sm text-muted-foreground">
                You do not have permission to manage payment methods.
              </div>
            ) : loading ? (
              <div className="rounded-lg border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
                Loading payment methods…
              </div>
            ) : methods.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
                No payment methods on file. Add a card to get started.
              </div>
            ) : (
              <div className="space-y-8">
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Default card</p>
                    <span className="text-xs text-muted-foreground">Used for automatic payments</span>
                  </div>
                  {defaultMethods.length === 0 ? (
                    <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                      No default card set.
                    </div>
                  ) : (
                    defaultMethods.map((method) => (
                      <div key={method.id} className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-14 items-center justify-center rounded-lg border border-primary/30 bg-background px-2">
                              <img
                                src={resolveCardIcon(method.card_brand)}
                                alt={method.card_brand || 'card'}
                                className="h-6 w-full object-contain"
                              />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">
                                {(method.card_brand || 'Card').replace(/\b\w/g, (c) => c.toUpperCase())}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {method.masked_card_number || '••••'}
                                {method.card_expiry_month && method.card_expiry_year
                                  ? ` • Exp ${method.card_expiry_month}/${method.card_expiry_year}`
                                  : ''}
                                {method.billing_postal_code ? ` • ZIP ${method.billing_postal_code}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                              Default
                            </span>
                            {canDelete && (
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={methods.length <= 1}
                                title={methods.length <= 1 ? 'Add another card before removing this one.' : 'Remove payment method'}
                                onClick={() => handleDelete(method.id)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                        {methods.length <= 1 && (
                          <p className="mt-3 text-xs text-muted-foreground">
                            Add a new payment method before removing this one.
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </section>

                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Other cards</p>
                    <span className="text-xs text-muted-foreground">Available for manual selection</span>
                  </div>
                  {otherMethods.length === 0 ? (
                    <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                      No additional cards.
                    </div>
                  ) : (
                    otherMethods.map((method) => (
                      <div key={method.id} className="rounded-xl border border-border bg-background p-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-14 items-center justify-center rounded-lg border border-border bg-background px-2">
                              <img
                                src={resolveCardIcon(method.card_brand)}
                                alt={method.card_brand || 'card'}
                                className="h-6 w-full object-contain"
                              />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">
                                {(method.card_brand || 'Card').replace(/\b\w/g, (c) => c.toUpperCase())}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {method.masked_card_number || '••••'}
                                {method.card_expiry_month && method.card_expiry_year
                                  ? ` • Exp ${method.card_expiry_month}/${method.card_expiry_year}`
                                  : ''}
                                {method.billing_postal_code ? ` • ZIP ${method.billing_postal_code}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {canUpdate && (
                              <Button variant="outline" size="sm" onClick={() => handleSetDefault(method.id)}>
                                Make Default
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={methods.length <= 1}
                                title={methods.length <= 1 ? 'Add another card before removing this one.' : 'Remove payment method'}
                                onClick={() => handleDelete(method.id)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </section>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Secure by design</p>
                  <p className="text-xs text-muted-foreground">Cards are tokenized and never stored on our servers.</p>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-background p-4 text-xs text-muted-foreground">
                Active gateway: <span className="font-semibold text-foreground">{gatewayLabel}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Billing tips</p>
                  <p className="text-xs text-muted-foreground">Use a card with enough balance for monthly renewals.</p>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>• Update cards before they expire.</li>
                <li>• Keep one default card for automated charges.</li>
                <li>• Reach support for billing disputes.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
