import type { PreviewContext } from "@/features/treatments/types";
import {
  QUESTIONNAIRE_PREVIEW_DEFAULTS,
  QUESTIONNAIRE_PREVIEW_FRAGMENT,
} from "@/features/treatments/preview/constants";

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, "");

export interface QuestionnairePreviewTarget {
  url: string;
  supported: boolean;
  reason?: string;
}

interface CapabilityPreviewContext {
  capabilityToken: string;
  apiBaseUrl?: string;
  snapshotChecksum: string;
  snapshotId: string;
}

export const getQuestionnairePreviewBaseUrl = () => {
  return normalizeBaseUrl(
    import.meta.env.VITE_QUESTIONNAIRE_PREVIEW_BASE_URL || QUESTIONNAIRE_PREVIEW_DEFAULTS.appBaseUrl
  );
};

export const getQuestionnairePreviewApiBaseUrl = () => {
  return normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || QUESTIONNAIRE_PREVIEW_DEFAULTS.apiBaseUrl);
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
    context.type === "program"
      ? "program_id"
      : context.type === "custom_program"
        ? "custom_program_id"
        : "section_id",
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
      context.type === "section"
        ? "Section preview is not wired to questionnaire runtime yet because sections do not have a standalone runtime route."
        : undefined,
  };
};

export const buildQuestionnairePreviewUrl = (context: PreviewContext) =>
  buildQuestionnairePreviewTarget(context).url;

export const buildCapabilityQuestionnairePreviewUrl = ({
  capabilityToken,
  apiBaseUrl,
  snapshotChecksum,
  snapshotId,
}: CapabilityPreviewContext) => {
  const query = new URLSearchParams({
    api_base_url: apiBaseUrl || getQuestionnairePreviewApiBaseUrl(),
  });
  const fragment = new URLSearchParams({
    [QUESTIONNAIRE_PREVIEW_FRAGMENT.capability]: capabilityToken,
    [QUESTIONNAIRE_PREVIEW_FRAGMENT.snapshotChecksum]: snapshotChecksum,
    [QUESTIONNAIRE_PREVIEW_FRAGMENT.snapshotId]: snapshotId,
  });
  return `${getQuestionnairePreviewBaseUrl()}/preview?${query.toString()}#${fragment.toString()}`;
};
