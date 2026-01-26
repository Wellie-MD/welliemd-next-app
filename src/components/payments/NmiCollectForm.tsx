import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaymentFieldFrame } from './PaymentFieldFrame';

export interface NmiCollectFormHandle {
  getPaymentData: () => Promise<{ payment_token: string; postal_code?: string }>;
}

interface NmiCollectFormProps {
  clientKey?: string;
  scriptUrl?: string;
}

function loadCollectScript(src: string, clientKey: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) return resolve();

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.setAttribute('data-tokenization-key', clientKey);
    script.setAttribute('data-variant', 'inline');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

export const NmiCollectForm = forwardRef<NmiCollectFormHandle, NmiCollectFormProps>(({ clientKey, scriptUrl }, ref) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cardholderName, setCardholderName] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const configuredRef = useRef(false);
  const pendingResolveRef = useRef<((token: string) => void) | null>(null);
  const pendingRejectRef = useRef<((err: Error) => void) | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);
      setError(null);

      try {
        if (!clientKey) {
          throw new Error('NMI tokenization key is not configured.');
        }

        const url = scriptUrl || 'https://secure.networkmerchants.com/token/Collect.js';
        await loadCollectScript(url, clientKey);

        if (!(window as any).CollectJS || typeof (window as any).CollectJS.configure !== 'function') {
          throw new Error('Collect.js failed to load');
        }

        if (!document.getElementById('__nmi_hidden_submit')) {
          const hidden = document.createElement('button');
          hidden.id = '__nmi_hidden_submit';
          hidden.style.display = 'none';
          document.body.appendChild(hidden);
        }

        (window as any).CollectJS.configure({
          variant: 'inline',
          paymentSelector: '#__nmi_hidden_submit',
          fields: {
            ccnumber: { selector: '#nmi-ccnumber', title: 'Card Number' },
            ccexp: { selector: '#nmi-ccexp', title: 'Expiration' },
            cvv: { selector: '#nmi-cvv', title: 'CVV' },
          },
          callback: (response: any) => {
            if (pendingResolveRef.current) {
              if (response && response.token) {
                pendingResolveRef.current(response.token);
              } else {
                pendingRejectRef.current?.(new Error('Failed to tokenize card'));
              }
            }
            pendingResolveRef.current = null;
            pendingRejectRef.current = null;
          },
        });

        configuredRef.current = true;
      } catch (err: any) {
        if (mounted) setError(err?.message || 'Failed to initialize NMI');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [clientKey, scriptUrl]);

  useImperativeHandle(ref, () => ({
    async getPaymentData() {
      setError(null);

      if (!configuredRef.current || !(window as any).CollectJS) {
        throw new Error('NMI tokenization is not ready.');
      }

      if (!cardholderName.trim()) {
        throw new Error('Cardholder name is required');
      }

      const normalizedZip = postalCode.trim().replace(/\D/g, '');
      if (!normalizedZip) {
        throw new Error('Billing ZIP code is required');
      }
      if (!/^\d{5}(\d{4})?$/.test(normalizedZip)) {
        throw new Error('Please enter a valid ZIP code');
      }

      return await new Promise<{ payment_token: string; postal_code?: string }>((resolve, reject) => {
        pendingResolveRef.current = (token: string) => resolve({ payment_token: token, postal_code: normalizedZip });
        pendingRejectRef.current = reject;

        try {
          (window as any).CollectJS.startPaymentRequest();
        } catch (err: any) {
          pendingResolveRef.current = null;
          pendingRejectRef.current = null;
          reject(err);
        }
      });
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
          className="mt-1 bg-background border border-input shadow-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">Name as it appears on the card.</p>
      </div>

      <div>
        <Label className="text-sm">Card number</Label>
        <PaymentFieldFrame id="nmi-ccnumber" />
        <p className="mt-1 text-xs text-muted-foreground">Enter the 16-digit card number.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm">Expiry</Label>
          <PaymentFieldFrame id="nmi-ccexp" />
          <p className="mt-1 text-xs text-muted-foreground">MM / YY</p>
        </div>
        <div>
          <Label className="text-sm">CVV</Label>
          <PaymentFieldFrame id="nmi-cvv" />
          <p className="mt-1 text-xs text-muted-foreground">3 or 4 digits.</p>
        </div>
      </div>

      <div>
        <Label className="text-sm">Billing ZIP</Label>
        <Input
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          placeholder="12345"
          className="mt-1 bg-background border border-input shadow-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">Used for address verification.</p>
      </div>

      {loading && <p className="text-xs text-muted-foreground">Loading NMI…</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
});

NmiCollectForm.displayName = 'NmiCollectForm';
