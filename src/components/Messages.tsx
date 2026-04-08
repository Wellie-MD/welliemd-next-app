"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Send,
  X,
  ChevronDown,
  Paperclip,
  FileText,
  FileSpreadsheet,
  FileArchive,
  File as FileIcon,
  FileAudio,
  FileVideo,
  FileCode,
  ExternalLink,
} from "lucide-react";

import {
  MessageService,
  type RawMessage,
  type ChatRecipient,
} from "@/features/messages/services/message.service";
import { VisitService } from "@/features/visits/services/visit.service";
import { useAuth } from "@/features/auth";
import { env } from "@/config/env";

import { isToday, isYesterday, isThisWeek, format, formatISO } from "date-fns";

// ---------------- Types -----------------
interface Conversation {
  id: string;            // masterId
  masterId: string;
  label: string;         // e.g., `${visit_type} — Chat`
  messages: RawMessage[]; // newest-first in state
}

// --------------- Helpers ----------------
const byTimeAsc = (a: RawMessage, b: RawMessage) => {
  const tA = new Date(a.timestamp).getTime();
  const tB = new Date(b.timestamp).getTime();
  if (isNaN(tA)) return 1;
  if (isNaN(tB)) return -1;
  return tA - tB;
};

const byTimeDesc = (a: RawMessage, b: RawMessage) => {
  const tA = new Date(a.timestamp).getTime();
  const tB = new Date(b.timestamp).getTime();
  if (isNaN(tA)) return 1;
  if (isNaN(tB)) return -1;
  return tB - tA;
};

// function getMessageGroupLabel(dateStr: string) {
//   const date = new Date(dateStr);
//   if (isToday(date)) return "Today";
//   if (isYesterday(date)) return "Yesterday";
//   if (isThisWeek(date)) return format(date, "EEEE");
//   return format(date, "MMM d, yyyy");
// }

function groupMessagesByDate<T extends { timestamp: string }>(messages: T[]) {
  const groups: Record<string, T[]> = {};
  messages.forEach((msg) => {
    try {
      const date = new Date(msg.timestamp);
      if (isNaN(date.getTime())) return;
      const dateKey = formatISO(date, { representation: "date" });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(msg);
    } catch (e) {
      console.warn("Invalid message timestamp", msg.timestamp);
    }
  });
  return groups;
}

function isInboundForPatient(m: RawMessage) {
  return (
    m.senderType === "doctor" ||
    m.senderType === "support" ||
    m.senderType === "super_support"
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function routeLabel(m: RawMessage) {
  if (m.senderType === "patient") {
    if (m.chatType === "doctor") return "to Doctor";
    if (m.chatType === "super_support") return "to Super Admin Support";
    if (m.chatType === "support") return "to Support";
    return "You";
  }
  if (m.senderType === "doctor") return "Doctor";
  if (m.senderType === "super_support") return "Client Support";
  if (m.senderType === "support") return "Client Support";
  return "You";
}

const isImage = (mime?: string) => (mime ?? "").startsWith("image/");

function linkifyText(text: string): React.ReactNode {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.substring(lastIndex, match.index));
    const url = match[0];
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {url}
        <ExternalLink className="inline-block ml-1 w-3 h-3" />
      </a>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.substring(lastIndex));
  if (parts.length === 0) return text;
  return <>{parts}</>;
}

const getExt = (name?: string) => {
  if (!name) return "";
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
};

const DocIcon = ({ ext, mime }: { ext: string; mime?: string | undefined }) => {
  const m = (mime || "").toLowerCase();
  if (m.startsWith("audio/")) return <FileAudio className="h-5 w-5" />;
  if (m.startsWith("video/")) return <FileVideo className="h-5 w-5" />;
  if (m.startsWith("text/") || ext === "txt" || ext === "rtf") return <FileText className="h-5 w-5" />;
  if (ext === "pdf") return <FileText className="h-5 w-5" />;
  if (["xls", "xlsx", "csv", "ods"].includes(ext)) return <FileSpreadsheet className="h-5 w-5" />;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return <FileArchive className="h-5 w-5" />;
  if (["js", "ts", "py", "java", "c", "cpp", "json", "yml", "yaml", "html", "css"].includes(ext))
    return <FileCode className="h-5 w-5" />;
  return <FileIcon className="h-5 w-5" />;
};

function DocumentBubble({
  url,
  name,
  mime,
}: {
  url: string;
  name?: string | null | undefined;
  mime?: string | null | undefined;
}) {
  const ext = getExt(name || undefined);
  const display = name || "Attachment";
  return (
    <div style={{ maxWidth: 260, borderRadius: 8, background: "var(--km-s1)", border: "1px solid var(--km-b)", overflow: "hidden" }}>
      <div style={{ padding: 12, display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ width: 36, height: 36, background: "var(--km-s2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <DocIcon ext={ext} mime={mime || undefined} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--km-t)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{display}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            {ext && <span style={{ fontSize: 10, background: "var(--km-s2)", padding: "2px 6px", borderRadius: 12, textTransform: "uppercase", fontWeight: 600 }}>{ext}</span>}
          </div>
        </div>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: "block", textAlign: "center", padding: "8px", borderTop: "1px solid var(--km-b)", fontSize: 12, fontWeight: 600, color: "var(--km-t)", background: "var(--km-s2)", textDecoration: "none" }}>
        Open Attachment
      </a>
    </div>
  );
}

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [composeText, setComposeText] = useState("");
  const [composeTo, setComposeTo] = useState<ChatRecipient>("doctor"); // default support
  const [showRouting, setShowRouting] = useState(false);
  const [search, setSearch] = useState("");

  // attachments (multi-select)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const visits = await VisitService.getPatientVisits();
      const promises = visits.map(async (v) => {
        const mId = v.master_id || v.id;
        const raw = await MessageService.getAllMessages(mId);
        return {
          id: v.id,
          masterId: mId,
          label: v.visit_type || `Visit ${v.id}`,
          messages: raw,
        } as Conversation;
      });
      const results = await Promise.all(promises);
      const nextConversations = results
        .filter((c) => c != null)
        .sort((a, b) => {
          const aLatest = (a.messages || []).slice().sort(byTimeDesc)[0];
          const bLatest = (b.messages || []).slice().sort(byTimeDesc)[0];
          const aTime = aLatest ? new Date(aLatest.timestamp).getTime() : 0;
          const bTime = bLatest ? new Date(bLatest.timestamp).getTime() : 0;
          return bTime - aTime;
        });

      setConversations(nextConversations);
      setSelectedId((prevSelected) => {
        if (!nextConversations.length) return null;
        if (!prevSelected) return nextConversations[0].id;
        const stillExists = nextConversations.some((c) => c.id === prevSelected);
        return stillExists ? prevSelected : nextConversations[0].id;
      });
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
    const id = window.setInterval(() => void loadConversations(), 10000);
    const onFocus = () => void loadConversations();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [loadConversations]);

  // Auto-mark inbound messages as read when a conversation is selected
  useEffect(() => {
    if (!selectedId) return;
    const chat = conversations.find(c => c.id === selectedId);
    if (!chat) return;
    const unreadInbound = chat.messages.filter(m => !m.readByPatient && isInboundForPatient(m));
    if (unreadInbound.length === 0) return;

    // Mark each unread message as read on the backend
    unreadInbound.forEach(m => {
      MessageService.markAsReadByPatient(m.id).catch(() => undefined);
    });

    // Update local state so blue dot disappears
    setConversations(prev =>
      prev.map(c =>
        c.id === selectedId
          ? { ...c, messages: c.messages.map(m => isInboundForPatient(m) ? { ...m, readByPatient: true } : m) }
          : c
      )
    );
  }, [selectedId, conversations.length]);

  useEffect(() => {
    // If selected chat gets updated, scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, [selectedId, conversations]);

  const handleSend = async () => {
    const selected = conversations.find(c => c.id === selectedId);
    if (!selected) return;

    const body = composeText.trim();
    const hasFiles = attachedFiles.length > 0;
    if (!body && !hasFiles) return;

    setUploading(true);
    try {
      const uploads = await Promise.all(
        attachedFiles.map((f) => MessageService.uploadAttachment(f))
      );

      const makeOptimistic = (opts: { content: string; is_media?: boolean; media_url?: string; mime_type?: string; file_name?: string; chatTo: ChatRecipient; }): RawMessage => {
        const msg: any = {
          id: Date.now() + Math.random(),
          content: opts.content,
          timestamp: new Date().toISOString(),
          read: true,
          readByPatient: true,
          masterId: selected.masterId,
          senderType: "patient",
          side: "left", // patient replies show nicely
          chatType: opts.chatTo,
          is_media: !!opts.is_media,
        };
        if (opts.media_url) msg.media_url = opts.media_url;
        if (opts.mime_type) msg.mime_type = opts.mime_type;
        if (opts.file_name) msg.file_name = opts.file_name;
        return msg;
      };

      const optimistic: RawMessage[] = [];

      if (body) {
        const first = uploads[0];
        
        const payload: any = {
          master_id: selected.masterId,
          to: composeTo,
          content: body,
          is_media: !!first,
          app_name: env.VITE_APP_NAME,
        };
        if (first?.url) payload.media_url = first.url;
        if (first?.mimeType) payload.media_mime_type = first.mimeType;
        if (first?.fileName) payload.media_file_name = first.fileName;
        if (user?.first_name) payload.first_name = user.first_name;
        if (user?.last_name) payload.last_name = user.last_name;

        await MessageService.sendMessage(payload);

        const optOptsMain: any = { content: body, is_media: !!first, chatTo: composeTo };
        if (first?.url) optOptsMain.media_url = first.url;
        if (first?.mimeType) optOptsMain.mime_type = first.mimeType;
        if (first?.fileName) optOptsMain.file_name = first.fileName;
        optimistic.push(makeOptimistic(optOptsMain));
        if (first) uploads.shift();
      }

      for (const up of uploads) {
        const payload: any = {
          master_id: selected.masterId,
          to: composeTo,
          content: up.fileName || "Attachment",
          is_media: true,
          media_url: up.url,
          media_mime_type: up.mimeType,
          media_file_name: up.fileName,
          app_name: env.VITE_APP_NAME,
        };
        if (user?.first_name) payload.first_name = user.first_name;
        if (user?.last_name) payload.last_name = user.last_name;

        await MessageService.sendMessage(payload);
        
        const optOpts: any = { content: up.fileName || "Attachment", is_media: true, chatTo: composeTo };
        if (up.url) optOpts.media_url = up.url;
        if (up.mimeType) optOpts.mime_type = up.mimeType;
        if (up.fileName) optOpts.file_name = up.fileName;
        optimistic.push(makeOptimistic(optOpts));
      }

      const next = [...optimistic, ...(selected.messages || [])];
      setConversations((prev) =>
        prev.map((c) => (c.id === selected.id ? { ...c, messages: next } : c))
      );

      setComposeText("");
      setAttachedFiles([]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 40);
      void loadConversations();
    } finally {
      setUploading(false);
    }
  };

  const filtered = useMemo(
    () => conversations.filter((c) => c.label.toLowerCase().includes(search.toLowerCase())),
    [conversations, search]
  );

  const selectedChat = conversations.find(c => c.id === selectedId);

  return (
    <div className="km-msg-layout">
      {/* THREAD LIST PANEL */}
      <div className="km-msg-list-panel">
        <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid var(--km-b)" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 500, marginBottom: 12 }}>Messages</div>
          <div className="km-swrap" style={{ marginBottom: 0, position: "relative" }}>
            <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--km-tm)" }} />
            <input 
              className="km-sinp" 
              style={{ width: "100%", background: "var(--km-s2)", border: "1px solid var(--km-b)", borderRadius: "var(--km-rs)", padding: "10px 13px 10px 36px", color: "var(--km-t)", fontSize: 13, outline: "none" }}
              placeholder="Search messages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filtered.map(c => {
          const lastMsg = (c.messages || []).slice().sort(byTimeDesc)[0];
          const avText = c.label.substring(0, 2).toUpperCase();
          const pType = c.label.toUpperCase(); // Group by Treatment Type
          const isUnread = c.messages?.some(m => !m.readByPatient && isInboundForPatient(m));
          
          return (
            <div key={c.id}>
              <div className="km-msg-group-label" style={{ padding: "16px 16px 8px", fontSize: '10px', color: 'var(--km-tm)' }}>{pType}</div>
              <div 
                className={`km-mthread ${selectedId === c.id ? "msg-active" : ""} ${isUnread ? "km-mthread-unread" : ""}`}
                onClick={() => setSelectedId(c.id)}
                style={{ position: 'relative', background: isUnread && selectedId !== c.id ? 'var(--km-acp)' : undefined }}
              >
                <div className="km-mavt" style={{ background: isUnread ? 'var(--km-ac)' : 'var(--km-s2)', color: isUnread ? '#fff' : 'var(--km-gr)', fontWeight: 600 }}>{avText}</div>
                <div className="km-mbody">
                  <div className="km-mfrom" style={{ fontSize: '13px', fontWeight: isUnread ? 700 : 500, color: isUnread ? 'var(--km-t)' : 'var(--km-tm)' }}>{c.label} · {c.masterId.substring(0, 8)}</div>
                  <div className="km-mprev" style={{ fontSize: '11px', color: isUnread ? 'var(--km-t)' : 'var(--km-tm)', fontWeight: isUnread ? 500 : 400, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {lastMsg ? lastMsg.content : "No messages yet"}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <div className="km-mtime" style={{ fontSize: '10px', color: 'var(--km-tm)' }}>{lastMsg ? format(new Date(lastMsg.timestamp), "MMM d") : ""}</div>
                  {isUnread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--km-ac)', boxShadow: '0 0 0 2px var(--km-bg)' }}></div>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* CHAT PANEL */}
      <div className={`km-msg-chat-panel ${selectedId ? 'open' : ''}`}>
        
        {/* Empty state (desktop) */}
        {!selectedChat && (
          <div className="km-msg-empty-state">
            <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Select a conversation</div>
            <div style={{ fontSize: 13, color: "var(--km-tm)" }}>Choose a thread from the list to start reading</div>
          </div>
        )}

        {/* Active chat */}
        {selectedChat && (
          <>
            
            {/* Chat header */}
            <div className="km-msg-chat-header">
              <button className="km-msg-back-btn" onClick={() => setSelectedId(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div className="km-mavt" style={{ width: 34, height: 34, fontSize: 11 }}>
                {selectedChat.label.substring(0,2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedChat.label}</div>
                <div style={{ fontSize: 11, color: "var(--km-tm)" }}>Doctor + Support · Unified thread</div>
              </div>
            </div>

            {/* Messages */}
            <div className="km-cwrap" style={{ flex: 1, overflowY: "auto" }}>
              {(() => {
                const arr = [...(selectedChat.messages || [])].sort(byTimeAsc);
                const grouped = groupMessagesByDate(arr);
                return Object.keys(grouped).map((dateKey) => {
                  const msgs = grouped[dateKey];
                  return (
                    <div key={dateKey} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                      <div className="km-cdiv">
                        {isToday(new Date(dateKey)) ? "Today" : isYesterday(new Date(dateKey)) ? "Yesterday" : format(new Date(dateKey), "MMM d")}
                      </div>
                      {msgs && msgs.map((m) => {
                        const isMe = !isInboundForPatient(m);
                        const nameStr = m.senderType === "doctor" ? "Doctor" : m.senderType === "support" || m.senderType === "super_support" ? "Support" : "You";

                        return (
                          <div key={m.id} className={`km-cbwrap ${isMe ? 'me' : ''}`} style={{ marginBottom: 16 }}>
                            {!isMe && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ fontSize: '11px', color: 'var(--km-tm)', marginLeft: 44 }}>
                                  {nameStr} · {format(new Date(m.timestamp), "MMM d, h:mm a")}
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                  <div className="km-cavsm" style={{ width: 32, height: 32, flexShrink: 0, background: 'var(--km-s2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--km-ac)' }}>
                                    {m.senderType === "doctor" ? "DR" : "SP"}
                                  </div>
                                  <div className={`km-bub them ${m.senderType === "support" || m.senderType === "super_support" ? "sup" : ""}`} style={{ maxWidth: '80%', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', lineHeight: 1.5 }}>
                                    {m.is_media ? (
                                      isImage(m.mime_type) ? (
                                        <a href={m.media_url} target="_blank" rel="noopener noreferrer">
                                          <img src={m.media_url} alt="Attachment" style={{ maxWidth: 200, borderRadius: 8 }} />
                                        </a>
                                      ) : (
                                        <DocumentBubble url={m.media_url!} name={m.file_name} mime={m.mime_type} />
                                      )
                                    ) : (
                                      <div style={{ whiteSpace: "pre-wrap" }}>{linkifyText(m.content)}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            {isMe && (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                <div className="km-bub me" style={{ maxWidth: '80%', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', lineHeight: 1.5, background: 'var(--km-ac)', color: '#fff' }}>
                                  {m.is_media ? (
                                    isImage(m.mime_type) ? (
                                      <a href={m.media_url} target="_blank" rel="noopener noreferrer">
                                        <img src={m.media_url} alt="Attachment" style={{ maxWidth: 200, borderRadius: 8 }} />
                                      </a>
                                    ) : (
                                      <DocumentBubble url={m.media_url!} name={m.file_name} mime={m.mime_type} />
                                    )
                                  ) : (
                                    <div style={{ whiteSpace: "pre-wrap" }}>{linkifyText(m.content)}</div>
                                  )}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--km-tm)', marginRight: 4 }}>
                                  You · {format(new Date(m.timestamp), "MMM d, h:mm a")}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                });
              })()}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Options (File Attachment Previews) */}
            {attachedFiles.length > 0 && (
              <div style={{ padding: "8px 14px", background: "var(--km-s2)", borderTop: "1px solid var(--km-b)", display: "flex", gap: 8, overflowX: "auto" }}>
                {attachedFiles.map((file, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--km-s1)", border: "1px solid var(--km-b)", padding: "4px 8px", borderRadius: 8, fontSize: 11, fontWeight: 600 }}>
                    <Paperclip size={12} />
                    <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
                    <X size={12} style={{ cursor: "pointer", color: "var(--km-re)" }} onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))} />
                  </div>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="km-cibar">
              {showRouting && (
                <div style={{ position: "absolute", bottom: 54, left: 14, background: "var(--km-s1)", border: "1px solid var(--km-b)", borderRadius: "var(--km-rs)", boxShadow: "0 4px 20px rgba(0,0,0,.3)", overflow: "hidden", minWidth: 140, zIndex: 10 }}>
                  <div style={{ padding: 6 }}>
                    <div 
                      onClick={() => { setComposeTo("doctor"); setShowRouting(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 500, background: composeTo === "doctor" ? "var(--km-s2)" : "transparent" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      @ Doctor
                    </div>
                    <div 
                      onClick={() => { setComposeTo("support"); setShowRouting(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 500, background: composeTo === "support" ? "var(--km-s2)" : "transparent" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                      @ Support
                    </div>
                  </div>
                </div>
              )}

              <div 
                className="km-ctosel" 
                onClick={() => setShowRouting(!showRouting)}
                style={composeTo === "doctor" ? { background: "var(--km-acp)", color: "var(--km-ac)", borderColor: "var(--km-ac)" } : {}}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>@ {composeTo === "doctor" ? "Doctor" : "Support"}</span>
                <ChevronDown size={12} strokeWidth={2.5} />
              </div>

              <input 
                className="km-cinp" 
                placeholder="Type a message..." 
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              
              <div 
                className="km-cattch" 
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip strokeWidth={2.5} />
              </div>
              <input
                type="file"
                multiple
                className="hidden"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files) {
                    setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                  }
                }}
              />

              <button 
                className="km-csend" 
                onClick={handleSend}
                disabled={uploading}
                style={{ opacity: uploading ? 0.6 : 1 }}
              >
                {uploading ? (
                  <span style={{ fontSize: 13 }}>Sending...</span>
                ) : (
                  <>
                    <Send strokeWidth={2.5} /> <span>Send</span>
                  </>
                )}
              </button>
            </div>
            
          </>
        )}
      </div>

    </div>
  );
}
