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
  // Mirrors PHARMACY_API_CHOICES in apps/integrations/constants.py. The
  // options themselves are fetched from /api-vendors/ at runtime; this
  // union exists so a typo in code is caught at build time. Blank means a
  // passive pharmacy -- prescriptions are relayed, not submitted directly.
  api_vendor?: "life_file" | "dispense_pro" | "drx" | "";
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

export type BelugaPharmacy = {
  PharmacyId: number;
  StoreName: string;
  Address1: string;
  Address2?: string | null;
  City: string;
  State: string;
  ZipCode: string;
  PrimaryPhone?: string | null;
  PrimaryPhoneType?: number | null;
  PrimaryFax?: string | null;
  PhoneAdditional1?: string | null;
  PhoneAdditionalType1?: number | null;
  PhoneAdditional2?: string | null;
  PhoneAdditionalType2?: number | null;
  PhoneAdditional3?: string | null;
  PhoneAdditionalType3?: number | null;
  PharmacySpecialties?: string[];
  ServiceLevel?: number | null;
  Latitude?: number | null;
  Longitude?: number | null;
};

export type PharmacySearchPayload = {
  city?: string;
  state?: string;
  zip?: string;
  name?: string;
};

export type TestConnectionResult = {
  connected: boolean;
  /** The vendor's liveness value on success (DRX returns a pulse); null otherwise. */
  pulse: number | null;
  /** Human-readable outcome: the pulse, or why the probe did not succeed. */
  detail: string;
};

type Paginated<T> = { results: T[]; count?: number; next?: string | null; previous?: string | null };

const base = "/medical/pharmacies";

export const pharmacyApi = {
  list: async (params?: Record<string, unknown>) => {
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

  // Probes the pharmacy's vendor API through the backend's vendor seam.
  // A failed connection still comes back as HTTP 200 with connected:false
  // and a reason -- only auth, throttling and an unknown pharmacy are
  // non-200. Credentials never appear in the response.
  testConnection: async (id: string) => {
    const { data } = await axiosInstance.post<TestConnectionResult>(
      `${base}/${id}/test_connection/`
    );
    return data;
  },

  vendors: async () => {
    const { data } = await axiosInstance.get<Array<{ value: string; label: string }>>(`${base}/api-vendors/`);
    return data;
  },

  belugaSearch: async (payload: PharmacySearchPayload) => {
    const { data } = await axiosInstance.post(`${base}/search/`, payload);
    return data?.pharmacies ?? [];
  },

  belugaLookup: async (payload: PharmacySearchPayload) => {
    const { data } = await axiosInstance.post<{ success: boolean; pharmacies: BelugaPharmacy[] }>(
      `${base}/beluga-lookup/`,
      payload
    );
    return data?.pharmacies ?? [];
  },

  completeVisit: async (payload: unknown) => {
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
