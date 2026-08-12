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
      // Not JSON string
    }
  }

  const dataObj = typeof rawData === "object" && rawData !== null ? rawData : {};
  const messages = flattenDetails(dataObj.details);

  if (messages.length) {
    return `${messages.join(" ")} Update the named Product or its checkout option, then refresh the preview.`;
  }

  if (typeof dataObj.detail === "string" && dataObj.detail.trim()) {
    return dataObj.detail;
  }

  if (dataObj.error === "preview_configuration_invalid" || err?.response?.status === 409) {
    return "One or more products in this program are inactive or missing a Treatment Type. Update the product configuration in Product Management, then refresh the preview.";
  }

  if (typeof dataObj.error === "string" && dataObj.error.trim()) {
    return dataObj.error;
  }

  const rawMessage = err?.message || "";
  if (/status code 409/i.test(rawMessage)) {
    return "One or more products in this program are inactive or missing a Treatment Type. Update the product configuration in Product Management, then refresh the preview.";
  }

  return rawMessage || "The questionnaire preview could not be prepared.";
};

