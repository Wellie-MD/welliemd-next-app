import axiosInstance from "@/api/axiosInstance";

export interface ProgramAssignmentResult {
  program_id: string;
  client_id: string;
  success: boolean;
  already_assigned?: boolean;
  message: string;
  status_code?: number | null;
}

export interface ProgramAssignmentResponse {
  message: string;
  total: number;
  success_count: number;
  failure_count: number;
  results: ProgramAssignmentResult[];
}

export interface BulkAssignmentRequest {
  program_ids: (string | number)[];
  client_ids: string[];
}

export const programAssignmentApi = {
  bulkAssignPrograms: async (data: BulkAssignmentRequest): Promise<ProgramAssignmentResponse> => {
    const response = await axiosInstance.post("/treatments/programs/bulk_assign/", data);
    return response.data;
  },

  bulkAssignCustomPrograms: async (data: BulkAssignmentRequest): Promise<ProgramAssignmentResponse> => {
    const response = await axiosInstance.post("/treatments/custom-programs/bulk_assign/", data);
    return response.data;
  },
};
