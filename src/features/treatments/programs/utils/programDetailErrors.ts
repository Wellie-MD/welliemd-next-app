type ApiErrorData = {
  detail?: string;
  error?: string;
  message?: string;
};

import { safeAssignmentMessage } from "@/features/treatments/assignment/constants";

type ApiErrorLike = {
  response?: { data?: ApiErrorData };
  message?: string;
};

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiErrorLike;
  return safeAssignmentMessage(
    apiError.response?.data?.detail ||
    apiError.response?.data?.error ||
    apiError.response?.data?.message ||
    apiError.message ||
    fallback
  );
};
