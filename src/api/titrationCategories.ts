/**
 * Titration Category API
 */
import axiosInstance from "./axiosInstance";

export interface TitrationCategory {
    id: number;
    name: string;
    code: string;
    description?: string;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface TitrationCategoryListParams {
    is_active?: boolean;
    search?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
}

export const titrationCategoryApi = {
    /**
     * List titration categories with optional filtering
     */
    listCategories: async (params?: TitrationCategoryListParams): Promise<TitrationCategory[]> => {
        const { data } = await axiosInstance.get("products/titration-categories/", {
            params: { is_active: true, page_size: 100, ...params },
        });
        if (data && typeof data === "object" && "results" in data) {
            const firstPage = data.results || [];
            if (!data.next) return firstPage;
            const totalCount = Number(data.count || firstPage.length);
            const pageSize = firstPage.length || Number(params?.page_size) || 100;
            const pageCount = Math.ceil(totalCount / pageSize);
            const remainingPages = await Promise.all(
                Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
                    axiosInstance.get("products/titration-categories/", {
                        params: { is_active: true, ...params, page: index + 2, page_size: pageSize },
                    })
                )
            );
            return [
                ...firstPage,
                ...remainingPages.flatMap((response) => response.data?.results || []),
            ];
        }
        // Handle array response
        if (Array.isArray(data)) {
            return data;
        }
        return [];
    },

    /**
     * Get a single titration category by ID
     */
    getCategory: async (id: number): Promise<TitrationCategory> => {
        const { data } = await axiosInstance.get(`products/titration-categories/${id}/`);
        return data;
    },

    /**
     * Create a new titration category
     */
    createCategory: async (payload: {
        name: string;
        code: string;
        description?: string;
        display_order?: number;
    }): Promise<TitrationCategory> => {
        const { data } = await axiosInstance.post("products/titration-categories/", payload);
        return data;
    },

    /**
     * Update a titration category
     */
    updateCategory: async (
        id: number,
        payload: Partial<TitrationCategory>
    ): Promise<TitrationCategory> => {
        const { data } = await axiosInstance.patch(`products/titration-categories/${id}/`, payload);
        return data;
    },

    /**
     * Delete a titration category
     */
    deleteCategory: async (id: number): Promise<void> => {
        await axiosInstance.delete(`products/titration-categories/${id}/`);
    },
};

export default titrationCategoryApi;
