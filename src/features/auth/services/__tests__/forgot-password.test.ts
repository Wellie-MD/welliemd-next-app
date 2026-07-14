import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  patch: vi.fn(),
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
  getRefreshToken: vi.fn(),
  getAccessToken: vi.fn(),
}));

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    post: mocks.post,
    get: mocks.get,
    patch: mocks.patch,
  },
  tokenManager: {
    setTokens: mocks.setTokens,
    clearTokens: mocks.clearTokens,
    getRefreshToken: mocks.getRefreshToken,
    getAccessToken: mocks.getAccessToken,
  },
}));

import { authService } from '../auth.service';

describe('AuthService.forgotPassword', () => {
  beforeEach(() => {
    mocks.post.mockReset();
    mocks.post.mockResolvedValue({});
  });

  it('sends the patient portal hint by default', async () => {
    await authService.forgotPassword({ email: 'Patient@Example.com' } as any);

    expect(mocks.post).toHaveBeenCalledWith(
      '/auth/password-reset/request/',
      {
        email: 'patient@example.com',
        portal: 'patient',
      }
    );
  });

  it('preserves an explicit client portal override', async () => {
    await authService.forgotPassword({ email: 'Patient@Example.com', portal: 'client' } as any);

    expect(mocks.post).toHaveBeenCalledWith(
      '/auth/password-reset/request/',
      {
        email: 'patient@example.com',
        portal: 'client',
      }
    );
  });
});
