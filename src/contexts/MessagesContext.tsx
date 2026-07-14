import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  messageService,
  type Message,
  type ConversationSummary,
} from "@/services/messageService";
import { useAuthStore } from "@/store/useAuthStore";

const MESSAGES_PER_PAGE = 15;
const CONVERSATIONS_PER_PAGE = 15;

export type ClientMessagesContextValue = {
  conversations: ConversationSummary[];
  totalConversations: number;
  conversationsLoading: boolean;
  conversationsError: string | null;
  hasMoreConversations: boolean;
  loadMoreConversations: () => Promise<void>;

  activeConversationId: string | null;
  activeMessages: Message[];
  messagesLoading: boolean;
  messagesError: string | null;
  hasMoreMessages: boolean;
  selectConversation: (masterId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;

  searchQuery: string;
  setSearchQuery: (q: string) => void;
  conversationType: "patient" | "beluga";
  setConversationType: (t: "patient" | "beluga") => void;

  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;

  belugaCache: Record<string, Message[]>;
  belugaLoading: boolean;

  appendMessage: (msg: Message) => void;
  refreshBeluga: (masterId: string) => Promise<void>;
};

const MessagesContext = createContext<ClientMessagesContextValue | null>(null);

export function MessagesProvider({
  children,
}: {
  children: ReactNode;
  pollIntervalMs?: number;
}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const pollIntervalMs = 30000;

  // ── Conversations ──────────────────────────────────────────────
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [totalConversations, setTotalConversations] = useState(0);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const conversationsPageRef = useRef(0);
  const conversationsInFlightRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchQueryRef = useRef("");
  const [conversationType, setConversationType] = useState<"patient" | "beluga">("patient");
  const conversationTypeRef = useRef<"patient" | "beluga">("patient");

  // ── Per-conversation messages ──────────────────────────────────
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const messagesInFlightRef = useRef(false);
  const messagesOffsetRef = useRef(0);
  const messagesTotalRef = useRef(0);

  // ── Beluga ─────────────────────────────────────────────────────
  const [belugaCache, setBelugaCache] = useState<Record<string, Message[]>>({});
  const [belugaLoading, setBelugaLoading] = useState(false);

  // ── General ────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialLoadDoneRef = useRef(false);
  const errorStreakRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Helpers ────────────────────────────────────────────────────
  const resetConversations = useCallback(() => {
    setConversations([]);
    setTotalConversations(0);
    conversationsPageRef.current = 0;
    setConversationsError(null);
  }, []);

  const resetActiveMessages = useCallback(() => {
    setActiveMessages([]);
    setHasMoreMessages(false);
    messagesOffsetRef.current = 0;
    messagesTotalRef.current = 0;
    setMessagesError(null);
  }, []);

  // ── Fetch conversations ────────────────────────────────────────
  const fetchConversations = useCallback(
    async (reset: boolean) => {
      if (!isAuthenticated) return;
      if (conversationsInFlightRef.current) return;

      const nextPage = reset ? 1 : conversationsPageRef.current + 1;
      if (!reset && nextPage <= conversationsPageRef.current) return;

      try {
        conversationsInFlightRef.current = true;
        if (reset) {
          setConversationsLoading(true);
          setLoading(true);
          setError(null);
        }

        const res = await messageService.getConversations({
          page: nextPage,
          perPage: CONVERSATIONS_PER_PAGE,
          search: searchQueryRef.current || undefined,
          type: conversationTypeRef.current,
        });

        if (reset) {
          setConversations(res.results);
          conversationsPageRef.current = 1;
        } else {
          setConversations((prev) => {
            const existingIds = new Set(prev.map((c) => c.master_id));
            const newOnes = res.results.filter((c) => !existingIds.has(c.master_id));
            if (!newOnes.length) return prev;
            return [...prev, ...newOnes];
          });
          conversationsPageRef.current = nextPage;
        }

        setTotalConversations(res.count);
        setConversationsError(null);
        errorStreakRef.current = 0;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load conversations";
        if (reset) setError(msg);
        setConversationsError(msg);
        errorStreakRef.current += 1;
      } finally {
        conversationsInFlightRef.current = false;
        if (reset) {
          setConversationsLoading(false);
          setLoading(false);
        }
      }
    },
    [isAuthenticated]
  );

  // ── Load more conversations (infinite scroll) ──────────────────
  const loadMoreConversations = useCallback(async () => {
    if (conversationsInFlightRef.current) return;
    const nextPage = conversationsPageRef.current + 1;
    const maxPage = Math.ceil(totalConversations / CONVERSATIONS_PER_PAGE);
    if (nextPage > maxPage) return;
    await fetchConversations(false);
  }, [fetchConversations, totalConversations]);

  const hasMoreConversations =
    conversations.length < totalConversations &&
    conversationsPageRef.current < Math.ceil(totalConversations / CONVERSATIONS_PER_PAGE);

  // ── Select conversation & fetch messages ───────────────────────
  const selectConversation = useCallback(
    async (masterId: string) => {
      if (messagesInFlightRef.current) return;
      setActiveConversationId(masterId);
      resetActiveMessages();

      try {
        messagesInFlightRef.current = true;
        setMessagesLoading(true);
        setMessagesError(null);

        const msgs = await messageService.getMessagesForConversation({
          masterId,
          limit: MESSAGES_PER_PAGE,
          offset: 0,
        });

        setActiveMessages(msgs);
        messagesOffsetRef.current = msgs.length;
        messagesTotalRef.current = msgs.length;
        setHasMoreMessages(msgs.length >= MESSAGES_PER_PAGE);
        setMessagesError(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load messages";
        setMessagesError(msg);
      } finally {
        messagesInFlightRef.current = false;
        setMessagesLoading(false);
      }
    },
    [resetActiveMessages]
  );

  // ── Load more messages (infinite scroll upward) ────────────────
  const loadMoreMessages = useCallback(async () => {
    if (messagesInFlightRef.current || !activeConversationId) return;
    if (!hasMoreMessages) return;

    try {
      messagesInFlightRef.current = true;
      setMessagesLoading(true);

      const msgs = await messageService.getMessagesForConversation({
        masterId: activeConversationId,
        limit: MESSAGES_PER_PAGE,
        offset: messagesOffsetRef.current,
      });

      if (msgs.length > 0) {
        setActiveMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newOnes = msgs.filter((m) => !existingIds.has(m.id));
          return [...newOnes, ...prev];
        });
        messagesOffsetRef.current += msgs.length;
      }
      setHasMoreMessages(msgs.length >= MESSAGES_PER_PAGE);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load more messages";
      setMessagesError(msg);
    } finally {
      messagesInFlightRef.current = false;
      setMessagesLoading(false);
    }
  }, [activeConversationId, hasMoreMessages]);

  // ── Fetch Beluga thread ────────────────────────────────────────
  const fetchBeluga = useCallback(async (masterId: string) => {
    try {
      setBelugaLoading(true);
      const msgs = await messageService.getBelugaThread(masterId);
      setBelugaCache((prev) => {
        const existing = prev[masterId] || [];
        if (existing.length === msgs.length && existing.every((m, i) => m.id === msgs[i].id)) {
          return prev;
        }
        return { ...prev, [masterId]: msgs };
      });
    } catch {
      // silent
    } finally {
      setBelugaLoading(false);
    }
  }, []);

  // ── Polling for conversations ──────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    const poll = () => {
      pollTimerRef.current = setTimeout(async () => {
        try {
          const res = await messageService.getConversations({
            page: 1,
            perPage: CONVERSATIONS_PER_PAGE,
            search: searchQueryRef.current || undefined,
            type: conversationTypeRef.current,
          });
          setConversations((prev) => {
            const existingIds = new Set(prev.map((c) => c.master_id));
            const newOnes = res.results.filter((c) => !existingIds.has(c.master_id));
            if (newOnes.length === 0) {
              // Check for updates to existing conversations
              let changed = false;
              const updated = prev.map((existing) => {
                const match = res.results.find((r) => r.master_id === existing.master_id);
                if (match && (match.last_message !== existing.last_message || match.last_time !== existing.last_time)) {
                  changed = true;
                  return match;
                }
                return existing;
              });
              return changed ? updated : prev;
            }
            return [...newOnes, ...prev];
          });
          setTotalConversations(res.count);
        } catch {
          // silent
        }
        poll();
      }, pollIntervalMs);
    };

    poll();
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [isAuthenticated]);

  // ── Polling for Beluga messages (when active conversation is beluga) ──
  useEffect(() => {
    if (!activeConversationId || conversationType !== "beluga") return;
    const interval = setInterval(() => {
      void fetchBeluga(activeConversationId);
    }, 5000);
    void fetchBeluga(activeConversationId);
    return () => clearInterval(interval);
  }, [activeConversationId, conversationType, fetchBeluga]);

  // ── Initial load ───────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      resetConversations();
      resetActiveMessages();
      setLoading(false);
      initialLoadDoneRef.current = false;
      return;
    }
    if (!initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
      void fetchConversations(true);
    }
  }, [isAuthenticated, fetchConversations, resetConversations, resetActiveMessages]);

  // ── Handle search / type changes ───────────────────────────────
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    conversationTypeRef.current = conversationType;
    resetConversations();
    resetActiveMessages();
    setActiveConversationId(null);
    void fetchConversations(true);
  }, [conversationType, resetConversations, resetActiveMessages, fetchConversations]);

  // ── Debounced search ───────────────────────────────────────────
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setSearchQueryDebounced = useCallback(
    (q: string) => {
      setSearchQuery(q);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        resetConversations();
        void fetchConversations(true);
      }, 300);
    },
    [resetConversations, fetchConversations]
  );

  // ── Reload ─────────────────────────────────────────────────────
  const reload = useCallback(async () => {
    resetConversations();
    resetActiveMessages();
    setActiveConversationId(null);
    initialLoadDoneRef.current = true;
    await fetchConversations(true);
  }, [resetConversations, resetActiveMessages, fetchConversations]);

  // ── Context value ──────────────────────────────────────────────
  const value = useMemo<ClientMessagesContextValue>(
    () => ({
      conversations,
      totalConversations,
      conversationsLoading,
      conversationsError,
      hasMoreConversations,
      loadMoreConversations,

      activeConversationId,
      activeMessages,
      messagesLoading,
      messagesError,
      hasMoreMessages,
      selectConversation,
      loadMoreMessages,

      searchQuery,
      setSearchQuery: setSearchQueryDebounced,
      conversationType,
      setConversationType,

      loading,
      error,
      reload,

      belugaCache,
      belugaLoading,

      appendMessage: (msg: Message) => setActiveMessages((prev) => [...prev, msg]),
      refreshBeluga: fetchBeluga,
    }),
    [
      conversations,
      totalConversations,
      conversationsLoading,
      conversationsError,
      hasMoreConversations,
      loadMoreConversations,

      activeConversationId,
      activeMessages,
      messagesLoading,
      messagesError,
      hasMoreMessages,
      selectConversation,
      loadMoreMessages,

      searchQuery,
      setSearchQueryDebounced,
      conversationType,

      loading,
      error,
      reload,

      belugaCache,
      belugaLoading,

      fetchBeluga,
    ]
  );

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useClientMessages(): ClientMessagesContextValue {
  const ctx = useContext(MessagesContext);
  if (!ctx) {
    throw new Error("useClientMessages must be used within MessagesProvider");
  }
  return ctx;
}
