import { useEffect, useState } from "react";
import { messageService, type Message } from "@/services/messageService";

export function useMessages(apiEndpoint?: string, pollInterval: number = 5000) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchMessages(isInitial = false) {
      try {
        const res = await messageService.getAllMessages(apiEndpoint);
        if (cancelled) return;
        setMessages(res);
        setError(null);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || "Failed to load messages");
      } finally {
        if (!cancelled && isInitial) setLoading(false);
      }
    }

    // 🔑 IMPORTANT: clear prior messages immediately when endpoint changes
    setMessages([]);
    setError(null);
    setLoading(true);

    // initial fetch
    fetchMessages(true);

    // polling
    const interval = setInterval(() => fetchMessages(false), pollInterval);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [apiEndpoint, pollInterval]);

  // manual reload if needed
  const reload = () => {
    // force a fresh cycle by toggling loading + fetching once
    setLoading(true);
    messageService
      .getAllMessages(apiEndpoint)
      .then((res) => setMessages(res))
      .catch((err: any) => setError(err?.message || "Failed to load messages"))
      .finally(() => setLoading(false));
  };

  return { messages, loading, error, reload };
}
