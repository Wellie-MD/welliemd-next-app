const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const collectErrorMessages = (value: unknown): string[] => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectErrorMessages);
  if (!isRecord(value)) return [];
  return Object.values(value).flatMap(collectErrorMessages);
};

export const isDuplicateSlugError = (error: unknown) => {
  if (!isRecord(error) || !isRecord(error.response)) return false;

  const status = error.response.status;
  const data = error.response.data;
  if (status !== 400 || !isRecord(data)) return false;

  if (data.error_code === "duplicate_slug") return true;

  return collectErrorMessages(data.slug).some((message) => {
    const normalized = message.toLowerCase();
    return (
      normalized.includes("unique slug") ||
      normalized.includes("already in use") ||
      normalized.includes("with this slug")
    );
  });
};
