import {
  QUESTIONNAIRE_PREVIEW_FRAGMENT,
} from "@/features/treatments/preview/constants";

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, "");

const localDevelopmentUrl = (kind: "app" | "api") => {
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  if (!import.meta.env.DEV || !["localhost", "127.0.0.1"].includes(host)) {
    return "";
  }
  return kind === "app" ? "http://localhost:3001" : "http://localhost:8000/api/v1";
};

interface CapabilityPreviewContext {
  capabilityToken: string;
  apiBaseUrl?: string;
  snapshotChecksum: string;
  snapshotId: string;
}

export const getQuestionnairePreviewBaseUrl = () => {
  const configured = import.meta.env.VITE_QUESTIONNAIRE_PREVIEW_BASE_URL || localDevelopmentUrl("app");
  if (!configured) throw new Error("Questionnaire preview URL is not configured for this environment.");
  return normalizeBaseUrl(configured);
};

export const getQuestionnairePreviewApiBaseUrl = () => {
  const configured = import.meta.env.VITE_API_BASE_URL || localDevelopmentUrl("api");
  if (!configured) throw new Error("Preview API URL is not configured for this environment.");
  return normalizeBaseUrl(configured);
};

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
