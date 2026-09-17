export type ActiveSuperAdminSession = {
  apiBaseUrl: string;
};

let activeSuperAdminSession: ActiveSuperAdminSession | null = null;

export const setActiveSuperAdminSession = (session: ActiveSuperAdminSession | null): void => {
  activeSuperAdminSession = session;
};

export const getActiveSuperAdminSession = (): ActiveSuperAdminSession | null => activeSuperAdminSession;

export const clearActiveSuperAdminSession = (): void => {
  activeSuperAdminSession = null;
};
