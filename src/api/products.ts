/**
 * Product Management API
 *
 * Client users can:
 * - View products assigned to them
 * - Edit specific fields (description, images, safety info, etc.)
 * - Can edit patient-facing pricing (base price, shipping fee, discounts)
 * - Cannot edit admin costs or core configuration
 *
 * Admin users can:
 * - Create/update/delete products
 * - Assign products to clients
 * - Edit all fields
 */
import axiosInstance from "./axiosInstance";

// ==================== TYPES ====================

export interface Product {
  id: string;

  // Basic Information
  name: string;
  description?: string;
  application_directions?: string;
  learn_more?: string;
  product_image?: string;
  base_medication_name?: string;

  // Product Configuration
  product_type: "single" | "bundle" | "supply";
  bundle_products?: string[]; // Product IDs
  bundle_product_names?: string[];
  linked_supplies?: Array<{
    id: number;
    supply_product_id: number;
    supply_product_name: string;
    quantity: number;
    is_included: boolean;
    base_price?: string;
    discounted_price?: string | null;
    shipping_fee_patient?: string;
    cost_to_client?: string | null;
    shipping_cost_to_client?: string;
  }>;
  supply_usage_summary?: {
    total_links: number;
    included_links: number;
    billable_links: number;
  };
  ndc_number?: string;
  manufacturer_name?: string;
  purchase_type: "one_time" | "subscription";

  // Pricing (Admin only - read-only for clients)
  base_price: string;
  cost_to_client?: string;
  cost_to_welliemd?: string;
  shipping_cost_to_client?: string;
  shipping_cost_to_welliemd?: string;
  shipping_fee_patient: string;
  discounted_price?: string;

  // Prescription Details
  dose?: string;
  refills: number;
  rx_quantity: string;
  rx_quantity_units?: string;
  rx_drug_strength?: string;
  rx_drug_form?:
  | "tablet"
  | "capsule"
  | "milliliter"
  | "injection"
  | "cream"
  | "patch"
  | "each";
  rx_days_supply?: number;

  // External Integration IDs
  lifefile_product_id?: string;

  // Treatment & Classification
  treatment: "weight_loss" | "ed" | "glp" | "individualized_glp" | "general";
  rx_or_otc: "rx" | "otc";
  followup_days_after: number;

  // Provider Configuration
  requires_video_visit: boolean;
  provider_network: string;

  // Pharmacy Configuration
  pharmacy?: string;
  pharmacy_name?: string;
  beluga_medicine_id: string;
  beluga_addon_med_id?: string;
  vs_digital_health_sku?: string;
  pharmacy_api: "inherit" | "life_file" | "dispense_pro";
  generic_name?: string;
  generic_group?: string;
  service_states?: string[];
  category_name?: string;

  // Questionnaires
  onboarding_questionnaire?: string;
  onboarding_questionnaire_name?: string;
  followup_questionnaire?: string;
  followup_questionnaire_name?: string;
  onboarding_script_config?: Record<string, any>;

  // Safety & Side Effects
  safety_information?: string;
  side_effects?: string;

  // Inventory
  quantity: string;

  // Multi-tenancy Fields
  is_admin_product: boolean;
  source_product_id?: string;
  admin_product_version?: string;
  is_client_custom: boolean;
  allow_client_modifications: boolean;
  sync_to_tenants: boolean;

  // Status & Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  application_directions?: string;
  learn_more?: string;
  product_type: "single" | "bundle" | "supply";
  bundle_products?: string[];
  ndc_number?: string;
  manufacturer_name?: string;
  purchase_type: "one_time" | "subscription";
  base_price: string | number;
  cost_to_client?: string | number;
  cost_to_welliemd?: string | number;
  shipping_cost_to_client: string | number;
  shipping_cost_to_welliemd: string | number;
  shipping_fee_patient?: string | number;
  dose?: string;
  refills?: number;
  rx_quantity?: string | number;
  rx_quantity_units?: string;
  rx_drug_strength?: string;
  rx_drug_form?: string;
  rx_days_supply?: number;
  lifefile_product_id?: string;
  treatment: string;
  rx_or_otc: "rx" | "otc";
  followup_days_after: number;
  requires_video_visit?: boolean;
  provider_network: string;
  pharmacy?: string;
  beluga_medicine_id: string;
  beluga_addon_med_id?: string;
  vs_digital_health_sku?: string;
  pharmacy_api?: string;
  generic_name?: string;
  generic_group?: string;
  service_states?: string[];
  onboarding_questionnaire?: string;
  followup_questionnaire?: string;
  onboarding_script_config?: Record<string, any>;
  safety_information?: string;
  side_effects?: string;
  quantity?: string | number;
  allow_client_modifications?: boolean;
  sync_to_tenants?: boolean;
  is_active?: boolean;
}

export interface UpdateProductPayload {
  // Client-editable fields
  description?: string;
  application_directions?: string;
  learn_more?: string;
  safety_information?: string;
  side_effects?: string;
  onboarding_script_config?: Record<string, any>;
  quantity?: string | number;

  // Client-editable pricing fields
  base_price?: string | number;
  shipping_fee_patient?: string | number;
  discounted_price?: string | number;

  // Admin-only fields (will be ignored for client users)
  name?: string;
  product_type?: "single" | "bundle" | "supply";
  bundle_products?: string[];
  ndc_number?: string;
  manufacturer_name?: string;
  purchase_type?: "one_time" | "subscription";
  cost_to_welliemd?: string | number;
  shipping_cost_to_welliemd?: string | number;
  dose?: string;
  refills?: number;
  rx_quantity?: string | number;
  rx_quantity_units?: string;
  rx_drug_strength?: string;
  rx_drug_form?: string;
  rx_days_supply?: number;
  lifefile_product_id?: string;
  treatment?: string;
  rx_or_otc?: "rx" | "otc";
  followup_days_after?: number;
  requires_video_visit?: boolean;
  provider_network?: string;
  pharmacy?: string;
  beluga_medicine_id?: string;
  beluga_addon_med_id?: string;
  vs_digital_health_sku?: string;
  pharmacy_api?: string;
  generic_name?: string;
  generic_group?: string;
  service_states?: string[];
  onboarding_questionnaire?: string;
  followup_questionnaire?: string;
  allow_client_modifications?: boolean;
  sync_to_tenants?: boolean;
  is_active?: boolean;
}

export interface ProductCategorySummary {
  id: string;
  name: string;
  count: number;
}

export interface ProductGroupingSummary {
  key: string;
  label: string;
  icon?: string;
  count: number;
}

export interface CouponCategoriesResponse {
  total_products: number;
  categories: ProductCategorySummary[];
  product_types: ProductGroupingSummary[];
  rx_types: ProductGroupingSummary[];
  treatments: ProductGroupingSummary[];
}

export interface ProductListParams {
  is_admin_product?: boolean;
  is_active?: boolean;
  product_type?: "single" | "bundle" | "supply";
  treatment?: string;
  rx_or_otc?: "rx" | "otc";
  purchase_type?: "one_time" | "subscription";
  requires_video_visit?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

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

export interface BulkAssignmentResponse {
  message: string;
  total: number;
  success_count: number;
  failure_count: number;
  results: AssignmentResult[];
}

// ==================== PRODUCT API (CLIENT-ONLY) ====================

export const productApi = {
  /**
   * List all products assigned to the client
   * Clients only see products assigned to them (not admin products)
   * Returns paginated response or array
   */
  listProducts: async (params?: ProductListParams): Promise<unknown> => {
    const { data } = await axiosInstance.get("products/", { params });
    // Return the full response (could be paginated or array)
    return data;
  },

  /**
   * Get a single product by ID
   */
  getProduct: async (id: string): Promise<Product> => {
    const { data } = await axiosInstance.get<Product>(`products/${id}/`);
    return data;
  },

  /**
   * Update a product (Client can only update specific fields)
   * Client-editable fields: description, application_directions, learn_more,
   * product_image, safety_information, side_effects, onboarding_script_config, quantity
   */
  updateProduct: async (
    id: string,
    payload: UpdateProductPayload | FormData
  ): Promise<Product> => {
    const { data } = await axiosInstance.patch<Product>(
      `products/${id}/`,
      payload
    );
    return data;
  },

  /**
   * Get dynamic product categories/groupings for the current tenant
   */
  getCouponCategories: async (): Promise<CouponCategoriesResponse> => {
    const { data } = await axiosInstance.get<CouponCategoriesResponse>(
      "products/coupon-categories/"
    );
    return data;
  },
};

// Note: Assignment log APIs are admin-only and not included in this client repo

// ==================== CONSTANTS ====================

export const PRODUCT_TYPE_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "bundle", label: "Bundle" },
  { value: "supply", label: "Supply" },
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

// Fields that clients can edit (not pricing or core configuration)
export const CLIENT_EDITABLE_FIELDS = [
  "description",
  "application_directions",
  "learn_more",
  "product_image",
  "safety_information",
  "side_effects",
  "onboarding_script_config",
  "quantity",
];
