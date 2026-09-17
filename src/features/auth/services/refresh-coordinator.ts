type AsyncWork<T> = () => Promise<T>;

const inTabLocks = new Map<string, Promise<void>>();

/**
 * Serializes refresh work in this tab and, where supported, across tabs on
 * this origin. The server remains the final authority and provides a short
 * replay window for browsers without Web Locks.
 */
export async function withRefreshLock<T>(portal: string, work: AsyncWork<T>): Promise<T> {
  const previous = inTabLocks.get(portal) || Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  inTabLocks.set(portal, current);

  await previous;
  try {
    const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
    if (locks?.request) {
      return await locks.request(`welliemd-auth-refresh:${portal}`, { mode: 'exclusive' }, work);
    }
    return await work();
  } finally {
    release();
    if (inTabLocks.get(portal) === current) {
      inTabLocks.delete(portal);
    }
  }
}
