import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { subscriptionApi, StripePrice } from '@/api/subscriptionApi';
import { Client } from '@/api/clientApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, CreditCard, Lock } from 'lucide-react';
import { toast } from 'sonner';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51234567890abcdefghijklmnopqrstuvwxyz1234567890abcdef');

interface CreateSubscriptionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

const SubscriptionForm: React.FC<{
  client: Client;
  onOpenChange: (open: boolean) => void;
  prices?: StripePrice[];
  pricesLoading?: boolean;
}> = ({ client, onOpenChange, prices, pricesLoading }) => {
  const stripe = useStripe();
  const elements = useElements();
  const queryClient = useQueryClient();

  // Initialize form data with client name if available
  const [formData, setFormData] = useState({
    clientName: client?.name || '',
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvc: '',
  });

  // Update form data when client changes
  useEffect(() => {
    if (client?.name) {
      setFormData(prev => ({
        ...prev,
        clientName: client.name
      }));
    }
  }, [client?.name]);

  // Resolve base + metered monthly prices
  const monthlyPrices = prices?.filter(
    (price) => price.recurring?.interval === 'month' && price.active
  ) || [];
  const basePrice = monthlyPrices.find(
    (price) => price.recurring?.usage_type !== 'metered'
  );
  const meteredPrice = monthlyPrices.find(
    (price) => price.recurring?.usage_type === 'metered'
  );

  const mutation = useMutation({
    mutationFn: async (payload: { client_id: string; price_id: string; payment_method_id: string }) => {
      return subscriptionApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Subscription created successfully!');
      onOpenChange(false);
      setFormData({
        clientName: '',
        cardholderName: '',
        cardNumber: '',
        expiryDate: '',
        cvc: '',
      });
    },
    onError: (error: unknown) => {
      console.error('Subscription creation error:', error);
      const axiosError = error as any;
      const message = axiosError?.response?.data?.detail || axiosError?.message || 'An error occurred';
      toast.error(`Failed to create subscription: ${message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Form submitted, checking Stripe...');
    console.log('Stripe loaded:', !!stripe);
    console.log('Elements loaded:', !!elements);
    console.log('Cardholder name:', formData.cardholderName);
    console.log('Base price:', basePrice);
    console.log('Metered price:', meteredPrice);

    // Check if Stripe is properly loaded
    if (!stripe) {
      console.error('Stripe not loaded. Publishable key:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      toast.error('Payment system not loaded. Please refresh and try again.');
      return;
    }

    if (!elements) {
      console.error('Stripe Elements not loaded');
      toast.error('Payment form not loaded. Please refresh and try again.');
      return;
    }

    if (!formData.cardholderName.trim()) {
      toast.error('Please enter cardholder name');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      console.error('CardElement not found');
      toast.error('Payment form not ready. Please refresh and try again.');
      return;
    }

    console.log('Creating payment method...');

    // Create payment method with card element
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: formData.cardholderName,
      },
    });

    if (error) {
      console.error('Stripe error:', error);
      toast.error(`Card error: ${error.message}`);
      return;
    }

    if (!basePrice) {
      toast.error('No base monthly plan available');
      return;
    }

    const payload = {
      client_id: client.id,
      payment_method_id: paymentMethod.id,
      ...(meteredPrice
        ? { base_price_id: basePrice.id, metered_price_id: meteredPrice.id }
        : { price_id: basePrice.id }),
    };

    mutation.mutate(payload);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <>
      {/* Header - Compact */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">Create Subscription</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Add payment details for client</p>
        </div>
        <button
          onClick={() => onOpenChange(false)}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Plan Details - Dynamic Pricing */}
        {pricesLoading ? (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          </div>
        ) : basePrice ? (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="font-medium text-gray-800 dark:text-white text-sm truncate">
                  Subscription Plan Summary
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Base plan + metered usage (if configured)
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Base Monthly Fee
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Price: {basePrice.id}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    ${Number(basePrice.unit_amount || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">/month</p>
                </div>
              </div>

              {meteredPrice ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Metered Usage (Per Active Patient)
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Price: {meteredPrice.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      ${Number(meteredPrice.unit_amount || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">/patient</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-gray-300 dark:border-gray-700 px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                  No metered usage price found. This subscription will be base-only.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
            <p className="text-sm text-red-600 dark:text-red-400">No active monthly plan found</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Client Details - Read Only */}
          <div>
            <Label htmlFor="client-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Client Name
            </Label>
            <Input
              id="client-name"
              value={formData.clientName}
              readOnly
              disabled
              className="bg-gray-100 dark:bg-gray-600 border-gray-200 dark:border-gray-500 text-gray-600 dark:text-gray-400 text-sm cursor-not-allowed"
            />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-600 pt-2"></div>

          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Payment Information</h3>

          {/* Cardholder Name */}
          <div>
            <Label htmlFor="cardholder-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cardholder Name
            </Label>
            <Input
              id="cardholder-name"
              value={formData.cardholderName}
              onChange={(e) => handleInputChange('cardholderName', e.target.value)}
              placeholder="Enter cardholder name"
              className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary text-sm"
            />
          </div>

          {/* Card Information - Using Stripe Elements */}
          <div>
            <Label htmlFor="card-element" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Card Information
            </Label>
            <div className="relative">
              <div className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2 pl-10 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                <CardElement
                  options={{
                    hidePostalCode: true,
                    disabled: mutation.isPending,
                    style: {
                      base: {
                        fontSize: '14px',
                        color: '#374151',
                        '::placeholder': {
                          color: '#9CA3AF',
                        },
                      },
                    },
                  }}
                />
              </div>
              <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                <CreditCard className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-2">
            <div className="flex items-center justify-center">
              <Lock className="h-3 w-3 mr-1 text-gray-400" />
              <span>Secured by <b>Stripe</b></span>
            </div>
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-2 sm:space-y-3">
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary text-sm"
            >
              {mutation.isPending ? 'Creating...' : 'Create Subscription'}
            </Button>
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 dark:focus:ring-gray-500 transition-colors text-sm"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export const CreateSubscriptionModal: React.FC<CreateSubscriptionModalProps> = ({
  isOpen,
  onOpenChange,
  client,
}) => {
  const queryClient = useQueryClient();

  // Fetch available prices from Stripe
  const { data: prices, isLoading: pricesLoading } = useQuery({
    queryKey: ['stripe-prices'],
    queryFn: subscriptionApi.getPrices,
    enabled: isOpen, // Only fetch when modal is open
  });

  if (!client) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="fixed inset-0 bg-black/50 transition-opacity duration-300 ease-in-out" onClick={() => onOpenChange(false)}></div>
          <div className="relative z-10 w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-h-[80vh] flex flex-col">
            <Elements stripe={stripePromise}>
              <SubscriptionForm
                client={client}
                onOpenChange={onOpenChange}
                prices={prices}
                pricesLoading={pricesLoading}
              />
            </Elements>
          </div>
        </div>
      )}
    </>
  );
};
