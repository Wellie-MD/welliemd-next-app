import { useEffect, useState } from "react";
import { messageService, Message } from "../services/messageService";

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMessages() {
      try {
        setLoading(true);
        const res = await messageService.getAllMessages();
        setMessages(res.results);
      } catch (err: any) {
        setError(err.message || "Failed to load messages");
      } finally {
        setLoading(false);
      }
    }
    fetchMessages();
  }, []);

  return { messages, loading, error };
}
