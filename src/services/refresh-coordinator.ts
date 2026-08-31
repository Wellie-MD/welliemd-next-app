type RefreshWork<T> = () => Promise<T>;

const inFlightByPortal = new Map<string, Promise<unknown>>();

/** Serialize refreshes in this tab; the API's replay receipt covers other tabs. */
export const withRefreshLock = async <T>(portal: string, work: RefreshWork<T>): Promise<T> => {
  const existing = inFlightByPortal.get(portal) as Promise<T> | undefined;
  if (existing) return existing;

  const lockManager = typeof navigator === 'undefined' ? undefined : (navigator as Navigator & {
    locks?: { request: <R>(name: string, options: { mode: 'exclusive' }, cb: () => Promise<R>) => Promise<R> };
  }).locks;
  const promise = lockManager
    ? lockManager.request(`welliemd-auth-refresh:${portal}`, { mode: 'exclusive' }, work)
    : work();
  inFlightByPortal.set(portal, promise);
  try {
    return await promise;
  } finally {
    if (inFlightByPortal.get(portal) === promise) inFlightByPortal.delete(portal);
  }
};
