import { toast } from 'sonner';

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  code?: number;
  message?: string;
  data?: T;
}

// Only client-side specific errors (not duplicating backend constants)
const CLIENT_ERRORS = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  REQUEST_TIMEOUT: 'Request timed out. Please try again.',
  PARSE_ERROR: 'Failed to parse server response.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

class ApiHandler {
  private isDuplicateToast(message: string): boolean {
    const activeToasts = document.querySelectorAll('[data-sonner-toast]');
    return Array.from(activeToasts).some(toast => 
      toast.textContent?.includes(message)
    );
  }

  private showToast(type: 'success' | 'error', message: string, duration = 5000) {
    if (this.isDuplicateToast(message)) {
      return;
    }

    if (type === 'success') {
      toast.success(message, { duration });
    } else {
      toast.error(message, { duration });
    }
  }

  handleSuccess<T>(response: ApiResponse<T>, showToast = true): T | null {
    if (response.message && showToast) {
      this.showToast('success', response.message);
    }
    return response.data || null;
  }

  handleError(error: any, showToast = true): void {
    let message: string;

    if (error?.status === 'error' && error?.message) {
      // Structured API error from backend - use backend message directly
      message = error.message;
    } else if (error?.response?.data?.status === 'error') {
      // Axios error with structured backend response
      message = error.response.data.message || CLIENT_ERRORS.UNKNOWN_ERROR;
    } else if (error?.response?.data?.message) {
      // Legacy backend error format
      message = error.response.data.message;
    } else if (error?.response?.data?.detail) {
      // Django DRF detail format
      message = error.response.data.detail;
    } else if (error?.code === 'ECONNABORTED') {
      // Axios timeout error
      message = CLIENT_ERRORS.REQUEST_TIMEOUT;
    } else if (!error?.response) {
      // Network error
      message = CLIENT_ERRORS.NETWORK_ERROR;
    } else if (error?.message) {
      // Generic error object
      message = error.message;
    } else {
      // Fallback
      message = CLIENT_ERRORS.UNKNOWN_ERROR;
    }

    if (showToast) {
      this.showToast('error', message);
    }

    // Re-throw with structured message for component-level handling
    throw new Error(message);
  }

  // Utility method to extract error message without showing toast
  getErrorMessage(error: any): string {
    try {
      this.handleError(error, false);
    } catch (e: any) {
      return e.message;
    }
    return CLIENT_ERRORS.UNKNOWN_ERROR;
  }

  // Show success toast manually
  showSuccess(message: string) {
    this.showToast('success', message);
  }

  // Show error toast manually
  showError(message: string) {
    this.showToast('error', message);
  }
}

export const apiHandler = new ApiHandler();
