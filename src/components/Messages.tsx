// src/pages/Messages.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Send, Search, Plus, Phone, Video } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";

import { MessageService } from "@/features/messages/services/message.service";
import { VisitService, Visit } from "@/features/visits/services/visit.service";

import {
  isToday,
  isYesterday,
  isThisWeek,
  format,
  formatISO,
} from "date-fns";

interface Message {
  id: number | string;
  content: string;
  timestamp: string;
  isFromDoctor: boolean;
  read: boolean;
  senderName?: string;
  masterId?: string;
  chatType?: "doctor" | "support" | "super_support";
}

interface Conversation {
  id: string;
  masterId: string;
  label: string;
  type: "doctor" | "support";
  messages: Message[];
}

type UnreadMap = Record<string, number>;

// --------------------- Helpers -----------------------
function getDisplayName(msg: Message): string {
  if (msg.chatType === "doctor") {
    return msg.isFromDoctor ? "Doctor" : "Patient → Doctor";
  }
  if (msg.chatType === "super_support") {
    return "Super Admin Support";
  }
  if (msg.chatType === "support") {
    return msg.isFromDoctor ? "Client Support" : "Patient → Support";
  }
  return msg.senderName || "Sending...";
}

function getMessageGroupLabel(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isThisWeek(date)) return format(date, "EEEE"); // Monday, Tuesday
  return format(date, "MMM d, yyyy");
}

function groupMessagesByDate<T extends { timestamp: string }>(messages: T[]) {
  const groups: Record<string, T[]> = {};
  messages.forEach((msg) => {
    const dateKey = formatISO(new Date(msg.timestamp), { representation: "date" });
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
  });
  return groups;
}

// ------------------------------------------------------

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [unreadMap, setUnreadMap] = useState<UnreadMap>({});
  const [justArrivedConvId, setJustArrivedConvId] = useState<string | null>(null);
  const justArrivedTimer = useRef<number | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  const { qMasterId, qChatType } = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      qMasterId: params.get("masterId"),
      qChatType: (params.get("chatType") as "doctor" | "support" | null) ?? null,
    };
  }, [location.search]);

  const computeUnreadMap = (convs: Conversation[]): UnreadMap =>
    convs.reduce((acc, c) => {
      acc[c.id] = c.messages.reduce((n, m) => (m.read ? n : n + 1), 0);
      return acc;
    }, {} as UnreadMap);

  const flashJustArrived = (convId: string) => {
    setJustArrivedConvId(convId);
    if (justArrivedTimer.current) window.clearTimeout(justArrivedTimer.current);
    justArrivedTimer.current = window.setTimeout(() => {
      setJustArrivedConvId((cur) => (cur === convId ? null : cur));
      justArrivedTimer.current = null;
    }, 4500);
  };

  // Initial load
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
        setUnreadMap(computeUnreadMap(convs));
      } catch (err) {
        console.error("Failed to load conversations:", err);
      }
    };

    loadData();
    return () => {
      if (justArrivedTimer.current) window.clearTimeout(justArrivedTimer.current);
    };
  }, []);

  // Selection handler
  useEffect(() => {
    if (conversations.length === 0) return;

    let found =
      qMasterId && qChatType
        ? conversations.find((c) => c.masterId === qMasterId && c.type === qChatType)
        : null;

    if (!found && qMasterId) {
      found = conversations.find((c) => c.masterId === qMasterId) || null;
    }

    const toSelect = found || selectedConv || conversations[0];

    if (!selectedConv || selectedConv.id !== toSelect.id) {
      setSelectedConv({ ...toSelect, messages: [] });

      const url = `/dashboard/messages?masterId=${toSelect.masterId}&chatType=${toSelect.type}`;
      if (location.search !== `?masterId=${toSelect.masterId}&chatType=${toSelect.type}`) {
        navigate(url, { replace: true });
      }

      (async () => {
        try {
          let freshMsgs: Message[] = [];
          if (toSelect.type === "doctor") {
            freshMsgs = await MessageService.getDoctorMessages(toSelect.masterId);
          } else {
            freshMsgs = await MessageService.getSupportMessages(toSelect.masterId);
          }

          const unread = freshMsgs.filter((m) => !m.read);
          if (unread.length) {
            await Promise.all(unread.map((m) => MessageService.markAsRead(m.id)));
            freshMsgs = freshMsgs.map((m) => ({ ...m, read: true }));
          }

          setConversations((prev) =>
            prev.map((c) => (c.id === toSelect.id ? { ...c, messages: freshMsgs } : c))
          );
          setSelectedConv({ ...toSelect, messages: freshMsgs });
          setUnreadMap((prev) => ({ ...prev, [toSelect.id]: 0 }));
        } catch (err) {
          console.error("Failed to load messages:", err);
        }
      })();
    }
  }, [conversations, qMasterId, qChatType]);

  // Polling
  useEffect(() => {
    if (!selectedConv) return;

    const interval = setInterval(async () => {
      try {
        let updatedSelectedMsgs: Message[] = [];
        if (selectedConv.type === "doctor") {
          updatedSelectedMsgs = await MessageService.getDoctorMessages(selectedConv.masterId);
        } else {
          updatedSelectedMsgs = await MessageService.getSupportMessages(selectedConv.masterId);
        }

        const unreadInSelected = updatedSelectedMsgs.filter((m) => !m.read);
        if (unreadInSelected.length) {
          await Promise.all(unreadInSelected.map((m) => MessageService.markAsRead(m.id)));
          updatedSelectedMsgs = updatedSelectedMsgs.map((m) => ({ ...m, read: true }));
        }

        const nextConvs = conversations.map((c) =>
          c.id === selectedConv.id ? { ...c, messages: updatedSelectedMsgs } : c
        );

        setConversations(nextConvs);
        setSelectedConv((prev) => (prev ? { ...prev, messages: updatedSelectedMsgs } : prev));
        setUnreadMap(computeUnreadMap(nextConvs));
      } catch (err) {
        console.error("Polling failed:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedConv, conversations]);

  const handleSelectConversation = async (conv: Conversation) => {
    navigate(`/dashboard/messages?masterId=${conv.masterId}&chatType=${conv.type}`);
    setSelectedConv({ ...conv, messages: [] });

    try {
      let freshMsgs: Message[] = [];
      if (conv.type === "doctor") {
        freshMsgs = await MessageService.getDoctorMessages(conv.masterId);
      } else {
        freshMsgs = await MessageService.getSupportMessages(conv.masterId);
      }

      const unread = freshMsgs.filter((m) => !m.read);
      if (unread.length) {
        await Promise.all(unread.map((m) => MessageService.markAsRead(m.id)));
        freshMsgs = freshMsgs.map((m) => ({ ...m, read: true }));
      }

      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, messages: freshMsgs } : c))
      );
      setSelectedConv({ ...conv, messages: freshMsgs });
      setUnreadMap((prev) => ({ ...prev, [conv.id]: 0 }));
    } catch (err) {
      console.error("Failed to mark messages as read:", err);
    }
  };

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
        prev.map((c) => (c.id === selectedConv.id ? { ...c, messages: [...c.messages, newMsg] } : c))
      );
      setSelectedConv((prev) => (prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev));
      setUnreadMap((prev) => ({ ...prev, [selectedConv.id]: 0 }));

      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message. Please try again.");
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
          <p className="text-gray-600">Communicate with your doctor or support team</p>
        </div>
        <Button className="hidden">
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
            {filteredConversations.map((conv) => {
              const unread = unreadMap[conv.id] || 0;
              const isSelected = selectedConv?.id === conv.id;

              return (
                <div
                  key={conv.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 flex items-start ${
                    isSelected ? "bg-blue-50 border-blue-500" : "border-transparent"
                  }`}
                  onClick={() => handleSelectConversation(conv)}
                >
                  <div className="relative mr-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage />
                      <AvatarFallback>{conv.type === "doctor" ? "DR" : "CS"}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`truncate ${unread > 0 ? "font-semibold" : ""}`}>
                        {conv.label}
                      </p>
                      {unread > 0 && (
                        <span className="ml-2 shrink-0 rounded-full bg-blue-600 text-white text-xs px-2 py-0.5">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{conv.messages.length} messages</p>
                  </div>
                </div>
              );
            })}
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
                      <AvatarFallback>{selectedConv.type === "doctor" ? "DR" : "CS"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-gray-900">{selectedConv.label}</h3>
                      <p className="text-sm text-gray-600 capitalize">{selectedConv.type}</p>
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
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
                {(() => {
                  const grouped = groupMessagesByDate(selectedConv.messages);
                  const sortedDates = Object.keys(grouped).sort(
                    (a, b) => new Date(a).getTime() - new Date(b).getTime()
                  );

                  return sortedDates.map((dateKey) => (
                    <div key={dateKey}>
                      <div className="flex justify-center my-4">
                        <span className="bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full">
                          {getMessageGroupLabel(dateKey)}
                        </span>
                      </div>

                      <div className="space-y-4">
                        {grouped[dateKey].map((msg) => {
                          let alignment = "justify-start";
                          let bubbleColor = "bg-gray-100 text-gray-900";
                          let timeColor = "text-gray-500";

                          if (selectedConv.type === "doctor") {
                            if (msg.isFromDoctor) {
                              alignment = "justify-start";
                              bubbleColor = "bg-gray-100 text-gray-900";
                              timeColor = "text-gray-500";
                            } else {
                              alignment = "justify-end";
                              bubbleColor = "bg-blue-600 text-white";
                              timeColor = "text-blue-100";
                            }
                          } else {
                            if (msg.chatType === "super_support") {
                              alignment = "justify-start";
                              bubbleColor = "bg-red-100 text-red-800";
                              timeColor = "text-red-600";
                            } else if (msg.isFromDoctor) {
                              alignment = "justify-start";
                              bubbleColor = "bg-purple-100 text-purple-800";
                              timeColor = "text-purple-600";
                            } else {
                              alignment = "justify-end";
                              bubbleColor = "bg-blue-600 text-white";
                              timeColor = "text-blue-100";
                            }
                          }

                          return (
                            <div key={msg.id} className={`flex ${alignment}`}>
                              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${bubbleColor}`}>
                                <p className="text-sm">{msg.content}</p>
                                <p className={`text-xs mt-1 ${timeColor}`}>
                                  {getDisplayName(msg)} •{" "}
                                  {new Date(msg.timestamp).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </CardContent>

              {/* Input */}
              <div className="p-4 border-t bg-white">
                <div className="flex items-center justify-center gap-3">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 max-w-3xl rounded-full border px-4 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    className="px-7 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full shadow-md hover:shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Send
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
