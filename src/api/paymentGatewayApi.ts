/**
 * Payment Gateway Configuration API Service
 * 
 * API client for managing client payment gateway configuration
 * Backend: welliemd/apps/clients/api/views.py - ClientViewSet.me_payment_config
 */

import axiosInstance from './axiosInstance';
import type { PaymentGatewayConfig, PaymentGatewayConfigResponse } from '@/types/paymentGateway';

const BASE_URL = '/clients/me/payment-config';

export const paymentGatewayApi = {
    /**
     * Get current payment gateway configuration
     */
    getConfig: async (): Promise<PaymentGatewayConfigResponse> => {
        const { data } = await axiosInstance.get(`${BASE_URL}/`);
        return data;
    },

    /**
     * Update payment gateway configuration
     */
    updateConfig: async (config: Partial<PaymentGatewayConfig>): Promise<PaymentGatewayConfigResponse> => {
        const { data } = await axiosInstance.patch(`${BASE_URL}/`, config);
        return data;
    },
};

export default paymentGatewayApi;
