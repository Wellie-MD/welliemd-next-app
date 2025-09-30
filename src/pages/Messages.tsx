import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, Eye, Send, Smile, Paperclip } from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { groupMessages, Conversation } from "@/utils/groupMessages";
import { messageService } from "@/services/messageService";

type LastSeenMap = Record<string, string | number | undefined>;

const LS_KEY = "msg_last_seen";

// storage helpers
function writeLastSeenToStorage(next: LastSeenMap) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {}
}
function readLastSeenFromStorage(): LastSeenMap {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}

export default function Messages() {
  const { messages, loading, error } = useMessages(5000); // poll every 5s
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Build conversations from raw messages
  const conversations = useMemo(() => groupMessages(messages), [messages]);

  // --- unread state synced to localStorage ---
  const [lastSeen, setLastSeen] = useState<LastSeenMap>(() => readLastSeenFromStorage());
  const initialLoadDoneRef = useRef(false);

  // For playing a sound **per new message** on unopened chats
  const lastNotifiedKeyRef = useRef<Record<string, string | number | undefined>>({});

  const didAutoSelectRef = useRef(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // keep/restore original title for badge count
  const originalTitleRef = useRef(document.title);
  useEffect(() => {
    originalTitleRef.current = document.title;
  }, []);

  // helpers
  const latestKey = (c: Conversation) => {
    const last = c.messages[c.messages.length - 1];
    return (last?.id as number | string | undefined) ?? last?.created_at ?? c.lastTime;
  };

  // louder 2-note chime
  const playChime = async () => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();

      const g = ctx.createGain();
      g.connect(ctx.destination);

      const now = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.35, now + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = "triangle";
      osc2.type = "square";
      osc1.frequency.setValueAtTime(880, now);
      osc2.frequency.setValueAtTime(1318.51, now);

      osc1.connect(g);
      osc2.connect(g);
      osc1.start(now);
      osc2.start(now + 0.06);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch {}
  };

  const showBrowserNotification = (title: string, body: string) => {
    try {
      if (!("Notification" in window)) return;
      if (Notification.permission === "granted") {
        new Notification(title, { body });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted") new Notification(title, { body });
        });
      }
    } catch {}
  };

  // ===== init lastSeen (and lastNotified) after first load to avoid old history beeps/badges =====
  useEffect(() => {
    if (!initialLoadDoneRef.current && !loading) {
      const next: LastSeenMap = {};
      conversations.forEach((c) => (next[c.id] = latestKey(c)));
      setLastSeen(next);
      writeLastSeenToStorage(next);

      const seed: Record<string, string | number | undefined> = {};
      conversations.forEach((c) => (seed[c.id] = latestKey(c)));
      lastNotifiedKeyRef.current = seed;

      initialLoadDoneRef.current = true;
    }
  }, [loading, conversations]);

  // keep activeConversation synced when new messages land
  useEffect(() => {
    if (!activeConversation) return;
    const updated = conversations.find((c) => c.id === activeConversation.id);
    if (updated) setActiveConversation(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // mark active chat read & advance lastSeen + lastNotified (so no beeps for it)
  useEffect(() => {
    if (!activeConversation) return;
    const k = latestKey(activeConversation);
    setLastSeen((prev) => {
      const merged = { ...prev, [activeConversation.id]: k };
      writeLastSeenToStorage(merged);
      return merged;
    });
    lastNotifiedKeyRef.current[activeConversation.id] = k;
    (async () => {
      try {
        if (activeConversation.masterId && messageService.markRead) {
          await messageService.markRead(activeConversation.masterId);
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.messages, activeConversation?.id]);

  // compute hasNew map
  const hasNewMap: Record<string, boolean> = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (!initialLoadDoneRef.current) return map;
    conversations.forEach((c) => {
      const k = latestKey(c);
      const seen = lastSeen[c.id];
      map[c.id] = seen !== undefined && k !== seen && activeConversation?.id !== c.id;
    });
    return map;
  }, [conversations, lastSeen, activeConversation?.id]);

  const unseenCount = useMemo(
    () => Object.values(hasNewMap).filter(Boolean).length,
    [hasNewMap]
  );

  // Play sound for EVERY new message while chat is unopened
  useEffect(() => {
    if (!initialLoadDoneRef.current) return;
    conversations.forEach((c) => {
      if (activeConversation?.id === c.id) return; // active chat: no beep
      const k = latestKey(c);
      const shouldPrompt = hasNewMap[c.id] && lastNotifiedKeyRef.current[c.id] !== k;
      if (shouldPrompt) {
        playChime();
        showBrowserNotification("New message", `${(c.patientName || c.patientEmail || "Patient")} • ${c.lastMessage}`);
        lastNotifiedKeyRef.current[c.id] = k;
      }
    });
  }, [conversations, hasNewMap, activeConversation?.id]);

  // document.title badge
  useEffect(() => {
    const base = originalTitleRef.current || "Telehealth";
    if (unseenCount > 0) {
      document.title = `(${unseenCount}) New message${unseenCount > 1 ? "s" : ""} • ${base}`;
    } else {
      document.title = base;
    }
  }, [unseenCount]);

  // auto-open first conversation once
  useEffect(() => {
    if (didAutoSelectRef.current) return;
    if (loading) return;
    if (!activeConversation && conversations.length > 0) {
      setActiveConversation(conversations[0]);
      didAutoSelectRef.current = true;
    }
  }, [loading, conversations, activeConversation]);

  // fallback if active disappears
  useEffect(() => {
    if (activeConversation && !conversations.find((c) => c.id === activeConversation.id)) {
      if (conversations.length > 0) setActiveConversation(conversations[0]);
      else setActiveConversation(null);
    }
  }, [conversations, activeConversation]);

  // scroll messages to bottom on updates
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [activeConversation?.messages]);

  // send
  async function handleSend() {
    if (!activeConversation || !newMessage.trim()) return;

    try {
      setSending(true);

      await messageService.sendMessage({
        master_id: activeConversation.masterId,
        content: newMessage,
        to: "support",
        from_client: true,
      });

      const newMsg = {
        id: Date.now(),
        master_id: activeConversation.masterId,
        content: newMessage,
        created_at: new Date().toISOString(),
        read: true,
        sender_name: "Support",
        senderType: "support" as const,
        side: "right" as const,
        patientName: activeConversation.patientName,
        message_type: "support_to_patient" as const,
      };

      const updated = {
        ...activeConversation,
        messages: [...activeConversation.messages, newMsg],
        lastMessage: newMsg.content,
        lastTime: newMsg.created_at,
      };
      setActiveConversation(updated);

      setLastSeen((prev) => {
        const merged = { ...prev, [updated.id]: newMsg.id ?? newMsg.created_at };
        writeLastSeenToStorage(merged);
        return merged;
      });
      lastNotifiedKeyRef.current[updated.id] = newMsg.id ?? newMsg.created_at;

      setNewMessage("");
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      });
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  }

  function openConversation(c: Conversation) {
    setActiveConversation(c);
    const k = latestKey(c);
    setLastSeen((prev) => {
      const merged = { ...prev, [c.id]: k };
      writeLastSeenToStorage(merged);
      return merged;
    });
    lastNotifiedKeyRef.current[c.id] = k;
    (async () => {
      try {
        if (c.masterId && messageService.markRead) await messageService.markRead(c.masterId);
      } catch {}
    })();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px] min-h-0">
        {/* LEFT: list */}
        <div className="lg:col-span-1 bg-card rounded-lg border overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">All Messages</h2>
          </div>

          <div className="p-4 space-y-2 overflow-y-auto h-full max-h-[calc(700px-64px)]">
            {loading && <div>Loading...</div>}
            {error && <div className="text-red-500">{error}</div>}

            {conversations.map((c) => {
              const name = (c.patientName || "").trim();
              const email = (c.patientEmail || "").trim();
              const displayName = name ? (email ? `${name} - ${email}` : name) : email || "Patient";
              const avatarFallback = (name || email || "P").trim().charAt(0).toUpperCase();

              const isActive = activeConversation?.id === c.id;
              const showNew = !!hasNewMap[c.id];

              // base row
              let rowClass =
                "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition border hover:bg-muted border-transparent";
              if (isActive) {
                rowClass += " bg-indigo-50/80 ring-2 ring-indigo-500/70 border-indigo-200";
              }

              return (
                <div
                  key={c.id}
                  className={rowClass}
                  onClick={() => openConversation(c)}
                >
                  {/* left accent only for active */}
                  {isActive ? (
                    <div className="w-1.5 self-stretch rounded-full bg-indigo-500" />
                  ) : (
                    <div className="w-1.5 self-stretch rounded-full bg-transparent" />
                  )}

                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`truncate text-sm ${isActive ? "font-semibold" : "font-medium"}`}>
                        {displayName}
                      </div>
                      {/* unread: just a small pill; no border/bg so it won't compete with active */}
                      {!isActive && showNew && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
                          New
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{c.lastMessage}</div>
                  </div>

                  <div className={`text-xs whitespace-nowrap ${isActive ? "text-indigo-700" : "text-muted-foreground"}`}>
                    {new Date(c.lastTime).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: chat */}
        <div className="lg:col-span-2 bg-card rounded-lg border flex flex-col overflow-hidden">
          {activeConversation ? (
            <>
              <div className="p-4 border-b flex items-center justify-between shrink-0">
                <div>
                  <div className="font-semibold">
                    {activeConversation.patientName
                      ? activeConversation.patientEmail
                        ? `${activeConversation.patientName} - ${activeConversation.patientEmail}`
                        : activeConversation.patientName
                      : activeConversation.patientEmail || "Patient"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activeConversation.type === "doctor" ? "Doctor" : "Support"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Phone className="h-4 w-4" /> Call
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" /> View Profile
                  </Button>
                </div>
              </div>

              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
              >
                {activeConversation.messages.map((m) => {
                  let displayName: string;
                  if (m.senderType === "patient") {
                    if (m.message_type === "patient_to_doctor") displayName = "Patient → Doctor";
                    else if (m.message_type === "patient_to_support") displayName = "Patient → Support";
                    else displayName = "Patient";
                  } else if (m.senderType === "doctor") displayName = "Doctor";
                  else if (m.senderType === "support") displayName = "Client Support";
                  else if (m.senderType === "super_support") displayName = "Super Admin Support";
                  else displayName = m.sender_name;

                  let bubbleColor = "";
                  if (m.senderType === "patient") bubbleColor = "bg-gray-100 text-gray-800";
                  else if (m.senderType === "doctor") bubbleColor = "bg-blue-100 text-blue-800";
                  else if (m.senderType === "support") bubbleColor = "bg-purple-100 text-purple-800";
                  else if (m.senderType === "super_support") bubbleColor = "bg-red-100 text-red-800";
                  else bubbleColor = "bg-gray-200 text-gray-800";

                  return (
                    <div key={m.id} className={`flex ${m.side === "left" ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${bubbleColor}`}>
                        <div className="text-sm">{m.content}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {displayName} • {new Date(m.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 border-t shrink-0">
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Type your message here..."
                    className="flex-1 text-base px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-400"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSend();
                    }}
                  />
                  <Button variant="ghost" size="sm" className="hidden">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="hidden">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleSend}
                    disabled={sending}
                    className="px-6 py-3 text-base font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center gap-2"
                  >
                    <Send className="h-5 w-5" />
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
