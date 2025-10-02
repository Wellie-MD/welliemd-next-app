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
  pharmacy_specialties?: string[]; // array of tags/strings
  service_level?: number;
  latitude?: number | string | null;
  longitude?: number | string | null;
  is_active: boolean;
  last_synced_at?: string | null;

  // integration block
  api_vendor?: "life_file" | "dispense_pro" | "vs_digital_health" | "mdtoolbox" | "";
  api_url?: string;
  api_user?: string;
  api_password?: string;
  practice_id?: string;
  vendor_id?: string;
  location_id?: string;
  network_id?: string;
  api_name?: string;

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

  // integration-only patch
  updateIntegration: async (id: string, payload: Partial<Pharmacy>) => {
    const { data } = await axiosInstance.patch(`${base}/${id}/integration/`, payload);
    return data;
  },

  // dropdown options for vendors
  vendors: async () => {
    const { data } = await axiosInstance.get<Array<{ value: string; label: string }>>(`${base}/api-vendors/`);
    return data;
  },

  // beluga search proxy
  belugaSearch: async (payload: { city?: string; state?: string; zip?: string; name?: string }) => {
    const { data } = await axiosInstance.post(`${base}/search/`, payload);
    return data?.pharmacies ?? [];
  },

  // complete visit with beluga (if you need it on FE later)
  completeVisit: async (payload: any) => {
    const { data } = await axiosInstance.post(`${base}/complete_visit_with_beluga/`, payload);
    return data;
  },
};
