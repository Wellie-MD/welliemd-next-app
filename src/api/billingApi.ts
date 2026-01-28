// Client Portal B2B Billing API
// Calls tenant proxy APIs that forward to Control Plane

import axiosInstance from './axiosInstance';
import type {
  B2BInvoice,
  B2BInvoiceListResponse,
  SetupIntentResponse,
  B2BPaymentMethodResponse,
} from '../types/b2bBilling';

export const billingApi = {
  /**
   * Get reimbursement invoices (pharmacy/consult costs)
   */
  getReimbursementInvoices: async (params?: Record<string, any>): Promise<B2BInvoiceListResponse> => {
    const { data } = await axiosInstance.get('/billing/invoices/', {
      params: { ...(params || {}), invoice_type: 'reimbursement' }
    });
    return data;
  },

  /**
   * Get SaaS fee invoices (monthly subscription costs)
   */
  getSaaSInvoices: async (params?: Record<string, any>): Promise<B2BInvoiceListResponse> => {
    const { data } = await axiosInstance.get('/billing/invoices/', {
      params: { ...(params || {}), invoice_type: 'saas_fee' }
    });
    return data;
  },

  /**
   * Create a Stripe SetupIntent for updating payment method
   */
  createSetupIntent: async (): Promise<SetupIntentResponse> => {
    const { data } = await axiosInstance.post('/billing/setup-intent/');
    return data;
  },

  /**
   * Get current payment method summary
   */
  getPaymentMethod: async (): Promise<B2BPaymentMethodResponse> => {
    const { data } = await axiosInstance.get('/billing/payment-method/');
    return data;
  },
};
