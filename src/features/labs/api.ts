/**
 * Client Portal Lab Testing API
 *
 * Calls the tenant backend for assigned lab panels, orders, and Junction
 * assignment actions. All data is scoped to the authenticated client/tenant.
 */

import axiosInstance from "@/api/axiosInstance";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface Biomarker {
  id: string;
  name: string;
  category?: string;
  code: string;
  slug: string;
  provider_id?: string;
  display_code?: string;
  junction_marker_id?: string;
  lab_id?: string;
  lab_name?: string;
  units?: string;
  reference_range?: string;
  common_tat?: string;
  worst_case_tat?: string;
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

export type JunctionStatus =
  | "draft"
  | "pending_submission"
  | "pending_approval"
  | "active"
  | "inactive"
  | "failed"
  | "needs_support"
  | "replaced"
  | "archived";

export type OperationalStatus =
  | "draft"
  | "pending_client_configuration"
  | "pending_submission"
  | "pending_approval"
  | "active"
  | "inactive"
  | "replaced"
  | "archived"
  | "failed"
  | "needs_support";

/** Lab panel with assignment-level overlay returned by client endpoints. */
export interface ClientLabPanel {
  /** Assignment UUID (use this for assignment actions, not panel.id) */
  assignment_id: string;
  id: string;
  name: string;
  description: string;
  lab_provider: string;
  biomarkers: Biomarker[];
  fasting_required: "yes" | "no";
  collection_method: "testkit" | "walk_in_test" | "at_home_phlebotomy" | "on_site_collection";
  sample_type?: string;
  turnaround_days?: string;
  common_turnaround_time?: string;
  worst_case_turnaround_time?: string;

  // Pricing (money objects from backend → converted to numbers here)
  cost_to_client: number;
  patient_price: number;
  discounted_patient_price: number | null;

  is_active: boolean;
  is_current: boolean;
  is_orderable: boolean;

  // Junction assignment state
  junction_status: JunctionStatus;
  junction_external_status?: string;
  junction_rejection_reason?: string;
  junction_lab_test_id?: string;
  junction_submitted_at?: string | null;
  junction_last_status_checked_at?: string | null;
  operational_status: OperationalStatus;
  lab_account_id?: string;
  replaced_by?: string | null;

  // Storefront — backend-generated, never synthesized on the frontend
  storefront_url: string;
  storefront_slug: string;
  is_combined?: boolean;
  combined_storefront_slug?: string;
  combined_methods?: Array<{
    assignment_id: string;
    collection_method: ClientLabPanel["collection_method"];
    panel_name: string;
    lab_provider: string;
    junction_status: JunctionStatus;
    operational_status: OperationalStatus;
    junction_lab_test_id?: string;
    is_orderable: boolean;
  }>;

  service_states: string[];
  service_state_options?: string[];
  image_url?: string;
  created_at?: string;
  client_configuration_ready?: boolean;
  submission_ready?: boolean;
  blocking_reason?: string;
}

export interface LabOrderResult {
  id: string;
  biomarker: string;
  result: string;
  units: string;
  reference_range: string;
  flag: string;
}

export interface LabOrder {
  id: string;
  display_id: string;
  patient_name: string;
  patient_email: string;
  lab_panel_name: string;
  lab_provider: string;
  collection_method?: string;
  payment_status: string;
  order_status: string;
  results_status: string;
  total_paid: number;
  created_at: string;
  result_access_allowed?: boolean;
}

export interface LabOrderDetail {
  order: LabOrder;
  lifecycle_events: Array<Record<string, unknown>>;
  result: Record<string, unknown> | null;
  result_access_allowed: boolean;
  result_access_message: string | null;
}

// ---------------------------------------------------------------------------
// Normalizers — convert backend money objects to plain numbers
// ---------------------------------------------------------------------------

const moneyToNumber = (value: unknown): number => {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  if (typeof value === "object" && value !== null && "amount" in value) {
    return parseFloat((value as { amount: string }).amount) || 0;
  }
  return 0;
};

const normalizeBiomarker = (raw: Record<string, unknown>): Biomarker => ({
  id: String(raw.id ?? ""),
  name: String(raw.name ?? ""),
  category: String(raw.category ?? "Biomarkers"),
  code: String(raw.code ?? raw.slug ?? raw.id ?? ""),
  slug: String(raw.slug ?? raw.code ?? raw.id ?? ""),
  provider_id: String(raw.provider_id ?? ""),
  display_code: String(raw.display_code ?? raw.provider_id ?? raw.code ?? raw.id ?? ""),
  junction_marker_id: raw.junction_marker_id ? String(raw.junction_marker_id) : undefined,
  lab_id: raw.lab_id ? String(raw.lab_id) : undefined,
  lab_name: raw.lab_name ? String(raw.lab_name) : undefined,
  units: String(raw.units ?? ""),
  reference_range: String(raw.reference_range ?? ""),
  common_tat: String(raw.common_tat ?? raw.common_tat_days ?? "Varies"),
  worst_case_tat: String(raw.worst_case_tat ?? raw.worst_case_tat_days ?? "Varies"),
  loinc_map: Array.isArray(raw.loinc_map) ? (raw.loinc_map as Biomarker["loinc_map"]) : [],
});

const normalizePanel = (raw: Record<string, unknown>): ClientLabPanel => {
  const fastingRaw = raw.fasting_required;
  const fasting: "yes" | "no" =
    fastingRaw === true || fastingRaw === "yes" ? "yes" : "no";

  const discounted = raw.discounted_patient_price;
  const discountedNum =
    discounted != null && discounted !== "" && moneyToNumber(discounted) > 0
      ? moneyToNumber(discounted)
      : null;

  return {
    assignment_id: String(raw.assignment_id ?? raw.id ?? ""),
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    description: String(raw.description ?? ""),
    lab_provider: String(raw.lab_provider ?? ""),
    biomarkers: Array.isArray(raw.biomarkers)
      ? (raw.biomarkers as Record<string, unknown>[]).map(normalizeBiomarker)
      : [],
    fasting_required: fasting,
    collection_method: (raw.collection_method as ClientLabPanel["collection_method"]) ?? "walk_in_test",
    sample_type: raw.sample_type ? String(raw.sample_type) : undefined,
    common_turnaround_time: raw.common_turnaround_time ? String(raw.common_turnaround_time) : undefined,
    worst_case_turnaround_time: raw.worst_case_turnaround_time
      ? String(raw.worst_case_turnaround_time)
      : undefined,
    turnaround_days:
      raw.common_turnaround_time
        ? String(raw.common_turnaround_time)
        : raw.worst_case_turnaround_time
          ? String(raw.worst_case_turnaround_time)
          : undefined,
    cost_to_client: moneyToNumber(raw.cost_to_client),
    patient_price: moneyToNumber(raw.patient_price),
    discounted_patient_price: discountedNum,
    is_active: Boolean(raw.is_active),
    is_current: raw.is_current !== false,
    is_orderable: Boolean(raw.is_orderable),
    junction_status: (raw.junction_status as JunctionStatus) ?? "draft",
    junction_external_status: raw.junction_external_status
      ? String(raw.junction_external_status)
      : undefined,
    junction_rejection_reason: raw.junction_rejection_reason
      ? String(raw.junction_rejection_reason)
      : undefined,
    junction_lab_test_id: raw.junction_lab_test_id
      ? String(raw.junction_lab_test_id)
      : undefined,
    junction_submitted_at: raw.junction_submitted_at
      ? String(raw.junction_submitted_at)
      : null,
    junction_last_status_checked_at: raw.junction_last_status_checked_at
      ? String(raw.junction_last_status_checked_at)
      : null,
    operational_status: (raw.operational_status as OperationalStatus) ?? "pending_submission",
    lab_account_id: raw.lab_account_id ? String(raw.lab_account_id) : undefined,
    replaced_by: raw.replaced_by ? String(raw.replaced_by) : null,
    storefront_url: String(raw.storefront_url ?? ""),
    storefront_slug: String(raw.storefront_slug ?? ""),
    is_combined: Boolean(raw.is_combined),
    combined_storefront_slug: raw.combined_storefront_slug ? String(raw.combined_storefront_slug) : undefined,
    combined_methods: Array.isArray(raw.combined_methods)
      ? raw.combined_methods as ClientLabPanel["combined_methods"]
      : [],
    service_states: Array.isArray(raw.service_states)
      ? (raw.service_states as string[])
      : [],
    service_state_options: Array.isArray(raw.service_state_options)
      ? (raw.service_state_options as string[])
      : [],
    image_url: raw.image_url ? String(raw.image_url) : undefined,
    created_at: raw.created_at ? String(raw.created_at) : undefined,
    client_configuration_ready: Boolean(raw.client_configuration_ready),
    submission_ready: Boolean(raw.submission_ready),
    blocking_reason: raw.blocking_reason ? String(raw.blocking_reason) : undefined,
  };
};

const normalizeOrder = (raw: Record<string, unknown>): LabOrder => ({
  id: String(raw.id ?? ""),
  display_id: String(raw.display_id ?? raw.id ?? ""),
  patient_name: String(raw.patient_name ?? ""),
  patient_email: String(raw.patient_email ?? ""),
  lab_panel_name: String(raw.lab_panel_name ?? ""),
  lab_provider: String(raw.lab_provider ?? ""),
  collection_method: raw.collection_method ? String(raw.collection_method) : undefined,
  payment_status: String(raw.payment_status ?? ""),
  order_status: String(raw.order_status ?? ""),
  results_status: String(raw.results_status ?? ""),
  total_paid: moneyToNumber(raw.total_paid),
  created_at: String(raw.created_at ?? ""),
  result_access_allowed: Boolean(raw.result_access_allowed),
});

// ---------------------------------------------------------------------------
// API surface
// ---------------------------------------------------------------------------

export const clientLabsApi = {
  /**
   * List lab panels assigned to the current client/tenant.
   * Backend: GET /api/v1/client/labs/tests/
   */
  getLabPanels: async (): Promise<ClientLabPanel[]> => {
    const { data } = await axiosInstance.get("client/labs/tests/");
    return ((data.results ?? data ?? []) as Record<string, unknown>[]).map(normalizePanel);
  },

  /**
   * Update client-editable storefront fields for one assigned lab.
   * Backend: PATCH /api/v1/client/labs/tests/{id}/
   */
  updateLabPanel: async (
    assignmentId: string,
    updates: Partial<Pick<ClientLabPanel, "patient_price" | "discounted_patient_price" | "is_active" | "service_states" | "image_url">>
  ): Promise<ClientLabPanel> => {
    const body: Record<string, unknown> = {};
    if (updates.patient_price !== undefined) {
      body.patient_price = { amount: String(updates.patient_price ?? 0), currency: "USD" };
    }
    if (updates.discounted_patient_price !== undefined) {
      body.discounted_patient_price = updates.discounted_patient_price != null
        ? { amount: String(updates.discounted_patient_price), currency: "USD" }
        : null;
    }
    if (updates.is_active !== undefined) body.is_active = updates.is_active;
    if (updates.service_states !== undefined) body.service_states = updates.service_states;
    if (updates.image_url !== undefined) body.image_url = updates.image_url;
    const { data } = await axiosInstance.patch(`client/labs/tests/${assignmentId}/`, body);
    return normalizePanel(data as Record<string, unknown>);
  },

  /**
   * List standalone lab orders for the current tenant.
   * Backend: GET /api/v1/client/labs/orders/
   */
  getLabOrders: async (params?: { search?: string; status?: string; lab_panel_id?: string }): Promise<LabOrder[]> => {
    const { data } = await axiosInstance.get("client/labs/orders/", { params });
    return ((data.results ?? data ?? []) as Record<string, unknown>[]).map(normalizeOrder);
  },

  /**
   * Get one lab order with lifecycle events and result access.
   * Backend: GET /api/v1/client/labs/orders/{id}/
   */
  getLabOrderDetail: async (orderId: string): Promise<LabOrderDetail> => {
    const { data } = await axiosInstance.get(`client/labs/orders/${orderId}/`);
    return {
      order: normalizeOrder(data.order as Record<string, unknown>),
      lifecycle_events: Array.isArray(data.lifecycle_events) ? data.lifecycle_events : [],
      result: data.result ?? null,
      result_access_allowed: Boolean(data.result_access_allowed),
      result_access_message: data.result_access_message ?? null,
    };
  },

  /**
   * Toggle result access for a client lab order.
   * Backend: PATCH /api/v1/client/labs/orders/{id}/result-access/
   * NOTE: If backend doesn't have this endpoint yet, result_access_allowed
   * lives on the ClientLabPanelAssignment, not the order.
   * For V1 the toggle is assignment-level: PATCH /client/labs/tests/{assignment_id}/
   */
  toggleResultAccess: async (orderId: string, allow: boolean): Promise<void> => {
    // The result_access_allowed flag is stored on the assignment, not the order.
    // We need to load the order detail first to get the assignment_id, then PATCH the assignment.
    const detail = await axiosInstance.patch(`client/labs/orders/${orderId}/result-access/`, { result_access_allowed: allow });
    return detail.data;
  },

  getLabOrderResultPdf: async (orderId: string): Promise<Blob> => {
    const { data } = await axiosInstance.get(`client/labs/orders/${orderId}/result-pdf/`, {
      responseType: "blob",
    });
    return data as Blob;
  },

  /**
   * Get result PDF URL (only when result access is enabled for this client).
   * Backend: GET /api/v1/client/labs/orders/{id}/result-pdf/
   */
  getLabOrderResultPdfUrl: async (orderId: string): Promise<string> => {
    const { data } = await axiosInstance.get(`client/labs/orders/${orderId}/result-pdf/`);
    return String(data.url ?? "");
  },
};
