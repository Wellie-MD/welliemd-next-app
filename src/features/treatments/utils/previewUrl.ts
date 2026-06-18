import type { PreviewContext } from "@/features/treatments/types";

const DEFAULT_LOCAL_QUESTIONNAIRE_URL = "http://localhost:3001";

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, "");

export const getQuestionnairePreviewBaseUrl = () => {
  return normalizeBaseUrl(
    import.meta.env.VITE_QUESTIONNAIRE_PREVIEW_BASE_URL || DEFAULT_LOCAL_QUESTIONNAIRE_URL
  );
};

export const buildQuestionnairePreviewUrl = (context: PreviewContext) => {
  const baseUrl = getQuestionnairePreviewBaseUrl();
  const params = new URLSearchParams({
    preview: "true",
    source: "admin",
    disable_side_effects: "true",
    mode: context.type,
  });

  if (context.type === "program") {
    params.set("program_id", context.id);
  } else if (context.type === "custom_program") {
    params.set("custom_program_id", context.id);
  } else if (context.type === "section") {
    params.set("section_id", context.id);
  }

  if (context.slug) params.set("slug", context.slug);
  // Optional title could be passed via context, but the user spec didn't have title in PreviewContext
  // If we want title, we can pass it, but for now we'll stick to the strict type.

  return `${baseUrl}/preview?${params.toString()}`;
};
