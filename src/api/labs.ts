import axiosInstance from "./axiosInstance";
import { adminLabEndpoints } from "@/features/labs/api/endpoints";
import { junctionMockEnabled, mockLabOrderResults, mockLabOrders, updateMockLabOrder } from "./junctionMockData";
import type {
  Biomarker,
  CatalogItem,
  CatalogItemDetail,
  CatalogLab,
  ClientAssignment,
  CreateDraftLabPanelFromCatalogPayload,
  CreateLabPanelPayload,
  LabOrder,
  LabPanel,
} from "./labs-types";
export type {
  Biomarker,
  CatalogItem,
  CatalogItemDetail,
  CatalogLab,
  ClientAssignment,
  CreateDraftLabPanelFromCatalogPayload,
  CreateLabPanelPayload,
  LabOrder,
  LabPanel,
} from "./labs-types";

type Money = { amount: string; currency?: string } | number | string | null | undefined;

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
  marker_type: raw.marker_type || "",
  units: raw.units || "",
  reference_range: raw.reference_range || "",
  common_tat: raw.common_tat || raw.common_turnaround_time || (raw.common_tat_days != null ? String(raw.common_tat_days) : "") || "Varies",
  worst_case_tat: raw.worst_case_tat || raw.worst_case_turnaround_time || (raw.worst_case_tat_days != null ? String(raw.worst_case_tat_days) : "") || "Varies",
  labs: raw.labs || (raw.lab_id ? [String(raw.lab_id)] : []),
  aoe_questions: Array.isArray(raw.aoe_questions) ? raw.aoe_questions : [],
  aoe_required_count: typeof raw.aoe_required_count === "number" ? raw.aoe_required_count : undefined,
  aoe_optional_count: typeof raw.aoe_optional_count === "number" ? raw.aoe_optional_count : undefined,
  loinc_map: Array.isArray(raw.loinc_map) ? raw.loinc_map : [],
});

const normalizeCatalogItem = (raw: any): CatalogItem => ({
  id: String(raw.id),
  provider_id: raw.provider_id || "",
  source_item_id: String(raw.source_item_id || ""),
  slug: raw.slug || "",
  name: raw.name || "",
  item_type: raw.item_type || "",
  status: raw.status || "",
  price: String(raw.price || ""),
  lab_id: String(raw.lab_id || ""),
  lab_slug: raw.lab_slug || "",
  lab_name: raw.lab_name || "",
  common_tat_days: raw.common_tat_days ?? null,
  worst_case_tat_days: raw.worst_case_tat_days ?? null,
  has_aoe_required: !!raw.has_aoe_required,
  is_orderable: raw.is_orderable !== false,
  marker_count: typeof raw.marker_count === "number" ? raw.marker_count : 0,
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
  aoe_required_count: typeof raw.aoe_required_count === "number" ? raw.aoe_required_count : 0,
  aoe_optional_count: typeof raw.aoe_optional_count === "number" ? raw.aoe_optional_count : 0,
  configuration_status: raw.configuration_status || "in_progress",
  configuration_missing: Array.isArray(raw.configuration_missing) ? raw.configuration_missing : [],
  is_assignable: !!raw.is_assignable,
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
  lab_account_id: raw.lab_account_id || "",
  lab_account_state: raw.lab_account_state || "",
  lab_account_options: Array.isArray(raw.lab_account_options) ? raw.lab_account_options : [],
  linkedLabAccountIds: raw.lab_account_id ? [raw.lab_account_id] : raw.linkedLabAccountIds || [],
  client_configuration_ready: !!raw.client_configuration_ready,
  submission_ready: !!raw.submission_ready,
  blocking_reason: raw.blocking_reason || "",
  patient_price_configured: !!raw.patient_price_configured,
  service_state_options: Array.isArray(raw.service_state_options) ? raw.service_state_options : [],
  junction_provider_key: raw.junction_provider_key || "",
  junction_billing_type: raw.junction_billing_type || "",
  physician_ordering_mode: raw.physician_ordering_mode || "",
  provider_supported_states: Array.isArray(raw.provider_supported_states) ? raw.provider_supported_states : [],
  provider_policy_revision: typeof raw.provider_policy_revision === "number" ? raw.provider_policy_revision : null,
  provider_policy_source: raw.provider_policy_source || "",
});

const fallbackOrderStatus = (raw: any): string => {
  if (raw.order_status === "completed" || raw.results_status === "final") return "Completed";
  if (raw.order_status === "failed") return "Failed";
  if (raw.order_status === "requisition_created") return "Requisition Created";
  return "In Process";
};

const normalizeOrder = (raw: any): LabOrder => ({
  id: String(raw.id),
  display_id: String(raw.display_id || raw.id),
  client_id: raw.client_id ? String(raw.client_id) : undefined,
  patient_name: raw.patient_name || "",
  patient_email: raw.patient_email || "",
  patient_phone: raw.patient_phone || "",
  client_name: raw.client_name || "",
  product_name: raw.lab_panel_name || raw.product_name || "",
  lab_provider: raw.lab_provider || "",
  price: moneyToNumber(raw.total_paid || raw.price),
  status: raw.ui_order_status || fallbackOrderStatus(raw),
  payment_status: raw.ui_payment_status || (raw.payment_status === "paid" || raw.payment_status === "succeeded" ? "Paid" : "Unpaid"),
  visit_status: raw.ui_lab_event_label || raw.lab_event || "Lab",
  fulfillment_status: raw.ui_fulfillment_status || raw.fulfillment_status || "",
  lab_event: raw.ui_lab_event || raw.lab_event || "",
  lab_event_label: raw.ui_lab_event_label || raw.lab_event_label || "",
  ui_order_status: raw.ui_order_status || "",
  ui_payment_status: raw.ui_payment_status || "",
  ui_fulfillment_status: raw.ui_fulfillment_status || "",
  ui_lab_event: raw.ui_lab_event || "",
  ui_lab_event_label: raw.ui_lab_event_label || "",
  ui_lab_event_tone: raw.ui_lab_event_tone || "",
  timeline: { ordered: raw.created_at },
  results_status: raw.results_status || "pending",
  resultsReady: ["partial_results", "results_ready", "critical", "partial", "final"].includes(raw.results_status),
  tracking_number: raw.tracking_number || "",
  junction_provider_key: raw.junction_provider_key || "",
  junction_billing_type: raw.junction_billing_type || "",
  junction_patient_state: raw.junction_patient_state || "",
  junction_policy_revision: typeof raw.junction_policy_revision === "number" ? raw.junction_policy_revision : null,
});

export const labsApi = {
  getBiomarkers: async (): Promise<Biomarker[]> => {
    const { data } = await axiosInstance.get(adminLabEndpoints.biomarkers);
    return (data.results || data || []).map(normalizeBiomarker);
  },

  getCatalogLabs: async (): Promise<CatalogLab[]> => {
    const { data } = await axiosInstance.get(adminLabEndpoints.catalogLabs);
    return (data.results || data || []).map((raw: any) => ({
      id: String(raw.id),
      name: raw.name || `Lab ${raw.id}`,
      slug: raw.slug || "",
      catalog_item_count: raw.catalog_item_count || 0,
      orderable_item_count: raw.orderable_item_count || 0,
    }));
  },

  getCatalogItems: async (params: {
    lab_id?: string;
    q?: string;
    page?: number;
    page_size?: number;
    type?: string;
    aoe_required?: boolean;
  }): Promise<{ count: number; page: number; page_size: number; results: CatalogItem[] }> => {
    const { data } = await axiosInstance.get(adminLabEndpoints.catalogItems, {
      params: {
        lab_id: params.lab_id === "all" ? undefined : params.lab_id,
        q: params.q || undefined,
        page: params.page || undefined,
        page_size: params.page_size || undefined,
        type: params.type || undefined,
        aoe_required: params.aoe_required || undefined,
      },
    });
    return {
      count: data.count || 0,
      page: data.page || 1,
      page_size: data.page_size || 50,
      results: (data.results || []).map(normalizeCatalogItem),
    };
  },

  getCatalogItemDetail: async (id: string): Promise<CatalogItemDetail> => {
    const { data } = await axiosInstance.get(adminLabEndpoints.catalogItemDetail(id));
    return data as CatalogItemDetail;
  },

  getLabPanels: async (): Promise<LabPanel[]> => {
    const { data } = await axiosInstance.get(adminLabEndpoints.panels);
    return (data.results || data || []).map(normalizePanel);
  },

  createLabPanel: async (payload: CreateLabPanelPayload): Promise<LabPanel> => {
    const { data } = await axiosInstance.post(adminLabEndpoints.panels, {
      name: payload.name,
      description: payload.description,
      lab_provider: payload.lab_provider,
      fasting_required: payload.fasting_required === "yes",
      collection_method: payload.collection_method,
      cost_to_client: moneyPayload(payload.cost_to_client),
      cost_to_welliemd: moneyPayload(payload.cost_to_welliemd),
      is_active: payload.is_active,
      service_states: payload.service_states,
      biomarker_ids: [],
      catalog_item_ids: payload.catalog_item_ids,
    });
    return normalizePanel(data);
  },

  createDraftLabPanelFromCatalog: async (
    payload: CreateDraftLabPanelFromCatalogPayload
  ): Promise<LabPanel> => {
    const { data } = await axiosInstance.post(adminLabEndpoints.panelFromCatalog, {
      name: payload.name,
      description: payload.description,
      fasting_required: payload.fasting_required === "yes",
      collection_method: payload.collection_method,
      catalog_item_ids: payload.catalog_item_ids,
    });
    return normalizePanel(data);
  },

  updateLabPanel: async (id: string, payload: Partial<LabPanel>): Promise<LabPanel> => {
    const { data } = await axiosInstance.patch(adminLabEndpoints.panelDetail(id), {
      description: payload.description,
      cost_to_client:
        payload.cost_to_client === undefined ? undefined : moneyPayload(payload.cost_to_client),
      cost_to_welliemd:
        payload.cost_to_welliemd === undefined ? undefined : moneyPayload(payload.cost_to_welliemd),
      is_active: payload.is_active,
      service_states: payload.service_states,
    });
    return normalizePanel(data);
  },

  checkLabPanelJunctionStatus: async (id: string): Promise<LabPanel> => {
    const { data } = await axiosInstance.post(adminLabEndpoints.panelStatus(id));
    return normalizePanel(data.panel || data);
  },

  getClientsForLabAssignment: async (labId: string): Promise<ClientAssignment[]> => {
    const { data } = await axiosInstance.get(adminLabEndpoints.panelClients(labId));
    return (data.results || data || []).map(normalizeClientAssignment);
  },

  assignLabPanelToClients: async (
    labId: string,
    clientIds: string[],
    labAccountSelections?: Record<string, string>
  ): Promise<{ success: boolean; assigned_count?: number }> => {
    const { data } = await axiosInstance.post(adminLabEndpoints.panelClients(labId), {
      client_ids: clientIds,
      lab_account_selections: labAccountSelections || {},
    });
    return data;
  },

  submitAssignmentToJunction: async (assignmentId: string) => {
    const { data } = await axiosInstance.post(
      adminLabEndpoints.assignmentSubmit(assignmentId)
    );
    return data;
  },

  syncAssignmentToTenant: async (assignmentId: string) => {
    const { data } = await axiosInstance.post(
      adminLabEndpoints.assignmentSync(assignmentId)
    );
    return data;
  },

  checkAssignmentJunctionStatus: async (assignmentId: string) => {
    const { data } = await axiosInstance.post(
      adminLabEndpoints.assignmentStatus(assignmentId)
    );
    return data;
  },

  replaceAssignmentSubmission: async (assignmentId: string, supportNotes = "") => {
    const { data } = await axiosInstance.post(
      adminLabEndpoints.assignmentReplace(assignmentId),
      { support_notes: supportNotes }
    );
    return data;
  },

  archiveLabPanel: async (id: string): Promise<{ success: boolean; archived: boolean }> => {
    const { data } = await axiosInstance.delete(adminLabEndpoints.panelDetail(id));
    return data;
  },

  getCombinedPanels: async () => {
    const { data } = await axiosInstance.get(adminLabEndpoints.combinedPanels);
    return (data.results || data || []) as import("@/features/labs/types").CombinedLabPanel[];
  },

  createCombinedPanel: async (payload: {
    name: string;
    description?: string;
    member_panel_ids: string[];
    cost_to_client?: { amount: string; currency: string };
    cost_to_welliemd?: { amount: string; currency: string };
    service_states?: string[];
  }) => {
    const { data } = await axiosInstance.post(adminLabEndpoints.combinedPanels, payload);
    return data as import("@/features/labs/types").CombinedLabPanel;
  },

  updateCombinedPanel: async (
    id: string,
    payload: Partial<{
      name: string;
      description: string;
      is_active: boolean;
      service_states: string[];
      cost_to_client: { amount: string; currency: string };
      cost_to_welliemd: { amount: string; currency: string };
    }>
  ) => {
    const { data } = await axiosInstance.patch(adminLabEndpoints.combinedPanelDetail(id), payload);
    return data as import("@/features/labs/types").CombinedLabPanel;
  },

  archiveCombinedPanel: async (id: string): Promise<{ success: boolean; archived: boolean }> => {
    const { data } = await axiosInstance.delete(adminLabEndpoints.combinedPanelDetail(id));
    return data;
  },

  validateCombinedMembers: async (panelIds: string[]): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> => {
    const { data } = await axiosInstance.post(adminLabEndpoints.combinedValidate, {
      member_panel_ids: panelIds,
    });
    return data;
  },

  getCombinedPanelClients: async (combinedId: string) => {
    const { data } = await axiosInstance.get(adminLabEndpoints.combinedClients(combinedId));
    return (data.results || data || []) as Array<Record<string, any>>;
  },

  assignCombinedPanelToClients: async (
    combinedId: string,
    clientIds: string[]
  ): Promise<{ success: boolean; assigned_client_count: number }> => {
    const { data } = await axiosInstance.post(adminLabEndpoints.combinedClients(combinedId), {
      client_ids: clientIds,
    });
    return data;
  },

  getAdminLabOrders: async (): Promise<LabOrder[]> => {
    if (junctionMockEnabled) return mockLabOrders;
    const { data } = await axiosInstance.get(adminLabEndpoints.orders);
    return (data.results || data || []).map(normalizeOrder);
  },

  getAdminLabOrderResults: async (orderId: string, clientId?: string) => {
    if (junctionMockEnabled) return mockLabOrderResults(orderId);
    const { data } = await axiosInstance.get(adminLabEndpoints.orderResults(orderId), {
      params: clientId ? { client_id: clientId } : undefined,
    });
    return data;
  },

  updateAdminLabOrder: async (
    orderId: string,
    payload: { status?: string; tracking_number?: string }
  ): Promise<LabOrder> => {
    if (junctionMockEnabled) return updateMockLabOrder(orderId, payload);
    const { data } = await axiosInstance.patch(adminLabEndpoints.orderManualUpdate(orderId), payload);
    return normalizeOrder(data.order || data);
  },

  downloadAdminLabResultPdf: async (orderId: string, clientId?: string): Promise<Blob> => {
    const { data } = await axiosInstance.get(adminLabEndpoints.orderResultPdf(orderId), {
      responseType: "blob",
      params: clientId ? { client_id: clientId } : undefined,
    });
    return data;
  },

  downloadAdminLabRequisitionPdf: async (orderId: string, clientId?: string): Promise<Blob> => {
    const { data } = await axiosInstance.get(adminLabEndpoints.orderRequisitionPdf(orderId), {
      responseType: "blob",
      params: clientId ? { client_id: clientId } : undefined,
    });
    return data;
  },

  downloadAdminLabCollectionInstructionsPdf: async (orderId: string, clientId?: string): Promise<Blob> => {
    const { data } = await axiosInstance.get(adminLabEndpoints.orderCollectionInstructionsPdf(orderId), {
      responseType: "blob",
      params: clientId ? { client_id: clientId } : undefined,
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
