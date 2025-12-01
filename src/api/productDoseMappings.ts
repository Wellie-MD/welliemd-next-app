/**
 * Product Dose Mapping API for Admin Portal
 * 
 * Manages structured dose mappings for products
 */
import axiosInstance from "./axiosInstance";

// ==================== TYPES ====================

export interface ProductDoseMapping {
  id: number;
  category: number;
  category_name: string;
  name: string;
  patient_label: string;
  display_order: number;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDoseMappingPayload {
  category: number;
  name: string;
  patient_label: string;
  display_order?: number;
}

export interface UpdateDoseMappingPayload {
  category?: number;
  name?: string;
  patient_label?: string;
  display_order?: number;
}

export interface DoseMappingListParams {
  category?: number;
  category__name?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

// ==================== API FUNCTIONS ====================

/**
 * List all dose mappings with optional filtering
 */
export const listDoseMappings = async (
  params?: DoseMappingListParams
): Promise<{ results: ProductDoseMapping[]; count: number }> => {
  const response = await axiosInstance.get("/products/dose-mappings/", {
    params,
  });
  return response.data;
};

/**
 * Get a single dose mapping by ID
 */
export const getDoseMapping = async (
  id: number
): Promise<ProductDoseMapping> => {
  const response = await axiosInstance.get(`/products/dose-mappings/${id}/`);
  return response.data;
};

/**
 * Create a new dose mapping
 */
export const createDoseMapping = async (
  payload: CreateDoseMappingPayload
): Promise<ProductDoseMapping> => {
  const response = await axiosInstance.post(
    "/products/dose-mappings/",
    payload
  );
  return response.data;
};

/**
 * Update an existing dose mapping
 */
export const updateDoseMapping = async (
  id: number,
  payload: UpdateDoseMappingPayload
): Promise<ProductDoseMapping> => {
  const response = await axiosInstance.patch(
    `/products/dose-mappings/${id}/`,
    payload
  );
  return response.data;
};

/**
 * Delete a dose mapping
 * Note: Will fail if products reference this mapping
 */
export const deleteDoseMapping = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/products/dose-mappings/${id}/`);
};

/**
 * Get dose mappings for a specific category
 */
export const getDoseMappingsByCategory = async (
  categoryId: number
): Promise<ProductDoseMapping[]> => {
  const response = await listDoseMappings({ category: categoryId });
  return response.results;
};
