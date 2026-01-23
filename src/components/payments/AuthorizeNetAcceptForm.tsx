import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface AuthorizeNetAcceptFormHandle {
  getPaymentData: () => Promise<{
    opaqueDataDescriptor: string;
    opaqueDataValue: string;
    postal_code?: string;
  }>;
}

interface AuthorizeNetAcceptFormProps {
  clientKey?: string;
  apiLoginId?: string;
  scriptUrl?: string;
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

const parseExpiry = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length >= 4) {
    return { month: digits.slice(0, 2), year: digits.slice(2, 4) };
  }
  if (digits.length >= 2) {
    return { month: digits.slice(0, 2), year: digits.slice(2) };
  }
  return { month: '', year: '' };
};

const formatCardNumber = (value: string) => {
  const digits = value.replace(/\D/g, '');
  const groups = digits.match(/.{1,4}/g) || [];
  return groups.join(' ').slice(0, 19);
};

const formatExpiry = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length >= 2) {
    return digits.slice(0, 2) + (digits.length > 2 ? '/' + digits.slice(2, 4) : '');
  }
  return digits;
};

export const AuthorizeNetAcceptForm = forwardRef<AuthorizeNetAcceptFormHandle, AuthorizeNetAcceptFormProps>(({ clientKey, apiLoginId, scriptUrl }, ref) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [postalCode, setPostalCode] = useState('');

  useEffect(() => {
    let mounted = true;
    async function init() {
      setLoading(true);
      setError(null);
      try {
        if (!clientKey || !apiLoginId) {
          throw new Error('Authorize.Net client key or API login ID is missing');
        }
        if (!scriptUrl) {
          throw new Error('Authorize.Net script URL is missing');
        }
        await loadScript(scriptUrl);
      } catch (err: any) {
        if (mounted) setError(err?.message || 'Failed to load Authorize.Net');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [clientKey, apiLoginId, scriptUrl]);

  useImperativeHandle(ref, () => ({
    async getPaymentData() {
      setError(null);

      if (!cardholderName.trim()) throw new Error('Cardholder name is required');

      const normalizedZip = postalCode.trim().replace(/\D/g, '');
      if (!normalizedZip) throw new Error('Billing ZIP code is required');
      if (!/^\d{5}(\d{4})?$/.test(normalizedZip)) throw new Error('Please enter a valid ZIP code');

      const parsed = parseExpiry(expiry);
      const cleanCardNumber = cardNumber.replace(/\D/g, '');
      const cleanCvc = cvc.replace(/\D/g, '');

      if (!cleanCardNumber) throw new Error('Card number is required');
      if (!parsed.month || !parsed.year) throw new Error('Expiration date is required');
      if (!cleanCvc) throw new Error('CVC is required');

      const Accept = (window as any).Accept;
      if (!Accept || typeof Accept.dispatchData !== 'function') {
        throw new Error('Authorize.Net script not ready');
      }

      return await new Promise<{ opaqueDataDescriptor: string; opaqueDataValue: string; postal_code?: string }>((resolve, reject) => {
        const secureData = {
          authData: {
            clientKey,
            apiLoginID: apiLoginId,
          },
          cardData: {
            cardNumber: cleanCardNumber,
            month: parsed.month,
            year: parsed.year,
            cardCode: cleanCvc,
          },
        };

        Accept.dispatchData(secureData, (response: any) => {
          if (response?.messages?.resultCode === 'Ok') {
            resolve({
              opaqueDataDescriptor: response.opaqueData.dataDescriptor,
              opaqueDataValue: response.opaqueData.dataValue,
              postal_code: normalizedZip,
            });
          } else {
            const message = response?.messages?.message?.[0]?.text || 'Authorize.Net tokenization failed';
            reject(new Error(message));
          }
        });
      });
    },
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm">Cardholder name</Label>
        <Input value={cardholderName} onChange={(e) => setCardholderName(e.target.value)} className="mt-1 bg-background border border-input shadow-sm" />
      </div>

      <div>
        <Label className="text-sm">Card number</Label>
        <Input value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} className="mt-1 bg-background border border-input shadow-sm" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm">Expiry</Label>
          <Input value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} className="mt-1 bg-background border border-input shadow-sm" placeholder="MM/YY" />
        </div>
        <div>
          <Label className="text-sm">CVC</Label>
          <Input value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} className="mt-1 bg-background border border-input shadow-sm" />
        </div>
      </div>

      <div>
        <Label className="text-sm">Billing ZIP</Label>
        <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="mt-1 bg-background border border-input shadow-sm" />
      </div>

      {loading && <p className="text-xs text-muted-foreground">Loading Authorize.Net…</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
});

AuthorizeNetAcceptForm.displayName = 'AuthorizeNetAcceptForm';
