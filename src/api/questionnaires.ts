/**
 * Questionnaire Template & Question Management API for Admin Portal
 *
 * This service provides API functions for managing questionnaire templates and questions
 * in the admin portal, with support for read-only question enforcement.
 */
import axiosInstance from "./axiosInstance";
import type { AxiosRequestConfig } from "axios";

// ==================== TYPES ====================

export interface QuestionnaireTemplate {
  id: string;
  name: string;
  description?: string;
  questionnaire_type: "onboarding" | "follow_up"; // Onboarding or Follow-up
  treatment_type?: string; // Weight Loss, GLP-1, ED, etc.
  beluga_visit_type?: string; // Visit type (Initial Visit, Follow-up Consultation, etc.)
  slug?: string; // Optional routing slug (required for duplicate visit types)
  requires_photo_upload?: boolean;
  requires_labs: boolean;
  requires_identity_verification?: boolean;
  min_age?: number;
  is_published: boolean;
  is_admin_template?: boolean;
  is_modified_need_to_re_assigned?: boolean; // True if template was modified and needs re-assignment

  // Phase 2 additions
  primary_category?: number; // Primary product category for automated dose injection
  primary_category_name?: string; // Category name for display
  default_followup_template?: string | null;
  default_followup_template_name?: string | null;
  default_followup_source_template_id?: string | null;

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
  | "email"
  | "phone"
  | "state_routing"
  | "zip"
  | "single_choice"
  | "multiple_choice"
  | "number"
  | "date"
  | "height_weight"
  | "consent"
  | "file_upload"
  | "checkout"
  | "personal_details"
  | "shipping_address"
  | "sex"
  | "self_reported_meds"
  | "allergies"
  | "medical_conditions"
  | "product_selection"
  | "medication_dose_selector"
  | "labs"
  | "state_routing";
  is_required: boolean;
  is_read_only: boolean;
  order_index: number;
  answer_choices: Array<string | Record<string, unknown>>;
  conditional_logic: Record<string, unknown>;
  validation_rules: Record<string, unknown>;
  beluga_field_mapping: string;
  include_in_qa_section: boolean;
  is_client_custom: boolean;
  can_be_modified: boolean;
  consent_form?: ConsentForm;
  parent_question?: string | null; // UUID of parent question for grouped questions
  sub_questions?: SubQuestion[]; // Sub-questions for grouped question types

  // Phase 1 additions
  is_strength_question?: boolean; // Mark if this question asks for medication strength/dose
  checkout_category?: number; // Product category for checkout questions
  checkout_allowed_regimens?: number[]; // Allowed titration categories for checkout questions

  created_at: string;
  updated_at: string;
}

export interface SubQuestion {
  id: string;
  question_text: string;
  question_type: "text" | "email" | "phone" | "state_routing" | "zip" | "number" | "date";
  is_required: boolean;
  order_index: number;
  validation_rules: Record<string, unknown>;
  answer_choices: string[];
}

export interface CreateTemplatePayload {
  name: string;
  description?: string;
  questionnaire_type: "onboarding" | "follow_up";
  treatment_type?: string;
  beluga_visit_type?: string;
  slug?: string;
  requires_photo_upload?: boolean;
  requires_labs?: boolean;
  requires_identity_verification?: boolean;
  min_age?: number;
  is_admin_template?: boolean;
  default_followup_template?: string | null;
}

export interface UpdateTemplatePayload {
  name?: string;
  description?: string;
  questionnaire_type?: "onboarding" | "follow_up";
  treatment_type?: string;
  beluga_visit_type?: string;
  slug?: string;
  requires_photo_upload?: boolean;
  requires_labs?: boolean;
  requires_identity_verification?: boolean;
  min_age?: number;
  is_admin_template?: boolean;
  default_followup_template?: string | null;
}

export interface CreateQuestionPayload {
  template_id: string;
  question_text: string;
  question_type: string;
  is_required: boolean;
  is_read_only?: boolean;
  answer_choices?: unknown[];
  conditional_logic?: Record<string, unknown>;
  validation_rules?: Record<string, unknown>;
  beluga_field_mapping?: string;
  include_in_qa_section?: boolean;
  consent_form_data?: Omit<ConsentForm, 'id'>;
  parent_question?: string | null; // UUID of parent question for sub-questions
  sub_questions?: Omit<SubQuestion, 'id'>[]; // Sub-questions to create for grouped questions
}

export interface UpdateQuestionPayload {
  question_text?: string;
  question_type?: string;
  is_required?: boolean;
  is_read_only?: boolean;
  answer_choices?: unknown[];
  conditional_logic?: Record<string, unknown>;
  validation_rules?: Record<string, unknown>;
  beluga_field_mapping?: string;
  include_in_qa_section?: boolean;
  parent_question?: string | null;
  sub_questions?: Omit<SubQuestion, 'id'>[];
}

// ==================== TEMPLATE API ====================

export const templateApi = {
  listTemplates: async (): Promise<QuestionnaireTemplate[]> => {
    const aggregated: QuestionnaireTemplate[] = [];
    let nextUrl: string | null = "questionnaires/frontend/templates/?page_size=100";

    while (nextUrl) {
      const { data } = await axiosInstance.get<
        | QuestionnaireTemplate[]
        | {
            results?: QuestionnaireTemplate[];
            next?: string | null;
          }
      >(nextUrl);

      if (Array.isArray(data)) {
        aggregated.push(...data);
        nextUrl = null;
        continue;
      }

      if (data && Array.isArray(data.results)) {
        aggregated.push(...data.results);
        nextUrl = data.next || null;
        continue;
      }

      nextUrl = null;
    }

    return aggregated;
  },

  getTemplate: async (
    id: string,
    config?: AxiosRequestConfig
  ): Promise<QuestionnaireTemplate> => {
    const { data } = await axiosInstance.get<QuestionnaireTemplate>(
      `questionnaires/frontend/templates/${id}/`,
      config
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
   * Re-assign modified templates to clients (force update)
   * POST /api/v1/questionnaires/admin/template-assignments/re-assign/
   */
  reAssignToClients: async (
    payload: AssignTemplatesPayload
  ): Promise<AssignTemplatesResponse> => {
    const { data } = await axiosInstance.post<AssignTemplatesResponse>(
      "questionnaires/admin/template-assignments/re-assign/",
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
   * Archive templates on client databases
   */
  archiveTemplates: async (payload: {
    template_ids: string[];
    client_ids: string[];
  }) => {
    const { data } = await axiosInstance.post(
      'questionnaires/admin/template-assignments/archive/',
      payload
    );
    return data;
  },

  /**
   * Unarchive templates on client databases
   */
  unarchiveTemplates: async (payload: {
    template_ids: string[];
    client_ids: string[];
  }) => {
    const { data } = await axiosInstance.post(
      'questionnaires/admin/template-assignments/unarchive/',
      payload
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
