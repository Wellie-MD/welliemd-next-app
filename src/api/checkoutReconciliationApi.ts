import api from "./axiosInstance";

export type CheckoutState =
  | "gateway_processing"
  | "failed_compensating"
  | "reconciliation_required";

export interface CheckoutCompensationSummary {
  total: number;
  pending: number;
  failed: number;
  succeeded: number;
}

export interface CheckoutReconciliationCase {
  id: string;
  reference: string;
  status: string;
  submission_id: string;
  checkout_state: CheckoutState;
  failure_code: string;
  safe_context: Record<string, unknown>;
  age_seconds: number;
  compensation: CheckoutCompensationSummary;
  created_at: string;
  updated_at: string;
}

export interface CheckoutReconciliationFilters {
  checkout_state?: CheckoutState;
  failure_code?: string;
}

type WorklistResponse = CheckoutReconciliationCase[] | { results?: CheckoutReconciliationCase[] };

export interface ResolveCheckoutPayload {
  confirmed_outcome: "authorized" | "failed";
  evidence_reference: string;
  note?: string;
}

export interface ResolveCheckoutResponse {
  status: "resolved";
  checkout_state: string;
  evidence_reference: string;
}

export async function getCheckoutReconciliationWorklist(
  filters: CheckoutReconciliationFilters = {},
): Promise<CheckoutReconciliationCase[]> {
  const { data } = await api.get<WorklistResponse>("/orders/checkout-reconciliation/", { params: filters });
  return Array.isArray(data) ? data : data.results || [];
}

export async function resolveCheckoutReconciliation(
  reference: string,
  payload: ResolveCheckoutPayload,
): Promise<ResolveCheckoutResponse> {
  const { data } = await api.post<ResolveCheckoutResponse>(
    `/orders/checkout-reconciliation/${encodeURIComponent(reference)}/resolve/`,
    payload,
  );
  return data;
}
