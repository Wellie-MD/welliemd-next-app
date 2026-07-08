import type { PreviewContext } from "@/features/treatments/types";

const DEFAULT_LOCAL_QUESTIONNAIRE_URL = "http://localhost:3001";

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

  if (context.type === "program" && context.slug) {
    return {
      url: `${baseUrl}/visit/${context.slug}?${params.toString()}`,
      supported: true,
    };
  }

  return {
    url: `${baseUrl}/preview?${params.toString()}`,
    supported: false,
    reason:
      "Custom program preview is not wired to questionnaire runtime yet because the questionnaire app does not consume custom_program preview routes.",
  };
};

export const buildQuestionnairePreviewUrl = (context: PreviewContext) =>
  buildQuestionnairePreviewTarget(context).url;
