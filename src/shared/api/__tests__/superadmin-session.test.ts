import { describe, expect, it, beforeEach } from 'vitest';

import {
  clearActiveSuperAdminSession,
  getActiveSuperAdminSession,
  setActiveSuperAdminSession,
} from '../superadmin-session';

describe('superadmin session metadata', () => {
  beforeEach(() => {
    clearActiveSuperAdminSession();
  });

  it('stores only the tenant API base URL for cookie-backed broker sessions', () => {
    setActiveSuperAdminSession({ apiBaseUrl: 'http://localhost:8101/api/v1' });

    expect(getActiveSuperAdminSession()).toEqual({
      apiBaseUrl: 'http://localhost:8101/api/v1',
    });
    expect(getActiveSuperAdminSession()).not.toHaveProperty('token');
  });

  it('clears active broker metadata', () => {
    setActiveSuperAdminSession({ apiBaseUrl: 'http://localhost:8101/api/v1' });

    clearActiveSuperAdminSession();

    expect(getActiveSuperAdminSession()).toBeNull();
  });
});
