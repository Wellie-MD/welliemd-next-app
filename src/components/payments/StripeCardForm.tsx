import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaymentFieldFrame } from './PaymentFieldFrame';

export interface StripeCardFormHandle {
  getPaymentData: () => Promise<{ payment_method_id: string; postal_code?: string }>;
}

interface StripeCardFormProps {
  publishableKey?: string;
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if ((window as any).Stripe) return resolve();
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error(`Failed to load script: ${src}`)));
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

export const StripeCardForm = forwardRef<StripeCardFormHandle, StripeCardFormProps>(({ publishableKey }, ref) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cardholderName, setCardholderName] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const stripeRef = useRef<any>(null);
  const elementsRef = useRef<any>(null);
  const cardNumberRef = useRef<any>(null);
  const cardExpiryRef = useRef<any>(null);
  const cardCvcRef = useRef<any>(null);

  const cardNumberMountRef = useRef<HTMLDivElement | null>(null);
  const cardExpiryMountRef = useRef<HTMLDivElement | null>(null);
  const cardCvcMountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        if (!publishableKey) {
          throw new Error('Stripe publishable key not configured.');
        }

        await loadScript('https://js.stripe.com/v3/');

        if (!(window as any).Stripe) {
          throw new Error('Stripe.js failed to load');
        }

        if (!stripeRef.current) {
          stripeRef.current = (window as any).Stripe(publishableKey);
        }
        if (!elementsRef.current) {
          elementsRef.current = stripeRef.current.elements();
        }

        const style = {
          base: {
            fontSize: '14px',
            color: '#111827',
            '::placeholder': { color: '#9ca3af' },
          },
          invalid: { color: '#dc2626' },
        };

        if (!cardNumberRef.current && cardNumberMountRef.current) {
          cardNumberRef.current = elementsRef.current.create('cardNumber', { style });
          cardNumberRef.current.mount(cardNumberMountRef.current);
        }
        if (!cardExpiryRef.current && cardExpiryMountRef.current) {
          cardExpiryRef.current = elementsRef.current.create('cardExpiry', { style });
          cardExpiryRef.current.mount(cardExpiryMountRef.current);
        }
        if (!cardCvcRef.current && cardCvcMountRef.current) {
          cardCvcRef.current = elementsRef.current.create('cardCvc', { style });
          cardCvcRef.current.mount(cardCvcMountRef.current);
        }

        if (mounted) setError(null);
      } catch (err: any) {
        if (mounted) setError(err?.message || 'Failed to initialize Stripe');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [publishableKey]);

  useImperativeHandle(ref, () => ({
    async getPaymentData() {
      setError(null);

      if (!stripeRef.current || !cardNumberRef.current) {
        throw new Error('Stripe is not ready. Please try again.');
      }

      if (!cardholderName.trim()) {
        throw new Error('Cardholder name is required');
      }

      const normalizedZip = postalCode.trim();
      if (normalizedZip && !/^\d{5}(-\d{4})?$/.test(normalizedZip)) {
        throw new Error('Please enter a valid ZIP code');
      }

      const result = await stripeRef.current.createPaymentMethod({
        type: 'card',
        card: cardNumberRef.current,
        billing_details: {
          name: cardholderName.trim(),
          address: normalizedZip ? { postal_code: normalizedZip } : undefined,
        },
      });

      if (result.error) {
        throw new Error(result.error.message || 'Stripe failed to create payment method');
      }

      return { payment_method_id: result.paymentMethod.id, postal_code: normalizedZip || undefined };
    },
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm">Cardholder name</Label>
        <Input
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="Jane Doe"
          className="mt-1 bg-background"
        />
      </div>

      <div>
        <Label className="text-sm">Card number</Label>
        <PaymentFieldFrame className="stripe-card-number">
          <div ref={cardNumberMountRef} />
        </PaymentFieldFrame>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm">Expiry</Label>
          <PaymentFieldFrame className="stripe-card-expiry">
            <div ref={cardExpiryMountRef} />
          </PaymentFieldFrame>
        </div>
        <div>
          <Label className="text-sm">CVC</Label>
          <PaymentFieldFrame className="stripe-card-cvc">
            <div ref={cardCvcMountRef} />
          </PaymentFieldFrame>
        </div>
      </div>

      <div>
        <Label className="text-sm">Billing ZIP</Label>
        <Input
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          placeholder="12345"
          className="mt-1 bg-background"
        />
      </div>

      {loading && <p className="text-xs text-muted-foreground">Loading Stripe…</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
});

StripeCardForm.displayName = 'StripeCardForm';
