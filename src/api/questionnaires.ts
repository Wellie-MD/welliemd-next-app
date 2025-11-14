/**
 * Questionnaire Template & Question Management API for Admin Portal
 *
 * This service provides API functions for managing questionnaire templates and questions
 * in the admin portal, with support for read-only question enforcement.
 */
import axiosInstance from "./axiosInstance";

// ==================== TYPES ====================

export interface QuestionnaireTemplate {
  id: string;
  name: string;
  description?: string;
  questionnaire_type: "onboarding" | "follow_up"; // Onboarding or Follow-up
  treatment_type?: string; // Weight Loss, GLP-1, ED, etc.
  beluga_visit_type?: string; // Visit type (Initial Visit, Follow-up Consultation, etc.)
  requires_photo_upload: boolean;
  requires_identity_verification: boolean;
  is_published: boolean;
  is_admin_template?: boolean;
  created_at: string;
  updated_at: string;
  questions?: Question[];
  question_count?: number;
}

export interface ConsentForm {
  id?: string;
  consent_type: string;
  consent_text: string;
  requires_agreement: boolean;
  is_disqualifying: boolean;
  beluga_consent_code?: string;
}

export interface Question {
  id: string;
  question_text: string;
  question_type:
    | "text"
    | "textarea"
    | "single_choice"
    | "multiple_choice"
    | "number"
    | "date"
    | "height_weight"
    | "consent"
    | "file_upload";
  is_required: boolean;
  is_read_only: boolean;
  order_index: number;
  answer_choices: string[];
  conditional_logic: Record<string, any>;
  validation_rules: Record<string, any>;
  beluga_field_mapping: string;
  include_in_qa_section: boolean;
  is_client_custom: boolean;
  can_be_modified: boolean;
  consent_form?: ConsentForm;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplatePayload {
  name: string;
  description?: string;
  questionnaire_type: "onboarding" | "follow_up";
  treatment_type?: string;
  beluga_visit_type?: string;
  requires_photo_upload?: boolean;
  requires_identity_verification?: boolean;
  is_admin_template?: boolean;
}

export interface UpdateTemplatePayload {
  name?: string;
  description?: string;
  questionnaire_type?: "onboarding" | "follow_up";
  treatment_type?: string;
  beluga_visit_type?: string;
  requires_photo_upload?: boolean;
  requires_identity_verification?: boolean;
  is_admin_template?: boolean;
}

export interface CreateQuestionPayload {
  template_id: string;
  question_text: string;
  question_type: string;
  is_required: boolean;
  is_read_only?: boolean;
  answer_choices?: string[];
  conditional_logic?: Record<string, unknown>;
  validation_rules?: Record<string, unknown>;
  beluga_field_mapping?: string;
  include_in_qa_section?: boolean;
  consent_form_data?: Omit<ConsentForm, 'id'>;
}

export interface UpdateQuestionPayload {
  question_text?: string;
  question_type?: string;
  is_required?: boolean;
  is_read_only?: boolean;
  answer_choices?: string[];
  conditional_logic?: Record<string, unknown>;
  validation_rules?: Record<string, unknown>;
  beluga_field_mapping?: string;
  include_in_qa_section?: boolean;
}

// ==================== TEMPLATE API ====================

export const templateApi = {
  listTemplates: async (): Promise<QuestionnaireTemplate[]> => {
    const { data } = await axiosInstance.get<QuestionnaireTemplate[]>(
      "questionnaires/frontend/templates/"
    );
    return data;
  },

  getTemplate: async (id: string): Promise<QuestionnaireTemplate> => {
    const { data } = await axiosInstance.get<QuestionnaireTemplate>(
      `questionnaires/frontend/templates/${id}/`
    );
    return data;
  },

  createTemplate: async (
    payload: CreateTemplatePayload
  ): Promise<QuestionnaireTemplate> => {
    const { data } = await axiosInstance.post<QuestionnaireTemplate>(
      "questionnaires/frontend/templates/",
      payload
    );
    return data;
  },

  updateTemplate: async (
    id: string,
    payload: Partial<CreateTemplatePayload>
  ): Promise<QuestionnaireTemplate> => {
    const { data } = await axiosInstance.put<QuestionnaireTemplate>(
      `questionnaires/frontend/templates/${id}/`,
      payload
    );
    return data;
  },

  deleteTemplate: async (id: string): Promise<void> => {
    await axiosInstance.delete(`questionnaires/frontend/templates/${id}/`);
  },

  publishTemplate: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    const { data } = await axiosInstance.post(
      `questionnaires/frontend/templates/${id}/publish/`
    );
    return data;
  },

  unpublishTemplate: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    const { data } = await axiosInstance.post(
      `questionnaires/frontend/templates/${id}/unpublish/`
    );
    return data;
  },
};

// Legacy exports for backward compatibility
export const getTemplates = templateApi.listTemplates;
export const getTemplate = templateApi.getTemplate;
export const createTemplate = templateApi.createTemplate;
export const updateTemplate = templateApi.updateTemplate;
export const deleteTemplate = templateApi.deleteTemplate;
export const publishTemplate = templateApi.publishTemplate;
export const unpublishTemplate = templateApi.unpublishTemplate;

// ==================== QUESTION API ====================

export const questionApi = {
  listQuestions: async (templateId: string): Promise<Question[]> => {
    const { data } = await axiosInstance.get<Question[]>(
      `questionnaires/frontend/questions/?template_id=${templateId}`
    );
    return data;
  },

  getQuestion: async (id: string): Promise<Question> => {
    const { data } = await axiosInstance.get<Question>(
      `questionnaires/frontend/questions/${id}/`
    );
    return data;
  },

  createQuestion: async (payload: CreateQuestionPayload): Promise<Question> => {
    // Ensure is_read_only is set to true for admin-created questions
    const questionData = {
      ...payload,
      is_read_only:
        payload.is_read_only !== undefined ? payload.is_read_only : true,
    };

    const { data } = await axiosInstance.post<Question>(
      "questionnaires/frontend/questions/",
      questionData
    );
    return data;
  },

  updateQuestion: async (
    id: string,
    payload: Partial<CreateQuestionPayload>
  ): Promise<Question> => {
    const { data } = await axiosInstance.put<Question>(
      `questionnaires/frontend/questions/${id}/`,
      payload
    );
    return data;
  },

  deleteQuestion: async (id: string): Promise<void> => {
    await axiosInstance.delete(`questionnaires/frontend/questions/${id}/`);
  },

  reorderQuestions: async (
    templateId: string,
    questionOrder: string[]
  ): Promise<{ success: boolean; message: string }> => {
    const { data } = await axiosInstance.post(
      "questionnaires/frontend/questions/reorder/",
      {
        template_id: templateId,
        question_order: questionOrder,
      }
    );
    return data;
  },
};

// Legacy exports for backward compatibility
export const getQuestions = questionApi.listQuestions;
export const getQuestion = questionApi.getQuestion;
export const createQuestion = questionApi.createQuestion;
export const updateQuestion = questionApi.updateQuestion;
export const deleteQuestion = questionApi.deleteQuestion;
export const reorderQuestions = questionApi.reorderQuestions;

// ==================== TEMPLATE ASSIGNMENT API ====================

export interface AssignmentResult {
  template_id: string;
  template_name: string;
  client_id: string;
  client_name: string;
  success: boolean;
  client_template_id?: string;
  status_code?: number;
  error?: string;
}

export interface AssignTemplatesPayload {
  template_ids: string[];
  client_ids: string[];
}

export interface AssignTemplatesResponse {
  success: boolean;
  message: string;
  total_assignments: number;
  successful: number;
  failed: number;
  assignments: AssignmentResult[];
}

export interface TemplateAssignmentLog {
  id: string;
  template_id: string;
  template_name: string;
  template_version?: string;
  client_id: string;
  client_name: string;
  status: "pending" | "success" | "failed" | "retrying";
  retry_count: number;
  assigned_by: string;
  assigned_by_email: string;
  assigned_at: string;
  completed_at?: string;
  duration_seconds?: number;
  response_status_code?: number;
  error_message?: string;
}

export interface AssignmentHistoryParams {
  client_id?: string;
  template_id?: string;
  status?: "pending" | "success" | "failed" | "retrying";
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

export interface AssignmentHistoryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TemplateAssignmentLog[];
}

export interface RetryAssignmentResponse {
  success: boolean;
  message: string;
  assignment?: TemplateAssignmentLog;
  error?: string;
}

export const assignmentApi = {
  /**
   * Assign templates to clients
   * POST /api/v1/questionnaires/admin/template-assignments/assign/
   */
  assignToClients: async (
    payload: AssignTemplatesPayload
  ): Promise<AssignTemplatesResponse> => {
    const { data } = await axiosInstance.post<AssignTemplatesResponse>(
      "questionnaires/admin/template-assignments/assign/",
      payload
    );
    return data;
  },

  /**
   * Get assignment history with filtering and pagination
   * GET /api/v1/questionnaires/admin/template-assignments/assignment-history/
   */
  getAssignmentHistory: async (
    params?: AssignmentHistoryParams
  ): Promise<AssignmentHistoryResponse> => {
    const { data } = await axiosInstance.get<AssignmentHistoryResponse>(
      "questionnaires/admin/template-assignments/assignment-history/",
      { params }
    );
    return data;
  },

  /**
   * Retry a failed assignment
   * POST /api/v1/questionnaires/admin/template-assignments/{log_id}/retry/
   */
  retryAssignment: async (logId: string): Promise<RetryAssignmentResponse> => {
    const { data } = await axiosInstance.post<RetryAssignmentResponse>(
      `questionnaires/admin/template-assignments/${logId}/retry/`
    );
    return data;
  },
};

// Legacy exports for backward compatibility
export const assignTemplatesToClients = assignmentApi.assignToClients;
export const getAssignmentHistory = assignmentApi.getAssignmentHistory;
export const retryAssignment = assignmentApi.retryAssignment;

// ==================== EXPORTS ====================

export const questionnaireApi = {
  // Template operations
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  publishTemplate,
  unpublishTemplate,

  // Question operations
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,

  // Assignment operations
  assignToClients: assignmentApi.assignToClients,
  getAssignmentHistory: assignmentApi.getAssignmentHistory,
  retryAssignment: assignmentApi.retryAssignment,
};

export default questionnaireApi;
