/**
 * Treatments API - Programs & CustomPrograms Management
 */
import axiosInstance from "./axiosInstance";

// ==================== TYPES ====================

export interface ProgramAssignmentLog {
  id: string;
  program_id: string;
  program_name: string;
  client_id: string;
  client_name: string;
  status: "pending" | "success" | "failed" | "retrying";
  retry_count: number;
  assigned_by_email: string;
  assigned_at: string;
  completed_at?: string;
  duration_seconds?: number;
  response_status_code?: number;
  error_message?: string;
}

export interface CustomProgramAssignmentLog {
  id: string;
  custom_program_id: string;
  custom_program_name: string;
  client_id: string;
  client_name: string;
  status: "pending" | "success" | "failed" | "retrying";
  retry_count: number;
  assigned_by_email: string;
  assigned_at: string;
  completed_at?: string;
  duration_seconds?: number;
  response_status_code?: number;
  error_message?: string;
}

export interface AssignmentHistoryParams {
  client_id?: string;
  program_id?: string;
  custom_program_id?: string;
  status?: "pending" | "success" | "failed" | "retrying";
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface AssignmentHistoryResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ==================== API CLIENTS ====================

export interface ReAssignPayload {
  program_ids: string[];
  client_ids: string[];
}

export interface ReAssignResponse {
  message: string;
  total: number;
  success_count: number;
  failure_count: number;
  results: Array<{
    program_id: string;
    client_id: string;
    success: boolean;
    message: string;
    status_code?: number;
  }>;
}

export const programAssignmentHistoryApi = {
  getHistory: async (
    params?: AssignmentHistoryParams
  ): Promise<AssignmentHistoryResponse<ProgramAssignmentLog>> => {
    const { data } = await axiosInstance.get<AssignmentHistoryResponse<ProgramAssignmentLog>>(
      "treatments/program-assignment-history/",
      { params }
    );
    return data;
  },

  reAssign: async (payload: ReAssignPayload): Promise<ReAssignResponse> => {
    const { data } = await axiosInstance.post<ReAssignResponse>(
      "treatments/programs/re_assign/",
      payload
    );
    return data;
  },
};

export const customProgramAssignmentHistoryApi = {
  getHistory: async (
    params?: AssignmentHistoryParams
  ): Promise<AssignmentHistoryResponse<CustomProgramAssignmentLog>> => {
    const { data } = await axiosInstance.get<AssignmentHistoryResponse<CustomProgramAssignmentLog>>(
      "treatments/custom-program-assignment-history/",
      { params }
    );
    return data;
  },

  reAssign: async (payload: ReAssignPayload): Promise<ReAssignResponse> => {
    const { data } = await axiosInstance.post<ReAssignResponse>(
      "treatments/custom-programs/re_assign/",
      payload
    );
    return data;
  },
};

// ==================== EXPORTS ====================

export const treatmentsApi = {
  programAssignmentHistory: programAssignmentHistoryApi,
  customProgramAssignmentHistory: customProgramAssignmentHistoryApi,
};

export default treatmentsApi;
