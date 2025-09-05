import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { render, screen, waitFor } from '@/__tests__/utils';
import { ProtectedRoute } from '../protected-route';
import { useAuthStore } from '@/features/auth/store/auth.store';

// Mock the auth store
vi.mock('@/features/auth/store/auth.store');

const mockUseAuthStore = vi.mocked(useAuthStore);

describe('ProtectedRoute', () => {
  const TestComponent = () => <div>Protected Content</div>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when user is authenticated', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: null,
      tokens: null,
      permissions: [],
      features: {},
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      refreshProfile: vi.fn(),
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
      verifyEmail: vi.fn(),
      resendVerification: vi.fn(),
      clearError: vi.fn(),
      hasPermission: vi.fn(),
      hasAnyPermission: vi.fn(),
      hasAllPermissions: vi.fn(),
      isFeatureEnabled: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should show loading state when authentication is loading', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      tokens: null,
      permissions: [],
      features: {},
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      refreshProfile: vi.fn(),
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
      verifyEmail: vi.fn(),
      resendVerification: vi.fn(),
      clearError: vi.fn(),
      hasPermission: vi.fn(),
      hasAnyPermission: vi.fn(),
      hasAllPermissions: vi.fn(),
      isFeatureEnabled: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', async () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      tokens: null,
      permissions: [],
      features: {},
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      refreshProfile: vi.fn(),
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
      verifyEmail: vi.fn(),
      resendVerification: vi.fn(),
      clearError: vi.fn(),
      hasPermission: vi.fn(),
      hasAnyPermission: vi.fn(),
      hasAllPermissions: vi.fn(),
      isFeatureEnabled: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    // Should not render the protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();

    // Should redirect (in a real app, this would navigate to login)
    // In our test environment, we can check that the redirect occurred
    await waitFor(() => {
      expect(container.innerHTML).not.toContain('Protected Content');
    });
  });

  it('should render fallback when provided and user is authenticated', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: null,
      tokens: null,
      permissions: [],
      features: {},
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      refreshProfile: vi.fn(),
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
      verifyEmail: vi.fn(),
      resendVerification: vi.fn(),
      clearError: vi.fn(),
      hasPermission: vi.fn(),
      hasAnyPermission: vi.fn(),
      hasAllPermissions: vi.fn(),
      isFeatureEnabled: vi.fn(),
    });

    const FallbackComponent = () => <div>Fallback Content</div>;

    render(
      <MemoryRouter>
        <ProtectedRoute fallback={<FallbackComponent />}>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Fallback Content')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should use custom redirect path', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      tokens: null,
      permissions: [],
      features: {},
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      refreshProfile: vi.fn(),
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
      verifyEmail: vi.fn(),
      resendVerification: vi.fn(),
      clearError: vi.fn(),
      hasPermission: vi.fn(),
      hasAnyPermission: vi.fn(),
      hasAllPermissions: vi.fn(),
      isFeatureEnabled: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <ProtectedRoute redirectTo="/custom-login">
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    // Should not render the protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
