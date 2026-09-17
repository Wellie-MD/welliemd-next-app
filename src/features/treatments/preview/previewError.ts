type ErrorDetails = string | string[] | Record<string, unknown>;

const flattenDetails = (details: unknown): string[] => {
  if (typeof details === "string") return [details];
  if (Array.isArray(details)) return details.flatMap(flattenDetails);
  if (details && typeof details === "object") {
    return Object.values(details as Record<string, unknown>).flatMap(flattenDetails);
  }
  return [];
};

export const getPreviewErrorMessage = (error: unknown) => {
  const err = error as {
    response?: {
      status?: number;
      data?: { details?: ErrorDetails; detail?: string; error?: string } | string;
    };
    message?: string;
  };

  let rawData = err?.response?.data;
  if (typeof rawData === "string") {
    try {
      rawData = JSON.parse(rawData);
    } catch {
      // A non-JSON response is handled by the generic fallback below.
    }
  }

  const data = typeof rawData === "object" && rawData !== null ? rawData : {};
  const messages = flattenDetails(data.details).filter((message) => message.trim());
  if (messages.length) return messages.join(" ");

  if (typeof data.detail === "string" && data.detail.trim()) return data.detail;

  if (data.error === "preview_configuration_invalid" || err?.response?.status === 409) {
    return "The questionnaire preview is blocked by a configuration conflict. Resolve the reported configuration issue, then refresh the preview.";
  }

  if (typeof data.error === "string" && data.error.trim()) return data.error;
  return err?.message || "The questionnaire preview could not be prepared.";
};
