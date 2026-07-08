import axiosInstance from "./axiosInstance";
import type {
  ProductBillingConfig,
  ProductBillingSummary,
  ProductBillingListResponse,
  BulkUpdatePayload,
  BulkUpdateResponse,
  SingleProductOverridePayload,
} from "@/types/b2bBilling";

const BASE = "internal/clients";

export const productBillingApi = {
  getSummary: async (clientId: string): Promise<ProductBillingSummary> => {
    const { data } = await axiosInstance.get<ProductBillingSummary>(
      `${BASE}/${clientId}/product-billing/summary/`,
    );
    return data;
  },

  listProducts: async (
    clientId: string,
    params?: {
      search?: string;
      category_id?: string;
      pharmacy_id?: string;
      is_archived?: boolean | "all";
      configuration_status?: string;
      page?: number;
      page_size?: number;
    },
  ): Promise<ProductBillingListResponse> => {
    const { data } = await axiosInstance.get<ProductBillingListResponse>(
      `${BASE}/${clientId}/product-billing/products/`,
      { params },
    );
    return data;
  },

  updateProduct: async (
    clientId: string,
    adminProductId: number,
    payload: SingleProductOverridePayload,
  ): Promise<ProductBillingConfig> => {
    const { data } = await axiosInstance.patch<ProductBillingConfig>(
      `${BASE}/${clientId}/product-billing/products/${adminProductId}/`,
      payload,
    );
    return data;
  },

  resetProduct: async (
    clientId: string,
    adminProductId: number,
  ): Promise<{ success: boolean }> => {
    const { data } = await axiosInstance.post<{ success: boolean }>(
      `${BASE}/${clientId}/product-billing/products/${adminProductId}/reset/`,
    );
    return data;
  },

  archiveProduct: async (
    clientId: string,
    adminProductId: number,
  ): Promise<{ success: boolean }> => {
    const { data } = await axiosInstance.post<{ success: boolean }>(
      `${BASE}/${clientId}/product-billing/products/${adminProductId}/archive/`,
    );
    return data;
  },

  unarchiveProduct: async (
    clientId: string,
    adminProductId: number,
  ): Promise<{ success: boolean }> => {
    const { data } = await axiosInstance.post<{ success: boolean }>(
      `${BASE}/${clientId}/product-billing/products/${adminProductId}/unarchive/`,
    );
    return data;
  },

  bulkUpdate: async (
    clientId: string,
    payload: BulkUpdatePayload,
  ): Promise<BulkUpdateResponse> => {
    const { data } = await axiosInstance.post<BulkUpdateResponse>(
      `${BASE}/${clientId}/product-billing/bulk-update/`,
      payload,
    );
    return data;
  },
};

export default productBillingApi;
