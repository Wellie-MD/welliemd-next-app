// This component is deprecated and replaced by inline form in CreateSubscriptionModal
// Keeping for backward compatibility if used elsewhere

import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useQuery } from '@tanstack/react-query';
import { subscriptionApi, StripePrice } from '@/api/subscriptionApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Lock, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionFormProps {
  clientId: string;
  onSubmit: (payload: { client_id: string; price_id: string; payment_method_id: string }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const SubscriptionForm: React.FC<SubscriptionFormProps> = ({
  clientId,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardholderName, setCardholderName] = useState('');
  const [selectedPriceId, setSelectedPriceId] = useState('');

  const { data: prices, isLoading: pricesLoading, error: pricesError } = useQuery({
    queryKey: ['stripe-prices'],
    queryFn: subscriptionApi.getPrices,
  });

  if (pricesError) {
    return <div className="text-sm text-red-600">Error loading plans: {(pricesError as Error).message}</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      toast.error('Stripe not loaded');
      return;
    }

    if (!selectedPriceId) {
      toast.error('Please select a plan');
      return;
    }

    if (!cardholderName.trim()) {
      toast.error('Please enter cardholder name');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast.error('Card element not found');
      return;
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: cardholderName,
      },
    });

    if (error) {
      console.error('Stripe error:', error);
      toast.error(`Card error: ${error.message}`);
      return;
    }

    const payload = {
      client_id: clientId,
      price_id: selectedPriceId,
      payment_method_id: paymentMethod.id,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Plan Selection */}
      <div>
        <Label htmlFor="plan" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Subscription Plan <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <select
            id="plan"
            value={selectedPriceId}
            onChange={(e) => setSelectedPriceId(e.target.value)}
            disabled={pricesLoading || isLoading}
            className="appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-3"
            style={{ height: '44px' }}
          >
            <option value="">Select a subscription plan</option>
            {prices?.map((price: StripePrice) => (
              <option key={price.id} value={price.id}>
                {price.recurring?.interval === 'month' ? 'Monthly' : 'Yearly'} Plan - ${price.unit_amount.toFixed(2)}/{price.recurring?.interval || 'month'}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="space-y-4">
        <h4 className="text-base font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Payment Information</h4>

        <div>
          <Label htmlFor="cardholder-name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Cardholder Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cardholder-name"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="John Doe"
            disabled={isLoading}
            className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <Label htmlFor="card-element" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Card Information <span className="text-red-500">*</span>
          </Label>
          <div className="bg-white dark:bg-gray-800 p-3 border border-gray-300 dark:border-gray-600 rounded-lg" id="card-element" style={{ minHeight: '44px' }}>
            <CardElement
              options={{
                hidePostalCode: true,
                disabled: isLoading,
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
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
        <Lock className="w-4 h-4 mr-1" />
        Payment details are securely processed by Stripe.
      </div>
    </form>
  );
};
