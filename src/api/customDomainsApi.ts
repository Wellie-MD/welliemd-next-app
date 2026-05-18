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
  amplify_domain_name?: string;
  amplify_prefix?: string;
  route53_zone_id?: string;
  dns_provisioning_mode?: "auto" | "manual_required";
  dns_status?: "pending" | "applied" | "failed";
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

  setupPortals: async (payload: { domain: string }): Promise<CustomDomain[]> => {
    const { data } = await axiosInstance.post<CustomDomain[]>(
      "/clients/me/custom-domains/setup-portals/",
      payload
    );
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
