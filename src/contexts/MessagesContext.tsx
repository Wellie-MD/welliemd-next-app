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
import { messageService, type Message } from "@/services/messageService";
import { useAuthStore } from "@/store/useAuthStore";

function arraysEqual(a: Message[], b: Message[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].content !== b[i].content) return false;
  }
  return true;
}

function mergeMessages(prev: Message[], incoming: Message[]): Message[] {
  if (!incoming.length) return prev;
  const map = new Map<number, Message>();
  for (const m of prev) map.set(m.id, m);
  for (const m of incoming) map.set(m.id, m);
  return Array.from(map.values()).sort(
    (x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime()
  );
}

export type ClientMessagesContextValue = {
  messages: Message[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const MessagesContext = createContext<ClientMessagesContextValue | null>(null);

export function MessagesProvider({
  children,
  pollIntervalMs = 30000,
}: {
  children: ReactNode;
  pollIntervalMs?: number;
}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const maxIdRef = useRef(0);
  const inFlightRef = useRef(false);
  const errorStreakRef = useRef(0);

  const fetchMessages = useCallback(
    async (isInitial = false) => {
      if (!isAuthenticated) {
        setMessages([]);
        maxIdRef.current = 0;
        if (isInitial) setLoading(false);
        return;
      }
      if (inFlightRef.current) return;
      try {
        inFlightRef.current = true;
        if (isInitial) setLoading(true);
        setError(null);
        const useIncremental = !isInitial && maxIdRef.current > 0;
        const res = await messageService.getAllMessages(
          useIncremental ? { afterId: maxIdRef.current } : undefined
        );
        if (isInitial) {
          setMessages((prev) => (arraysEqual(prev, res) ? prev : res));
          maxIdRef.current = res.reduce((acc, m) => Math.max(acc, m.id), 0);
        } else if (res.length) {
          setMessages((prev) => {
            const merged = mergeMessages(prev, res);
            return arraysEqual(prev, merged) ? prev : merged;
          });
          const batchMax = res.reduce((acc, m) => Math.max(acc, m.id), 0);
          maxIdRef.current = Math.max(maxIdRef.current, batchMax);
        }
        errorStreakRef.current = 0;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load messages";
        setError(msg);
        errorStreakRef.current += 1;
      } finally {
        inFlightRef.current = false;
        if (isInitial) setLoading(false);
      }
    },
    [isAuthenticated]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setMessages([]);
      maxIdRef.current = 0;
      setLoading(false);
      return;
    }
    void fetchMessages(true);
  }, [isAuthenticated, fetchMessages]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const hiddenDelay = Math.max(pollIntervalMs * 4, 120000);
    const getDelay = () => {
      const base = typeof document !== "undefined" && document.hidden ? hiddenDelay : pollIntervalMs;
      const backoff = Math.min(2 ** Math.min(errorStreakRef.current, 3), 8);
      const jitter = Math.floor(Math.random() * 800);
      return base * backoff + jitter;
    };

    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void fetchMessages(false).finally(schedule);
      }, getDelay());
    };

    const onVisibility = () => {
      clearTimeout(timer);
      schedule();
    };

    schedule();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isAuthenticated, pollIntervalMs, fetchMessages]);

  const reload = useCallback(() => fetchMessages(true), [fetchMessages]);

  const value = useMemo(
    () => ({ messages, loading, error, reload }),
    [messages, loading, error, reload]
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
