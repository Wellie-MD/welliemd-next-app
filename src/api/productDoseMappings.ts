/**
 * Product Dose Mapping API for Admin Portal
 * 
 * Manages structured dose mappings for products
 */
import axiosInstance from "./axiosInstance";
import { invalidateCatalogProductsCache } from "@/features/treatments/programs/checkout-question/utils/catalogProductCache";

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
  const data = response.data;
  if (!data || !Array.isArray(data.results) || !data.next) {
    return data;
  }

  const firstPage = data.results;
  const totalCount = Number(data.count || firstPage.length);
  const pageSize = firstPage.length || Number(params?.page_size) || 100;
  const pageCount = Math.ceil(totalCount / pageSize);

  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
      axiosInstance.get("/products/dose-mappings/", {
        params: { ...params, page: index + 2, page_size: pageSize },
      })
    )
  );

  return {
    ...data,
    results: [
      ...firstPage,
      ...remainingPages.flatMap((page) => page.data?.results || []),
    ],
  };
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
  invalidateCatalogProductsCache();
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
  invalidateCatalogProductsCache();
  return response.data;
};

/**
 * Delete a dose mapping
 * Note: Will fail if products reference this mapping
 */
export const deleteDoseMapping = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/products/dose-mappings/${id}/`);
  invalidateCatalogProductsCache();
};

/**
 * Get dose mappings for a specific category
 */
export const getDoseMappingsByCategory = async (
  categoryId: number
): Promise<ProductDoseMapping[]> => {
  const response = await listDoseMappings({ category: categoryId, page_size: 100 });
  return response.results;
};
