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

/**
 * Auto-derives the questionnaire app's base URL from the current window origin.
 *
 * Resolution order:
 *   1. VITE_QUESTIONNAIRE_PREVIEW_BASE_URL env var (explicit override for non-standard setups)
 *   2. localhost  → http://localhost:3001 (questionnaire app's local dev port, see its .env PORT)
 *   3. hostname starting with "admin" → replace first segment with "intake"
 *      e.g. admin.welliemd.com → intake.welliemd.com
 *           admin-staging.welliemd.com → intake-staging.welliemd.com
 *   4. Fallback to the hardcoded constant (should never be reached in practice)
 */
export const getQuestionnairePreviewBaseUrl = (): string => {
  // 1. Explicit env override takes priority (escape hatch for non-standard deploys)
  if (import.meta.env.VITE_QUESTIONNAIRE_PREVIEW_BASE_URL) {
    return normalizeBaseUrl(import.meta.env.VITE_QUESTIONNAIRE_PREVIEW_BASE_URL as string);
  }

  const { protocol, hostname } = window.location;

  // 2. Localhost — questionnaire app's dev server runs on port 3001 (its .env pins PORT=3001;
  //    3000 is the patient portal, a different app, and would 404 on /preview)
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:3001";
  }

  // 3. Subdomain convention: replace leading "admin" segment with "intake"
  //    Handles: admin.X.com, admin-staging.X.com, admin-prod.X.com, etc.
  if (hostname.startsWith("admin")) {
    const derivedHost = hostname.replace(/^admin/, "intake");
    return normalizeBaseUrl(`${protocol}//${derivedHost}`);
  }

  // 4. Fallback — should not be hit in practice on standard deployments
  return QUESTIONNAIRE_PREVIEW_DEFAULTS.appBaseUrl;
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
