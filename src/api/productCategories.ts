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

const normalizeCategoryResponse = (data: any): ProductCategory[] => {
  if (data && typeof data === "object" && "results" in data) {
    return data.results || [];
  }
  if (Array.isArray(data)) {
    return data;
  }
  return [];
};

export const productCategoryApi = {
  /**
   * List all product categories
   */
  listCategories: async (): Promise<ProductCategory[]> => {
    const { data } = await axiosInstance.get("products/categories/", {
      params: { page_size: 100 },
    });
    const firstPage = normalizeCategoryResponse(data);
    const totalCount = data && typeof data === "object" ? Number(data.count) : firstPage.length;
    const pageSize = firstPage.length || 100;

    if (!data?.next || firstPage.length >= totalCount) {
      return firstPage;
    }

    const pageCount = Math.ceil(totalCount / pageSize);
    const remainingPages = await Promise.all(
      Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
        axiosInstance.get("products/categories/", {
          params: { page: index + 2, page_size: pageSize },
        })
      )
    );

    return [
      ...firstPage,
      ...remainingPages.flatMap((response) => normalizeCategoryResponse(response.data)),
    ];
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
