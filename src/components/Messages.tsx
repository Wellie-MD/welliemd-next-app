// src/components/Messages.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Send,
  Search,
  AtSign,
  X,
  Phone,
  Video,
  ChevronDown,
  Paperclip,
} from "lucide-react";

import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";

import {
  MessageService,
  type RawMessage,
  type ChatRecipient,
} from "@/features/messages/services/message.service";
import { VisitService, type Visit } from "@/features/visits/services/visit.service";

import { isToday, isYesterday, isThisWeek, format, formatISO } from "date-fns";

// ---------------- Types -----------------
interface Conversation {
  id: string;            // masterId
  masterId: string;
  label: string;         // e.g., `${visit_type} — Chat`
  messages: RawMessage[]; // newest-first in state
}

// --------------- Helpers ----------------
const byTimeAsc = (a: RawMessage, b: RawMessage) =>
  new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();

const byTimeDesc = (a: RawMessage, b: RawMessage) =>
  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();

function getMessageGroupLabel(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isThisWeek(date)) return format(date, "EEEE");
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

// Inbound relative to the patient
function isInboundForPatient(m: RawMessage) {
  return (
    m.senderType === "doctor" ||
    m.senderType === "support" ||
    m.senderType === "super_support"
  );
}

function routeLabel(m: RawMessage) {
  if (m.senderType === "patient") {
    if (m.chatType === "doctor") return "You → Doctor";
    if (m.chatType === "super_support") return "You → Super Admin Support";
    if (m.chatType === "support") return "You → Support";
    return "You";
  }
  if (m.senderType === "doctor") return "Doctor → You";
  if (m.senderType === "super_support") return "Super Admin Support → You";
  if (m.senderType === "support") return "Client Support → You";
  return "You";
}

const isImage = (mime?: string) => (mime ?? "").startsWith("image/");

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);

  const [composeText, setComposeText] = useState("");
  const [composeTo, setComposeTo] = useState<ChatRecipient>("support"); // default support
  const [search, setSearch] = useState("");

  // attachments (multi-select)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // smart scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const prevCountRef = useRef(0);
  const isUserScrollingRef = useRef(false);

  const scrollToBottom = (force = false) => {
    if (force || isNearBottom) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkNearBottom = () => {
    const el = scrollContainerRef.current;
    if (!el) return false;
    const threshold = 150;
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  const onScroll = () => {
    isUserScrollingRef.current = true;
    setIsNearBottom(checkNearBottom());
    setTimeout(() => (isUserScrollingRef.current = false), 120);
  };

  // Initial load: one conversation per visit using /messages/all/
  useEffect(() => {
    (async () => {
      const visits: Visit[] = await VisitService.getPatientVisits();
      const convs: Conversation[] = [];

      for (const v of visits) {
        if (!v.master_id) continue;
        const all = await MessageService.getAllMessages(v.master_id);
        const newestFirst = [...all].sort(byTimeDesc);
        convs.push({
          id: v.master_id,
          masterId: v.master_id,
          label: `${v.visit_type} — Chat`,
          messages: newestFirst,
        });
      }

      setConversations(convs);
      if (convs[0]) {
        setSelected(convs[0]);

        // mark inbound unread as read
        const inboundUnread = convs[0].messages.filter(
          (m) => isInboundForPatient(m) && (m.readByPatient ?? m.read) === false
        );
        if (inboundUnread.length) {
          await Promise.all(inboundUnread.map((m) => MessageService.markAsReadByPatient(m.id)));
        }

        setTimeout(() => scrollToBottom(true), 100);
        prevCountRef.current = convs[0].messages.length;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling only the selected conversation
  useEffect(() => {
    if (!selected) return;
    const timer = setInterval(async () => {
      const fresh = await MessageService.getAllMessages(selected.masterId);
      const newestFirst = [...fresh].sort(byTimeDesc);

      // mark inbound unread as read while viewing
      const inboundUnread = newestFirst.filter(
        (m) => isInboundForPatient(m) && (m.readByPatient ?? m.read) === false
      );
      if (inboundUnread.length) {
        await Promise.all(inboundUnread.map((m) => MessageService.markAsReadByPatient(m.id)));
      }

      setConversations((prev) =>
        prev.map((c) => (c.id === selected.id ? { ...c, messages: newestFirst } : c))
      );
      setSelected((prev) => (prev ? { ...prev, messages: newestFirst } : prev));

      if (!isUserScrollingRef.current) {
        const nowCount = newestFirst.length;
        const prevCount = prevCountRef.current;
        if (nowCount > prevCount && prevCount > 0) setTimeout(() => scrollToBottom(false), 50);
        prevCountRef.current = nowCount;
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [selected]);

  const selectConversation = async (c: Conversation) => {
    setSelected({ ...c });
    setTimeout(() => scrollToBottom(true), 80);

    // Mark inbound-unread as read
    const inboundUnread = c.messages.filter(
      (m) => isInboundForPatient(m) && (m.readByPatient ?? m.read) === false
    );
    if (inboundUnread.length) {
      await Promise.all(inboundUnread.map((m) => MessageService.markAsReadByPatient(m.id)));
    }
  };

  // ----- Chip menu (clicking on the @ chip) -----
  const [showChipMenu, setShowChipMenu] = useState(false);
  const chipRef = useRef<HTMLDivElement | null>(null);
  const chipMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        chipRef.current &&
        !chipRef.current.contains(target) &&
        chipMenuRef.current &&
        !chipMenuRef.current.contains(target)
      ) {
        setShowChipMenu(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ----- Attachments -----
  const openFilePicker = () => fileInputRef.current?.click();

  const onChooseFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Optional: further filter by size/mime if needed
    setAttachedFiles((prev) => {
      const next = [...prev];
      files.forEach((f) => {
        const key = `${f.name}_${f.size}_${f.lastModified}`;
        const exists = next.some((x) => `${x.name}_${x.size}_${x.lastModified}` === key);
        if (!exists) next.push(f);
      });
      return next;
    });

    // reset so same file can be picked again
    e.currentTarget.value = "";
  };

  const removeFile = (idx: number) =>
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));

  // ----- Send -----
  const send = async () => {
    if (!selected) return;

    const body = composeText.trim();
    const hasFiles = attachedFiles.length > 0;
    if (!body && !hasFiles) return;

    setUploading(true);
    try {
      // 1) upload all files (parallel)
      const uploads = await Promise.all(
        attachedFiles.map((f) => MessageService.uploadAttachment(f))
      ); // -> [{url, fileName, mimeType}, ...]

      const makeOptimistic = (opts: {
        content: string;
        is_media?: boolean;
        media_url?: string;
        mime_type?: string;
        file_name?: string;
        chatTo: ChatRecipient;
      }): RawMessage => ({
        id: Date.now() + Math.random(),
        content: opts.content,
        timestamp: new Date().toISOString(),
        read: true,
        readByPatient: true,
        masterId: selected.masterId,
        senderType: "patient",
        side: "left",
        chatType: opts.chatTo,
        is_media: !!opts.is_media,
        media_url: opts.media_url,
        mime_type: opts.mime_type,
        file_name: opts.file_name,
      });

      const optimistic: RawMessage[] = [];

      // 2) if text exists, send it; if a file also exists, attach the first file to this message
      if (body) {
        const first = uploads[0];
        await MessageService.sendMessage({
          master_id: selected.masterId,
          to: composeTo,
          content: body,
          is_media: !!first,
          media_url: first?.url,
          media_mime_type: first?.mimeType,
          media_file_name: first?.fileName,
        });

        optimistic.push(
          makeOptimistic({
            content: body,
            is_media: !!first,
            media_url: first?.url,
            mime_type: first?.mimeType,
            file_name: first?.fileName,
            chatTo: composeTo,
          })
        );

        // remove the first from the list (already used)
        if (first) uploads.shift();
      }

      // 3) send any remaining files as separate messages (no text)
      for (const up of uploads) {
        await MessageService.sendMessage({
          master_id: selected.masterId,
          to: composeTo,
          content: up.fileName || "Attachment",
          is_media: true,
          media_url: up.url,
          media_mime_type: up.mimeType,
          media_file_name: up.fileName,
        });

        optimistic.push(
          makeOptimistic({
            content: up.fileName || "Attachment",
            is_media: true,
            media_url: up.url,
            mime_type: up.mimeType,
            file_name: up.fileName,
            chatTo: composeTo,
          })
        );
      }

      // 4) update UI (newest-first in state)
      const next = [...optimistic, ...(selected.messages || [])];
      setSelected((prev) => (prev ? { ...prev, messages: next } : prev));
      setConversations((prev) =>
        prev.map((c) => (c.id === selected.id ? { ...c, messages: next } : c))
      );

      setComposeText("");
      setAttachedFiles([]);
      setTimeout(() => scrollToBottom(true), 40);
    } finally {
      setUploading(false);
    }
  };

  const filtered = useMemo(
    () => conversations.filter((c) => c.label.toLowerCase().includes(search.toLowerCase())),
    [conversations, search]
  );

  return (
    <div className="h-screen flex flex-col p-6">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
          <p className="text-gray-600">All messages (Doctor + Support) per visit</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px] overflow-hidden">
        {/* Sidebar */}
        <Card className="lg:col-span-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {filtered.map((c) => {
              const isSelected = selected?.id === c.id;
              const last = c.messages?.[0]; // newest-first
              return (
                <div
                  key={c.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 flex items-start ${
                    isSelected ? "bg-blue-50 border-blue-500" : "border-transparent"
                  }`}
                  onClick={() => selectConversation(c)}
                >
                  <div className="relative mr-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage />
                      <AvatarFallback>CH</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="truncate font-medium">{c.label}</p>
                      {last && (
                        <span className="ml-2 shrink-0 text-xs text-gray-500">
                          {new Date(last.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{last?.content}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Chat window */}
        <Card className="lg:col-span-2 flex flex-col min-h-0 overflow-hidden">
          {selected && (
            <>
              <CardHeader className="pb-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage />
                      <AvatarFallback>CH</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-gray-900">{selected.label}</h3>
                      <p className="text-sm text-gray-600">Unified thread</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Separator />
              </CardHeader>

              <CardContent
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0"
                onScroll={onScroll}
              >
                {(() => {
                  const chronological = [...(selected.messages || [])].sort(byTimeAsc);
                  const grouped = groupMessagesByDate(chronological);
                  const days = Object.keys(grouped).sort(
                    (a, b) => new Date(a).getTime() - new Date(b).getTime()
                  );

                  return days.map((day) => (
                    <div key={day}>
                      <div className="flex justify-center my-4">
                        <span className="bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full">
                          {getMessageGroupLabel(day)}
                        </span>
                      </div>
                      <div className="space-y-4">
                        {grouped[day].map((m) => {
                          const isMe = m.side ? m.side === "left" : m.senderType === "patient";
                          const alignment = isMe ? "justify-end" : "justify-start";
                          let bubble = isMe ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900";
                          let sub = isMe ? "text-blue-100" : "text-gray-500";

                          if (!isMe && m.senderType === "super_support") {
                            bubble = "bg-red-100 text-red-800";
                            sub = "text-red-700";
                          } else if (!isMe && m.senderType === "support") {
                            bubble = "bg-purple-100 text-purple-800";
                            sub = "text-purple-700";
                          }

                          return (
                            <div key={m.id} className={`flex ${alignment}`}>
                              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${bubble}`}>
                                {/* body or attachment */}
                                {m.is_media && m.media_url ? (
                                  isImage(m.mime_type) ? (
                                    <a
                                      href={m.media_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block"
                                      title={m.file_name || "Open image"}
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={m.media_url}
                                        alt={m.file_name || "attachment"}
                                        className="rounded-md max-h-60 object-contain mb-2"
                                      />
                                    </a>
                                  ) : (
                                    <a
                                      href={m.media_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-xs underline break-all"
                                      title={m.file_name || "Open file"}
                                    >
                                      {m.file_name || m.content || "Attachment"}
                                    </a>
                                  )
                                ) : (
                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {m.content}
                                  </p>
                                )}

                                <p className={`text-xs mt-1 ${sub}`}>
                                  {routeLabel(m)} •{" "}
                                  {new Date(m.timestamp).toLocaleTimeString([], {
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
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Composer */}
              <div className="p-4 border-t bg-white flex-shrink-0">
                <div className="flex items-center gap-2 max-w-3xl mx-auto w-full">
                  {/* Selected recipient chip (clickable) */}
                  <div className="relative" ref={chipRef}>
                    <button
                      type="button"
                      onClick={() => setShowChipMenu((v) => !v)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs text-gray-700 bg-white hover:bg-gray-50 relative z-30"
                      title="Recipient"
                    >
                      <AtSign className="h-3.5 w-3.5" />
                      <span className="capitalize">{composeTo}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                    </button>

                    {showChipMenu && (
                      <div
                        ref={chipMenuRef}
                        className="fixed bg-white border rounded-md shadow-md w-40 overflow-hidden z-[9999]"
                        style={{
                          left: chipRef.current
                            ? `${chipRef.current.getBoundingClientRect().left}px`
                            : 0,
                          top: chipRef.current
                            ? `${chipRef.current.getBoundingClientRect().top - 90}px`
                            : 0,
                        }}
                      >
                        <button
                          className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                            composeTo === "doctor" ? "bg-gray-50 font-medium" : ""
                          }`}
                          onClick={() => {
                            setComposeTo("doctor");
                            setShowChipMenu(false);
                          }}
                        >
                          @ Doctor
                        </button>
                        <button
                          className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                            composeTo === "support" ? "bg-gray-50 font-medium" : ""
                          }`}
                          onClick={() => {
                            setComposeTo("support");
                            setShowChipMenu(false);
                          }}
                        >
                          @ Support
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Message text */}
                  <div className="relative flex-1">
                    <Input
                      placeholder="Type your message…"
                      value={composeText}
                      onChange={(e) => setComposeText(e.target.value)}
                      className="rounded-full border px-4 py-2 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          send();
                        }
                      }}
                    />
                  </div>

                  {/* Attach + Send */}
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept={"image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"}
                      multiple
                      onChange={onChooseFile}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={openFilePicker}
                      disabled={uploading}
                      title="Attach images or documents"
                      className="rounded-full"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>

                    <Button onClick={send} className="px-6" disabled={uploading}>
                      <Send className="h-4 w-4 mr-2" />
                      {uploading ? "Sending…" : "Send"}
                    </Button>
                  </div>
                </div>

                {/* Selected files preview (chips) */}
                {attachedFiles.length > 0 && (
                  <div className="max-w-3xl mx-auto mt-2 flex flex-wrap gap-2">
                    {attachedFiles.map((f, idx) => (
                      <span
                        key={`${f.name}_${f.size}_${f.lastModified}`}
                        className="inline-flex items-center gap-2 text-xs px-2 py-1 border rounded-full bg-gray-50"
                      >
                        {f.type?.startsWith("image/") ? "Image:" : "File:"} {f.name}
                        <button
                          onClick={() => removeFile(idx)}
                          className="ml-1 hover:text-red-600"
                          title="Remove"
                          type="button"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
