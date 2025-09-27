// src/pages/Messages.tsx
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, Eye, Send } from "lucide-react";

import { useMessages } from "@/hooks/useMessages";
import { groupMessages, type Conversation } from "@/utils/groupMessages";
import { messageService } from "@/services/messageService";
import { useClients, type Client } from "@/hooks/useClients";

export default function Messages() {
  // ── 1) Load clients (Admin Portal)
  const { clients, loading: loadingClients, error: clientsError } = useClients();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // ── 2) Load messages from either:
  //     - selected client's API (Admin), or
  //     - local API (Client portal) when no client selected
  const { messages, loading, error } = useMessages(selectedClient?.api_endpoint, 5000);

  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const conversations = groupMessages(messages);

  // Keep activeConversation in sync on new data
  useEffect(() => {
    if (activeConversation) {
      const updated = conversations.find((c) => c.id === activeConversation.id);
      if (updated) setActiveConversation(updated);
    }
  }, [messages]);

  // Reset when switching client
  useEffect(() => {
    setActiveConversation(null);
  }, [selectedClient?.id]);

  // Auto-scroll
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeConversation?.messages]);

  async function handleSend() {
    if (!activeConversation || !newMessage.trim()) return;

    try {
      setSending(true);
      await messageService.sendMessage({
        master_id: activeConversation.masterId,
        content: newMessage,
        to: "support",             // or "doctor" if you add a toggle
        from_super_admin: true,         // same semantics as client portal
        apiEndpoint: selectedClient?.api_endpoint, // key line for Admin
      });

      // Optimistic UI
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

      setActiveConversation({
        ...activeConversation,
        messages: [...activeConversation.messages, newMsg],
        lastMessage: newMsg.content,
        lastTime: newMsg.created_at,
      });
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Left: Clients + Conversations */}
        <div className="lg:col-span-1 bg-card rounded-lg border flex flex-col">
          {/* Client selector (Admin) */}
          <div className="p-4 border-b space-y-3">
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

          {/* Conversations */}
          <div className="p-4 space-y-2 overflow-y-auto max-h-[600px]">
            {loading && <div>Loading messages…</div>}
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
                    <AvatarFallback>{(displayName || "?").charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{displayName}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {c.lastMessage}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(c.lastTime).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Chat */}
        <div className="lg:col-span-2 bg-card rounded-lg border flex flex-col">
          {activeConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <div className="font-semibold">
                    {activeConversation.patientName
                      ? `${activeConversation.patientName}${
                          activeConversation.patientEmail ? ` (${activeConversation.patientEmail})` : ""
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

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {activeConversation.messages.map((m) => {
                  let displayName = m.sender_name || "";
                  if (m.senderType === "patient") {
                    displayName =
                      m.message_type === "patient_to_doctor"
                        ? "Patient → Doctor"
                        : m.message_type === "patient_to_support"
                        ? "Patient → Support"
                        : "Patient";
                  } else if (m.senderType === "doctor") {
                    displayName = "Doctor";
                  } else if (m.senderType === "support") {
                    displayName = "Client Support";
                  } else if (m.senderType === "super_support") {
                    displayName = "Super Admin Support";
                  } else {
                    displayName = m.sender_name;
                  }

                  let bubbleColor = "";
                  if (m.senderType === "patient") bubbleColor = "bg-gray-100 text-gray-800";
                  else if (m.senderType === "doctor") bubbleColor = "bg-blue-100 text-blue-800";
                  else if (m.senderType === "support") bubbleColor = "bg-purple-100 text-purple-800";
                  else if (m.senderType === "super_support") {
                    displayName = "Super Admin Support";
                    bubbleColor = "bg-red-100 text-red-800";   // distinct color
                  }
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
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="p-4 border-t">
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
              {selectedClient ? "Select a conversation" : "Select a client to load messages"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
