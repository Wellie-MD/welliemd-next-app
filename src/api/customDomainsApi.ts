import axiosInstance from "./axiosInstance";

export type CustomDomainPortalType = "client" | "patient" | "intake";
export type CustomDomainStatus =
  | "pending_validation"
  | "validating"
  | "verified"
  | "failed"
  | "deleting";

export interface CustomDomainValidationRecord {
  type?: string;
  name?: string;
  value?: string;
}

export interface CustomDomain {
  id: string;
  client: string;
  domain: string;
  portal_type: CustomDomainPortalType;
  portal_type_display?: string;
  status: CustomDomainStatus;
  status_display?: string;
  validation_records: CustomDomainValidationRecord[];
  is_locked: boolean;
  last_error?: { error?: string; step?: string } | null;
  created_at: string;
  updated_at: string;
  verified_at?: string | null;
}

export const customDomainsApi = {
  list: async (): Promise<CustomDomain[]> => {
    const { data } = await axiosInstance.get<CustomDomain[]>("/clients/me/custom-domains/");
    return data;
  },

  create: async (payload: {
    domain: string;
    portal_type: CustomDomainPortalType;
  }): Promise<CustomDomain> => {
    const { data } = await axiosInstance.post<CustomDomain>("/clients/me/custom-domains/", payload);
    return data;
  },

  verify: async (id: string): Promise<CustomDomain> => {
    const { data } = await axiosInstance.post<CustomDomain>(`/clients/me/custom-domains/${id}/verify/`);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/clients/me/custom-domains/${id}/`);
  },
};
