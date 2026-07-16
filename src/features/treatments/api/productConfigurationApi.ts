import axiosInstance from "@/api/axiosInstance";
import { productApi, type Product } from "@/api/products";

export const productConfigurationApi = {
  list: (params?: Record<string, unknown>): Promise<Product[]> => productApi.listProducts(params),
  assignTreatmentType: async (productId: string | number, treatmentTypeId: string): Promise<Product> => {
    const { data } = await axiosInstance.patch<Product>(
      `products/configuration/${productId}/treatment-type/`,
      { treatment_type_id: treatmentTypeId },
    );
    return data;
  },
};
