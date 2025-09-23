import { useEffect, useState } from "react";
import { Send, Search, Plus, Paperclip, Phone, Video } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";

import { MessageService } from "@/features/messages/services/message.service";
import { VisitService, Visit } from "@/features/visits/services/visit.service";

interface Message {
  id: number | string;
  content: string;
  timestamp: string;
  isFromDoctor: boolean;
  read: boolean;
  senderName?: string;
  masterId?: string;
}

interface Conversation {
  id: string;
  masterId: string;
  label: string; // e.g. "ED – Doctor"
  type: "doctor" | "support";
  messages: Message[];
}

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // ----------------------------
  // Load visits + messages
  // ----------------------------
  useEffect(() => {
    const loadData = async () => {
      try {
        const visits: Visit[] = await VisitService.getPatientVisits();
        const convs: Conversation[] = [];

        for (const visit of visits) {
          const masterId = visit.master_id;
          if (!masterId) continue;

          const [doctorMsgs, supportMsgs] = await Promise.all([
            MessageService.getDoctorMessages(masterId),
            MessageService.getSupportMessages(masterId),
          ]);

          convs.push({
            id: `${masterId}-doctor`,
            masterId,
            label: `${visit.visit_type} – Doctor`,
            type: "doctor",
            messages: doctorMsgs,
          });

          convs.push({
            id: `${masterId}-support`,
            masterId,
            label: `${visit.visit_type} – Support`,
            type: "support",
            messages: supportMsgs,
          });
        }

        setConversations(convs);
        if (convs.length > 0) setSelectedConv(convs[0]);
      } catch (err) {
        console.error("Failed to load conversations:", err);
      }
    };

    loadData();
  }, []);

  // ----------------------------
  // Polling for new messages
  // ----------------------------
  useEffect(() => {
    if (!selectedConv) return;

    const interval = setInterval(async () => {
      try {
        let msgs: Message[] = [];
        if (selectedConv.type === "doctor") {
          msgs = await MessageService.getDoctorMessages(selectedConv.masterId);
        } else {
          msgs = await MessageService.getSupportMessages(selectedConv.masterId);
        }

        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConv.id ? { ...c, messages: msgs } : c
          )
        );

        setSelectedConv((prev) =>
          prev ? { ...prev, messages: msgs } : prev
        );
      } catch (err) {
        console.error("Polling failed:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedConv]);

  // ----------------------------
  // Select conversation + mark messages as read
  // ----------------------------
  const handleSelectConversation = async (conv: Conversation) => {
    setSelectedConv(conv);

    try {
      for (const msg of conv.messages) {
        if (!msg.read) {
          await MessageService.markAsRead(msg.id);
        }
      }
    } catch (err) {
      console.error("Failed to mark messages as read:", err);
    }

    // Optimistic update so unread clears immediately
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conv.id
          ? {
              ...c,
              messages: c.messages.map((m) => ({ ...m, read: true })),
            }
          : c
      )
    );
  };

  // ----------------------------
  // Send message
  // ----------------------------
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConv) return;

    const payload = {
      master_id: selectedConv.masterId,
      to: selectedConv.type,
      content: newMessage.trim(),
    };

    try {
      const res = await MessageService.sendMessage(payload);

      const newMsg: Message = {
        id: res.id || Date.now(),
        content: newMessage,
        timestamp: new Date().toISOString(),
        isFromDoctor: false,
        read: true,
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConv.id
            ? { ...c, messages: [...c.messages, newMsg] }
            : c
        )
      );
      setSelectedConv((prev) =>
        prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev
      );

      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message. Please try again.");
    }
  };

  // ----------------------------
  // Filter conversations
  // ----------------------------
  const filteredConversations = conversations.filter((c) =>
    c.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
          <p className="text-gray-600">
            Communicate with your doctor or support team
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* Sidebar */}
        <Card className="lg:col-span-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 ${
                  selectedConv?.id === conv.id
                    ? "bg-blue-50 border-blue-500"
                    : "border-transparent"
                }`}
                onClick={() => handleSelectConversation(conv)} // ✅ updated
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage />
                    <AvatarFallback>
                      {conv.type === "doctor" ? "DR" : "CS"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      {conv.label}
                    </p>
                    <p className="text-xs text-gray-400">
                      {conv.messages.length} messages
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          {selectedConv && (
            <>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage />
                      <AvatarFallback>
                        {selectedConv.type === "doctor" ? "DR" : "CS"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {selectedConv.label}
                      </h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {selectedConv.type}
                      </p>
                    </div>
                  </div>
                  {selectedConv.type === "doctor" && (
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Video className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <Separator />
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedConv.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.isFromDoctor ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.isFromDoctor
                          ? "bg-gray-100 text-gray-900"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.isFromDoctor
                            ? "text-gray-500"
                            : "text-blue-100"
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>

              {/* Input */}
              <div className="p-6 border-t">
                <div className="flex items-end space-x-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={3}
                    className="flex-1 resize-none"
                  />
                  <div className="flex flex-col space-y-2">
                    <Button variant="outline" size="sm">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleSendMessage} size="sm">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
