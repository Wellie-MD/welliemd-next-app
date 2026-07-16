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
    | 'payment_pending'
    | 'payment_authorized'
    | 'payment_captured'
    | 'payment_failed'
    | 'partial'
    | 'processing'
    | 'visit_failed'
    | 'visit_pending'
    | 'visit_scheduled'
    | 'visit_rescheduled'
    | 'consult_scheduled'
    | 'consult_rescheduled'
    | 'consult_canceled'
    | 'no_show'
    | 'referred'
    | 'prescribed'
    | 'billing_pending'
    | 'rx_sent'
    | 'shipped'
    | 'in_transit'
    | 'out_for_delivery'
    | 'delivered'
    | 'delivery_failed'
    | 'declined'
    | 'completed'
    | 'refunded'
    | 'canceled'
    | 'cancelled'
    | 'failed';

export interface OrderActivityEvent {
    id: string;
    event_type: string;
    status: string;
    title: string;
    description: string;
    source: string;
    occurred_at: string;
    payload?: Record<string, unknown>;
}

export interface PatientOrderLineItem {
    id: string;
    product_id?: number | null;
    product_name?: string | null;
    item_type?: string;
    quantity?: string | number;
    unit_patient_price?: string | number;
    unit_shipping_fee?: string | number;
    line_total?: string | number;
    prescription_status?: string;
    fulfilment_status?: string;
    shipment_status?: string;
    refund_status?: string;
    duration_days?: number | null;
    tracking_number?: string | null;
    tracking_url?: string | null;
    shipment_provider?: string | null;
    prescribed_at?: string | null;
    fulfilled_at?: string | null;
    shipped_at?: string | null;
    cancelled_at?: string | null;
    refunded_amount?: string | number;
    created_at?: string;
    updated_at?: string;
}

export interface PatientTreatmentCaseSummary {
    id: string;
    treatment_type_id?: string;
    treatment_type_key?: string | null;
    status?: string;
    lifecycle_status?: string;
    visit_id?: string | null;
    visit_status?: string | null;
    beluga_dispatch_status?: string | null;
    treatment_total?: string;
    reimbursement_total?: string;
}

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
    product_image?: string | null;
    pharmacy_name: string | null;
    tracking_number: string | null;
    tracking_url: string | null;
    amount: string;
    chargeable_amount?: string;
    chargeable_amount_source?: 'requested_medicine' | 'prescribed_medicine' | 'requested_medicine_fallback';
    payment_status?: string | null;
    payment_status_display?: string | null;
    requested_medicine_name?: string | null;
    prescribed_medicine_name?: string | null;
    doctor_name?: string | null;
    checkout_url?: string | null;
    booking_scheduled_at?: string | null;
    booking_location?: string | null;
    created_at: string;
    prescribed_at: string | null;
    shipped_at: string | null;
    updated_at: string;
    activity_events?: OrderActivityEvent[];
    line_items?: PatientOrderLineItem[];
    treatment_case_summary?: PatientTreatmentCaseSummary | null;
    combined_payment_summary?: {
        id?: string;
        status?: string;
        currency?: string;
        authorized_amount?: string;
        captured_amount?: string;
        refunded_amount?: string;
        allocation_total?: string;
        allocation?: {
            id: string;
            status?: string;
            allocated_amount?: string;
            captured_amount?: string;
            refunded_amount?: string;
        };
        allocations?: Array<{
            id: string;
            order_id: string;
            treatment_case_id: string;
            status?: string;
            allocated_amount?: string;
            captured_amount?: string;
            refunded_amount?: string;
        }>;
    } | null;
    combined_submission_summary?: {
        id: string;
        status?: string;
        release_version?: number | null;
        runtime_session_id?: string;
        pricing_snapshot?: Record<string, unknown>;
        checkout_total?: Record<string, unknown>;
        combined_payment?: {
            id: string;
            status?: string;
            currency?: string;
            authorized_amount?: string;
            captured_amount?: string;
            refunded_amount?: string;
        } | null;
        orders?: Array<{
            order_id?: string;
            order_display_id?: string | null;
            treatment_case_id: string;
            treatment_type_id?: string;
            treatment_type_key?: string | null;
            status?: string;
            beluga_dispatch_status?: string | null;
            treatment_total?: string;
            payment_allocation?: {
                id: string;
                status?: string;
                allocated_amount?: string;
                captured_amount?: string;
                refunded_amount?: string;
            } | null;
        }>;
    } | null;
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
