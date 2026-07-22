import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import axiosInstance from '../../api/axiosInstance';
import { useBranding } from '@/contexts/BrandingContext';
import { storeSettingsApi } from '@/api/storeSettingsApi';

declare global {
  interface Window {
    Intercom?: (...args: any[]) => void;
    intercomSettings?: any;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Support Messenger (fully custom UI over real Intercom)
//
// The whole conversation lives in this component — there is NO Intercom JS
// Messenger / iframe. Messages are created and read through our Django proxy
// (`/integrations/intercom/conversation/`), which talks to Intercom's
// Conversations REST API as the signed-in user. Agent replies arrive via a
// webhook → cheap "updates" signal that this widget polls, fetching the full
// thread only when something actually changed.
//
// Supports starting a new chat and going back to previous conversations.
//
// HIPAA: the footer reminds users not to share patient details here.
// ─────────────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  author: 'user' | 'admin' | 'bot';
  name: string;
  body: string;
  created_at: number | null;
}
interface ConversationResponse {
  conversation_id: string | null;
  messages: ChatMessage[];
}
interface ConversationSummary {
  id: string;
  handler: string;
  by_bot: boolean;
  preview: string;
  updated_at: number;
}

const CONVERSATION_URL = '/integrations/intercom/conversation/';
const UPDATES_URL = '/integrations/intercom/conversation/updates/';
const LIST_URL = '/integrations/intercom/conversations/';
const IDENTITY_URL = '/auth/intercom-identity-token/';
const POLL_OPEN_MS = 5000;
const POLL_IDLE_MS = 10000; // closed: still poll the cheap signal so replies notify promptly
const FORCE_FETCH_EVERY = 6; // periodic safety sync if a webhook was missed
const LAST_SEEN_KEY = 'welliemd_support_last_seen';
const BRAND_NAME_KEY = 'welliemd_support_brand';
const WS_EVENT_TYPE = 'support_message';

/** Build the realtime notifications socket URL (token via query string, the
 *  scheme the Channels JWT middleware expects). Returns null until authed. */
function buildSupportWsUrl(): string | null {
  const token = useAuthStore.getState().accessToken;
  if (!token) return null;
  const apiBase =
    (import.meta as any).env?.VITE_API_BASE_URL || 'https://knysysapi.welliemd.com/api/v1';
  let origin: string;
  try {
    const u = new URL(apiBase);
    origin = `${u.protocol === 'https:' ? 'wss:' : 'ws:'}//${u.host}`;
  } catch {
    origin = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
  }
  return `${origin}/ws/client/notifications/?token=${encodeURIComponent(token)}`;
}

// ── Module-level enable probe ──────────────────────────────────────
let probed = false;
let enabled = false;
let storeUnsubscribe: (() => void) | null = null;
const readyListeners = new Set<(value: boolean) => void>();

function emitReady() {
  readyListeners.forEach((listener) => listener(enabled));
}
function subscribeReady(cb: (value: boolean) => void) {
  readyListeners.add(cb);
  cb(enabled);
  return () => {
    readyListeners.delete(cb);
  };
}
function ensureProbe() {
  if (probed) return;
  if (!useAuthStore.getState().isAuthenticated) return;
  probed = true;
  axiosInstance
    .post(IDENTITY_URL)
    .then(() => {
      enabled = true;
      emitReady();
    })
    .catch((error: any) => {
      enabled = false;
      if (error?.response?.status !== 404) {
        probed = false;
        console.error('Failed to initialize support chat:', error);
      }
      emitReady();
    });
}
function ensureStoreListener() {
  if (storeUnsubscribe) return;
  storeUnsubscribe = useAuthStore.subscribe((state) => {
    if (!state.isAuthenticated) {
      enabled = false;
      probed = false;
      emitReady();
    } else {
      ensureProbe();
    }
  });
}

/** Best-effort teardown of legacy Intercom Messenger DOM (called on logout). */
export function shutdownIntercom() {
  enabled = false;
  probed = false;
  emitReady();
  try {
    window.Intercom?.('shutdown');
  } catch {
    /* no-op */
  }
  document.getElementById('intercom-script')?.remove();
  document
    .querySelectorAll(
      '.intercom-lightweight-app, .intercom-namespace, ' +
      'iframe.intercom-launcher-frame, iframe.intercom-launcher-badge-frame, ' +
      '#intercom-container, #intercom-frame',
    )
    .forEach((el) => el.remove());
}

// ── Reference UI content ───────────────────────────────────────────
function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'WM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
function formatTime(ts: number): string {
  if (!ts) return '';
  const diff = Date.now() / 1000 - ts;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

const QUICK_REPLIES: { key: string; label: string; prefill: string }[] = [
  { key: 'billing', label: 'Billing', prefill: 'I have a question about billing.' },
  { key: 'pharmacy', label: 'Pharmacy routing', prefill: 'I have a question about pharmacy routing.' },
  { key: 'orders', label: 'A patient order', prefill: 'I have a question about a patient order.' },
  { key: 'other', label: 'Something else', prefill: '' },
];

function readLastSeen(): number {
  const raw = Number(localStorage.getItem(LAST_SEEN_KEY));
  return Number.isFinite(raw) ? raw : 0;
}
function countUnread(messages: ChatMessage[], since: number): number {
  return messages.filter((m) => m.author !== 'user' && (m.created_at ?? 0) > since).length;
}

export const IntercomWidget = () => {
  const { logos } = useBranding();
  const [ready, setReady] = useState(enabled);
  const [panelOpen, setPanelOpen] = useState(false);
  const [view, setView] = useState<'thread' | 'list'>('thread');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [unread, setUnread] = useState(0);
  const [loadingThread, setLoadingThread] = useState(false);
  const [listLoaded, setListLoaded] = useState(false);
  // Seed from cache so the title doesn't flash the platform name before the
  // client's store name loads on subsequent visits.
  const [brandName, setBrandName] = useState(() => {
    try {
      return localStorage.getItem(BRAND_NAME_KEY) || '';
    } catch {
      return '';
    }
  });

  const msgsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationIdRef = useRef<string | null>(null);
  conversationIdRef.current = conversationId;
  const panelOpenRef = useRef(false);
  panelOpenRef.current = panelOpen;
  const viewRef = useRef<'thread' | 'list'>('thread');
  viewRef.current = view;
  // Messages we've sent but Intercom's read API may not echo yet (it's
  // eventually consistent) — kept visible until the server confirms them, so a
  // just-sent bubble never flickers away.
  const pendingRef = useRef<{ body: string; ts: number }[]>([]);
  const signalRef = useRef(0);
  const tickRef = useRef(0);
  const wsConnectedRef = useRef(false);
  // True after "New chat" until the first message is sent, so that message
  // opens a brand-new conversation instead of replying to the latest one.
  const newChatRef = useRef(false);
  // Only notify for replies that arrive after the widget mounts (not history).
  const notifyTsRef = useRef(Math.floor(Date.now() / 1000));

  useEffect(() => {
    ensureStoreListener();
    ensureProbe();
    return subscribeReady(setReady);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    storeSettingsApi
      .getCurrent()
      .then((settings) => {
        const name = settings.store_name || '';
        if (!active || !name) return;
        setBrandName(name);
        try {
          localStorage.setItem(BRAND_NAME_KEY, name);
        } catch {
          /* ignore */
        }
      })
      .catch(() => { });
    return () => {
      active = false;
    };
  }, [ready]);

  // Until the client's name is known, show a neutral "Support" rather than the
  // platform fallback, so the title never flashes the wrong brand.
  const titleBrand = brandName || 'Support';
  const displayName = brandName || 'WellieMD';
  const initials = toInitials(displayName);
  const logoUrl = logos?.round || logos?.square || '';
  const greeting = brandName
    ? `Hi there 👋 Welcome to ${brandName} Support. How can we help with your brand today?`
    : 'Hi there 👋 Welcome to Support. How can we help with your brand today?';

  // Render-only: update the visible thread (with optimistic-merge) without
  // touching seen/unread. Returns the server messages.
  const renderConversation = (data: ConversationResponse): ChatMessage[] => {
    const server = data.messages || [];
    const serverUserBodies = new Set(server.filter((m) => m.author === 'user').map((m) => m.body));
    const now = Math.floor(Date.now() / 1000);
    pendingRef.current = pendingRef.current.filter(
      (p) => !serverUserBodies.has(p.body) && now - p.ts < 60,
    );
    const merged = [
      ...server,
      ...pendingRef.current.map((p) => ({
        id: `tmp-${p.ts}`,
        author: 'user' as const,
        name: '',
        body: p.body,
        created_at: p.ts,
      })),
    ];
    setMessages(merged);
    if (data.conversation_id) setConversationId(data.conversation_id);
    return server;
  };

  const markSeenNow = (server: ChatMessage[]) => {
    const newest = server.reduce((max, m) => Math.max(max, m.created_at ?? 0), readLastSeen());
    localStorage.setItem(LAST_SEEN_KEY, String(newest));
    // Messages the user has actually seen must never trigger a (late) desktop
    // notification from a subsequent safety sync.
    notifyTsRef.current = Math.max(notifyTsRef.current, newest);
    setUnread(0);
  };
  const refreshUnread = (server: ChatMessage[]) => setUnread(countUnread(server, readLastSeen()));

  const applyConversation = (data: ConversationResponse, markSeen: boolean) => {
    const server = renderConversation(data);
    if (markSeen) markSeenNow(server);
    else refreshUnread(server);
  };

  /** Desktop notification for replies that arrive while the panel isn't actively
   *  showing that conversation. Fires once per new message; clicking opens it. */
  const maybeNotify = (server: ChatMessage[], convId: string | null) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const fresh = server.filter((m) => m.author !== 'user' && (m.created_at ?? 0) > notifyTsRef.current);
    if (fresh.length === 0) return;
    const newest = fresh[fresh.length - 1];
    notifyTsRef.current = newest.created_at ?? Math.floor(Date.now() / 1000);
    try {
      const note = new Notification(`${newest.name || displayName} · ${displayName} Support`, {
        body: newest.body,
        icon: logoUrl || undefined,
        tag: 'welliemd-support',
      });
      note.onclick = () => {
        window.focus();
        if (convId) openConversation(convId);
        else {
          setPanelOpen(true);
          setView('thread');
        }
        note.close();
      };
    } catch {
      /* notifications unsupported in this context — badge still updates */
    }
  };

  /** Raw fetch with no state mutation (id null → latest). */
  const getConversationData = async (id: string | null): Promise<ConversationResponse | null> => {
    const url = id ? `${CONVERSATION_URL}?conversation_id=${encodeURIComponent(id)}` : CONVERSATION_URL;
    try {
      const res = await axiosInstance.get<ConversationResponse>(url);
      return res.data;
    } catch {
      return null;
    }
  };

  const fetchConversation = async (id: string | null, markSeen: boolean) => {
    const data = await getConversationData(id ?? conversationIdRef.current);
    if (data) applyConversation(data, markSeen);
  };

  const fetchList = async () => {
    try {
      const res = await axiosInstance.get<{ conversations: ConversationSummary[] }>(LIST_URL);
      const server = res.data.conversations || [];
      setConversations((prev) => {
        const serverIds = new Set(server.map((c) => c.id));
        const now = Math.floor(Date.now() / 1000);
        // Preserve a just-created conversation that Intercom's search (eventually
        // consistent) hasn't indexed yet, so a new chat never vanishes.
        const pending = prev.filter((c) => !serverIds.has(c.id) && now - c.updated_at < 120);
        return [...pending, ...server].sort((a, b) => b.updated_at - a.updated_at);
      });
    } catch {
      /* keep whatever we have */
    } finally {
      setListLoaded(true);
    }
  };

  /** Optimistically add/update a conversation in the list (e.g. right after the
   *  first message of a new chat) so the user immediately sees it was sent. */
  const upsertConversationSummary = (data: ConversationResponse) => {
    const cid = data.conversation_id;
    if (!cid) return;
    const msgs = data.messages || [];
    const last = msgs[msgs.length - 1];
    let handler = '';
    let byBot = false;
    for (let i = msgs.length - 1; i >= 0; i -= 1) {
      if (msgs[i].author !== 'user') {
        handler = msgs[i].name || '';
        byBot = msgs[i].author === 'bot';
        break;
      }
    }
    const summary: ConversationSummary = {
      id: cid,
      handler,
      by_bot: byBot,
      preview: last?.body || '',
      updated_at: Math.floor(Date.now() / 1000),
    };
    setConversations((prev) => [summary, ...prev.filter((c) => c.id !== cid)]);
  };

  // Reconcile after a change (from the websocket, or the poll backstop). The
  // signal is per-contact ("something changed somewhere"), so we look at the
  // latest conversation — that's where a new reply lands — and notify even if
  // the user is viewing a different (older) thread.
  const syncConversations = async () => {
    const latest = await getConversationData(null);
    if (!latest) return;
    const visible = typeof document === 'undefined' || !document.hidden;
    // inThread: panel open and currently in thread view (vs list view)
    const inThread = panelOpenRef.current && visible;
    const threadVisible = inThread && viewRef.current === 'thread';
    const curId = conversationIdRef.current;
    const viewingLatest = threadVisible && !!curId && curId === latest.conversation_id;
    if (viewingLatest) {
      applyConversation(latest, true); // open thread changed → show inline + mark seen
    } else {
      refreshUnread(latest.messages || []);
      maybeNotify(latest.messages || [], latest.conversation_id);
      // Fix 6: use threadVisible (not inThread) so list-view doesn't trigger a
      // redundant thread fetch, but thread-view always stays live.
      if (threadVisible && curId && curId !== latest.conversation_id) {
        const current = await getConversationData(curId);
        if (current) renderConversation(current); // keep a different open thread live
      }
    }
    // Keep the conversations list live while the user is looking at it.
    if (viewRef.current === 'list') fetchList();
  };

  // Initial load to surface any unread replies on the launcher.
  useEffect(() => {
    if (ready) fetchConversation(null, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Fix 4: Refresh immediately when the user switches back to this tab after
  // the page was hidden (avoids up-to-10s poll lag after tab restore).
  useEffect(() => {
    if (!ready) return;
    const onVisibilityChange = () => {
      if (!document.hidden) syncConversations();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Real-time via the existing Channels socket: an Intercom webhook makes the
  // backend push a `support_message` event to this user's notification group.
  useEffect(() => {
    if (!ready) return;
    let socket: WebSocket | null = null;
    let closedByUs = false;
    let retry: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      const url = buildSupportWsUrl();
      if (!url) {
        retry = setTimeout(connect, 4000); // token not ready yet — try again
        return;
      }
      try {
        socket = new WebSocket(url);
      } catch {
        retry = setTimeout(connect, 8000);
        return;
      }
      socket.onopen = () => {
        wsConnectedRef.current = true;
      };
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg?.type === WS_EVENT_TYPE) {
            // Avoid a redundant poll fetch right after.
            signalRef.current = Math.floor(Date.now() / 1000);
            syncConversations();
          }
        } catch {
          /* ignore non-JSON frames */
        }
      };
      socket.onclose = () => {
        wsConnectedRef.current = false;
        if (!closedByUs) retry = setTimeout(connect, 8000); // reconnect
      };
      socket.onerror = () => {
        try {
          socket?.close();
        } catch {
          /* no-op */
        }
      };
    };
    connect();
    return () => {
      closedByUs = true;
      if (retry) clearTimeout(retry);
      wsConnectedRef.current = false;
      try {
        socket?.close();
      } catch {
        /* no-op */
      }
    };
  }, [ready]);

  // Poll backstop: only does real work when the websocket is down (or to catch
  // a missed webhook). When the socket is connected this stays quiet.
  useEffect(() => {
    if (!ready) return;
    const interval = panelOpen ? POLL_OPEN_MS : POLL_IDLE_MS;
    const timer = setInterval(async () => {
      tickRef.current += 1;
      const safety = tickRef.current % FORCE_FETCH_EVERY === 0;
      // When the socket is healthy, skip the steady signal polling — but still
      // run an occasional safety sync in case a webhook (and its push) was lost.
      if (wsConnectedRef.current && !safety) return;

      let changed = false;
      try {
        const res = await axiosInstance.get<{ updated_at: number }>(UPDATES_URL);
        const sig = res.data?.updated_at || 0;
        if (sig > signalRef.current) {
          changed = true;
          signalRef.current = sig;
        }
      } catch {
        /* ignore — safety below still runs */
      }
      if (changed || safety) await syncConversations();
    }, interval);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, panelOpen]);

  useEffect(() => {
    const el = msgsRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, panelOpen, view]);

  const openPanel = () => {
    setPanelOpen(true);
    setView('thread');
    newChatRef.current = false;
    // Ask once (on this user gesture) so we can surface replies as desktop
    // notifications when the panel is in the background.
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => { });
    }
    if (messages.length === 0) setLoadingThread(true);
    fetchConversation(null, true).finally(() => setLoadingThread(false));
    fetchList(); // prefetch so the "previous chats" list is instant
  };

  const startNewChat = () => {
    pendingRef.current = [];
    newChatRef.current = true;
    setLoadingThread(false);
    setConversationId(null);
    setMessages([]);
    setSendFailed(false);
    setView('thread');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const openConversation = (id: string) => {
    pendingRef.current = [];
    newChatRef.current = false;
    setConversationId(id);
    setMessages([]);
    setLoadingThread(true);
    setView('thread');
    fetchConversation(id, true).finally(() => setLoadingThread(false));
  };

  const openList = () => {
    setView('list');
    fetchList();
  };

  const sendMessage = async (text: string) => {
    const body = text.trim();
    if (!body || sending) return;
    setSendFailed(false);
    setSending(true);
    const ts = Math.floor(Date.now() / 1000);
    pendingRef.current.push({ body, ts });
    setMessages((prev) => [...prev, { id: `tmp-${ts}`, author: 'user', name: '', body, created_at: ts }]);
    setDraft('');
    const startNew = newChatRef.current && !conversationIdRef.current;
    try {
      const res = await axiosInstance.post<ConversationResponse>(CONVERSATION_URL, {
        message: body,
        conversation_id: conversationIdRef.current || undefined,
        new_conversation: startNew,
      });
      newChatRef.current = false;
      applyConversation(res.data, true);
      // Show the (possibly brand-new) conversation in the list immediately —
      // Intercom's search may not surface it for a few seconds.
      upsertConversationSummary(res.data);
    } catch {
      // Fix 1+2: remove the ghost bubble and restore the draft so the user can
      // retry immediately without retyping. The Retry button calls onSend again.
      pendingRef.current = pendingRef.current.filter((p) => !(p.body === body && p.ts === ts));
      setMessages((prev) => prev.filter((m) => m.id !== `tmp-${ts}`));
      setDraft(body);
      setSendFailed(true);
    } finally {
      setSending(false);
    }
  };

  const onChip = (item: (typeof QUICK_REPLIES)[number]) => {
    if (item.prefill) sendMessage(item.prefill);
    else inputRef.current?.focus();
  };
  const onSend = () => sendMessage(draft);

  if (!ready) return null;

  const launcherActive = panelOpen;
  const renderAvatar = (cls: string) => (
    <span className={`${cls}${logoUrl ? ' ic-has-img' : ''}`}>
      {logoUrl ? <img src={logoUrl} alt="" /> : initials}
    </span>
  );

  return (
    <div className={`ic-root${panelOpen ? ' ic-open' : ''}`}>
      <style>{WIDGET_STYLES}</style>

      <div className="ic-panel" role="dialog" aria-label={`${displayName} Support`}>
        <div className="ic-head">
          <div className="ic-head-top">
            <div className="ic-avs">
              {renderAvatar('ic-av')}
              {logoUrl && <span className="ic-av">{initials}</span>}
            </div>
            <div className="ic-actions">
              {view === 'thread' ? (
                <>
                  <button className="ic-iconbtn" onClick={openList} aria-label="Previous conversations" title="Previous conversations">
                    <svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
                  </button>
                  <button className="ic-iconbtn" onClick={startNewChat} aria-label="New conversation" title="New conversation">
                    <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
                  </button>
                </>
              ) : (
                <button className="ic-iconbtn" onClick={() => setView('thread')} aria-label="Back" title="Back">
                  <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
              )}
              <button className="ic-iconbtn" onClick={() => setPanelOpen(false)} aria-label="Close">
                <svg viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          <div className="ic-title">{view === 'list' ? 'Your conversations' : `${titleBrand} Support`}</div>
          {view === 'thread' && (
            <div className="ic-subtitle">Ask us anything — we usually reply in a few minutes.</div>
          )}
        </div>

        {view === 'list' ? (
          <div className="ic-list">
            <button className="ic-listnew" onClick={startNewChat}>＋ Start a new conversation</button>
            {!listLoaded ? (
              <div className="ic-loading"><span className="ic-spinner" /></div>
            ) : conversations.length === 0 ? (
              <div className="ic-empty">No previous conversations yet.</div>
            ) : (
              conversations.map((c) => {
                const who = c.handler || (c.by_bot ? 'Chatbot' : displayName);
                return (
                  <button className="ic-listrow" key={c.id} onClick={() => openConversation(c.id)}>
                    {renderAvatar('ic-lav')}
                    <span className="ic-lmeta">
                      <span className="ic-ltop">
                        <span className="nm">
                          {who}
                          {c.by_bot && <span className="ic-botpill">bot</span>}
                        </span>
                        <span className="tm">{formatTime(c.updated_at)}</span>
                      </span>
                      <span className="pv">{c.preview}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <>
            <div className="ic-msgs" ref={msgsRef}>
              {loadingThread && messages.length === 0 ? (
                <div className="ic-loading"><span className="ic-spinner" /></div>
              ) : (
                <>
                  {messages.length === 0 && (
                    <div className="ic-row them">
                      {renderAvatar('ic-bav')}
                      <div className="ic-bubble">{greeting}</div>
                    </div>
                  )}
                  {messages.map((m) => (
                    <div className={`ic-row ${m.author === 'user' ? 'me' : 'them'}`} key={m.id}>
                      {m.author !== 'user' && renderAvatar('ic-bav')}
                      <div className="ic-bubble">{m.body}</div>
                    </div>
                  ))}
                  {sendFailed && (
                    <div className="ic-error">
                      Couldn't send.{' '}
                      {/* Fix 3: inline Retry button — draft is already restored */}
                      <button className="ic-retry" onClick={onSend} disabled={sending}>
                        Retry
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {!loadingThread && messages.length === 0 && (
              <div className="ic-quick">
                {QUICK_REPLIES.map((item) => (
                  <button key={item.key} className="ic-chip" onClick={() => onChip(item)} disabled={sending}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            <div className="ic-compose">
              <input
                ref={inputRef}
                className="ic-input"
                placeholder="Write a message…"
                value={draft}
                disabled={sending}
                onChange={(e) => {
                  setDraft(e.target.value);
                  // Fix 2: dismiss the error banner as soon as the user starts editing
                  if (sendFailed) setSendFailed(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSend();
                }}
              />
              <button className="ic-send" onClick={onSend} aria-label="Send" disabled={sending || !draft.trim()}>
                <svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
              </button>
            </div>
          </>
        )}

        <div className="ic-foot">
          <svg viewBox="0 0 24 24">
            <rect x="4" y="11" width="16" height="9" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Secured · please don't share patient details here
        </div>
      </div>

      <button
        className="ic-launcher"
        onClick={() => (panelOpen ? setPanelOpen(false) : openPanel())}
        aria-label={launcherActive ? 'Close support' : 'Open support'}
      >
        {!launcherActive && unread > 0 && <span className="ic-badge">{unread > 9 ? '9+' : unread}</span>}
        <svg className="ic-chat" viewBox="0 0 24 24" style={{ display: launcherActive ? 'none' : 'block' }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <svg className="ic-x" viewBox="0 0 24 24" style={{ display: launcherActive ? 'block' : 'none' }}>
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

const WIDGET_STYLES = `
  .ic-root{
    --ic-bg:#f7f8fa;--ic-surface:#fff;--ic-border:#e8ebef;--ic-border-2:#eef1f4;
    --ic-text:#0f172a;--ic-text-3:#94a3b8;--ic-accent:#2563eb;--ic-accent-soft:#eff4ff;
    --ic-accent-2:#1e40af;
    position:fixed;right:24px;bottom:24px;z-index:9000;font-family:inherit}
  .dark .ic-root{
    --ic-bg:#0d1117;--ic-surface:#161c26;--ic-border:#2a3240;--ic-border-2:#222a36;
    --ic-text:#e6edf3;--ic-text-3:#6b7686;--ic-accent:#4f8ff7;--ic-accent-soft:#16243a;
    --ic-accent-2:#1e3a5f}
  .ic-launcher{position:relative;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;
    background:var(--ic-accent);color:#fff;display:grid;place-items:center;
    box-shadow:0 6px 22px rgba(37,99,235,.42);transition:transform .15s ease;margin-left:auto}
  .ic-launcher:hover{transform:scale(1.05)}
  .ic-launcher svg{width:26px;height:26px;stroke:#fff;fill:none;stroke-width:2;transition:opacity .12s}
  .ic-badge{position:absolute;top:-2px;right:-2px;min-width:20px;height:20px;padding:0 5px;
    border-radius:10px;background:#ef4444;color:#fff;font-size:11px;font-weight:700;line-height:1;
    display:grid;place-items:center;border:2px solid var(--ic-surface)}
  .ic-panel{position:absolute;right:0;bottom:72px;width:376px;max-width:calc(100vw - 32px);
    height:min(620px,78vh);background:var(--ic-surface);border:1px solid var(--ic-border);
    border-radius:16px;box-shadow:0 12px 48px rgba(15,23,42,.24);overflow:hidden;
    display:none;flex-direction:column;transform-origin:bottom right}
  .ic-root.ic-open .ic-panel{display:flex;animation:icpop .16s ease}
  @keyframes icpop{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
  .ic-head{background:linear-gradient(135deg,var(--ic-accent),var(--ic-accent-2));color:#fff;padding:18px 18px 16px}
  .ic-head-top{display:flex;align-items:center;justify-content:space-between}
  .ic-avs{display:flex}
  .ic-av{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.22);border:2px solid var(--ic-accent);
    display:grid;place-items:center;font-size:12px;font-weight:700;margin-left:-8px}
  .ic-av:first-child{margin-left:0}
  .ic-av.ic-has-img,.ic-bav.ic-has-img{background:#fff;overflow:hidden}
  .ic-av img,.ic-bav img,.ic-lav img{width:100%;height:100%;border-radius:50%;object-fit:cover}
  .ic-actions{display:flex;align-items:center;gap:2px}
  .ic-iconbtn{background:none;border:none;color:#fff;cursor:pointer;opacity:.85;padding:4px;display:grid;place-items:center}
  .ic-iconbtn:hover{opacity:1}
  .ic-iconbtn svg{width:18px;height:18px;stroke:#fff;fill:none;stroke-width:2}
  .ic-title{font-size:17px;font-weight:700;margin-top:12px}
  .ic-subtitle{font-size:12.5px;opacity:.85;margin-top:2px}
  .ic-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
  .ic-row{display:flex;gap:8px;max-width:88%}
  .ic-row.me{align-self:flex-end;flex-direction:row-reverse}
  .ic-bubble{padding:9px 13px;border-radius:14px;font-size:13.5px;line-height:1.45;white-space:pre-wrap;word-break:break-word}
  .ic-row.them .ic-bubble{background:var(--ic-bg);color:var(--ic-text);border-top-left-radius:4px}
  .ic-row.me .ic-bubble{background:var(--ic-accent);color:#fff;border-top-right-radius:4px}
  .ic-bav{width:26px;height:26px;border-radius:50%;background:var(--ic-accent-soft);color:var(--ic-accent);
    display:grid;place-items:center;font-size:11px;font-weight:700;flex-shrink:0;align-self:flex-end}
  .ic-error{font-size:11.5px;color:#dc2626;text-align:center;padding:2px 6px;display:flex;align-items:center;justify-content:center;gap:6px}
  .ic-retry{background:none;border:none;color:#dc2626;font-size:11.5px;font-weight:600;cursor:pointer;text-decoration:underline;padding:0;font-family:inherit}
  .ic-retry:disabled{opacity:.5;cursor:default}
  .ic-loading{flex:1;display:grid;place-items:center;min-height:120px}
  .ic-spinner{width:26px;height:26px;border:3px solid var(--ic-border);border-top-color:var(--ic-accent);
    border-radius:50%;animation:icspin .7s linear infinite}
  @keyframes icspin{to{transform:rotate(360deg)}}
  .ic-list{flex:1;overflow-y:auto;display:flex;flex-direction:column}
  .ic-listnew{margin:12px 16px;padding:10px;border-radius:9px;border:1.5px solid var(--ic-accent);
    background:var(--ic-accent-soft);color:var(--ic-accent);font-weight:600;font-size:12.5px;cursor:pointer;font-family:inherit}
  .ic-listrow{display:flex;align-items:center;gap:10px;padding:12px 16px;border:none;
    background:none;cursor:pointer;text-align:left;border-bottom:1px solid var(--ic-border-2);font-family:inherit}
  .ic-listrow:hover{background:var(--ic-bg)}
  .ic-lav{width:32px;height:32px;border-radius:50%;background:var(--ic-accent-soft);color:var(--ic-accent);
    display:grid;place-items:center;font-size:12px;font-weight:700;flex-shrink:0}
  .ic-lav.ic-has-img{background:#fff;overflow:hidden}
  .ic-lmeta{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
  .ic-ltop{display:flex;align-items:center;justify-content:space-between;gap:8px}
  .ic-ltop .nm{font-size:12.5px;font-weight:600;color:var(--ic-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:6px}
  .ic-botpill{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;color:var(--ic-accent);
    background:var(--ic-accent-soft);border-radius:5px;padding:1px 5px;line-height:1.4}
  .ic-listrow .pv{font-size:12px;color:var(--ic-text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ic-listrow .tm{font-size:11px;color:var(--ic-text-3);flex-shrink:0}
  .ic-empty{padding:24px 16px;text-align:center;color:var(--ic-text-3);font-size:12.5px}
  .ic-quick{display:flex;flex-wrap:wrap;gap:7px;padding:0 16px 8px}
  .ic-chip{font-size:12.5px;border:1.5px solid var(--ic-border);background:var(--ic-surface);color:var(--ic-accent);
    border-radius:999px;padding:7px 13px;cursor:pointer;font-family:inherit;transition:background .12s,border-color .12s}
  .ic-chip:hover{background:var(--ic-accent-soft);border-color:var(--ic-accent)}
  .ic-chip:disabled{opacity:.5;cursor:default}
  .ic-compose{border-top:1px solid var(--ic-border);padding:10px 12px;display:flex;gap:8px;align-items:center}
  .ic-input{flex:1;border:none;outline:none;background:none;font-family:inherit;font-size:13.5px;color:var(--ic-text);padding:8px}
  .ic-input::placeholder{color:var(--ic-text-3)}
  .ic-input:disabled{opacity:.6}
  .ic-send{border:none;background:var(--ic-accent);width:34px;height:34px;border-radius:9px;cursor:pointer;display:grid;place-items:center;flex-shrink:0}
  .ic-send:disabled{opacity:.5;cursor:default}
  .ic-send svg{width:16px;height:16px;stroke:#fff;fill:none;stroke-width:2}
  .ic-foot{padding:7px 14px;font-size:11px;color:var(--ic-text-3);text-align:center;border-top:1px solid var(--ic-border-2);display:flex;align-items:center;justify-content:center;gap:5px}
  .ic-foot svg{width:11px;height:11px;stroke:var(--ic-text-3);fill:none;stroke-width:2}
  @media (max-width:560px){ .ic-panel{width:calc(100vw - 32px)} }
`;
