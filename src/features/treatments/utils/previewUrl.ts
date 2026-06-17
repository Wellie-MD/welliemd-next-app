export type QuestionnairePreviewMode = "program" | "custom_program";

export interface QuestionnairePreviewContext {
  mode: QuestionnairePreviewMode;
  id: string;
  slug?: string;
  title?: string;
}

const DEFAULT_LOCAL_QUESTIONNAIRE_URL = "http://localhost:3001";

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, "");

export const getQuestionnairePreviewBaseUrl = () => {
  return normalizeBaseUrl(
    import.meta.env.VITE_QUESTIONNAIRE_PREVIEW_BASE_URL || DEFAULT_LOCAL_QUESTIONNAIRE_URL
  );
};

export const buildQuestionnairePreviewUrl = (context: QuestionnairePreviewContext) => {
  const baseUrl = getQuestionnairePreviewBaseUrl();
  const params = new URLSearchParams({
    preview: "true",
    source: "admin",
    disable_side_effects: "true",
    mode: context.mode,
  });

  if (context.mode === "program") {
    params.set("program_id", context.id);
  } else {
    params.set("custom_program_id", context.id);
  }

  if (context.slug) params.set("slug", context.slug);
  if (context.title) params.set("title", context.title);

  return `${baseUrl}/preview?${params.toString()}`;
};
