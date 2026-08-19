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

export const customProgramMutationErrorMessage = (
  error: unknown,
  fallback: string,
): string => isCustomProgramRevisionConflict(error)
  ? "This Custom Program was changed in another Admin session. Refresh it before saving or publishing again."
  : fallback;
