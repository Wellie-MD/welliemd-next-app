type ApiErrorBody = {
  detail?: string;
  error?: string;
  message?: string;
  non_field_errors?: string[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const formatBodyMessage = (body: unknown): string | null => {
  if (typeof body === "string") return body;
  if (!isRecord(body)) return null;

  const data = body as ApiErrorBody;
  const directMessage = data.detail || data.error || data.message;
  if (directMessage) return directMessage;
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
    return data.non_field_errors.join(" ");
  }

  const firstFieldError = Object.values(body).find((value) => {
    if (typeof value === "string") return true;
    return Array.isArray(value) && value.every((item) => typeof item === "string");
  });

  if (typeof firstFieldError === "string") return firstFieldError;
  if (Array.isArray(firstFieldError)) return firstFieldError.join(" ");

  return null;
};

export const getTreatmentApiErrorMessage = (error: unknown, fallback: string) => {
  if (!isRecord(error)) return fallback;

  const response = error.response;
  if (isRecord(response)) {
    const status = typeof response.status === "number" ? response.status : undefined;
    const bodyMessage = formatBodyMessage(response.data);
    if (status && bodyMessage) return `${status}: ${bodyMessage}`;
    if (bodyMessage) return bodyMessage;
    if (status) return `${status}: ${fallback}`;
  }

  if (typeof error.message === "string") return error.message;
  return fallback;
};
