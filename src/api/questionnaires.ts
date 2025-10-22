/**
 * Questionnaire Template & Question Management API with React Flow Integration
 */
import axiosInstance from "./axiosInstance";

// ==================== TYPES ====================

export interface QuestionnaireTemplate {
  id: string;
  name: string;
  description?: string;
  questionnaire_type: string;
  beluga_visit_type?: string;
  requires_photo_upload: boolean;
  requires_identity_verification: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  questions?: Question[];
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
  order_index: number;
  answer_choices: string[];
  conditional_logic: Record<string, any>;
  validation_rules: Record<string, any>;
  beluga_field_mapping: string;
  include_in_qa_section: boolean;
  is_client_custom: boolean;
  can_be_modified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplatePayload {
  name: string;
  description?: string;
  questionnaire_type: string;
  beluga_visit_type?: string;
  requires_photo_upload?: boolean;
  requires_identity_verification?: boolean;
}

export interface CreateQuestionPayload {
  template_id: string;
  question_text: string;
  question_type: string;
  is_required: boolean;
  answer_choices?: string[];
  conditional_logic?: Record<string, any>;
  validation_rules?: Record<string, any>;
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
    const { data } = await axiosInstance.post<Question>(
      "questionnaires/frontend/questions/",
      payload
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
