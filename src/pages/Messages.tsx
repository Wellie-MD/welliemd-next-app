// src/pages/Messages.tsx
// Admin Portal with date separators + smart autoscroll
// UPDATED: hide all attachment names (no filenames/titles anywhere)

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";

import { useMessages } from "@/hooks/useMessages";
import { groupMessages, type Conversation } from "@/utils/groupMessages";
import { messageService, sendMessageWithFiles, type NewAttachment } from "@/services/messageService";
import { useClients, type Client } from "@/hooks/useClients";

import { isToday, isYesterday, isThisWeek, format, formatISO } from "date-fns";

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
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-800">
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
    <div className="w-[260px] lg:w-[320px] rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
      <div className="p-3 flex items-start gap-3">
        <DocIcon ext={ext} mime={mime} />
        <div className="min-w-0">
          {/* filename/title intentionally omitted */}
          <div className="mt-1 flex items-center gap-2">
            {ext && (
              <span className="inline-flex items-center rounded-full bg-gray-50 text-gray-700 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                {ext}
              </span>
            )}
            {mime && <span className="text-[11px] text-gray-500 truncate">{mime}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center border-t px-3 py-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900"
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
  // 1) Admin: load clients
  const { clients, loading: loadingClients, error: clientsError } = useClients();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // 2) Load messages (admin hits selected client's API)
  const { messages, loading, error } = useMessages(selectedClient?.api_endpoint, 5000);

  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

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

  // Auto-pick first client
  useEffect(() => {
    if (!loadingClients && !selectedClient && clients.length > 0) {
      setSelectedClient(clients[0]);
    }
  }, [loadingClients, clients, selectedClient]);

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
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [activeConversation?.id, selectedClient?.id]);

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

  // Send
  async function handleSend() {
    if (!activeConversation || (!newMessage.trim() && files.length === 0)) return;

    try {
      setSending(true);
      shouldStickRef.current = true;

      if (files.length > 0) {
        const resp = await sendMessageWithFiles({
          master_id: activeConversation.masterId,
          to: "support",
          from_super_admin: true as any,
          apiEndpoint: selectedClient?.api_endpoint,
          content: newMessage.trim() || undefined,
          files,
        });

        const optimisticAttachments: NewAttachment[] =
          resp.attachments && resp.attachments.length > 0
            ? resp.attachments
            : previews.map((p) => ({
                url: p.url,
                file_name: p.file.name,
                mime_type: p.file.type || "application/octet-stream",
              }));

        const newMsg = {
          id: resp?.id || Date.now(),
          master_id: activeConversation.masterId,
          content: newMessage,
          created_at: new Date().toISOString(),
          read: true,
          sender_name: "Super Admin Support",
          senderType: "super_support" as const,
          side: "right" as const,
          patientName: activeConversation.patientName,
          message_type: "support_to_patient" as const,
          attachments: optimisticAttachments,
        };

        setActiveConversation((prev) =>
          prev
            ? {
                ...prev,
                messages: [...prev.messages, newMsg],
                lastMessage:
                  newMsg.content || "Attachment",
                lastTime: newMsg.created_at,
              }
            : prev
        );

        setNewMessage("");
        clearAllAttachments();
        stickToBottomSoon();
        return;
      }

      await messageService.sendMessage({
        master_id: activeConversation.masterId,
        content: newMessage,
        to: "support",
        from_super_admin: true as any,
        apiEndpoint: selectedClient?.api_endpoint,
      });

      const newMsg = {
        id: Date.now(),
        master_id: activeConversation.masterId,
        content: newMessage,
        created_at: new Date().toISOString(),
        read: true,
        sender_name: "Super Admin Support",
        senderType: "super_support" as const,
        side: "right" as const,
        patientName: activeConversation.patientName,
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
                    <div className="text-xs text-muted-foreground truncate">{c.lastMessage}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(c.lastTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Chat */}
        <div
          key={selectedClient?.id || "no-client"}
          className="lg:col-span-2 bg-card rounded-lg border flex flex-col overflow-hidden"
        >
          {activeConversation ? (
            <>
              <div className="p-4 border-b flex items-center justify-between shrink-0">
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

              {/* ---- DATE-GROUPED MESSAGES ---- */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0">
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
                          else if (m.senderType === "super_support") displayName = "Super Admin Support";

                          let bubbleColor = "";
                          if (m.senderType === "patient") bubbleColor = "bg-gray-100 text-gray-800";
                          else if (m.senderType === "doctor") bubbleColor = "bg-blue-100 text-blue-800";
                          else if (m.senderType === "support") bubbleColor = "bg-purple-100 text-purple-800";
                          else if (m.senderType === "super_support") bubbleColor = "bg-red-100 text-red-800";
                          else bubbleColor = "bg-gray-200 text-gray-800";

                          // attachments array (some backends)
                          const attachments: any[] = Array.isArray(m.attachments) ? m.attachments : [];

                          // content-only URL fallback
                          const contentUrl = extractFirstUrl(m.content || "");
                          const isImgUrl = !!contentUrl && IMG_EXT_RE.test(contentUrl);
                          const isDocUrl = !!contentUrl && DOC_EXT_RE.test(contentUrl);

                          return (
                            <div key={m.id} className={`flex ${m.side === "left" ? "justify-start" : "justify-end"}`}>
                              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${bubbleColor}`}>
                                {/* original text (keep) */}
                                {m.content && (
                                  <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>
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
                                            className="block rounded-md overflow-hidden border"
                                          >
                                            <img
                                              src={a.url}
                                              alt="image" // no filename
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

                                {/* NEW: single-file media coming via is_media + media_url */}
                                {!attachments.length && m.is_media && m.media_url && (
                                  <div className="mt-2">
                                    {isImageMime(m.media_mime_type) || IMG_EXT_RE.test(m.media_url) ? (
                                      <a
                                        href={m.media_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block rounded-md overflow-hidden border"
                                      >
                                        <img
                                          src={m.media_url}
                                          alt="image" // no filename
                                          className="w-full max-h-72 object-contain"
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
                                        className="block rounded-md overflow-hidden border"
                                      >
                                        <img
                                          src={contentUrl}
                                          alt="image" // no filename
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
                {/* previews (composer) */}
                {previews.length > 0 && (
                  <div className="mb-3 border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">
                        {previews.length} attachment{previews.length > 1 ? "s" : ""}
                      </span>
                      <button onClick={clearAllAttachments} className="text-xs underline">
                        Clear all
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {previews.map((p, i) => {
                        const imgLike = p.file.type.startsWith("image/");
                        return (
                          <div key={i} className="relative border rounded-md overflow-hidden">
                            {imgLike ? (
                              <img src={p.url} alt="image" className="w-full h-24 object-cover" />
                            ) : (
                              <div className="p-2 text-xs break-all h-24 overflow-auto">Attachment</div>
                            )}
                            <button
                              onClick={() => clearAttachment(i)}
                              className="absolute top-1 right-1 bg-black/60 text-white rounded px-1 text-[10px]"
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

                <div className="flex items-center gap-3">
                  {/* hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={onFilesSelected}
                    accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv,application/rtf"
                  />

                  {/* input */}
                  <Input
                    placeholder="Type your message here..."
                    className="flex-1 h-12 text-base px-6 rounded-full border focus:ring-2 focus:ring-blue-400"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSend();
                    }}
                  />

                  {/* <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onClickAttach}
                    title="Attach files"
                    className="rounded-full h-12 w-12"
                  >
                    <Paperclip className="h-5 w-5" />
                    <span className="sr-only">Attach</span>
                  </Button> */}

                  <Button
                    onClick={handleSend}
                    disabled={sending || !selectedClient}
                    className="h-12 px-6 text-base font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center gap-2"
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
