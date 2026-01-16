/**
 * Payment Transactions API
 *
 * Fetches payment transactions from the backend with pagination and filtering.
 */

import axiosInstance from './axiosInstance';

export interface PaymentTransaction {
    id: string;
    user_id: string;
    payment_method: string | null;
    payment_method_details: {
        masked_card_number: string;
        card_brand: string;
    } | null;
    processor: 'nmi' | 'authorizenet' | 'stripe';
    nmi_transaction_id: string;
    authnet_transaction_id: string;
    amount: string;
    currency: string;
    status: 'pending' | 'authorized' | 'captured' | 'approved' | 'declined' | 'error' | 'voided' | 'refunded';
    auth_code: string;
    response_text: string;
    created_at: string;
    updated_at: string;
    processor_transaction_id: string;
}

export interface TransactionListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: PaymentTransaction[];
}

export interface TransactionListParams {
    page?: number;
    page_size?: number;
    status?: string;
    processor?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
}

export interface ClientPaymentHistory {
    date: string;
    patient_id: string;
    patient_name: string;
    order_number: string;
    total_amount: string;
    discount: string;
    amount_paid: string;
    payment_status: string;
}

export interface ClientPaymentHistoryResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: ClientPaymentHistory[];
}

/**
 * Fetch payment transactions with pagination and filtering
 */
export async function fetchTransactions(params: TransactionListParams = {}): Promise<TransactionListResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params.status && params.status !== 'All') queryParams.append('status', params.status.toLowerCase());
    if (params.processor && params.processor !== 'All') queryParams.append('processor', params.processor.toLowerCase());
    if (params.date_from) queryParams.append('date_from', params.date_from);
    if (params.date_to) queryParams.append('date_to', params.date_to);
    if (params.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = `/payments/transactions/${queryString ? `?${queryString}` : ''}`;

    const response = await axiosInstance.get<TransactionListResponse>(url);
    return response.data;
}

/**
 * Fetch client payment history
 */
export async function fetchClientPaymentHistory(): Promise<ClientPaymentHistoryResponse> {
    const response = await axiosInstance.get<ClientPaymentHistoryResponse>('/client/payment_history/');
    return response.data;
}

export default {
    fetchTransactions,
    fetchClientPaymentHistory,
};
