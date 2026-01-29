import axiosInstance from "@/api/axiosInstance";

export type Pharmacy = {
  id: string;
  beluga_pharmacy_id?: string;
  store_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  zip_code: string;
  primary_phone?: string;
  primary_fax?: string;
  email?: string;
  website?: string;
  ncpdp_id?: string;
  pharmacy_specialties?: string[];
  service_level?: number;
  latitude?: number | string | null;
  longitude?: number | string | null;
  is_active: boolean;
  service_states?: string[];  // States where pharmacy provides service (empty = all states)
  last_synced_at?: string | null;

  // integration block (unchanged)
  api_vendor?: "life_file" | "lifefile" | "life file" | "dispense_pro" | "vs_digital_health" | "mdtoolbox" | "";
  api_url?: string;
  api_user?: string;
  api_password?: string;
  practice_id?: string;
  vendor_id?: string;
  location_id?: string;
  network_id?: string;
  api_name?: string;

  // NEW: status fields from backend (read-only)
  integration_status?: "pending" | "connected" | "error";
  integration_last_validated_at?: string | null;
  integration_last_error?: string | null;

  created_at?: string;
  updated_at?: string;
};

type Paginated<T> = { results: T[]; count?: number; next?: string | null; previous?: string | null };

const base = "/medical/pharmacies";

export const pharmacyApi = {
  list: async (params?: Record<string, any>) => {
    const { data } = await axiosInstance.get<Paginated<Pharmacy>>(`${base}/`, { params });
    return data.results ?? [];
  },
  retrieve: async (id: string) => {
    const { data } = await axiosInstance.get<Pharmacy>(`${base}/${id}/`);
    return data;
  },
  create: async (payload: Partial<Pharmacy>) => {
    const { data } = await axiosInstance.post<Pharmacy>(`${base}/`, payload);
    return data;
  },
  update: async (id: string, payload: Partial<Pharmacy>) => {
    const { data } = await axiosInstance.patch<Pharmacy>(`${base}/${id}/`, payload);
    return data;
  },
  remove: async (id: string) => {
    await axiosInstance.delete(`${base}/${id}/`);
  },

  // integration-only patch (kept)
  updateIntegration: async (id: string, payload: Partial<Pharmacy>) => {
    const { data } = await axiosInstance.patch(`${base}/${id}/integration/`, payload);
    return data;
  },

  // NEW: test connection action
  testConnection: async (id: string) => {
    const { data } = await axiosInstance.post<{
      connected: boolean;
      integration_status: Pharmacy["integration_status"];
      integration_last_validated_at: string | null;
      details?: { status_code?: number; error?: string | null };
    }>(`${base}/${id}/test_connection/`);
    return data;
  },

  vendors: async () => {
    const { data } = await axiosInstance.get<Array<{ value: string; label: string }>>(`${base}/api-vendors/`);
    return data;
  },

  belugaSearch: async (payload: { city?: string; state?: string; zip?: string; name?: string }) => {
    const { data } = await axiosInstance.post(`${base}/search/`, payload);
    return data?.pharmacies ?? [];
  },

  completeVisit: async (payload: any) => {
    const { data } = await axiosInstance.post(`${base}/complete_visit_with_beluga/`, payload);
    return data;
  },

  // Sync pharmacies to all client databases
  syncToClients: async () => {
    const { data } = await axiosInstance.post<{
      success: boolean;
      total_clients: number;
      successful: number;
      failed: number;
      pharmacies_count: number;
      results: Array<{
        client_id: string;
        client_name: string;
        success: boolean;
        message?: string;
        error?: string;
        created?: number;
        updated?: number;
      }>;
    }>(`${base}/sync-to-clients/`);
    return data;
  },
};
