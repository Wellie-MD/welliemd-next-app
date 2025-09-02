import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ModernErrorBoundary } from '@/components/error/error-boundary';
import { ToastProvider } from '@/components/ui/toast';

// Create a custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  queryClient?: QueryClient;
}

function AllTheProviders({ 
  children, 
  initialEntries = ['/'],
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  }),
}: {
  children: React.ReactNode;
  initialEntries?: string[];
  queryClient?: QueryClient;
}) {
  return (
    <ModernErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ModernErrorBoundary>
  );
}

function customRender(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const { initialEntries, queryClient, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders initialEntries={initialEntries} queryClient={queryClient}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
}

// Test utilities for authentication
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'patient',
  status: 'active',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockTokens = (overrides = {}) => ({
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 3600,
  tokenType: 'Bearer',
  ...overrides,
});

export const createMockAuthState = (overrides = {}) => ({
  user: createMockUser(),
  tokens: createMockTokens(),
  permissions: ['patient:read:own_data', 'patient:view:appointments'],
  features: {},
  isAuthenticated: true,
  isLoading: false,
  error: null,
  ...overrides,
});

// Test utilities for API responses
export const createMockApiResponse = <T,>(data: T, overrides = {}) => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
  ...overrides,
});

export const createMockApiError = (message = 'Test error', code = 'TEST_ERROR', overrides = {}) => ({
  success: false,
  error: {
    code,
    message,
    details: {},
  },
  timestamp: new Date().toISOString(),
  ...overrides,
});

// Test utilities for patients
export const createMockPatient = (overrides = {}) => ({
  id: 'test-patient-id',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phoneNumber: '+1 (555) 123-4567',
  dateOfBirth: '1990-01-01T00:00:00Z',
  gender: 'male',
  address: {
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345',
    country: 'US',
  },
  emergencyContact: {
    name: 'Jane Doe',
    relationship: 'Spouse',
    phoneNumber: '+1 (555) 987-6543',
  },
  medicalHistory: ['Hypertension', 'Diabetes Type 2'],
  allergies: ['Penicillin'],
  medications: ['Metformin', 'Lisinopril'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Test utilities for appointments
export const createMockAppointment = (overrides = {}) => ({
  id: 'test-appointment-id',
  patientId: 'test-patient-id',
  providerId: 'test-provider-id',
  type: 'consultation',
  status: 'scheduled',
  scheduledAt: '2024-12-25T10:00:00Z',
  duration: 30,
  reason: 'Annual checkup',
  notes: 'Patient reports no issues',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Test utilities for form testing
export const fillForm = async (form: HTMLFormElement, data: Record<string, string>) => {
  const { fireEvent } = await import('@testing-library/react');
  
  Object.entries(data).forEach(([name, value]) => {
    const field = form.querySelector(`[name="${name}"]`) as HTMLInputElement;
    if (field) {
      fireEvent.change(field, { target: { value } });
    }
  });
};

export const submitForm = async (form: HTMLFormElement) => {
  const { fireEvent } = await import('@testing-library/react');
  fireEvent.submit(form);
};

// Test utilities for waiting
export const waitForLoadingToFinish = async () => {
  const { waitForElementToBeRemoved, screen } = await import('@testing-library/react');
  
  try {
    await waitForElementToBeRemoved(
      () => screen.queryByText(/loading/i) || screen.queryByRole('progressbar'),
      { timeout: 5000 }
    );
  } catch {
    // Loading element might not be present
  }
};

// Test utilities for error testing
export const expectErrorMessage = async (message: string) => {
  const { screen, waitFor } = await import('@testing-library/react');
  
  await waitFor(() => {
    expect(screen.getByText(message)).toBeInTheDocument();
  });
};

// Test utilities for accessibility
export const checkAccessibility = async (container: HTMLElement) => {
  const { axe, toHaveNoViolations } = await import('jest-axe');
  expect.extend(toHaveNoViolations);
  
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

// Test utilities for user interactions
export const createUserEvent = async () => {
  const userEvent = await import('@testing-library/user-event');
  return userEvent.default.setup();
};

// Mock implementations for common hooks
export const mockUseAuthStore = (state = {}) => {
  const mockState = {
    ...createMockAuthState(),
    ...state,
  };

  return {
    ...mockState,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    refreshProfile: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    clearError: vi.fn(),
    hasPermission: vi.fn(() => true),
    hasAnyPermission: vi.fn(() => true),
    hasAllPermissions: vi.fn(() => true),
    isFeatureEnabled: vi.fn(() => true),
  };
};

export const mockUseUIStore = (state = {}) => {
  const mockState = {
    toasts: [],
    modals: [],
    sidebar: {
      isOpen: true,
      isCollapsed: false,
      activeSection: 'dashboard',
    },
    globalLoading: false,
    loadingStates: {},
    theme: 'light',
    ...state,
  };

  return {
    ...mockState,
    addToast: vi.fn(),
    removeToast: vi.fn(),
    clearToasts: vi.fn(),
    openModal: vi.fn(),
    closeModal: vi.fn(),
    closeAllModals: vi.fn(),
    setSidebarOpen: vi.fn(),
    toggleSidebar: vi.fn(),
    setSidebarCollapsed: vi.fn(),
    toggleSidebarCollapsed: vi.fn(),
    setActiveSection: vi.fn(),
    setGlobalLoading: vi.fn(),
    setLoading: vi.fn(),
    getLoading: vi.fn(() => false),
    setTheme: vi.fn(),
    showSuccessToast: vi.fn(),
    showErrorToast: vi.fn(),
    showWarningToast: vi.fn(),
    showInfoToast: vi.fn(),
  };
};

// Export everything
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { customRender as render };

// Re-export testing library utilities with our custom render as default
export {
  customRender,
  AllTheProviders,
  createMockUser,
  createMockTokens,
  createMockAuthState,
  createMockApiResponse,
  createMockApiError,
  createMockPatient,
  createMockAppointment,
  fillForm,
  submitForm,
  waitForLoadingToFinish,
  expectErrorMessage,
  checkAccessibility,
  createUserEvent,
  mockUseAuthStore,
  mockUseUIStore,
};
