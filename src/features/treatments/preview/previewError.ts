type ErrorDetails = string | string[] | Record<string, unknown>;

const flattenDetails = (details: unknown): string[] => {
  if (typeof details === "string") return [details];
  if (Array.isArray(details)) return details.flatMap(flattenDetails);
  if (details && typeof details === "object") {
    return Object.values(details as Record<string, unknown>).flatMap(flattenDetails);
  }
  return [];
};

export const getPreviewErrorMessage = (error: {
  response?: { data?: { details?: ErrorDetails; detail?: string; error?: string } };
  message?: string;
}) => {
  const messages = flattenDetails(error?.response?.data?.details);
  if (messages.length) {
    return `${messages.join(" ")} Update the named Product or its checkout option, then refresh the preview.`;
  }
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.error ||
    error?.message ||
    "The questionnaire preview could not be prepared."
  );
};
