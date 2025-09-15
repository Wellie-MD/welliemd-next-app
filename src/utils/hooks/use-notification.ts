import { apiHandler } from '@/utils/api-handler';

// Simple wrapper around apiHandler for consistent usage
export const useNotification = () => {
  return {
    success: (message: string) => apiHandler.showSuccess(message),
    error: (message: string) => apiHandler.showError(message),
    handleApiResponse: apiHandler.handleSuccess.bind(apiHandler),
    handleApiError: apiHandler.handleError.bind(apiHandler),
    getErrorMessage: apiHandler.getErrorMessage.bind(apiHandler),
  };
};

// Export for direct usage
export const notify = {
  success: (message: string) => apiHandler.showSuccess(message),
  error: (message: string) => apiHandler.showError(message),
  handleApiResponse: apiHandler.handleSuccess.bind(apiHandler),
  handleApiError: apiHandler.handleError.bind(apiHandler),
  getErrorMessage: apiHandler.getErrorMessage.bind(apiHandler),
};
