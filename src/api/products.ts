/**
 * Product Management API for Admin Portal
 *
 * Admin users can:
 * - Create/update/delete products
 * - Assign products to clients
 * - View assignment logs
 * - Edit all fields including pricing
 */
import axiosInstance from "./axiosInstance";

// ==================== PRODUCT TYPES ====================

export interface Product {
  id: number | string;
  name: string;
  description?: string;
  application_directions?: string;
  learn_more?: string;
  product_image?: string;
  category?: number;
  category_name?: string;
  product_type: "single" | "bundle";
  bundle_products?: string[];
  bundle_product_names?: string[];
  ndc_number?: string;
  manufacturer_name?: string;
  purchase_type: "one_time" | "subscription";
  base_price?: string;
  price?: string | number;
  cost?: string | number;
  cost_to_client?: string;
  cost_to_welliemd?: string;
  shipping_cost_to_client?: string;
  shipping_cost_to_welliemd?: string;
  shipping_fee_patient?: string;
  base_shipping_cost?: string | number;
  shipping_fee?: string | number;

  // Dose Mapping (NEW - Phase 1)
  dose_mapping?: number;
  dose_mapping_name?: string;
  dose_mapping_label?: string;

  // Deprecated fields (use dose_mapping instead)
  /** @deprecated Use dose_mapping instead */
  dose?: string;
  /** @deprecated Use dose_mapping instead */
  base_medication_name?: string;

  refills?: number;
  rx_quantity?: string | number;
  rx_quantity_units?: string;
  rx_drug_strength?: string;
  rx_drug_form?: string;
  rx_days_supply?: number;
  lifefile_product_id?: string;
  treatment: string;
  rx_or_otc?: "rx" | "otc";
  followup_days_after?: number;
  requires_video_visit?: boolean;
  provider_network?: string;
  pharmacy?: string;
  pharmacy_name?: string;
  beluga_medicine_id?: string;
  beluga_addon_med_id?: string;
  vs_digital_health_sku?: string;
  pharmacy_api?: string;
  generic_name?: string;
  generic_group?: string;
  onboarding_questionnaire?: string;
  onboarding_questionnaire_name?: string;
  followup_questionnaire?: string;
  followup_questionnaire_name?: string;
  onboarding_script_config?: Record<string, any>;
  safety_information?: string;
  side_effects?: string;
  safety_info?: string;
  quantity?: string | number;
  is_admin_product?: boolean;
  source_product_id?: string;
  admin_product_version?: string;
  is_client_custom?: boolean;
  allow_client_modifications?: boolean;
  sync_to_tenants?: boolean;
  is_modified_need_to_re_assigned?: boolean; // True if product was modified and needs re-assignment
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  application_directions?: string;
  product_type: "single" | "bundle";
  purchase_type: "one_time" | "subscription";
  base_price: string | number;
  treatment: string;
  rx_or_otc: "rx" | "otc";
  [key: string]: any;
}

export interface UpdateProductPayload {
  [key: string]: any;
}

export interface ProductListParams {
  is_admin_product?: boolean;
  is_active?: boolean;
  product_type?: "single" | "bundle";
  treatment?: string;
  rx_or_otc?: "rx" | "otc";
  purchase_type?: "one_time" | "subscription";
  search?: string;
  page?: number;
  page_size?: number;
}

// ==================== CONSTANTS ====================

export const PRODUCT_TYPE_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "bundle", label: "Bundle" },
];

export const PURCHASE_TYPE_OPTIONS = [
  { value: "one_time", label: "One Time" },
  { value: "subscription", label: "Subscription" },
];

export const RX_OTC_OPTIONS = [
  { value: "rx", label: "RX" },
  { value: "otc", label: "OTC" },
];

export const TREATMENT_OPTIONS = [
  { value: "weight_loss", label: "Weight Loss" },
  { value: "ed", label: "Erectile Dysfunction" },
  { value: "glp", label: "GLP" },
  { value: "individualized_glp", label: "Individualized GLP" },
  { value: "general", label: "General" },
];

export const RX_DRUG_FORM_OPTIONS = [
  { value: "tablet", label: "Tablet" },
  { value: "capsule", label: "Capsule" },
  { value: "milliliter", label: "Milliliter" },
  { value: "injection", label: "Injection" },
  { value: "cream", label: "Cream" },
  { value: "patch", label: "Patch" },
  { value: "each", label: "Each" },
];

export const PHARMACY_API_OPTIONS = [
  { value: "inherit", label: "Inherit from Pharmacy" },
  { value: "life_file", label: "Life File" },
  { value: "dispense_pro", label: "Dispense Pro" },
];

// ==================== ASSIGNMENT TYPES ====================

export interface ProductAssignmentLog {
  id: string;
  product_id: string;
  product_name: string;
  product_version: string;
  client_id: string;
  client_name: string;
  request_payload: Record<string, any>;
  response_status_code?: number;
  response_data?: Record<string, any>;
  error_message?: string;
  status: "pending" | "success" | "failed" | "retrying";
  retry_count: number;
  assigned_by?: string;
  assigned_by_email?: string;
  assigned_at: string;
  completed_at?: string;
  duration_seconds?: number;
}

export interface AssignmentResult {
  success: boolean;
  product_id: string;
  product_name: string;
  client_id: string;
  client_name: string;
  message?: string;
  error?: string;
}

export interface BulkAssignmentPayload {
  product_ids: number[];
  client_ids: string[];
}

export interface BulkAssignmentResponse {
  message: string;
  total: number;
  success_count: number;
  failure_count: number;
  results: AssignmentResult[];
}

export interface AssignmentSummary {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  recent_total: number;
  recent_successful: number;
}

// ==================== PRODUCT API (ADMIN) ====================

export const productApi = {
  /**
   * List all products (admin sees all products)
      */
  listProducts: async (params?: any): Promise<any[]> => {
    const { data } = await axiosInstance.get("products/", { params });
    // Handle paginated response
    if (data && typeof data === "object" && "results" in data) {
      return data.results || [];
    }
    // Handle array response
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  },

  /**
   * Get a single product by ID
   */
  getProduct: async (id: string | number): Promise<any> => {
    const { data } = await axiosInstance.get(`products/${id}/`);
    return data;
  },

  /**
   * Create a new product (admin only)
   */
  createProduct: async (payload: any): Promise<any> => {
    const { data } = await axiosInstance.post("products/", payload);
    return data;
  },

  /**
   * Update a product (admin can update all fields)
   */
  updateProduct: async (id: string | number, payload: any): Promise<unknown> => {
    const { data } = await axiosInstance.patch(`products/${id}/`, payload);
    return data;
  },

  /**
   * Delete a product
   */
  deleteProduct: async (id: string | number): Promise<void> => {
    await axiosInstance.delete(`products/${id}/`);
  },

  /**
   * Bulk assign products to clients
   * POST /api/v1/products/bulk_assign/
   */
  bulkAssign: async (
    payload: BulkAssignmentPayload
  ): Promise<BulkAssignmentResponse> => {
    const { data } = await axiosInstance.post<BulkAssignmentResponse>(
      "products/bulk_assign/",
      payload
    );
    return data;
  },

  /**
   * Re-assign modified products to clients (force update)
   * POST /api/v1/products/admin/assignments/re-assign/
   */
  reAssignProducts: async (
    payload: BulkAssignmentPayload
  ): Promise<BulkAssignmentResponse> => {
    const { data } = await axiosInstance.post<BulkAssignmentResponse>(
      "products/admin/assignments/re-assign/",
      payload
    );
    return data;
  },

  /**
   * Archive products on client databases
   */
  archiveProducts: async (payload: {
    product_ids: number[];
    client_ids: string[];
  }) => {
    const { data } = await axiosInstance.post(
      'products/admin/assignments/archive/',
      payload
    );
    return data;
  },

  /**
   * Unarchive products on client databases
   */
  unarchiveProducts: async (payload: {
    product_ids: number[];
    client_ids: string[];
  }) => {
    const { data } = await axiosInstance.post(
      'products/admin/assignments/unarchive/',
      payload
    );
    return data;
  },
};

// ==================== ASSIGNMENT LOG API ====================

export const assignmentLogApi = {
  /**
   * List assignment logs with filtering
   */
  listLogs: async (params?: {
    status?: string;
    product_id?: string;
    client_id?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ results: ProductAssignmentLog[]; count: number }> => {
    const { data } = await axiosInstance.get("products/assignments/", {
      params,
    });
    return data;
  },

  /**
   * Get assignment summary statistics
   */
  getSummary: async (): Promise<AssignmentSummary> => {
    const { data } = await axiosInstance.get<AssignmentSummary>(
      "products/assignments/summary/"
    );
    return data;
  },
};

export default productApi;
