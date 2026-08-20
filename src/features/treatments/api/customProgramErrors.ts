const responseData = (error: unknown): Record<string, unknown> => {
  const response = (error as { response?: { data?: unknown } } | null)?.response;
  return response?.data && typeof response.data === "object"
    ? response.data as Record<string, unknown>
    : {};
};

export const isCustomProgramRevisionConflict = (error: unknown): boolean => {
  const data = responseData(error);
  const detail = data.detail;
  const detailRecord = detail && typeof detail === "object"
    ? detail as Record<string, unknown>
    : null;
  return (
    data.error === "stale_builder_revision"
    || data.code === "stale_builder_revision"
    || detail === "stale_builder_revision"
    || detailRecord?.detail === "stale_builder_revision"
    || detailRecord?.code === "stale_builder_revision"
  );
};

const diagnosticText = (value: unknown): string[] => {
  if (typeof value === "string" && value.trim()) return [value.trim()];
  if (Array.isArray(value)) return value.flatMap(diagnosticText);
  if (!value || typeof value !== "object") return [];

  const record = value as Record<string, unknown>;
  if (typeof record.message === "string" && record.message.trim()) {
    return [record.message.trim()];
  }
  return Object.entries(record).flatMap(([key, nested]) =>
    diagnosticText(nested).map((message) => `${key}: ${message}`),
  );
};

export const customProgramMutationErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (isCustomProgramRevisionConflict(error)) {
    return "This Custom Program was changed in another Admin session. Refresh it before saving or publishing again.";
  }

  const data = responseData(error);
  const messages = [
    ...diagnosticText(data.details),
    ...diagnosticText(data.blockers),
    ...diagnosticText(data.unpublished_programs).map((message) => `Included Program: ${message}`),
  ];
  const uniqueMessages = [...new Set(messages)];
  return uniqueMessages.length > 0 ? uniqueMessages.join(" ") : fallback;
};
