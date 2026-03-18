/**
 * Orders API service for patient portal.
 * 
 * Provides methods to fetch patient orders from the backend.
 * Uses the /api/v1/patient/orders/ endpoint with automatic patient filtering.
 */

import { apiClient, withRetry } from './client';

/**
 * Order status values matching backend ORDER_STATUS_CHOICES
 */
export type OrderStatus =
    | 'created'
    | 'processing'
    | 'visit_failed'
    | 'visit_pending'
    | 'consult_canceled'
    | 'referred'
    | 'prescribed'
    | 'billing_pending'
    | 'rx_sent'
    | 'shipped'
    | 'canceled';

/**
 * Order data returned from patient orders API
 */
export interface PatientOrder {
    id: string;
    order_id?: string | null;
    display_id: string;
    status: OrderStatus;
    status_display: string;
    product_name: string;
    pharmacy_name: string | null;
    tracking_number: string | null;
    tracking_url: string | null;
    amount: string;
    created_at: string;
    prescribed_at: string | null;
    shipped_at: string | null;
    updated_at: string;
}

/**
 * Paginated response from orders API
 */
export interface PaginatedOrdersResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: PatientOrder[];
}

/**
 * Fetch paginated list of patient orders.
 * Orders are automatically filtered to only show the authenticated patient's orders.
 * 
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of orders per page (default: 20)
 * @param ordering - Field to order by (default: '-created_at')
 */
export async function getOrders(
    page: number = 1,
    pageSize: number = 20,
    ordering: string = '-created_at'
): Promise<PaginatedOrdersResponse> {
    const response = await withRetry(() =>
        apiClient.get<PaginatedOrdersResponse>('/patient/orders/', {
            params: {
                page,
                page_size: pageSize,
                ordering,
            },
        })
    );

    return response.data;
}

/**
 * Fetch a single order by ID.
 * Will return 404 if order doesn't belong to the authenticated patient.
 * 
 * @param orderId - UUID of the order
 */
export async function getOrder(orderId: string): Promise<PatientOrder> {
    const response = await withRetry(() =>
        apiClient.get<PatientOrder>(`/patient/orders/${orderId}/`)
    );

    return response.data;
}

/**
 * Get orders with specific status filter.
 * 
 * @param status - Status to filter by
 * @param page - Page number
 */
export async function getOrdersByStatus(
    status: OrderStatus,
    page: number = 1
): Promise<PaginatedOrdersResponse> {
    const response = await withRetry(() =>
        apiClient.get<PaginatedOrdersResponse>('/patient/orders/', {
            params: {
                status,
                page,
                ordering: '-created_at',
            },
        })
    );

    return response.data;
}

/**
 * Get recently updated orders (for missed notification fallback).
 * Fetches orders updated since the given timestamp.
 * 
 * @param since - ISO timestamp to filter orders updated after
 */
export async function getRecentlyUpdatedOrders(
    since: string
): Promise<PaginatedOrdersResponse> {
    const response = await withRetry(() =>
        apiClient.get<PaginatedOrdersResponse>('/patient/orders/', {
            params: {
                updated_at__gte: since,
                ordering: '-updated_at',
                page_size: 50, // Get more for catch-up
            },
        })
    );

    return response.data;
}
