type ApiErrorData = {
  detail?: string;
  error?: string;
  message?: string;
  non_field_errors?: string[];
  details?: {
    non_field_errors?: string[];
  };
  questions?: unknown;
  screening_questions?: unknown;
  flow_items?: unknown;
};

import { safeAssignmentMessage } from "@/features/treatments/assignment/constants";

type ApiErrorLike = {
  response?: { data?: ApiErrorData };
  message?: string;
};

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiErrorLike;
  const data = apiError.response?.data;
  const validationMessage = (
    data?.non_field_errors || data?.details?.non_field_errors
  )?.filter(Boolean).join(" ");
  return safeAssignmentMessage(
    validationMessage ||
    data?.questions ||
    data?.screening_questions ||
    data?.flow_items ||
    data?.detail ||
    data?.error ||
    data?.message ||
    apiError.message ||
    fallback
  );
};
