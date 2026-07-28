import axiosInstance from "@/api/axiosInstance";
import { productApi, type Product } from "@/api/products";
import { TREATMENT_PRODUCT_API } from "./constants";

export const productConfigurationApi = {
  list: (params?: Record<string, unknown>): Promise<Product[]> => productApi.listProducts(params),
  assignTreatmentType: async (productId: string | number, treatmentTypeId: string): Promise<Product> => {
    const { data } = await axiosInstance.patch<Product>(
      TREATMENT_PRODUCT_API.treatmentTypeConfiguration(productId),
      { treatment_type_id: treatmentTypeId },
    );
    return data;
  },
};
