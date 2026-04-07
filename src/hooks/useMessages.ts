// src/hooks/useMessages.ts
import { useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    let cancelled = false;

    async function fetchMessages(isInitial = false) {
      try {
        const res = await messageService.getAllMessages(apiEndpoint, clientId);
        if (cancelled) return;
        setError(null);
        setMessages((prev) => (shallowEqualMessages(prev, res) ? prev : res));
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || "Failed to load messages");
      } finally {
        if (!cancelled && isInitial) setLoading(false);
      }
    }

    // Reset state on endpoint change
    setMessages([]);
    setError(null);
    setLoading(true);

    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(false), pollInterval);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [apiEndpoint, pollInterval, clientId]);

  const reload = () => {
    setLoading(true);
    messageService
      .getAllMessages(apiEndpoint, clientId)
      .then((res) =>
        setMessages((prev) => (shallowEqualMessages(prev, res) ? prev : res))
      )
      .catch((err: any) => setError(err?.message || "Failed to load messages"))
      .finally(() => setLoading(false));
  };

  return { messages, loading, error, reload };
}
