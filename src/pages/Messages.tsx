// src/pages/Messages.tsx (Admin Portal with date separators + smart autoscroll)
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, Eye, Send } from "lucide-react";

import { useMessages } from "@/hooks/useMessages";
import { groupMessages, type Conversation } from "@/utils/groupMessages";
import { messageService } from "@/services/messageService";
import { useClients, type Client } from "@/hooks/useClients";

import {
  isToday,
  isYesterday,
  isThisWeek,
  format,
  formatISO,
} from "date-fns";

// ---- helpers for grouping ----
function getMessageGroupLabel(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isThisWeek(date)) return format(date, "EEEE"); // Monday, Tuesday…
  return format(date, "MMM d, yyyy");
}
function groupMessagesByDate<T extends { created_at: string }>(messages: T[]) {
  const groups: Record<string, T[]> = {};
  messages.forEach((msg) => {
    const dateKey = formatISO(new Date(msg.created_at), { representation: "date" });
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
  });
  return groups;
}

export default function Messages() {
  // 1) Admin: load clients
  const { clients, loading: loadingClients, error: clientsError } = useClients();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // 2) Load messages (admin hits selected client's API)
  const { messages, loading, error } = useMessages(selectedClient?.api_endpoint, 5000);

  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const conversations = groupMessages(messages);

  // Auto-pick first client once clients load
  useEffect(() => {
    if (!loadingClients && !selectedClient && clients.length > 0) {
      setSelectedClient(clients[0]);
    }
  }, [loadingClients, clients, selectedClient]);

  // Keep activeConversation in sync on new data (same client)
  useEffect(() => {
    if (activeConversation) {
      const updated = conversations.find((c) => c.id === activeConversation.id);
      if (updated) setActiveConversation(updated);
    }
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  // 🔁 Reset conversation when client changes
  useEffect(() => {
    setActiveConversation(null);
  }, [selectedClient?.id]);

  // 🔒 Only auto-open once new client's messages have loaded
  useEffect(() => {
    if (!loading && !activeConversation && conversations.length > 0) {
      setActiveConversation(conversations[0]);
    }
  }, [loading, conversations, activeConversation]);

  // ===== Smart autoscroll =====
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldStickRef = useRef(true);
  const SCROLL_THRESHOLD = 48; // px from bottom counts as "near bottom"

  // Recompute stickiness on user scroll
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      shouldStickRef.current = distanceFromBottom <= SCROLL_THRESHOLD;
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    // initialize once so we start with correct stickiness
    onScroll();

    return () => {
      el.removeEventListener("scroll", onScroll);
    };
    // Re-attach when the conversation panel is remounted (container ref changes on key)
  }, [activeConversation?.id, selectedClient?.id]);

  // Scroll to bottom helper (next paint)
  function stickToBottomSoon() {
    shouldStickRef.current = true;
    requestAnimationFrame(() => {
      const el = messagesContainerRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    });
  }

  // When messages for the active conversation change, only auto-scroll if we should stick
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el || !activeConversation) return;

    if (shouldStickRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [activeConversation?.messages]);

  // When switching clients or conversations, we want to stick to bottom at open
  useEffect(() => {
    shouldStickRef.current = true;
  }, [selectedClient?.id]);
  useEffect(() => {
    shouldStickRef.current = true;
    stickToBottomSoon();
  }, [activeConversation?.id]);

  async function handleSend() {
    if (!activeConversation || !newMessage.trim()) return;

    try {
      setSending(true);
      // we want to stay at the bottom after sending
      shouldStickRef.current = true;

      await messageService.sendMessage({
        master_id: activeConversation.masterId,
        content: newMessage,
        to: "support",                 // keep this; BE uses from_super_admin to tag it
        from_super_admin: true as any, // already telling BE this is super admin
        apiEndpoint: selectedClient?.api_endpoint,
      });

      // ✅ Optimistic UI should mirror BE shape
      const newMsg = {
        id: Date.now(),
        master_id: activeConversation.masterId,
        content: newMessage,
        created_at: new Date().toISOString(),
        read: true,
        sender_name: "Super Admin Support",    // 👈 updated
        senderType: "super_support" as const,  // 👈 updated
        side: "right" as const,
        patientName: activeConversation.patientName,
        // keep this unless your BE actually returns a distinct value for super admin
        message_type: "support_to_patient" as const,
      };

      setActiveConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, newMsg],
              lastMessage: newMsg.content,
              lastTime: newMsg.created_at,
            }
          : prev
      );

      setNewMessage("");
      stickToBottomSoon();
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  }


  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px] min-h-0">
        {/* LEFT: Clients + Conversations */}
        <div className="lg:col-span-1 bg-card rounded-lg border flex flex-col overflow-hidden">
          {/* Client selector */}
          <div className="p-4 border-b space-y-3 shrink-0">
            <h2 className="text-lg font-semibold">All Messages</h2>
            <div>
              <label className="text-sm text-muted-foreground">Client</label>
              <select
                className="mt-1 w-full p-2 border rounded"
                value={selectedClient?.id || ""}
                onChange={(e) => {
                  const c = clients.find((x) => x.id === e.target.value) || null;
                  setSelectedClient(c);
                }}
              >
                <option value="">— Select a client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {loadingClients && <div className="text-xs mt-2">Loading clients…</div>}
              {clientsError && <div className="text-xs text-red-500 mt-2">{clientsError}</div>}
            </div>
          </div>

          {/* Conversations list */}
          <div className="p-4 space-y-2 overflow-y-auto flex-1 min-h-0">
            {loading && selectedClient && (
              <div className="text-sm text-muted-foreground">
                Loading messages for <span className="font-medium">{selectedClient.name}</span>…
              </div>
            )}
            {error && <div className="text-red-500">{error}</div>}
            {conversations.map((c) => {
              const displayName = c.patientName
                ? `${c.patientName}${c.patientEmail ? ` (${c.patientEmail})` : ""}`
                : c.patientEmail || "Patient";

              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted ${
                    activeConversation?.id === c.id ? "bg-muted" : ""
                  }`}
                  onClick={() => setActiveConversation(c)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {(displayName || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{displayName}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {c.lastMessage}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(c.lastTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Chat */}
        <div
          key={selectedClient?.id || "no-client"}  // 🔑 force remount on client switch
          className="lg:col-span-2 bg-card rounded-lg border flex flex-col overflow-hidden"
        >
          {activeConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between shrink-0">
                <div>
                  <div className="font-semibold">
                    {activeConversation.patientName
                      ? `${activeConversation.patientName}${
                          activeConversation.patientEmail
                            ? ` (${activeConversation.patientEmail})`
                            : ""
                        }`
                      : activeConversation.patientEmail || "Patient"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedClient ? `Client: ${selectedClient.name}` : "Local"}
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

              {/* ---- DATE-GROUPED MESSAGES ---- */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0"
              >
                {(() => {
                  const grouped = groupMessagesByDate(activeConversation.messages);
                  const sortedDates = Object.keys(grouped).sort(
                    (a, b) => new Date(a).getTime() - new Date(b).getTime()
                  );

                  return sortedDates.map((dateKey) => (
                    <div key={dateKey}>
                      {/* Date separator */}
                      <div className="flex justify-center my-4">
                        <span className="bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full">
                          {getMessageGroupLabel(dateKey)}
                        </span>
                      </div>

                      {/* Messages for this day */}
                      <div className="space-y-4">
                        {grouped[dateKey].map((m: any) => {
                          let displayName = m.sender_name || "";
                          if (m.senderType === "patient") {
                            displayName =
                              m.message_type === "patient_to_doctor"
                                ? "Patient → Doctor"
                                : m.message_type === "patient_to_support"
                                ? "Patient → Support"
                                : "Patient";
                          } else if (m.senderType === "doctor") displayName = "Doctor";
                          else if (m.senderType === "support") displayName = "Client Support";
                          else if (m.senderType === "super_support")
                            displayName = "Super Admin Support";

                          let bubbleColor = "";
                          if (m.senderType === "patient")
                            bubbleColor = "bg-gray-100 text-gray-800";
                          else if (m.senderType === "doctor")
                            bubbleColor = "bg-blue-100 text-blue-800";
                          else if (m.senderType === "support")
                            bubbleColor = "bg-purple-100 text-purple-800";
                          else if (m.senderType === "super_support")
                            bubbleColor = "bg-red-100 text-red-800";
                          else bubbleColor = "bg-gray-200 text-gray-800";

                          return (
                            <div
                              key={m.id}
                              className={`flex ${m.side === "left" ? "justify-start" : "justify-end"}`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${bubbleColor}`}
                              >
                                <div className="text-sm">{m.content}</div>
                                <div className="text-xs opacity-70 mt-1">
                                  {displayName} •{" "}
                                  {new Date(m.created_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Composer */}
              <div className="p-4 border-t shrink-0">
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Type your message here…"
                    className="flex-1 text-base px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-400"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSend();
                    }}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={sending || !selectedClient}
                    className="px-6 py-3 text-base font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center gap-2"
                    title={!selectedClient ? "Select a client first" : "Send"}
                  >
                    <Send className="h-5 w-5" />
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              {selectedClient
                ? loading
                  ? `Loading ${selectedClient.name}…`
                  : "Select a conversation"
                : "Select a client to load messages"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
