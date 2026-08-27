import { apiClient } from "./client";

export type PatientCheckoutRecoveryState =
  | "gateway_processing"
  | "failed_compensating"
  | "reconciliation_required";

export interface PatientCheckoutRecoveryItem {
  submission_id: string;
  checkout_state: PatientCheckoutRecoveryState;
  needs_attention: boolean;
  message: string;
  support_reference: string | null;
  updated_at: string;
}

interface PatientCheckoutRecoveryResponse {
  results?: PatientCheckoutRecoveryItem[];
}

export async function getPatientCheckoutRecovery(): Promise<PatientCheckoutRecoveryItem[]> {
  const { data } = await apiClient.get<PatientCheckoutRecoveryResponse>("/patient/checkout-recovery/");
  return data.results || [];
}
