// src/api/productAssignmentApi.ts
import axiosInstance from './axiosInstance';

export interface BulkAssignmentRequest {
  product_ids: (string | number)[];
  client_ids: string[];
}

export interface AssignmentResult {
  product_id: string;
  product_name: string;
  client_id: string;
  client_name: string;
  success: boolean;
  error?: string;
  log_id?: string;
}

export interface BulkAssignmentResponse {
  message: string;
  total: number;
  success_count: number;
  failure_count: number;
  results: AssignmentResult[];
}

export const productAssignmentApi = {
  /**
   * Bulk assign multiple products to multiple clients
   */
  bulkAssign: async (data: BulkAssignmentRequest): Promise<BulkAssignmentResponse> => {
    const response = await axiosInstance.post('/products/bulk_assign/', data);
    return response.data;
  },
};
