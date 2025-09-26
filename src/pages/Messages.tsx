import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, Eye, Send, Smile, Paperclip } from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { groupMessages, Conversation } from "@/utils/groupMessages";
import { messageService } from "@/services/messageService";

export default function Messages() {
  const { messages, loading, error } = useMessages();
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const conversations = groupMessages(messages);

  async function handleSend() {
    if (!activeConversation || !newMessage.trim()) return;

    try {
      setSending(true);

      await messageService.sendMessage({
        master_id: activeConversation.masterId,
        content: newMessage,
        to: "support", // doctor or support
        from_client: true,           // 👈 NEW
      });

      // Optimistically add message to UI
      const newMsg = {
        id: Date.now(),
        master_id: activeConversation.masterId,
        content: newMessage,
        created_at: new Date().toISOString(),
        read: true,
        sender_name: "Support",                // 👈 change here
        senderType: "support" as const,        // 👈 change here
        side: "right" as const,                // 👈 change here
        patientName: activeConversation.patientName,
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
        {/* Conversations List */}
        <div className="lg:col-span-1 bg-card rounded-lg border">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">All Messages</h2>
          </div>
          <div className="p-4 space-y-2 overflow-y-auto max-h-[600px]">
            {loading && <div>Loading...</div>}
            {error && <div className="text-red-500">{error}</div>}

            {conversations.map((c) => {
              const displayName = c.patientName
                ? `${c.patientName} (${c.patientEmail || ""})`
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
                    <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
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

        {/* Chat Area */}
        <div className="lg:col-span-2 bg-card rounded-lg border flex flex-col">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <div className="font-semibold">
                    {activeConversation.patientName
                      ? `${activeConversation.patientName} (${activeConversation.patientEmail})`
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

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {activeConversation.messages.map((m) => {
                  let displayName;
                  if (m.senderType === "patient") {
                    displayName = "Patient";
                  } else if (m.senderType === "doctor") {
                    displayName = "Doctor";
                  } else if (m.senderType === "support") {
                    displayName = "Client Support";   // 👈 override email
                  } else {
                    displayName = m.sender_name;
                  }

                  return (
                    <div
                      key={m.id}
                      className={`flex ${m.side === "left" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          m.senderType === "doctor"
                            ? "bg-blue-100 text-blue-800"
                            : m.senderType === "support"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        <div className="text-sm">{m.content}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {displayName} •{" "}
                          {new Date(m.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type your message here..."
                    className="flex-1"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSend();
                    }}
                  />
                  <Button variant="ghost" size="sm">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={handleSend}
                    disabled={sending}
                  >
                    <Send className="h-4 w-4" />
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
