import { useCallback, useEffect, useRef, useState } from "react";
import {
  messageService,
  type Message,
  type ConversationSummary,
} from "@/services/messageService";

const CONVERSATIONS_PER_PAGE = 15;
const MESSAGES_PER_PAGE = 15;
const POLL_INTERVAL_MS = 30000;

export function useMessages(clientId?: string) {
  // ── Conversations ──
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [totalConversations, setTotalConversations] = useState(0);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const conversationsPageRef = useRef(0);
  const conversationsInFlightRef = useRef(false);

  // ── Per-conversation messages ──
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const messagesInFlightRef = useRef(false);
  const messagesOffsetRef = useRef(0);

  // ── General ──
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const errorStreakRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Reset ──
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
    setMessagesError(null);
  }, []);

  // ── Fetch conversations ──
  const fetchConversations = useCallback(
    async (reset: boolean) => {
      if (!clientId) return;
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

        const res = await messageService.getConversations(clientId, {
          page: nextPage,
          perPage: CONVERSATIONS_PER_PAGE,
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
    [clientId]
  );

  // ── Load more conversations (infinite scroll) ──
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

  // ── Select conversation & fetch messages ──
  const selectConversation = useCallback(
    async (masterId: string) => {
      if (!clientId || messagesInFlightRef.current) return;
      setActiveConversationId(masterId);
      resetActiveMessages();

      try {
        messagesInFlightRef.current = true;
        setMessagesLoading(true);
        setMessagesError(null);

        const msgs = await messageService.getMessagesForConversation(clientId, masterId, {
          limit: MESSAGES_PER_PAGE,
          offset: 0,
        });

        setActiveMessages(msgs);
        messagesOffsetRef.current = msgs.length;
        setHasMoreMessages(msgs.length >= MESSAGES_PER_PAGE);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load messages";
        setMessagesError(msg);
      } finally {
        messagesInFlightRef.current = false;
        setMessagesLoading(false);
      }
    },
    [clientId, resetActiveMessages]
  );

  // ── Load more messages (scroll up) ──
  const loadMoreMessages = useCallback(async () => {
    if (!clientId || !activeConversationId || messagesInFlightRef.current) return;
    if (!hasMoreMessages) return;

    try {
      messagesInFlightRef.current = true;
      setMessagesLoading(true);

      const msgs = await messageService.getMessagesForConversation(clientId, activeConversationId, {
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
  }, [clientId, activeConversationId, hasMoreMessages]);

  // ── Polling for conversations ──
  useEffect(() => {
    if (!clientId) return;

    const poll = () => {
      pollTimerRef.current = setTimeout(async () => {
        try {
          const res = await messageService.getConversations(clientId, {
            page: 1,
            perPage: CONVERSATIONS_PER_PAGE,
          });
          setConversations((prev) => {
            const existingIds = new Set(prev.map((c) => c.master_id));
            const newOnes = res.results.filter((c) => !existingIds.has(c.master_id));
            if (newOnes.length === 0) {
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
          errorStreakRef.current = 0;
        } catch {
          errorStreakRef.current += 1;
        }
        poll();
      }, POLL_INTERVAL_MS);
    };

    poll();
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [clientId]);

  // Keep active conversation messages synced with polling
  useEffect(() => {
    if (!clientId || !activeConversationId) return;
    const interval = setInterval(async () => {
      try {
        const msgs = await messageService.getMessagesForConversation(clientId, activeConversationId, {
          limit: MESSAGES_PER_PAGE,
          offset: 0,
        });
        setActiveMessages((prev) => {
          if (msgs.length === prev.length && msgs.every((m, i) => m.id === prev[i].id)) {
            return prev;
          }
          const existingIds = new Set(prev.map((m) => m.id));
          const newOnes = msgs.filter((m) => !existingIds.has(m.id));
          if (newOnes.length === 0) return prev;
          return [...prev, ...newOnes];
        });
      } catch {
        // silent
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [clientId, activeConversationId]);

  // ── Initial load ──
  useEffect(() => {
    if (!clientId) {
      resetConversations();
      resetActiveMessages();
      setLoading(false);
      return;
    }
    resetConversations();
    resetActiveMessages();
    setActiveConversationId(null);
    void fetchConversations(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // ── Reload ──
  const reload = useCallback(() => {
    resetConversations();
    resetActiveMessages();
    setActiveConversationId(null);
    void fetchConversations(true);
  }, [resetConversations, resetActiveMessages, fetchConversations]);

  return {
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

    loading,
    error,
    reload,

    appendMessage: (msg: Message) => setActiveMessages((prev) => [...prev, msg]),
  };
}
