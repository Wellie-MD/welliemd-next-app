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

const blockerText = (message: unknown): string => {
  if (typeof message === "string") return message;
  if (message && typeof message === "object") {
    return Object.entries(message as Record<string, unknown>)
      .flatMap(([field, value]) => (Array.isArray(value) ? value.map((item) => `${field}: ${String(item)}`) : [`${field}: ${String(value)}`]))
      .join("; ");
  }
  return String(message);
};

const blockersMessage = (error: unknown): string | null => {
  const data = responseData(error);
  const blockers = data.blockers;
  if (Array.isArray(blockers) && blockers.length > 0) {
    return blockers
      .map((blocker) => (blocker && typeof blocker === "object" ? blockerText((blocker as Record<string, unknown>).message) : String(blocker)))
      .join(" ");
  }
  if (data.details) return blockerText(data.details);
  return null;
};

export const customProgramMutationErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (isCustomProgramRevisionConflict(error)) {
    return "This Custom Program was changed in another Admin session. Refresh it before saving or publishing again.";
  }
  return blockersMessage(error) || fallback;
};
