import { useEffect, useState } from "react";
import { messageService, Message } from "../services/messageService";

function arraysEqual(a: Message[], b: Message[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].content !== b[i].content) return false;
  }
  return true;
}

export function useMessages(pollInterval: number = 5000) {
  const [messages, setMessages] = useState<Message[]>([]);          // existing (patient/all) messages
  const [belugaMessages, setBelugaMessages] = useState<Message[]>([]); // 🆕 beluga-only
  const [loading, setLoading] = useState(true);   
  const [error, setError] = useState<string | null>(null);

  async function fetchMessages(isInitial = false) {
    try {
      if (isInitial) setLoading(true);

      // 🆕 fetch both in parallel; keep your original "messages" behavior
      const [resAll, resBeluga] = await Promise.all([
        messageService.getAllMessages(),
        messageService.getBelugaMessages(),
      ]);

      setMessages((prev) => (arraysEqual(prev, resAll) ? prev : resAll));
      setBelugaMessages((prev) => (arraysEqual(prev, resBeluga) ? prev : resBeluga));
    } catch (err: any) {
      setError(err.message || "Failed to load messages");
    } finally {
      if (isInitial) setLoading(false);
    }
  }

  useEffect(() => {
    // first load
    fetchMessages(true);

    // polling (no loading spinner)
    const interval = setInterval(() => {
      fetchMessages(false);
    }, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval]);

  // 🆕 expose belugaMessages in addition to your existing return
  return { messages, belugaMessages, loading, error, reload: () => fetchMessages(true) };
}
