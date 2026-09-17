import { describe, expect, it, vi } from 'vitest';
import { withRefreshLock } from '../refresh-coordinator';

describe('withRefreshLock', () => {
  it('serializes refresh work within a tab', async () => {
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const events: string[] = [];

    const first = withRefreshLock('patient', async () => {
      events.push('first:start');
      await firstGate;
      events.push('first:end');
      return 'first';
    });
    const second = withRefreshLock('patient', async () => {
      events.push('second:start');
      return 'second';
    });

    await Promise.resolve();
    expect(events).toEqual(['first:start']);
    releaseFirst();
    await expect(first).resolves.toBe('first');
    await expect(second).resolves.toBe('second');
    expect(events).toEqual(['first:start', 'first:end', 'second:start']);
  });

  it('uses the browser Web Lock when available', async () => {
    const request = vi.fn(async (_name: string, _options: unknown, callback: () => Promise<string>) => callback());
    Object.defineProperty(navigator, 'locks', { configurable: true, value: { request } });

    await expect(withRefreshLock('patient', async () => 'ok')).resolves.toBe('ok');
    expect(request).toHaveBeenCalledWith(
      'welliemd-auth-refresh:patient',
      { mode: 'exclusive' },
      expect.any(Function),
    );
  });
});
