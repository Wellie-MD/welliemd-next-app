// src/hooks/useMessages.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { messageService, type Message } from "@/services/messageService";

function shallowEqualMessages(a: Message[], b: Message[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  // compare a few stable fields to detect real changes
  for (let i = 0; i < a.length; i++) {
    const A = a[i], B = b[i];
    if (A.id !== B.id || A.created_at !== B.created_at || A.content !== B.content) {
      return false;
    }
  }
  return true;
}

export function useMessages(apiEndpoint?: string, pollInterval: number = 5000, clientId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const errorStreakRef = useRef(0);
  const terminalClientRef = useRef(false);

  const fetchMessages = useCallback(
    async (isInitial = false, cancelledRef?: { current: boolean }) => {
      if (!clientId && !apiEndpoint) {
        if (isInitial) setLoading(false);
        setMessages([]);
        setError(null);
        return;
      }
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      try {
        const res = await messageService.getAllMessages(apiEndpoint, clientId);
        if (cancelledRef?.current) return;
        setError(null);
        setMessages((prev) => (shallowEqualMessages(prev, res) ? prev : res));
        errorStreakRef.current = 0;
        terminalClientRef.current = false;
      } catch (err: any) {
        if (cancelledRef?.current) return;
        const nextMessage = err?.message || "Failed to load messages";
        setError(nextMessage);
        errorStreakRef.current += 1;
        // Prevent hot-loop polling on stale/invalid tenant IDs.
        terminalClientRef.current = /\b404\b/.test(nextMessage);
      } finally {
        inFlightRef.current = false;
        if (!cancelledRef?.current && isInitial) setLoading(false);
      }
    },
    [apiEndpoint, clientId]
  );

  useEffect(() => {
    const cancelledRef = { current: false };
    let timer: ReturnType<typeof setTimeout> | undefined;

    const getNextDelay = () => {
      const hidden = typeof document !== "undefined" && document.hidden;
      const visibilityFactor = hidden ? 4 : 1;
      const backoffFactor = Math.min(2 ** Math.min(errorStreakRef.current, 3), 8);
      const base = pollInterval * visibilityFactor * backoffFactor;
      const terminalFloor = terminalClientRef.current ? 120000 : 0;
      const jitter = Math.floor(Math.random() * 1200);
      return Math.max(base + jitter, terminalFloor);
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void fetchMessages(false, cancelledRef).finally(schedule);
      }, getNextDelay());
    };

    // Reset state on endpoint change
    setMessages([]);
    setError(null);
    setLoading(true);
    errorStreakRef.current = 0;
    terminalClientRef.current = false;

    void fetchMessages(true, cancelledRef).finally(schedule);

    const onVisibility = () => {
      if (timer) clearTimeout(timer);
      schedule();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelledRef.current = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [apiEndpoint, pollInterval, clientId, fetchMessages]);

  const reload = () => {
    setLoading(true);
    void fetchMessages(true).finally(() => setLoading(false));
  };

  return { messages, loading, error, reload };
}
