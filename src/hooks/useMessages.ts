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
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);   
  const [error, setError] = useState<string | null>(null);

  async function fetchMessages(isInitial = false) {
    try {
      if (isInitial) setLoading(true);

      const res = await messageService.getAllMessages();

      setMessages((prev) => (arraysEqual(prev, res) ? prev : res));
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

  return { messages, loading, error, reload: () => fetchMessages(true) };
}
