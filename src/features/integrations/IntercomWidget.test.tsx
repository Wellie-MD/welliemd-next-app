import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Regression test for a race condition: a rapid burst of admin replies in
// Intercom fires one websocket push per message, and the widget used to apply
// whichever fetch response landed last — even if it was issued earlier and
// was therefore stale. See IntercomWidget.tsx `syncSeqRef` for the fix.

const CONVERSATION_URL = '/integrations/intercom/conversation/';
const LIST_URL = '/integrations/intercom/conversations/';
const UPDATES_URL = '/integrations/intercom/conversation/updates/';
const IDENTITY_URL = '/auth/intercom-identity-token/';

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('../../api/axiosInstance', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: {
    getState: () => ({ isAuthenticated: true, accessToken: 'test-token' }),
    subscribe: () => () => {},
  },
}));

vi.mock('@/contexts/BrandingContext', () => ({
  useBranding: () => ({ logos: undefined }),
}));

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }
  close() {}
}
(globalThis as unknown as { WebSocket: unknown }).WebSocket = FakeWebSocket;

function chatMsg(id: string, body: string, ts: number) {
  return { id, author: 'admin' as const, name: 'Agent', body, created_at: ts };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('IntercomWidget realtime sync', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    FakeWebSocket.instances.length = 0;
    mockPost.mockResolvedValue({ data: {} });
  });

  it('never lets a stale out-of-order websocket-triggered fetch overwrite a fresher one', async () => {
    const firedFirstResolvesLast = deferred<{ data: unknown }>();
    const firedSecondResolvesFirst = deferred<{ data: unknown }>();
    let conversationCallCount = 0;

    mockGet.mockImplementation((url: string) => {
      if (url === LIST_URL) return Promise.resolve({ data: { conversations: [] } });
      if (url === UPDATES_URL) return Promise.resolve({ data: { updated_at: 0 } });
      if (url === CONVERSATION_URL) {
        const call = conversationCallCount++;
        if (call === 0) {
          // Initial mount fetch.
          return Promise.resolve({ data: { conversation_id: 'c1', messages: [] } });
        }
        if (call === 1) {
          // openPanel fetch.
          return Promise.resolve({
            data: { conversation_id: 'c1', messages: [chatMsg('m1', 'Hello', 1)] },
          });
        }
        if (call === 2) return firedFirstResolvesLast.promise;
        if (call === 3) return firedSecondResolvesFirst.promise;
        return Promise.resolve({ data: { conversation_id: 'c1', messages: [] } });
      }
      return Promise.resolve({ data: {} });
    });

    const { IntercomWidget } = await import('./IntercomWidget');
    render(<IntercomWidget />);

    await waitFor(() => expect(mockPost).toHaveBeenCalledWith(IDENTITY_URL));

    const launcher = await screen.findByLabelText('Open support');
    fireEvent.click(launcher);
    await waitFor(() => expect(screen.getByText('Hello')).toBeInTheDocument());

    const socket = FakeWebSocket.instances[0];
    expect(socket).toBeTruthy();

    // Two rapid admin replies -> two websocket pushes -> two overlapping syncs.
    socket.onmessage!({ data: JSON.stringify({ type: 'support_message' }) });
    socket.onmessage!({ data: JSON.stringify({ type: 'support_message' }) });

    // The SECOND (later-issued, more complete) fetch resolves FIRST.
    firedSecondResolvesFirst.resolve({
      data: {
        conversation_id: 'c1',
        messages: [chatMsg('m1', 'Hello', 1), chatMsg('m2', 'How are you', 2), chatMsg('m3', 'Final message', 3)],
      },
    });
    await waitFor(() => expect(screen.getByText('Final message')).toBeInTheDocument());

    // The FIRST (earlier-issued, now-stale) fetch resolves LAST.
    firedFirstResolvesLast.resolve({
      data: {
        conversation_id: 'c1',
        messages: [chatMsg('m1', 'Hello', 1), chatMsg('m2', 'How are you', 2)],
      },
    });

    // Give the stale response a chance to (wrongly) overwrite state.
    await new Promise((r) => setTimeout(r, 0));

    // The fuller, later thread must still be shown — the stale response must
    // never win, and no message may disappear from the visible chat.
    expect(screen.getByText('Final message')).toBeInTheDocument();
  });
});
