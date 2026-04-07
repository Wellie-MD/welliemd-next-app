// src/pages/Messages.tsx (Client Portal) — attachments hidden for Support (Beluga) tab
// UPDATED: document UI matches patient portal (icon + filename + mime + centered “Open”).
// UPDATED: Left list preview (message line + time) is now TAB-AWARE (Patient vs Support/Beluga)

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Phone,
  Eye,
  Send,
  Smile,
  Paperclip,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  FileArchive,
  File as FileIcon,
  FileAudio,
  FileVideo,
  FileCode,
} from "lucide-react";
import { useClientMessages } from "@/contexts/MessagesContext";
import { groupMessages, type Conversation } from "@/utils/groupMessages";
import { useClients, type Client } from "@/hooks/useClients";
import { useSearchParams } from "react-router-dom";

import { patientService, type Patient } from "@/services/patientService";
import { PatientDetailSheet } from "@/components/patients/PatientDetailSheet";
import { messageService, type Message } from "@/services/messageService";

import { isToday, isYesterday, isThisWeek, format, formatISO } from "date-fns";

type LastSeenMap = Record<string, string | number | undefined>;
const LS_KEY = "msg_last_seen";

// ---- (optional) S3 URL fallback base ----
const S3_PUBLIC_BASE = "https://welliemd.s3.eu-north-1.amazonaws.com/";

// ---- Date grouping helpers ----
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

// ---- storage helpers ----
function writeLastSeenToStorage(next: LastSeenMap) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("msg:last-seen-updated"));
  } catch { }
}
function readLastSeenFromStorage(): LastSeenMap {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}

// ---- media helpers ----
function looksLikeImageUrl(url: string | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  return /\.(jpg|jpeg|png|gif|webp|heic|bmp|tif|tiff)$/i.test(url.split("?")[0]);
}
function isImageMime(mime?: string): boolean {
  return !!mime && mime.toLowerCase().startsWith("image/");
}

// ==== simple document helpers (same as patient portal style) ====
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
  const ext = getExt(name);
  const display = name || "Attachment";
  return (
    <div className="w-[260px] lg:w-[320px] rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
      <div className="p-3 flex items-start gap-3">
        <DocIcon ext={ext} mime={mime} />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900 break-words line-clamp-2">
            {display}
          </div>
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
      {/* Centered “Open” only, opens in new tab */}
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
// ====================================================================

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { messages, loading, error } = useClientMessages();

  // tabs: "patient" (normal support/doctor thread) and "support" (Beluga)
  const [tab, setTab] = useState<"patient" | "support">("patient");

  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  // For patient profile sheet
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const handleViewProfile = async () => {
    if (!activeConversation) return;
    try {
      setLoadingProfile(true);
      // Search by email or exact name to find the patient record
      const searchQuery = activeConversation.patientEmail || activeConversation.patientName;
      if (!searchQuery) {
        alert("No identifier found to load patient profile.");
        return;
      }
      const res = await patientService.getPatients({ search: searchQuery, page_size: 1 });
      if (res.results && res.results.length > 0) {
        setSelectedPatient(res.results[0]);
        setIsSheetOpen(true);
      } else {
        alert("Patient profile not found.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load patient profile.");
    } finally {
      setLoadingProfile(false);
    }
  };

  // attachments state (ENABLED only for Patient tab)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const conversations = useMemo(() => groupMessages(messages), [messages]);

  // beluga support cache
  const [belugaCache, setBelugaCache] = useState<Record<string, Message[]>>({});

  useEffect(() => {
    const masterId = activeConversation?.masterId;
    if (tab !== "support" || !masterId) return;

    const belugaArraysEqual = (a: Message[], b: Message[]) => {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (
          a[i].id !== b[i].id ||
          a[i].content !== b[i].content ||
          a[i].created_at !== b[i].created_at
        ) {
          return false;
        }
      }
      return true;
    };

    let cancelled = false;

    const fetchBeluga = async () => {
      try {
        const msgs = await messageService.getBelugaThread(masterId);
        if (cancelled) return;
        setBelugaCache((prev) => {
          const existing = prev[masterId] || [];
          if (belugaArraysEqual(existing, msgs)) return prev;
          return { ...prev, [masterId]: msgs };
        });
      } catch { }
    };

    fetchBeluga();
    const interval = setInterval(fetchBeluga, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [tab, activeConversation?.masterId]);

  // ---------- TAB-AWARE PREVIEW HELPERS (left list uses these) ----------
  const isBeluga = (m: Message) =>
    m.message_type === "client_to_beluga_support" ||
    m.message_type === "beluga_support_to_client";

  const isPatientSide = (m: Message) =>
    m.message_type === "patient_to_doctor" ||
    m.message_type === "patient_to_support" ||
    m.message_type === "doctor_to_patient" ||
    m.message_type === "support_to_patient" ||
    m.message_type === "super_support_to_patient";

  function displayFromMessage(m: Message) {
    return m.is_media ? m.media_file_name || m.content || "Attachment" : m.content || "Attachment";
  }

  function getTabPreview(
    c: Conversation,
    tab: "patient" | "support",
    belugaCache: Record<string, Message[]>
  ) {
    if (tab === "support") {
      const belugaList = belugaCache[c.masterId];
      const list = (belugaList && belugaList.length ? belugaList : c.messages.filter(isBeluga)).slice();
      if (list.length) {
        const last = list[list.length - 1];
        return { text: displayFromMessage(last), time: last.created_at };
      }
      return { text: "", time: "" };
    } else {
      const pts = c.messages.filter(isPatientSide);
      if (pts.length) {
        const last = pts[pts.length - 1];
        return { text: displayFromMessage(last), time: last.created_at };
      }
      return { text: c.lastMessage, time: c.lastTime };
    }
  }
  // ---------------------------------------------------------------------

  // unread state synced to localStorage
  const [lastSeen, setLastSeen] = useState<LastSeenMap>(() => readLastSeenFromStorage());
  const initialLoadDoneRef = useRef(false);
  const lastNotifiedKeyRef = useRef<Record<string, string | number | undefined>>({});

  const didAutoSelectRef = useRef(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // bottom anchor + helper to scroll
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = (smooth = true) => {
    if (bottomAnchorRef.current) {
      bottomAnchorRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
      return;
    }
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const originalTitleRef = useRef(document.title);
  useEffect(() => {
    originalTitleRef.current = document.title;
  }, []);

  const latestKey = (c: Conversation) => {
    const lastMsg = c.messages[c.messages.length - 1];
    return (lastMsg?.id as number | string | undefined) ?? lastMsg?.created_at ?? c.lastTime;
  };

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
      const a = ctx.createOscillator();
      const b = ctx.createOscillator();
      a.type = "triangle";
      b.type = "square";
      a.frequency.setValueAtTime(880, now);
      b.frequency.setValueAtTime(1318.51, now);
      a.connect(g);
      b.connect(g);
      a.start(now);
      b.start(now + 0.06);
      a.stop(now + 0.5);
      b.stop(now + 0.5);
    } catch { }
  };

  const showBrowserNotification = (title: string, body: string) => {
    try {
      if (!("Notification" in window)) return;
      if (Notification.permission === "granted") new Notification(title, { body });
      else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted") new Notification(title, { body });
        });
      }
    } catch { }
  };

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

  useEffect(() => {
    if (!activeConversation) return;
    const updated = conversations.find((c) => c.id === activeConversation.id);
    if (updated) setActiveConversation(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

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
      } catch { }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.messages, activeConversation?.id]);

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

  useEffect(() => {
    if (!initialLoadDoneRef.current) return;
    conversations.forEach((c) => {
      if (activeConversation?.id === c.id) return;
      const k = latestKey(c);
      const shouldNotify = hasNewMap[c.id] && lastNotifiedKeyRef.current[c.id] !== k;
      if (shouldNotify) {
        playChime();
        const who = c.patientName || c.patientEmail || "Patient";
        showBrowserNotification("New message", `${who} • ${c.lastMessage}`);
        lastNotifiedKeyRef.current[c.id] = k;
      }
    });
  }, [conversations, hasNewMap, activeConversation?.id]);

  useEffect(() => {
    const base = originalTitleRef.current || "Telehealth";
    document.title =
      unseenCount > 0
        ? `(${unseenCount}) New message${unseenCount > 1 ? "s" : ""} • ${base}`
        : base;
  }, [unseenCount]);

  useEffect(() => {
    if (didAutoSelectRef.current) return;
    if (loading) return;
    if (!activeConversation && conversations.length > 0) {
      setActiveConversation(conversations[0]);
      didAutoSelectRef.current = true;
    }
  }, [loading, conversations, activeConversation]);

  useEffect(() => {
    const targetMasterId = searchParams.get("master_id");
    if (!targetMasterId || conversations.length === 0) return;

    const match = conversations.find((c) => c.masterId === targetMasterId);
    if (!match) return;

    setActiveConversation(match);
    didAutoSelectRef.current = true;

    const next = new URLSearchParams(searchParams);
    next.delete("master_id");
    setSearchParams(next, { replace: true });
  }, [conversations, searchParams, setSearchParams]);

  useEffect(() => {
    if (activeConversation && !conversations.find((c) => c.id === activeConversation.id)) {
      if (conversations.length > 0) setActiveConversation(conversations[0]);
      else setActiveConversation(null);
    }
  }, [conversations, activeConversation]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [activeConversation?.messages]);

  // when opening/switching a chat or tab, jump to bottom (ensures latest is visible)
  useEffect(() => {
    if (!activeConversation) return;
    const id = setTimeout(() => {
      scrollToBottom(false); // jump without smooth on open/switch
    }, 0);
    return () => clearTimeout(id);
  }, [activeConversation?.id, tab]);

  // ----- attachments: helpers -----
  const openFilePicker = () => {
    if (tab === "support") return; // Beluga: not allowed (and UI is hidden)
    fileInputRef.current?.click();
  };

  const onChooseFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setAttachedFiles((prev) => {
      const next = [...prev];
      files.forEach((f) => {
        const key = `${f.name}_${f.size}_${f.lastModified}`;
        const exists = next.some((x) => `${x.name}_${x.size}_${x.lastModified}` === key);
        if (!exists) next.push(f);
      });
      return next;
    });
    e.currentTarget.value = ""; // allow re-pick same file
  };

  const removeFile = (idx: number) =>
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));

  async function handleSend() {
    if (!activeConversation) return;

    const text = newMessage.trim();
    const hasFiles = attachedFiles.length > 0;

    // Beluga support: attachments NOT allowed (UI hidden, but guard anyway)
    if (tab === "support") {
      if (!text) return;
      try {
        setSending(true);
        await messageService.sendMessage({
          master_id: activeConversation.masterId,
          content: text,
          to: "beluga_support",
          from_client: true,
        });

        const newMsg: Message = {
          id: Date.now(),
          master_id: activeConversation.masterId,
          content: text,
          created_at: new Date().toISOString(),
          read: true,
          sender_name: "Client",
          senderType: "client",
          side: "right",
          patientName: activeConversation.patientName,
          message_type: "client_to_beluga_support",
        };

        setBelugaCache((prev) => {
          const list = prev[activeConversation.masterId] || [];
          return { ...prev, [activeConversation.masterId]: [...list, newMsg] };
        });

        setNewMessage("");
        // scroll to bottom after sending
        requestAnimationFrame(() => scrollToBottom(true));
      } catch (err) {
        console.error("Failed to send beluga message", err);
      } finally {
        setSending(false);
      }
      return;
    }

    // Patient tab: attachments allowed
    if (!text && !hasFiles) return;

    setSending(true);
    setUploading(true);
    try {
      // 1) upload all attachments in parallel
      const uploads = await Promise.all(
        attachedFiles.map((f) => messageService.uploadAttachment(f))
      ); // -> { url, fileName, mimeType }[]

      // 2) send a text message; if any files, attach the first file to it
      const optimistic: Message[] = [];
      const sendTextFirst = !!text;

      if (sendTextFirst) {
        const first = uploads[0];
        await messageService.sendMessage({
          master_id: activeConversation.masterId,
          to: "support",
          content: text,
          is_media: !!first,
          media_url: first?.url,
          media_mime_type: first?.mimeType,
          media_file_name: first?.fileName,
          from_client: true,
        });

        optimistic.push({
          id: Date.now(),
          master_id: activeConversation.masterId,
          content: text,
          created_at: new Date().toISOString(),
          read: true,
          sender_name: "Support",
          senderType: "support",
          side: "right",
          patientName: activeConversation.patientName,
          message_type: "support_to_patient",
          is_media: !!first,
          media_url: first?.url,
          media_mime_type: first?.mimeType,
          media_file_name: first?.fileName,
        });

        if (first) uploads.shift();
      }

      // 3) send any remaining files as standalone media messages
      for (const up of uploads) {
        await messageService.sendMessage({
          master_id: activeConversation.masterId,
          to: "support",
          content: up.fileName || "Attachment",
          is_media: true,
          media_url: up.url,
          media_mime_type: up.mimeType,
          media_file_name: up.fileName,
          from_client: true,
        });

        optimistic.push({
          id: Date.now() + Math.random(),
          master_id: activeConversation.masterId,
          content: up.fileName || "Attachment",
          created_at: new Date().toISOString(),
          read: true,
          sender_name: "Support",
          senderType: "support",
          side: "right",
          patientName: activeConversation.patientName,
          message_type: "support_to_patient",
          is_media: true,
          media_url: up.url,
          media_mime_type: up.mimeType,
          media_file_name: up.fileName,
        });
      }

      // 4) update visible conversation
      const updated = {
        ...activeConversation,
        messages: [...activeConversation.messages, ...optimistic],
        lastMessage: optimistic[optimistic.length - 1]?.content || activeConversation.lastMessage,
        lastTime: optimistic[optimistic.length - 1]?.created_at || activeConversation.lastTime,
      };
      setActiveConversation(updated);

      setLastSeen((prev) => {
        const merged = { ...prev, [updated.id]: optimistic[optimistic.length - 1]?.id ?? updated.lastTime };
        writeLastSeenToStorage(merged);
        return merged;
      });
      lastNotifiedKeyRef.current[updated.id] =
        optimistic[optimistic.length - 1]?.id ?? updated.lastTime;

      setNewMessage("");
      setAttachedFiles([]);
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
        // also use anchor (more reliable)
        scrollToBottom(true);
      });
    } catch (err) {
      console.error("Failed to send message with attachments", err);
    } finally {
      setUploading(false);
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
      } catch { }
    })();
    // ensure we land on latest right after opening
    requestAnimationFrame(() => scrollToBottom(false));
  }

  function getRightPaneMessages(): Message[] {
    if (!activeConversation) return [];
    if (tab === "patient") return activeConversation.messages;
    const list = belugaCache[activeConversation.masterId];
    return list ?? [];
  }
  const rightMessages = getRightPaneMessages();

  // keep it pinned to bottom when visible message count changes
  useEffect(() => {
    if (!activeConversation) return;
    requestAnimationFrame(() => scrollToBottom(true));
  }, [rightMessages.length, activeConversation?.id]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-6"
        style={{ height: 'calc(100vh - 11rem)' }} >
        {/* LEFT: list */}
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">
              {tab === "patient" ? "Patient Chats" : "Beluga Support Chats"}
            </h2>
            <div className="inline-flex rounded-lg border overflow-hidden">
              <button
                className={`px-3 py-1.5 text-sm font-medium ${tab === "patient" ? "bg-indigo-600 text-white" : "bg-white text-gray-700"
                  }`}
                onClick={() => setTab("patient")}
              >
                Patient
              </button>
              <button
                className={`px-3 py-1.5 text-sm font-medium ${tab === "support" ? "bg-indigo-600 text-white" : "bg-white text-gray-700"
                  } border-l`}
                onClick={() => setTab("support")}
              >
                Support
              </button>
            </div>
          </div>

          <div className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 15rem)' }} >
            {loading && <div>Loading...</div>}
            {error && <div className="text-red-500">{error}</div>}

            {conversations.map((c) => {
              const name = (c.patientName || "").trim();
              const email = (c.patientEmail || "").trim();
              const displayName = name ? (email ? `${name} - ${email}` : name) : email || "Patient";
              const avatarFallback = (name || email || "P").trim().charAt(0).toUpperCase();

              const isActive = activeConversation?.id === c.id;
              const showNew = !!hasNewMap[c.id];

              // TAB-AWARE PREVIEW FOR THIS ROW
              const { text: previewText, time: previewTime } = getTabPreview(c, tab, belugaCache);

              let rowClass =
                "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition border hover:bg-muted border-transparent";
              if (isActive) {
                rowClass += " bg-indigo-50/80 ring-2 ring-indigo-500/70 border-indigo-200 dark:bg-indigo-900/40 dark:ring-indigo-400/40 dark:border-indigo-500/40";
              }

              return (
                <div key={c.id} className={rowClass} onClick={() => openConversation(c)}>
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
                      {!isActive && showNew && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
                          New
                        </span>
                      )}
                    </div>
                    {/* Tab-aware preview text */}
                    <div className="text-xs text-muted-foreground truncate">
                      {previewText || (tab === "support" ? "" : c.lastMessage)}
                    </div>
                  </div>

                  {/* Tab-aware time */}
                  <div className={`text-xs whitespace-nowrap ${isActive ? "text-indigo-700" : "text-muted-foreground"}`}>
                    {previewTime
                      ? new Date(previewTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : c.lastTime
                        ? new Date(c.lastTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: chat */}
        <div className="bg-card rounded-lg border flex flex-col overflow-hidden">
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
                    {tab === "support" ? "Client ↔ Beluga Support" : "Support / Doctor Messages"}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="text-sm border bg-gray-50 dark:bg-slate-900 dark:border-slate-700 rounded px-2 py-1 flex items-center">
                    <span className="text-muted-foreground mr-2 font-medium">Order:</span>
                    <span className="font-mono">
                      {activeConversation.orderNumber || activeConversation.masterId}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="View Profile"
                    onClick={handleViewProfile}
                    disabled={loadingProfile}
                  >
                    <Eye className="h-4 w-4 mr-1" /> {loadingProfile ? "Loading..." : "View Profile"}
                  </Button>
                </div>
              </div>

              {/* ---- DATE-GROUPED MESSAGES ---- */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0">
                {(() => {
                  const grouped = groupMessagesByDate(rightMessages);
                  const sortedDates = Object.keys(grouped).sort(
                    (a, b) => new Date(a).getTime() - new Date(b).getTime()
                  );

                  if (sortedDates.length === 0) {
                    return (
                      <div className="text-center text-sm text-muted-foreground mt-8">
                        No messages yet.
                      </div>
                    );
                  }

                  return sortedDates.map((dateKey) => {
                    const dayMsgs = [...grouped[dateKey]].sort(
                      (a, b) =>
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );

                    return (
                      <div key={dateKey}>
                        {/* Date Separator */}
                        <div className="flex justify-center my-4">
                          <span className="bg-gray-200 text-gray-700 dark:bg-slate-800 dark:text-slate-200 text-xs px-3 py-1 rounded-full">
                            {getMessageGroupLabel(dateKey)}
                          </span>
                        </div>

                        {/* Messages for that day */}
                        <div className="space-y-4">
                          {dayMsgs.map((m) => {
                            let displayName: string;
                            if (m.senderType === "patient") {
                              if (m.message_type === "patient_to_doctor") displayName = "Patient → Doctor";
                              else if (m.message_type === "patient_to_support") displayName = "Patient → Support";
                              else displayName = "Patient";
                            } else if (m.senderType === "client") {
                              displayName = "Client";
                            } else if (m.senderType === "doctor") displayName = "Doctor";
                            else if (m.senderType === "support") displayName = "Client Support";
                            else if (m.senderType === "super_support") displayName = "Super Admin Support";
                            else if (m.senderType === "beluga_support") displayName = "Beluga Support";
                            else displayName = m.sender_name;

                            let bubbleColor = "";
                            if (m.senderType === "patient") bubbleColor = "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-100";
                            else if (m.senderType === "client") bubbleColor = "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-100";
                            else if (m.senderType === "doctor") bubbleColor = "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200";
                            else if (m.senderType === "support") bubbleColor = "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200";
                            else if (m.senderType === "super_support") bubbleColor = "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200";
                            else if (m.senderType === "beluga_support") bubbleColor = "bg-green-100 text-green-800 dark:bg-emerald-900/40 dark:text-emerald-200";
                            else bubbleColor = "bg-gray-200 text-gray-800 dark:bg-slate-800 dark:text-slate-100";

                            // ---- MEDIA-AWARE RENDERING ----
                            const isMedia = !!m.is_media && (!!m.media_url || !!m.content);
                            const rawUrl = (m.media_url || (isMedia ? m.content : "")) || "";
                            const mediaUrl =
                              rawUrl.startsWith("http") || rawUrl.startsWith("data:")
                                ? rawUrl
                                : rawUrl
                                  ? `${S3_PUBLIC_BASE}${rawUrl.replace(/^\/+/, "")}`
                                  : "";

                            const mime = (m.media_mime_type || "").toLowerCase();
                            const fileName = m.media_file_name || m.content || "attachment";
                            const imageLike = isImageMime(mime) || looksLikeImageUrl(mediaUrl);

                            return (
                              <div key={m.id} className={`flex ${m.side === "left" ? "justify-start" : "justify-end"}`}>
                                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${bubbleColor}`}>
                                  {/* CONTENT */}
                                  {isMedia && mediaUrl ? (
                                    <>
                                      {imageLike ? (
                                        <a
                                          href={mediaUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="block"
                                        >
                                          <img
                                            src={mediaUrl}
                                            alt={fileName}
                                            className="rounded-md max-h-72 w-auto object-contain"
                                            loading="lazy"
                                          />
                                        </a>
                                      ) : (
                                        <div className="mb-1">
                                          <DocumentBubble url={mediaUrl} name={fileName} mime={mime} />
                                        </div>
                                      )}

                                      {/* Show real text if present (and not just the filename) */}
                                      {Boolean(m.content?.trim()) &&
                                        m.content?.trim() !== (m.media_file_name || "").trim() && (
                                          <div className="mt-2 text-sm whitespace-pre-wrap break-words">
                                            {m.content}
                                          </div>
                                        )}
                                    </>
                                  ) : (
                                    <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>
                                  )}

                                  {/* META */}
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
                    );
                  });
                })()}

                {/* bottom anchor for reliable scroll-to-bottom */}
                <div ref={bottomAnchorRef} />
              </div>

              {/* Composer */}
              <div className="p-4 border-t shrink-0">
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Type your message here…"
                    className="flex-1 text-base px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-400"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  />

                  {/* (hidden) emoji button */}
                  <Button variant="ghost" size="sm" className="hidden" aria-label="Emoji">
                    <Smile className="h-4 w-4" />
                  </Button>

                  {/* Attachments UI — completely hidden on Support tab */}
                  {tab !== "support" && (
                    <>
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
                        variant="ghost"
                        size="sm"
                        onClick={openFilePicker}
                        disabled={uploading || sending}
                        title="Attach images or documents"
                        aria-label="Attach files"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  <Button
                    onClick={handleSend}
                    disabled={sending}
                    className="px-6 py-3 text-base font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center gap-2"
                  >
                    <Send className="h-5 w-5" />
                    {sending ? "Sending…" : "Send"}
                  </Button>
                </div>

                {/* Selected files preview — hidden on Support tab */}
                {tab !== "support" && attachedFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
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
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a conversation
            </div>
          )}
        </div>
      </div>

      {selectedPatient && (
        <PatientDetailSheet
          patient={selectedPatient}
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          // The sheet expects onPatientUpdated and onPatientDeleted as optional props
          // but we just pass empty functions if we don't need intense sync here
          onPatientUpdated={(updated) => setSelectedPatient(updated)}
          onPatientDeleted={() => {
            setIsSheetOpen(false);
            setSelectedPatient(null);
          }}
          readOnly={true}
        />
      )}
    </div>
  );
}
