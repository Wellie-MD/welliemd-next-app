import axiosInstance from "@/api/axiosInstance";
import { TREATMENT_ASSIGNMENT_ENDPOINTS } from "@/api/endpoints";

export type AssignmentSourceKind = "program" | "custom_program";

export interface AssignmentDependencyNode {
  kind: string;
  source_id: string;
  name: string;
  status: string;
  code: string;
  message: string;
  facts: Record<string, unknown>;
}

export interface AssignmentImpact {
  added: AssignmentDependencyNode[];
  removed: AssignmentDependencyNode[];
  changed: Array<{
    before: AssignmentDependencyNode;
    after: AssignmentDependencyNode;
  }>;
  update_available: boolean;
  confirmation_required: boolean;
  severity: "standard" | "high";
  reasons: string[];
  existing_snapshot_policy: string;
  active_sessions_mutated: boolean;
  existing_orders_mutated: boolean;
}

export interface AssignmentPreflight {
  success: boolean;
  source_kind: AssignmentSourceKind;
  source_id: string;
  source_name: string;
  source_version: string;
  source_checksum: string;
  source_release: {
    id: string;
    version: number;
    checksum: string;
  };
  client_id: string;
  client_name: string;
  status: string;
  runtime_ready: boolean;
  counts: Record<string, number>;
  nodes: AssignmentDependencyNode[];
  blockers: AssignmentDependencyNode[];
  external_pending: AssignmentDependencyNode[];
  update_available: boolean;
  previous_source_checksum: string;
  impact: AssignmentImpact;
}

export interface AssignmentStep {
  key: string;
  sequence: number;
  status: string;
  attempt_count: number;
  error_code: string;
  error_detail: string;
  dependencies: Record<string, unknown>;
  result: Record<string, unknown>;
  updated_at: string;
}

export interface AssignmentOperation {
  id: string;
  source_kind: AssignmentSourceKind;
  source_id: string;
  source_name: string;
  source_version: string;
  source_checksum: string;
  source_release: {
    id: string | null;
    version: number | null;
    checksum: string;
  };
  client_id: string;
  client_name: string;
  status: string;
  runtime_state: string;
  correlation_id: string;
  current_step: string;
  attempt_count: number;
  last_error_code: string;
  last_error_detail: string;
  cancel_requested: boolean;
  preflight: AssignmentPreflight;
  result: Record<string, unknown>;
  impact: AssignmentImpact;
  created_at: string;
  updated_at: string;
  steps: AssignmentStep[];
}

export const treatmentAssignmentApi = {
  preflight: async (
    sourceKind: AssignmentSourceKind,
    sourceId: string,
    clientId: string
  ): Promise<AssignmentPreflight> => {
    const { data } = await axiosInstance.post(
      TREATMENT_ASSIGNMENT_ENDPOINTS.preflight,
      {
        source_kind: sourceKind,
        source_id: sourceId,
        client_id: clientId,
      }
    );
    return data;
  },

  createOperation: async (
    preflight: AssignmentPreflight
  ): Promise<AssignmentOperation> => {
    const { data } = await axiosInstance.post(
      TREATMENT_ASSIGNMENT_ENDPOINTS.operations,
      {
        source_kind: preflight.source_kind,
        source_id: preflight.source_id,
        client_id: preflight.client_id,
        source_checksum: preflight.source_checksum,
      }
    );
    return data.operation;
  },

  getOperation: async (operationId: string): Promise<AssignmentOperation> => {
    const { data } = await axiosInstance.get(
      TREATMENT_ASSIGNMENT_ENDPOINTS.operation(operationId)
    );
    return data;
  },

  retryOperation: async (operationId: string): Promise<AssignmentOperation> => {
    const { data } = await axiosInstance.post(
      TREATMENT_ASSIGNMENT_ENDPOINTS.retry(operationId)
    );
    return data.operation;
  },

  cancelOperation: async (operationId: string): Promise<AssignmentOperation> => {
    const { data } = await axiosInstance.post(
      TREATMENT_ASSIGNMENT_ENDPOINTS.cancel(operationId)
    );
    return data.operation;
  },
};
