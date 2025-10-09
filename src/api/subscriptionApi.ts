import axiosInstance from './axiosInstance';

export interface StripePrice {
  id: string;
  product_id: string;
  currency: string;
  unit_amount: number;
  recurring: {
    interval: string;
    [key: string]: unknown;
  };
  active: boolean;
  metadata: object;
  created: number;
}

export const subscriptionApi = {
  getPrices: async (): Promise<StripePrice[]> => {
    const response = await axiosInstance.get('/stripe/admin/prices/');
    return response.data;
  },
  create: async (payload: { client_id: string; price_id: string; payment_method_id: string }): Promise<{ id: string; name: string; stripe_subscription_id: string }> => {
    const response = await axiosInstance.post('/stripe/admin/subscriptions/', payload);
    return response.data;
  },
  cancel: async (clientId: string): Promise<void> => {
    await axiosInstance.delete(`/stripe/admin/subscriptions/${clientId}/`);
  },
};
