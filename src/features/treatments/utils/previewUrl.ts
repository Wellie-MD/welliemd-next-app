import type { PreviewContext } from "@/features/treatments/types";

const DEFAULT_LOCAL_QUESTIONNAIRE_URL = "http://localhost:3001";
const DEFAULT_LOCAL_API_BASE_URL = "http://localhost:8000/api/v1";

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, "");

export interface QuestionnairePreviewTarget {
  url: string;
  supported: boolean;
  reason?: string;
}

export const getQuestionnairePreviewBaseUrl = () => {
  return normalizeBaseUrl(
    import.meta.env.VITE_QUESTIONNAIRE_PREVIEW_BASE_URL || DEFAULT_LOCAL_QUESTIONNAIRE_URL
  );
};

export const getQuestionnairePreviewApiBaseUrl = () => {
  return normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || DEFAULT_LOCAL_API_BASE_URL);
};

export const buildQuestionnairePreviewTarget = (
  context: PreviewContext
): QuestionnairePreviewTarget => {
  const baseUrl = getQuestionnairePreviewBaseUrl();
  const params = new URLSearchParams({
    preview: "true",
    source: "admin",
    disable_side_effects: "true",
    mode: context.type,
  });

  params.set(
    context.type === "program" ? "program_id" : "custom_program_id",
    context.id
  );

  if (context.slug) params.set("slug", context.slug);
  if (context.apiBaseUrl) params.set("api_base_url", context.apiBaseUrl);

  if (context.type === "program") {
    if (context.visitType) params.set("visit_type", context.visitType);
    if (context.templateId) params.set("template_id", context.templateId);

    return {
      url: `${baseUrl}/preview?${params.toString()}`,
      supported: true,
    };
  }

  return {
    url: `${baseUrl}/preview?${params.toString()}`,
    supported: context.type !== "section",
    reason:
      context.type === "custom_program"
        ? undefined
        : "Section preview is not wired to questionnaire runtime yet because sections do not have a standalone runtime route.",
  };
};

export const buildQuestionnairePreviewUrl = (context: PreviewContext) =>
  buildQuestionnairePreviewTarget(context).url;
