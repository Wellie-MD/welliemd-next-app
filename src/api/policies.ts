import axiosInstance from "./axiosInstance";

export interface LabPolicyTemplate {
  id: string;
  name: string;
  policy_type: "lab_hipaa_authorization" | "lab_telehealth_consent";
  content: string;
  placeholders: string[];
  version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tenant_sync?: Array<{
    success: boolean;
    client_id?: string;
    client_name?: string;
    policy_type?: string;
    sync_url?: string;
    status_code?: number;
    error?: string;
    reason?: string;
    payload?: unknown;
  }>;
  tenant_sync_summary?: {
    total: number;
    success: number;
    failed: number;
    all_success: boolean;
  };
}

export const policyApi = {
  getLabPolicies: async (): Promise<LabPolicyTemplate[]> => {
    const { data } = await axiosInstance.get<LabPolicyTemplate[]>("admin/lab-policy-templates/");
    return data;
  },

  updateLabPolicy: async (
    id: string,
    payload: Pick<LabPolicyTemplate, "name" | "content" | "version" | "is_active">
  ): Promise<LabPolicyTemplate> => {
    const { data } = await axiosInstance.patch<LabPolicyTemplate>(`admin/lab-policy-templates/${id}/`, payload);
    return data;
  },
};
