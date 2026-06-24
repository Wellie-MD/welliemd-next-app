import axiosInstance from "./axiosInstance";

type Money = { amount: string; currency?: string } | number | string | null | undefined;

export interface Biomarker {
  id: string;
  name: string;
  /** Backend-derived category from source_snapshot.category/category_name. Fallback: "Biomarkers". */
  category: string;
  code: string;
  slug: string;
  provider_id?: string;
  display_code?: string;
  junction_marker_id?: string;
  lab_id?: string;
  lab_slug?: string;
  lab_name?: string;
  lab_account_ids?: string[];
  /**
   * Raw Junction type field (e.g. "panel", null). Used to filter compound
   * tests out of the biomarker picker. Do NOT use as a clinical category.
   */
  marker_type?: string;
  units?: string;
  reference_range?: string;
  common_tat: string;
  worst_case_tat: string;
  labs?: string[];
  aoe_questions?: Array<{
    question_id: string;
    code: string;
    label: string;
    type: string;
    required: boolean;
    options: Array<{ code: string; value: string }>;
  }>;
  loinc_map?: Array<{
    name: string;
    test_code: string;
    slug: string;
    required: boolean;
    loinc: string;
    loinc_name?: string;
    unit?: string;
  }>;
}

export interface CatalogLab {
  id: string;
  name: string;
  slug: string;
  marker_count: number;
  lab_account_ids: string[];
}

export type JunctionStatus =
  | "draft"
  | "pending_submission"
  | "pending_approval"
  | "active"
  | "inactive"
  | "failed"
  | "Pending"
  | "Active";

export interface LabPanel {
  id: string;
  name: string;
  description: string;
  lab_provider: string;
  biomarkers: Biomarker[];
  fasting_required: "yes" | "no";
  collection_method: "testkit" | "walk_in_test" | "at_home_phlebotomy" | "on_site_collection";
  cost_to_client: number;
  cost_to_welliemd: number;
  patient_price?: number;
  discounted_patient_price?: number | null;
  is_active: boolean;
  junction_status: JunctionStatus;
  junction_external_status?: string;
  junction_rejection_reason?: string;
  service_states: string[];
  junction_price?: number;
  sample_type?: string;
  turnaround_days?: string;
  vital_slug?: string;
  required?: "required" | "optional";
}

export interface ClientAssignment {
  id: string;
  name: string;
  email: string;
  assigned: boolean;
  assigned_at?: string | null;
  assignment_id?: string | null;
  is_current?: boolean;
  junction_lab_test_id?: string;
  junction_status?: string;
  junction_external_status?: string;
  operational_status?: string;
  is_orderable?: boolean;
  linkedLabAccountIds?: string[];
}

export interface LabOrder {
  id: string;
  patient_name: string;
  patient_email: string;
  patient_phone?: string;
  client_name: string;
  product_name: string;
  lab_provider: string;
  price: number;
  status: "Completed" | "In Process" | "Requisition Created" | "Failed";
  payment_status: "Paid" | "Unpaid";
  visit_status: "Lab";
  doctor_name?: string;
  timeline: {
    ordered?: string;
    sample_collected?: string;
    results?: string;
  };
  resultsReady: boolean;
  biomarkers?: Array<{
    biomarker: string;
    result: string;
    units: string;
    reference_range: string;
    flag: "Normal" | "High" | "Low";
  }>;
}

const moneyToNumber = (value: Money): number => {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number.parseFloat(value) || 0;
  return Number.parseFloat(value.amount) || 0;
};

const moneyPayload = (amount: number | undefined | null) => ({
  amount: String(amount ?? 0),
  currency: "USD",
});

const normalizeBiomarker = (raw: any): Biomarker => ({
  id: String(raw.id),
  name: raw.name || "",
  // category from backend (source_snapshot.category/category_name). Fallback: "Biomarkers".
  // Never use marker_type as category — see Phase 1 backend comments.
  category: raw.category || "Biomarkers",
  code: raw.code || raw.slug || String(raw.id),
  slug: raw.slug || raw.code || String(raw.id),
  provider_id: raw.provider_id || "",
  display_code: raw.display_code || raw.provider_id || raw.code || raw.slug || String(raw.id),
  junction_marker_id: raw.junction_marker_id ? String(raw.junction_marker_id) : "",
  lab_id: raw.lab_id ? String(raw.lab_id) : "",
  lab_slug: raw.lab_slug || "",
  lab_name: raw.lab_name || "",
  lab_account_ids: raw.lab_account_ids || [],
  // marker_type is the raw Junction type field ("panel" = compound test to filter out)
  marker_type: raw.marker_type || "",
  units: raw.units || "",
  reference_range: raw.reference_range || "",
  common_tat: raw.common_tat || raw.common_turnaround_time || (raw.common_tat_days != null ? String(raw.common_tat_days) : "") || "Varies",
  worst_case_tat: raw.worst_case_tat || raw.worst_case_turnaround_time || (raw.worst_case_tat_days != null ? String(raw.worst_case_tat_days) : "") || "Varies",
  labs: raw.labs || (raw.lab_id ? [String(raw.lab_id)] : []),
  aoe_questions: Array.isArray(raw.aoe_questions) ? raw.aoe_questions : [],
  loinc_map: Array.isArray(raw.loinc_map) ? raw.loinc_map : [],
});

const normalizePanel = (raw: any): LabPanel => ({
  id: String(raw.id),
  name: raw.name || "",
  description: raw.description || "",
  lab_provider: raw.lab_provider || "",
  biomarkers: (raw.biomarkers || []).map(normalizeBiomarker),
  fasting_required: raw.fasting_required === true || raw.fasting_required === "yes" ? "yes" : "no",
  collection_method: raw.collection_method || "at_home_phlebotomy",
  cost_to_client: moneyToNumber(raw.cost_to_client),
  cost_to_welliemd: moneyToNumber(raw.cost_to_welliemd),
  patient_price: moneyToNumber(raw.patient_price),
  discounted_patient_price: raw.discounted_patient_price ? moneyToNumber(raw.discounted_patient_price) : null,
  is_active: !!raw.is_active,
  junction_status: raw.junction_status || "draft",
  junction_external_status: raw.junction_external_status || "",
  junction_rejection_reason: raw.junction_rejection_reason || "",
  service_states: raw.service_states || [],
  junction_price: moneyToNumber(raw.patient_price),
  sample_type: raw.sample_type || raw.specimen || "",
  turnaround_days: raw.common_turnaround_time || raw.worst_case_turnaround_time || "",
  vital_slug: raw.junction_lab_test_id || "",
  required: "required",
});

const normalizeClientAssignment = (raw: any): ClientAssignment => ({
  id: String(raw.client_id || raw.id),
  name: raw.client_name || raw.name || "",
  email: raw.client_email || raw.email || "",
  assigned: !!raw.assigned,
  assigned_at: raw.assigned_at || null,
  assignment_id: raw.assignment_id || null,
  is_current: raw.is_current,
  junction_lab_test_id: raw.junction_lab_test_id || "",
  junction_status: raw.junction_status || "",
  junction_external_status: raw.junction_external_status || "",
  operational_status: raw.operational_status || "",
  is_orderable: !!raw.is_orderable,
  linkedLabAccountIds: raw.lab_account_id ? [raw.lab_account_id] : raw.linkedLabAccountIds || [],
});

const normalizeOrder = (raw: any): LabOrder => ({
  id: String(raw.id),
  patient_name: raw.patient_name || "",
  patient_email: raw.patient_email || "",
  client_name: raw.client_name || "",
  product_name: raw.lab_panel_name || raw.product_name || "",
  lab_provider: raw.lab_provider || "",
  price: moneyToNumber(raw.total_paid || raw.price),
  status:
    raw.order_status === "completed" || raw.results_status === "final"
      ? "Completed"
      : raw.order_status === "failed"
        ? "Failed"
        : raw.order_status === "requisition_created"
          ? "Requisition Created"
          : "In Process",
  payment_status: raw.payment_status === "paid" || raw.payment_status === "succeeded" ? "Paid" : "Unpaid",
  visit_status: "Lab",
  timeline: { ordered: raw.created_at },
  resultsReady: raw.results_status === "final" || raw.results_status === "partial",
});

export const labsApi = {
  getBiomarkers: async (): Promise<Biomarker[]> => {
    const { data } = await axiosInstance.get("admin/labs/biomarkers/");
    return (data.results || data || []).map(normalizeBiomarker);
  },

  getCatalogLabs: async (): Promise<CatalogLab[]> => {
    const { data } = await axiosInstance.get("admin/labs/catalog/labs/");
    return (data.results || data || []).map((raw: any) => ({
      id: String(raw.id),
      name: raw.name || `Lab ${raw.id}`,
      slug: raw.slug || "",
      marker_count: raw.marker_count || 0,
      lab_account_ids: raw.lab_account_ids || [],
    }));
  },

  getLabPanels: async (): Promise<LabPanel[]> => {
    const { data } = await axiosInstance.get("admin/labs/panels/");
    return (data.results || data || []).map(normalizePanel);
  },

  createLabPanel: async (
    payload: Omit<LabPanel, "id" | "junction_status" | "junction_price">
  ): Promise<LabPanel> => {
    const { data } = await axiosInstance.post("admin/labs/panels/", {
      name: payload.name,
      description: payload.description,
      lab_provider: payload.lab_provider,
      fasting_required: payload.fasting_required === "yes",
      collection_method: payload.collection_method,
      cost_to_client: moneyPayload(payload.cost_to_client),
      cost_to_welliemd: moneyPayload(payload.cost_to_welliemd),
      patient_price: moneyPayload(payload.patient_price ?? payload.cost_to_client),
      discounted_patient_price: payload.discounted_patient_price
        ? moneyPayload(payload.discounted_patient_price)
        : null,
      is_active: payload.is_active,
      service_states: payload.service_states,
      biomarker_ids: payload.biomarkers.map(biomarker => biomarker.id),
    });
    return normalizePanel(data);
  },

  updateLabPanel: async (id: string, payload: Partial<LabPanel>): Promise<LabPanel> => {
    const { data } = await axiosInstance.patch(`admin/labs/panels/${id}/`, {
      description: payload.description,
      cost_to_client:
        payload.cost_to_client === undefined ? undefined : moneyPayload(payload.cost_to_client),
      cost_to_welliemd:
        payload.cost_to_welliemd === undefined ? undefined : moneyPayload(payload.cost_to_welliemd),
      patient_price:
        payload.patient_price === undefined ? undefined : moneyPayload(payload.patient_price),
      discounted_patient_price:
        payload.discounted_patient_price === undefined
          ? undefined
          : payload.discounted_patient_price === null
            ? null
            : moneyPayload(payload.discounted_patient_price),
      is_active: payload.is_active,
      service_states: payload.service_states,
    });
    return normalizePanel(data);
  },

  checkLabPanelJunctionStatus: async (id: string): Promise<LabPanel> => {
    const { data } = await axiosInstance.post(`admin/labs/panels/${id}/check-junction-status/`);
    return normalizePanel(data.panel || data);
  },

  getClientsForLabAssignment: async (labId: string): Promise<ClientAssignment[]> => {
    const { data } = await axiosInstance.get(`admin/labs/panels/${labId}/clients/`);
    return (data.results || data || []).map(normalizeClientAssignment);
  },

  assignLabPanelToClients: async (
    labId: string,
    clientIds: string[]
  ): Promise<{ success: boolean; assigned_count?: number }> => {
    const { data } = await axiosInstance.post(`admin/labs/panels/${labId}/clients/`, {
      client_ids: clientIds,
    });
    return data;
  },

  submitAssignmentToJunction: async (assignmentId: string) => {
    const { data } = await axiosInstance.post(
      `admin/labs/assignments/${assignmentId}/submit-to-junction/`
    );
    return data;
  },

  checkAssignmentJunctionStatus: async (assignmentId: string) => {
    const { data } = await axiosInstance.post(
      `admin/labs/assignments/${assignmentId}/check-junction-status/`
    );
    return data;
  },

  replaceAssignmentSubmission: async (assignmentId: string, supportNotes = "") => {
    const { data } = await axiosInstance.post(
      `admin/labs/assignments/${assignmentId}/replace-submission/`,
      { support_notes: supportNotes }
    );
    return data;
  },

  archiveLabPanel: async (id: string): Promise<{ success: boolean; archived: boolean }> => {
    const { data } = await axiosInstance.delete(`admin/labs/panels/${id}/`);
    return data;
  },

  // ---------------------------------------------------------------------------
  // Combined panel API methods
  // ---------------------------------------------------------------------------

  getCombinedPanels: async () => {
    const { data } = await axiosInstance.get("admin/labs/combined-panels/");
    return (data.results || data || []) as import("@/features/labs/types").CombinedLabPanel[];
  },

  createCombinedPanel: async (payload: {
    name: string;
    description?: string;
    member_panel_ids: string[];
    cost_to_client?: { amount: string; currency: string };
    cost_to_welliemd?: { amount: string; currency: string };
    patient_price?: { amount: string; currency: string };
    service_states?: string[];
  }) => {
    const { data } = await axiosInstance.post("admin/labs/combined-panels/", payload);
    return data as import("@/features/labs/types").CombinedLabPanel;
  },

  updateCombinedPanel: async (
    id: string,
    payload: Partial<{
      name: string;
      description: string;
      is_active: boolean;
      service_states: string[];
      patient_price: { amount: string; currency: string };
      cost_to_client: { amount: string; currency: string };
      cost_to_welliemd: { amount: string; currency: string };
    }>
  ) => {
    const { data } = await axiosInstance.patch(`admin/labs/combined-panels/${id}/`, payload);
    return data as import("@/features/labs/types").CombinedLabPanel;
  },

  archiveCombinedPanel: async (id: string): Promise<{ success: boolean; archived: boolean }> => {
    const { data } = await axiosInstance.delete(`admin/labs/combined-panels/${id}/`);
    return data;
  },

  validateCombinedMembers: async (panelIds: string[]): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> => {
    const { data } = await axiosInstance.post("admin/labs/combined-panels/validate/", {
      member_panel_ids: panelIds,
    });
    return data;
  },

  getCombinedPanelClients: async (combinedId: string) => {
    const { data } = await axiosInstance.get(`admin/labs/combined-panels/${combinedId}/clients/`);
    return (data.results || data || []) as Array<{
      client_id: string;
      client_name: string;
      client_email: string | null;
      assigned: boolean;
      derived_status: string;
      orderable_count: number;
      member_count: number;
      methods: Array<{
        assignment_id: string;
        collection_method: string;
        junction_status: string;
        junction_lab_test_id: string;
        is_orderable: boolean;
      }>;
    }>;
  },

  assignCombinedPanelToClients: async (
    combinedId: string,
    clientIds: string[]
  ): Promise<{ success: boolean; assigned_client_count: number }> => {
    const { data } = await axiosInstance.post(`admin/labs/combined-panels/${combinedId}/clients/`, {
      client_ids: clientIds,
    });
    return data;
  },

  getAdminLabOrders: async (): Promise<LabOrder[]> => {
    const { data } = await axiosInstance.get("admin/labs/orders/");
    return (data.results || data || []).map(normalizeOrder);
  },

  getAdminLabOrderResults: async (orderId: string) => {
    const { data } = await axiosInstance.get(`admin/labs/orders/${orderId}/results/`);
    return data;
  },

  downloadAdminLabResultPdf: async (orderId: string): Promise<Blob> => {
    const { data } = await axiosInstance.get(`admin/labs/orders/${orderId}/result-pdf/`, {
      responseType: "blob",
    });
    return data;
  },

  getJunctionLabOrderResultsPdf: async (orderId: string): Promise<string> => {
    const blob = await labsApi.downloadAdminLabResultPdf(orderId);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },
};
