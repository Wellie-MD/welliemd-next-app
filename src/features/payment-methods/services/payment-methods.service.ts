import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/config/constants';
import type { PaymentConfig, PaymentGateway, PaymentMethod, CreatePaymentMethodPayload } from '../types/payment-methods.types';

const endpointForGateway: Record<PaymentGateway, string> = {
  stripe: API_ENDPOINTS.PAYMENTS.STRIPE_PAYMENT_METHODS,
  nmi: API_ENDPOINTS.PAYMENTS.NMI_PAYMENT_METHODS,
  authorize_net: API_ENDPOINTS.PAYMENTS.AUTHNET_PAYMENT_METHODS,
};

export const PaymentMethodsService = {
  async getPaymentConfig(): Promise<PaymentConfig> {
    const res = await apiClient.get<PaymentConfig>(API_ENDPOINTS.PAYMENTS.CONFIG, { skipAuth: true });
    return res.data;
  },

  async listPaymentMethods(gateway: PaymentGateway): Promise<PaymentMethod[]> {
    const res = await apiClient.get<PaymentMethod[]>(endpointForGateway[gateway]);
    return res.data || [];
  },

  async createPaymentMethod(gateway: PaymentGateway, payload: CreatePaymentMethodPayload): Promise<PaymentMethod> {
    const res = await apiClient.post<PaymentMethod>(endpointForGateway[gateway], payload);
    return res.data;
  },

  async setDefaultPaymentMethod(gateway: PaymentGateway, methodId: string): Promise<PaymentMethod> {
    const res = await apiClient.put<PaymentMethod>(`${endpointForGateway[gateway]}${methodId}/`, {
      is_default: true,
    });
    return res.data;
  },

  async deletePaymentMethod(gateway: PaymentGateway, methodId: string): Promise<void> {
    await apiClient.delete(`${endpointForGateway[gateway]}${methodId}/`);
  },
};
