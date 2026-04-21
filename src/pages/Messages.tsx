// src/pages/Messages.tsx
// Admin Portal with date separators + smart autoscroll
// UPDATED: hide all attachment names (no filenames/titles anywhere)

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Phone,
  Eye,
  Send,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  FileArchive,
  File as FileIcon,
  FileAudio,
  FileVideo,
  FileCode,
  Paperclip,
  Search,
  MessageSquare,
  ArrowDown,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useMessages } from "@/hooks/useMessages";
import { groupMessages, type Conversation } from "@/utils/groupMessages";
import { useClients, type Client } from "@/hooks/useClients";

import { isToday, isYesterday, isThisWeek, format, formatISO } from "date-fns";
import {
  messageService,
  uploadToAdminS3,
  type NewAttachment,
  markAdminNotificationsReadForConversation,
} from "@/services/messageService";
import { useSearchParams } from "react-router-dom";

function getMessageGroupLabel(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isThisWeek(date)) return format(date, "EEEE");
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

const URL_RE = /https?:\/\/[^\s)]+/i;
const IMG_EXT_RE = /\.(png|jpe?g|gif|webp|bmp|svg|heic|tiff?)(\?.*)?$/i;
const DOC_EXT_RE = /\.(pdf|docx?|xlsx?|csv|txt|rtf|pptx?)(\?.*)?$/i;
const isImageMime = (mime?: string) => !!mime && mime.toLowerCase().startsWith("image/");
const extractFirstUrl = (text?: string): string | null => {
  if (!text) return null;
  const m = text.match(URL_RE);
  return m ? m[0] : null;
};
function fileNameFromUrl(u: string) {
  try {
    const url = new URL(u);
    return decodeURIComponent(url.pathname.split("/").pop() || u);
  } catch {
    return u;
  }
}

/* -------------------- Document UI (names removed) -------------------- */
const getExt = (name?: string | null) => {
  if (!name) return "";
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
};

const DocIcon = ({ ext, mime }: { ext: string; mime?: string | null }) => {
  let Icon = FileIcon;
  const m = (mime || "").toLowerCase();
  if (m.startsWith("audio/")) Icon = FileAudio;
  else if (m.startsWith("video/")) Icon = FileVideo;
  else if (m.startsWith("text/") || ["txt", "rtf", "pdf"].includes(ext)) Icon = FileText;
  else if (["xls", "xlsx", "csv", "ods"].includes(ext)) Icon = FileSpreadsheet;
  else if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) Icon = FileArchive;
  else if (["js", "ts", "py", "java", "c", "cpp", "json", "yml", "yaml", "html", "css"].includes(ext)) Icon = FileCode;

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-200">
      <Icon className="h-5 w-5" />
    </div>
  );
};

function DocumentBubble({
  url,
  name,
  mime,
}: {
  url: string;
  name?: string | null;
  mime?: string | null;
}) {
  // derive extension from given name or URL; DO NOT display the name
  const derivedName = name ?? fileNameFromUrl(url);
  const ext = getExt(derivedName);

  return (
    <div className="w-[260px] lg:w-[320px] rounded-lg bg-white dark:bg-slate-900 shadow-sm ring-1 ring-gray-200 dark:ring-slate-700">
      <div className="p-3 flex items-start gap-3">
        <DocIcon ext={ext} mime={mime} />
        <div className="min-w-0">
          {/* filename/title intentionally omitted */}
          <div className="mt-1 flex items-center gap-2">
            {ext && (
              <span className="inline-flex items-center rounded-full bg-gray-50 text-gray-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                {ext}
              </span>
            )}
            {mime && <span className="text-[11px] text-gray-500 dark:text-slate-400 truncate">{mime}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center border-t border-gray-200 dark:border-slate-700 px-3 py-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100"
          title="Open in new tab"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open
        </a>
      </div>
    </div>
  );
}

/* ==================== Component ==================== */
export default function Messages() {
  const MAX_COMPOSER_HEIGHT_PX = 140;
  const [searchParams, setSearchParams] = useSearchParams();
  // 1) Admin: load clients
  const { clients, loading: loadingClients, error: clientsError } = useClients();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // 2) Load messages (admin hits selected client's API)
  const { messages, loading, error } = useMessages(undefined, 20000, selectedClient?.id);

  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const sendInFlightRef = useRef(false);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Attachments (compose)
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; file: File }[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onClickAttach = () => fileInputRef.current?.click();
  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;
    setFiles((prev) => [...prev, ...list]);
    setPreviews((prev) => [...prev, ...list.map((f) => ({ file: f, url: URL.createObjectURL(f) }))]);
  };
  const clearAttachment = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    const u = previews[i]?.url;
    if (u) URL.revokeObjectURL(u);
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };
  const clearAllAttachments = () => {
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setFiles([]);
    setPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const conversations = groupMessages(messages);

  const filteredConversations = searchQuery
    ? conversations.filter(c => {
        const q = searchQuery.toLowerCase();
        return c.patientName?.toLowerCase().includes(q) ||
          c.patientEmail?.toLowerCase().includes(q) ||
          (c.orderNumber && c.orderNumber.toLowerCase().includes(q));
      })
    : conversations;

  const resizeComposer = () => {
    const el = messageInputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const nextHeight = Math.min(el.scrollHeight, MAX_COMPOSER_HEIGHT_PX);
    el.style.height = `${Math.max(48, nextHeight)}px`;
    el.style.overflowY = el.scrollHeight > MAX_COMPOSER_HEIGHT_PX ? "auto" : "hidden";
  };

  useEffect(() => {
    resizeComposer();
  }, [newMessage]);

  // Auto-pick first client
  useEffect(() => {
    const targetClientId = searchParams.get("client_id");
    if (!loadingClients && targetClientId && clients.length > 0) {
      const match = clients.find((c) => c.id === targetClientId);
      if (match) {
        setSelectedClient(match);
        return;
      }
      // Guard stale client ids to avoid repeated 404 poll loops.
      const next = new URLSearchParams(searchParams);
      next.delete("client_id");
      next.delete("master_id");
      setSearchParams(next, { replace: true });
    }
    if (!loadingClients && !selectedClient && clients.length > 0) {
      setSelectedClient(clients[0]);
    }
  }, [loadingClients, clients, selectedClient, searchParams, setSearchParams]);

  // Keep activeConversation in sync
  useEffect(() => {
    if (activeConversation) {
      const updated = conversations.find((c) => c.id === activeConversation.id);
      if (updated) setActiveConversation(updated);
    }
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset conversation when client changes
  useEffect(() => {
    setActiveConversation(null);
  }, [selectedClient?.id]);

  // Auto-open first conversation
  useEffect(() => {
    if (!loading && !activeConversation && conversations.length > 0) {
      setActiveConversation(conversations[0]);
    }
  }, [loading, conversations, activeConversation]);

  useEffect(() => {
    const targetMasterId = searchParams.get("master_id");
    if (!targetMasterId || conversations.length === 0) return;
    const match = conversations.find((c) => c.masterId === targetMasterId);
    if (!match) return;
    setActiveConversation(match);
    const next = new URLSearchParams(searchParams);
    next.delete("master_id");
    next.delete("client_id");
    setSearchParams(next, { replace: true });
  }, [conversations, searchParams, setSearchParams]);

  useEffect(() => {
    if (!selectedClient?.id || !activeConversation?.masterId) return;
    let cancelled = false;

    (async () => {
      const compositeIds = await markAdminNotificationsReadForConversation(
        selectedClient.id,
        activeConversation.masterId
      );
      if (cancelled || compositeIds.length === 0) return;

      try {
        const raw = localStorage.getItem("admin_seen_message_notifications");
        const existing = raw ? (JSON.parse(raw) as string[]) : [];
        const merged = Array.from(new Set([...existing, ...compositeIds]));
        localStorage.setItem("admin_seen_message_notifications", JSON.stringify(merged));
      } catch {
        // no-op
      }

      window.dispatchEvent(
        new CustomEvent("admin:notifications-seen", {
          detail: { compositeIds },
        })
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedClient?.id, activeConversation?.id, activeConversation?.masterId, activeConversation?.messages]);

  // ===== Smart autoscroll =====
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldStickRef = useRef(true);
  const SCROLL_THRESHOLD = 48;

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      shouldStickRef.current = distanceFromBottom <= SCROLL_THRESHOLD;
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll;
    return () => el.removeEventListener("scroll", onScroll);
  }, [activeConversation?.id, selectedClient?.id]);

  // scroll-to-bottom FAB visibility
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollToBottom(distance > 120);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [activeConversation?.id]);

  function stickToBottomSoon() {
    shouldStickRef.current = true;
    requestAnimationFrame(() => {
      const el = messagesContainerRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    });
  }

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el || !activeConversation) return;
    if (shouldStickRef.current) el.scrollTop = el.scrollHeight;
  }, [activeConversation?.messages]);

  useEffect(() => { shouldStickRef.current = true; }, [selectedClient?.id]);
  useEffect(() => { shouldStickRef.current = true; stickToBottomSoon(); }, [activeConversation?.id]);



async function handleSend() {
  if (sendInFlightRef.current || sending) return;
  if (!activeConversation || (!newMessage.trim() && files.length === 0)) return;

  try {
    sendInFlightRef.current = true;
    setSending(true);
    shouldStickRef.current = true;

    // 1) Upload to Admin (works already)
    let uploaded: NewAttachment[] = [];
    if (files.length > 0) {
      uploaded = await uploadToAdminS3(files);
    }

    // 2) Build messages to send (classic media fields)
    const text = newMessage.trim();
    const [first, ...rest] = uploaded;

    // 2a) If we have text OR at least one file:
    if (text || first) {
      const resp = await messageService.sendMessage({
        master_id: activeConversation.masterId,
        to: "support",
        from_super_admin: true as any,
        clientId: selectedClient?.id,
        content: text || (first ? "Attachment" : undefined),

        // <<< populate these (the key part you asked for)
        is_media: !!first,
        media_url: first?.url,
        media_mime_type: first?.mime_type,
        media_file_name: first?.file_name,

        // keep attachments too if your BE also consumes them (optional)
        // attachments: uploaded.length ? uploaded : undefined,
      });

      const newMsg = {
        id: resp?.id || Date.now(),
        master_id: activeConversation.masterId,
        content: text || (first ? "Attachment" : ""),
        created_at: new Date().toISOString(),
        read: true,
        sender_name: "Super Admin Support",
        senderType: "super_support" as const,
        side: "right" as const,
        patientName: activeConversation.patientName,
        message_type: "support_to_patient" as const,

        // Optimistic echo of media fields
        is_media: !!first,
        media_url: first?.url,
        media_mime_type: first?.mime_type,
        media_file_name: first?.file_name,
        delivery_status: resp?.status || (resp?.queued ? "sending" : "sent"),
      };

      setActiveConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, newMsg],
              lastMessage: newMsg.content || (first ? "Attachment" : ""),
              lastTime: newMsg.created_at,
            }
          : prev
      );
    }

    // 2b) Any remaining files -> send as standalone media messages
    for (const up of rest) {
      const resp = await messageService.sendMessage({
        master_id: activeConversation.masterId,
        to: "support",
        from_super_admin: true as any,
        clientId: selectedClient?.id,

        content: up.file_name || "Attachment",
        is_media: true,
        media_url: up.url,
        media_mime_type: up.mime_type,
        media_file_name: up.file_name,
      });

      const mediaMsg = {
        id: resp?.id || Date.now() + Math.random(),
        master_id: activeConversation.masterId,
        content: up.file_name || "Attachment",
        created_at: new Date().toISOString(),
        read: true,
        sender_name: "Super Admin Support",
        senderType: "super_support" as const,
        side: "right" as const,
        patientName: activeConversation.patientName,
        message_type: "support_to_patient" as const,

        is_media: true,
        media_url: up.url,
        media_mime_type: up.mime_type,
        media_file_name: up.file_name,
        delivery_status: resp?.status || (resp?.queued ? "sending" : "sent"),
      };

      setActiveConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, mediaMsg],
              lastMessage: mediaMsg.content,
              lastTime: mediaMsg.created_at,
            }
          : prev
      );
    }

    // Cleanup
    setNewMessage("");
    clearAllAttachments();
    stickToBottomSoon();
  } catch (err) {
    console.error("Failed to send message", err);
  } finally {
    setSending(false);
    sendInFlightRef.current = false;
  }
}

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ height: 'calc(100vh - 11rem)' }} >
        {/* LEFT: Clients + Conversations */}
        <div className="lg:col-span-1 bg-card rounded-xl border shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 pb-3 border-b space-y-3 shrink-0">
            <h2 className="text-lg font-semibold">All Messages</h2>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Client</label>
              <Select
                value={selectedClient?.id || ""}
                onValueChange={(val) => {
                  const c = clients.find((x) => x.id === val) || null;
                  setSelectedClient(c);
                }}
              >
                <SelectTrigger className="w-full h-9 rounded-lg text-sm">
                  <SelectValue placeholder="— Select a client —" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loadingClients && <div className="text-[11px] text-muted-foreground mt-1.5">Loading clients…</div>}
              {clientsError && <div className="text-xs text-destructive mt-1.5">{clientsError}</div>}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations…"
                className="pl-9 h-9 bg-muted/50 border-0 focus-visible:ring-1 rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {loading && selectedClient && (
              <div className="p-4 text-sm text-muted-foreground text-center">
                Loading <span className="font-medium text-foreground">{selectedClient.name}</span>…
              </div>
            )}
            {error && <div className="p-4 text-destructive text-sm">{error}</div>}
            {filteredConversations.map((c) => {
              const displayName = c.patientName
                ? `${c.patientName}${c.patientEmail ? ` (${c.patientEmail})` : ""}`
                : c.patientEmail || "Patient";
              const avatarFallback = (displayName || "?").charAt(0).toUpperCase();
              const isActive = activeConversation?.id === c.id;

              return (
                <div
                  key={c.id}
                  className={`relative flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-border/30 ${
                    isActive
                      ? "bg-primary/10 dark:bg-primary/15"
                      : "hover:bg-muted/60"
                  }`}
                  onClick={() => setActiveConversation(c)}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-primary rounded-r-full" />
                  )}
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className={`text-sm font-semibold ${
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>{avatarFallback}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className={`truncate text-[14px] ${isActive ? "font-semibold text-foreground" : "font-medium"}`}>{displayName}</div>
                      <div className="text-[11px] text-muted-foreground whitespace-nowrap ml-2 shrink-0">
                        {c.lastTime ? new Date(c.lastTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </div>
                    </div>
                    <div className="text-[13px] text-muted-foreground truncate">{c.lastMessage || "No messages yet"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Chat */}
        <div
          key={selectedClient?.id || "no-client"}
          className="lg:col-span-2 bg-card rounded-xl border shadow-sm flex flex-col overflow-hidden relative"
        >
          {activeConversation ? (
            <>
              <div className="px-5 py-3 border-b flex items-center justify-between shrink-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 z-10">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/15 text-primary font-semibold text-sm">
                      {(activeConversation.patientName || activeConversation.patientEmail || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-[15px] leading-tight">
                      {activeConversation.patientName
                        ? `${activeConversation.patientName}${activeConversation.patientEmail ? ` (${activeConversation.patientEmail})` : ""}`
                        : activeConversation.patientEmail || "Patient"}
                    </div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">
                      {selectedClient ? `Client: ${selectedClient.name}` : "Local"}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* ---- DATE-GROUPED MESSAGES ---- */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-5 pt-10 pb-4 space-y-1 min-h-0">
                {(() => {
                  const grouped = groupMessagesByDate(activeConversation.messages);
                  const sortedDates = Object.keys(grouped).sort(
                    (a, b) => new Date(a).getTime() - new Date(b).getTime()
                  );

                  return sortedDates.map((dateKey) => {
                    const dayMsgs = [...grouped[dateKey]].sort(
                      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );

                    return (
                      <div key={dateKey}>
                        {/* Date separator */}
                        <div className="flex items-center justify-center my-6 gap-3">
                          <div className="flex-1 h-px bg-border/60" />
                          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                            {getMessageGroupLabel(dateKey)}
                          </span>
                          <div className="flex-1 h-px bg-border/60" />
                        </div>

                        {/* Messages for this day */}
                        <div className="space-y-0.5">
                          {grouped[dateKey]
                            .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                            .map((m: any, idx: number, arr: any[]) => {
                            const isSent = m.side === "right";
                            const prevMsg = arr[idx - 1];
                            const nextMsg = arr[idx + 1];
                            const isFirstInGroup = !prevMsg || prevMsg.senderType !== m.senderType;
                            const isLastInGroup = !nextMsg || nextMsg.senderType !== m.senderType;

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
                            else if (m.senderType === "super_support") displayName = "Super Admin";

                            const bubbleColor = isSent
                              ? "bg-gradient-to-r from-[hsl(199,85%,48%)] to-[hsl(215,85%,55%)] text-white shadow-sm"
                              : "bg-[hsl(220,14%,96%)] dark:bg-slate-800 text-foreground";

                            let radii = "rounded-2xl";
                            if (isSent) {
                              radii = isLastInGroup ? "rounded-2xl rounded-br-sm" : "rounded-2xl";
                            } else {
                              radii = isLastInGroup ? "rounded-2xl rounded-bl-sm" : "rounded-2xl";
                            }

                            // attachments array (some backends)
                            const attachments: any[] = Array.isArray(m.attachments) ? m.attachments : [];

                            // content-only URL fallback
                            const contentUrl = extractFirstUrl(m.content || "");
                            const isImgUrl = !!contentUrl && IMG_EXT_RE.test(contentUrl);
                            const isDocUrl = !!contentUrl && DOC_EXT_RE.test(contentUrl);

                            return (
                              <div key={m.id} className={`flex flex-col ${isSent ? "items-end" : "items-start"} ${isLastInGroup ? "mb-4" : "mb-0.5"}`}>
                                {!isSent && isFirstInGroup && (
                                  <div className="text-[11px] font-medium text-muted-foreground mb-1 ml-1">
                                    {displayName}
                                  </div>
                                )}
                                <div className={`relative max-w-[75%] lg:max-w-[65%] px-3.5 py-2.5 ${radii} ${bubbleColor}`}>
                                  {/* original text (keep) */}
                                  {m.content && (
                                    <div className="text-[14px] whitespace-pre-wrap break-words leading-relaxed">{m.content}</div>
                                  )}

                                  {/* attachments from backend (array) */}
                                  {attachments.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                      {/* Images grid */}
                                      <div className="grid grid-cols-2 gap-2">
                                        {attachments
                                          .filter((a) => isImageMime(a?.mime_type))
                                          .map((a, idx) => (
                                            <a
                                              key={`${a.url}-${idx}`}
                                              href={a.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="block rounded-xl overflow-hidden"
                                            >
                                              <img
                                                src={a.url}
                                                alt="image"
                                                className="w-full h-32 object-cover"
                                                loading="lazy"
                                              />
                                            </a>
                                          ))}
                                      </div>

                                      {/* Non-image files -> DocumentBubble (no name) */}
                                      <div className="space-y-2">
                                        {attachments
                                          .filter((a) => !isImageMime(a?.mime_type))
                                          .map((a, idx) => (
                                            <DocumentBubble
                                              key={`${a.url}-file-${idx}`}
                                              url={a.url}
                                              name={undefined}
                                              mime={a.mime_type}
                                            />
                                          ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* single-file media coming via is_media + media_url */}
                                  {!attachments.length && m.is_media && m.media_url && (
                                    <div className="mt-2">
                                      {isImageMime(m.media_mime_type) || IMG_EXT_RE.test(m.media_url) ? (
                                        <a
                                          href={m.media_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="block -mx-1.5 -mt-1 mb-1 overflow-hidden rounded-xl"
                                        >
                                          <img
                                            src={m.media_url}
                                            alt="image"
                                            className="w-full max-h-[280px] object-cover"
                                            loading="lazy"
                                          />
                                        </a>
                                      ) : (
                                        <DocumentBubble
                                          url={m.media_url}
                                          name={undefined}
                                          mime={m.media_mime_type || undefined}
                                        />
                                      )}
                                    </div>
                                  )}

                                  {/* content-only URL previews (fallback when no media fields) */}
                                  {!attachments.length && !m.is_media && contentUrl && (
                                    <div className="mt-2">
                                      {isImgUrl ? (
                                        <a
                                          href={contentUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="block rounded-xl overflow-hidden"
                                        >
                                          <img
                                            src={contentUrl}
                                            alt="image"
                                            className="w-full h-32 object-cover"
                                            loading="lazy"
                                          />
                                        </a>
                                      ) : isDocUrl ? (
                                        <DocumentBubble
                                          url={contentUrl}
                                          name={undefined}
                                          mime={null}
                                        />
                                      ) : null}
                                    </div>
                                  )}

                                </div>
                                {/* TIME — outside the bubble */}
                                <div className="text-[10px] text-muted-foreground mt-1 px-1">
                                  {new Date(m.created_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                  {m.side === "right" && m.delivery_status ? ` • ${m.delivery_status}` : ""}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Scroll-to-bottom FAB */}
              {showScrollToBottom && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-28 right-6 rounded-full shadow-lg border h-9 w-9 z-20 bg-card/90 backdrop-blur"
                  onClick={() => stickToBottomSoon()}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              )}

              {/* Composer */}
              <div className="px-4 py-3 border-t shrink-0 bg-card">
                {/* previews (composer) */}
                {previews.length > 0 && (
                  <div className="mb-3 border rounded-xl p-3 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        {previews.length} attachment{previews.length > 1 ? "s" : ""}
                      </span>
                      <button onClick={clearAllAttachments} className="text-[11px] font-medium text-destructive hover:underline">
                        Clear all
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {previews.map((p, i) => {
                        const imgLike = p.file.type.startsWith("image/");
                        return (
                          <div key={i} className="relative border rounded-lg overflow-hidden group">
                            {imgLike ? (
                              <img src={p.url} alt="image" className="w-full h-20 object-cover" />
                            ) : (
                              <div className="p-2 text-xs break-all h-20 overflow-auto flex items-center justify-center text-muted-foreground">Attachment</div>
                            )}
                            <button
                              onClick={() => clearAttachment(i)}
                              className="absolute top-1 right-1 bg-black/60 text-white rounded-full h-5 w-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-2 bg-muted/50 rounded-2xl px-2 py-1.5 focus-within:ring-1 focus-within:ring-ring transition-all">
                  {/* hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={onFilesSelected}
                    accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv,application/rtf"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onClickAttach}
                    title="Attach files"
                    className="rounded-full h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>

                  <textarea
                    ref={messageInputRef}
                    placeholder="Message…"
                    rows={1}
                    className="flex-1 bg-transparent text-[14px] px-2 py-2.5 border-0 focus:outline-none focus:ring-0 resize-none leading-relaxed max-h-[140px]"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value)
                      resizeComposer()
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />

                  <Button
                    onClick={handleSend}
                    disabled={sending || !selectedClient}
                    size="icon"
                    className="rounded-full h-9 w-9 shrink-0 bg-gradient-to-r from-[hsl(199,85%,48%)] to-[hsl(215,85%,55%)] hover:from-[hsl(199,85%,42%)] hover:to-[hsl(215,85%,49%)] text-white shadow-sm"
                    title={!selectedClient ? "Select a client first" : "Send"}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-7 w-7 text-muted-foreground/60" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {selectedClient
                  ? loading
                    ? `Loading ${selectedClient.name}…`
                    : "No conversation selected"
                  : "Select a client"}
              </h3>
              <p className="text-sm text-center max-w-[280px]">
                {selectedClient
                  ? "Choose a conversation from the sidebar to view messages."
                  : "Please select a client from the dropdown to load their messaging history."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
