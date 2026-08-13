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
import { useAuthStore } from '@/features/auth/store/auth.store';
import { PERMISSIONS } from '@/features/auth/types/auth.types';
import { PaymentMethodsService } from '@/features/payment-methods/services/payment-methods.service';
import type { PaymentConfig, PaymentGateway, PaymentMethod } from '@/features/payment-methods/types/payment-methods.types';
import { StripeCardForm, type StripeCardFormHandle } from './StripeCardForm';
import { NmiCollectForm, type NmiCollectFormHandle } from './NmiCollectForm';
import { AuthorizeNetAcceptForm, type AuthorizeNetAcceptFormHandle } from './AuthorizeNetAcceptForm';
import { toast } from 'sonner';
import { ErrorUtils } from '@/shared/lib/errors';
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
  const isImpersonated = useAuthStore((state) => state.isImpersonated);

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
      toast.error(ErrorUtils.getErrorMessage(error, 'Failed to load payment configuration'));
      return null;
    }
  };

  const loadMethods = async (gateway: PaymentGateway) => {
    try {
      const list = await PaymentMethodsService.listPaymentMethods(gateway);
      setMethods(list || []);
    } catch (error: any) {
      toast.error(ErrorUtils.getErrorMessage(error, 'Failed to load payment methods'));
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
    if (isImpersonated || !activeGateway) return;
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
          card_meta: data.card_meta,
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
    if (isImpersonated || !activeGateway) return;
    try {
      await PaymentMethodsService.setDefaultPaymentMethod(activeGateway, methodId);
      toast.success('Default payment method updated');
      await loadMethods(activeGateway);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update default payment method');
    }
  };

  const handleDelete = async (methodId: string) => {
    if (isImpersonated || !activeGateway) return;
    try {
      await PaymentMethodsService.deletePaymentMethod(activeGateway, methodId);
      toast.success('Payment method removed');
      await loadMethods(activeGateway);
    } catch (error: any) {
      toast.error(ErrorUtils.getErrorMessage(error, 'Failed to remove payment method'));
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
    <div className="pg" id="pg-billing">
      <div className="km-fade" style={{ marginBottom: 18 }}>
        <p className="km-page-title">Billing</p>
        <p className="km-page-sub" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <ShieldCheck size={12} /> Secure Billing
        </p>
      </div>

      <div className="km-grid">
        {/* PAYMENT METHODS */}
          <div className="km-sc km-fade fd">
            <div className="km-sct">Payment methods</div>
            <div className="km-scs" style={{ fontSize: 13, lineHeight: 1.5 }}>
              Keep your cards up to date for uninterrupted treatment deliveries and plan renewals.
            </div>
          
          {canCreate && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <button className="km-btn km-btn-primary" disabled={limitReached || isImpersonated} style={{ marginBottom: 18, gap: 8, opacity: isImpersonated ? 0.5 : 1, cursor: isImpersonated ? 'not-allowed' : 'pointer' }}>
                  <Pencil size={14} />
                  Add another card
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-xl km-billing-dialog">
                <DialogHeader>
                  <DialogTitle className="text-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>Add a new card</DialogTitle>
                  <DialogDescription>
                    We use {gatewayLabel} to safely store your payment method.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-4">
                  {renderGatewayForm()}
                  <button onClick={handleSave} disabled={saving || !activeGateway || isImpersonated} className="km-btn km-btn-primary" style={{ width: '100%', justifyContent: 'center', borderRadius: 10, padding: '10px 16px' }}>
                    {saving ? 'Saving…' : 'Save card'}
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {limitReached && (
            <div className="km-vbox km-vbox-amber" style={{ marginBottom: 16 }}>
              <div className="km-vsub">
                You have reached the maximum of {paymentMethodLimit} saved cards. Remove a card before adding another.
              </div>
            </div>
          )}

          {!canList ? (
            <div className="km-vbox km-vbox-red">
               <div className="km-vsub">You do not have permission to manage payment methods.</div>
            </div>
          ) : loading ? (
            <div className="km-vbox km-vbox-gray">
              <div className="km-vsub">Loading payment methods…</div>
            </div>
          ) : methods.length === 0 ? (
            <div className="km-vbox km-vbox-gray">
              <div className="km-vsub">No payment methods on file. Add a card to get started.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Default Card */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--km-t)' }}>Default card</span>
                  <span style={{ fontSize: 11, color: 'var(--km-tm)' }}>Used for automatic payments</span>
                </div>
                {defaultMethods.map((method) => (
                  <div key={method.id} style={{ background: 'var(--km-s2)', border: '1px solid var(--km-b)', borderRadius: 'var(--km-rs)', padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 46, height: 32, borderRadius: 6, background: 'var(--km-s3)', border: '1px solid var(--km-b)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <img
                          src={resolveCardIcon(method.card_brand)}
                          alt={method.card_brand || 'card'}
                          style={{ height: 18, width: 26, objectFit: 'contain' }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--km-t)', marginBottom: 2 }}>
                          {(method.card_brand || 'Card').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--km-tm)' }}>
                          {method.masked_card_number || '••••'}
                          {method.card_expiry_month && method.card_expiry_year
                            ? ` · Exp ${method.card_expiry_month}/${method.card_expiry_year}`
                            : ''}
                          {method.billing_postal_code ? ` · ZIP ${method.billing_postal_code}` : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span className="km-badge km-badge-blue" style={{ fontSize: 11 }}>Default</span>
                      {canDelete && methods.length > 1 && (
                        <button
                          className="km-btn"
                          style={{ padding: '5px 12px', fontSize: 12, background: 'var(--km-rep)', color: 'var(--km-re)', border: '1px solid rgba(239,68,68,0.2)', opacity: isImpersonated ? 0.5 : 1, cursor: isImpersonated ? 'not-allowed' : 'pointer' }}
                          onClick={() => handleDelete(method.id)}
                          disabled={isImpersonated}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {methods.length <= 1 && (
                      <div style={{ fontSize: 11, color: 'var(--km-tm)', padding: '8px 10px', background: 'var(--km-s3)', borderRadius: 7 }}>
                        Add a new payment method before removing this one.
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Other Cards */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--km-t)' }}>Other cards</span>
                  <span style={{ fontSize: 11, color: 'var(--km-tm)' }}>Available for manual selection</span>
                </div>
                {otherMethods.length === 0 ? (
                  <div style={{ background: 'var(--km-s2)', border: '1px solid var(--km-b)', borderRadius: 'var(--km-rs)', padding: 14, fontSize: 13, color: 'var(--km-tm)' }}>
                    No additional cards.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                     {otherMethods.map((method) => (
                        <div key={method.id} style={{ background: 'var(--km-s2)', border: '1px solid var(--km-b)', borderRadius: 'var(--km-rs)', padding: 14 }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                              <div style={{ width: 46, height: 32, borderRadius: 6, background: 'var(--km-s3)', border: '1px solid var(--km-b)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <img
                                  src={resolveCardIcon(method.card_brand)}
                                  alt={method.card_brand || 'card'}
                                  style={{ height: 18, width: 26, objectFit: 'contain' }}
                                />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--km-t)', marginBottom: 2 }}>
                                  {(method.card_brand || 'Card').replace(/\b\w/g, (c) => c.toUpperCase())}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--km-tm)' }}>
                                  {method.masked_card_number || '••••'}
                                  {method.card_expiry_month && method.card_expiry_year
                                    ? ` · Exp ${method.card_expiry_month}/${method.card_expiry_year}`
                                    : ''}
                                </div>
                              </div>
                           </div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {canUpdate && (
                                <button className="km-btn km-btn-outline" style={{ padding: '5px 12px', fontSize: 12, opacity: isImpersonated ? 0.5 : 1, cursor: isImpersonated ? 'not-allowed' : 'pointer' }} onClick={() => handleSetDefault(method.id)} disabled={isImpersonated}>
                                  Make Default
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  className="km-btn"
                                  style={{ padding: '5px 12px', fontSize: 12, background: 'var(--km-rep)', color: 'var(--km-re)', border: '1px solid rgba(239,68,68,0.2)', opacity: isImpersonated ? 0.5 : 1, cursor: isImpersonated ? 'not-allowed' : 'pointer' }}
                                  onClick={() => handleDelete(method.id)}
                                  disabled={isImpersonated}
                                >
                                  Remove
                                </button>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* SECURE BY DESIGN */}
          <div className="km-sc km-fade fd">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--km-t)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldCheck size={18} style={{ color: 'var(--km-bg)' }} strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--km-t)', marginBottom: 2 }}>Secure by design</div>
                <div style={{ fontSize: 12, color: 'var(--km-tm)' }}>Cards are tokenized and never stored on our servers.</div>
              </div>
            </div>
            <div style={{ background: 'var(--km-s2)', border: '1px solid var(--km-b)', borderRadius: 'var(--km-rs)', padding: '12px 14px', fontSize: 13, color: 'var(--km-tm)' }}>
              Active gateway: <strong style={{ color: 'var(--km-t)' }}>{gatewayLabel}</strong>
            </div>
          </div>

          {/* BILLING TIPS */}
          <div className="km-sc km-fade fd">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--km-acp)', border: '1px solid var(--km-b)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--km-ac)" strokeWidth="1.8"><path d="M12 2v1M12 21v1M4.22 4.22l.71.71M18.36 18.36l.71.71M1 12h1M21 12h1M4.22 19.78l.71-.71M18.36 5.64l.71-.71"/><circle cx="12" cy="12" r="4"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--km-t)', marginBottom: 2 }}>Billing tips</div>
                <div style={{ fontSize: 12, color: 'var(--km-tm)' }}>Use a card with enough balance for monthly renewals.</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Update cards before they expire.',
                'Keep one default card for automated charges.',
                'Reach support for billing disputes.'
              ].map((tip, idx) => (
                <div key={idx} style={{ fontSize: 13, color: 'var(--km-tm)', display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                  <span style={{ color: 'var(--km-ac)', marginTop: 1 }}>·</span>
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
