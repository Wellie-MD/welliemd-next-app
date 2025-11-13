/**
 * Product Category API
 */
import axiosInstance from "./axiosInstance";

export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
}

export const productCategoryApi = {
  /**
   * List all product categories
   */
  listCategories: async (): Promise<ProductCategory[]> => {
    const { data } = await axiosInstance.get("products/categories/");
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
   * Get a single category by ID
   */
  getCategory: async (id: number): Promise<ProductCategory> => {
    const { data } = await axiosInstance.get(`products/categories/${id}/`);
    return data;
  },

  /**
   * Create a new category
   */
  createCategory: async (payload: CreateCategoryPayload): Promise<ProductCategory> => {
    const { data } = await axiosInstance.post("products/categories/", payload);
    return data;
  },

  /**
   * Update a category
   */
  updateCategory: async (
    id: number,
    payload: UpdateCategoryPayload
  ): Promise<ProductCategory> => {
    const { data } = await axiosInstance.patch(`products/categories/${id}/`, payload);
    return data;
  },

  /**
   * Delete a category
   */
  deleteCategory: async (id: number): Promise<void> => {
    await axiosInstance.delete(`products/categories/${id}/`);
  },

  /**
   * Get products in a category
   */
  getCategoryProducts: async (id: number): Promise<any[]> => {
    const { data } = await axiosInstance.get(`products/categories/${id}/products/`);
    return data;
  },
};

export default productCategoryApi;
