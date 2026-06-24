// src/pages/Messages.tsx (Client Portal) — lazy-load paginated conversations + infinite scroll
// UPDATED: document UI matches patient portal (icon + filename + mime + centered "Open").
// UPDATED: Left list preview (message line + time) is now TAB-AWARE (Patient vs Support/Beluga)

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
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
  Search,
  MessageSquare,
  ArrowDown,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClientMessages } from "@/contexts/MessagesContext";
import type { ConversationSummary, Message } from "@/services/messageService";
import { useClients, type Client } from "@/hooks/useClients";
import { useSearchParams } from "react-router-dom";

import { patientService, type Patient } from "@/services/patientService";
import { PatientDetailSheet } from "@/components/patients/PatientDetailSheet";
import { messageService } from "@/services/messageService";

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
  const ext = getExt(name);
  const display = name || "Attachment";
  return (
    <div className="w-[260px] lg:w-[320px] rounded-lg bg-white dark:bg-slate-900 shadow-sm ring-1 ring-gray-200 dark:ring-slate-700">
      <div className="p-3 flex items-start gap-3">
        <DocIcon ext={ext} mime={mime} />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 break-words line-clamp-2">
            {display}
          </div>
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

// ==== Infinite scroll sentinel component ====
function Sentinel({ onVisible }: { onVisible: () => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onVisible();
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [onVisible]);
  return <div ref={ref} />;
}

// ====================================================================

export default function Messages() {
  const MAX_COMPOSER_HEIGHT_PX = 140;
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    conversations,
    conversationsLoading,
    conversationsError,
    hasMoreConversations,
    loadMoreConversations,

    activeConversationId,
    activeMessages,
    messagesLoading,
    messagesError,
    hasMoreMessages,
    selectConversation,
    loadMoreMessages,

    searchQuery,
    setSearchQuery,
    conversationType,
    setConversationType,

    loading,
    error,
    reload,

    belugaCache,
    belugaLoading,
  } = useClientMessages();

  // tabs: "patient" (normal support/doctor thread) and "support" (Beluga)
  const [tab, setTab] = useState<"patient" | "support">("patient");

  const [activeConvSummary, setActiveConvSummary] = useState<ConversationSummary | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const sendInFlightRef = useRef(false);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);

  // For patient profile sheet
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const handleViewProfile = async () => {
    if (!activeConvSummary) return;
    try {
      setLoadingProfile(true);
      const searchQ = activeConvSummary.patient_email || activeConvSummary.patient_name;
      if (!searchQ) {
        alert("No identifier found to load patient profile.");
        return;
      }
      const res = await patientService.getPatients({ search: searchQ, page_size: 1 });
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
  const [sendError, setSendError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Map tab changes to conversation type
  const handleTabChange = useCallback(
    (val: string) => {
      const newTab = val as "patient" | "support";
      setTab(newTab);
      setConversationType(newTab === "support" ? "beluga" : "patient");
      setActiveConvSummary(null);
    },
    [setConversationType]
  );

  // Sync tab → conversationType on mount
  useEffect(() => {
    setConversationType(tab === "support" ? "beluga" : "patient");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Show active conversation summary
  const updateActiveConv = useCallback(() => {
    if (activeConversationId) {
      const found = conversations.find((c) => c.master_id === activeConversationId);
      setActiveConvSummary(found || null);
    }
  }, [conversations, activeConversationId]);

  useEffect(() => {
    updateActiveConv();
  }, [conversations, activeConversationId, updateActiveConv]);

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

  // Beluga polling per active conversation
  useEffect(() => {
    const masterId = activeConvSummary?.master_id;
    if (tab !== "support" || !masterId) return;

    let cancelled = false;

    const fetchBeluga = async () => {
      try {
        await selectConversation(masterId);
      } catch { }
    };

    fetchBeluga();
    const interval = setInterval(fetchBeluga, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [tab, activeConvSummary?.master_id]); // eslint-disable-line react-hooks/exhaustive-deps

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
    c: ConversationSummary,
    tab: "patient" | "support",
    belugaCache: Record<string, Message[]>
  ) {
    if (tab === "support") {
      const belugaList = belugaCache[c.master_id];
      if (belugaList && belugaList.length) {
        const last = belugaList[belugaList.length - 1];
        return { text: displayFromMessage(last), time: last.created_at };
      }
      return { text: "", time: "" };
    }
    return { text: c.last_message || "", time: c.last_time || "" };
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
  }, [activeConvSummary?.master_id]);

  const latestKey = (c: ConversationSummary) => c.last_time || c.master_id;

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
      conversations.forEach((c) => (next[c.master_id] = latestKey(c)));
      setLastSeen(next);
      writeLastSeenToStorage(next);

      const seed: Record<string, string | number | undefined> = {};
      conversations.forEach((c) => (seed[c.master_id] = latestKey(c)));
      lastNotifiedKeyRef.current = seed;

      initialLoadDoneRef.current = true;
    }
  }, [loading, conversations]);

  // Mark read on active conversation change
  useEffect(() => {
    if (!activeConvSummary?.master_id) return;
    const k = latestKey(activeConvSummary);
    setLastSeen((prev) => {
      const merged = { ...prev, [activeConvSummary.master_id]: k };
      writeLastSeenToStorage(merged);
      return merged;
    });
    lastNotifiedKeyRef.current[activeConvSummary.master_id] = k;

    (async () => {
      try {
        if (activeConvSummary.master_id && messageService.markRead) {
          await messageService.markRead(activeConvSummary.master_id);
        }
      } catch { }
    })();
  }, [activeConvSummary, activeMessages]);

  // Mark notifications read
  useEffect(() => {
    if (!activeConvSummary?.master_id) return;
    let cancelled = false;
    (async () => {
      const updated = await messageService.markNotificationsReadForMaster(activeConvSummary.master_id);
      if (cancelled) return;
      if (updated > 0) {
        window.dispatchEvent(new Event("client:notifications-refetch"));
      }
    })();
    return () => { cancelled = true; };
  }, [activeConvSummary?.master_id, activeMessages]);

  const displayName = useCallback(
    (c: ConversationSummary) => {
      const name = (c.patient_name || "").trim();
      const email = (c.patient_email || "").trim();
      return name ? (email ? `${name} - ${email}` : name) : email || "Patient";
    },
    []
  );

  const hasNewMap: Record<string, boolean> = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (!initialLoadDoneRef.current) return map;
    conversations.forEach((c) => {
      const k = latestKey(c);
      const seen = lastSeen[c.master_id];
      map[c.master_id] = seen !== undefined && k !== seen && activeConvSummary?.master_id !== c.master_id;
    });
    return map;
  }, [conversations, lastSeen, activeConvSummary?.master_id]);

  const unseenCount = useMemo(
    () => Object.values(hasNewMap).filter(Boolean).length,
    [hasNewMap]
  );

  useEffect(() => {
    if (!initialLoadDoneRef.current) return;
    conversations.forEach((c) => {
      if (activeConvSummary?.master_id === c.master_id) return;
      const k = latestKey(c);
      const shouldNotify = hasNewMap[c.master_id] && lastNotifiedKeyRef.current[c.master_id] !== k;
      if (shouldNotify) {
        playChime();
        const who = c.patient_name || c.patient_email || "Patient";
        showBrowserNotification("New message", `${who} • ${c.last_message}`);
        lastNotifiedKeyRef.current[c.master_id] = k;
      }
    });
  }, [conversations, hasNewMap, activeConvSummary?.master_id]);

  useEffect(() => {
    const base = originalTitleRef.current || "Telehealth";
    document.title =
      unseenCount > 0
        ? `(${unseenCount}) New message${unseenCount > 1 ? "s" : ""} • ${base}`
        : base;
  }, [unseenCount]);

  // Auto-select first conversation
  useEffect(() => {
    if (didAutoSelectRef.current) return;
    if (loading) return;
    if (!activeConvSummary && conversations.length > 0) {
      const first = conversations[0];
      setActiveConvSummary(first);
      void selectConversation(first.master_id);
      didAutoSelectRef.current = true;
    }
  }, [loading, conversations, activeConvSummary, selectConversation]);

  // Handle URL param master_id
  useEffect(() => {
    const targetMasterId = searchParams.get("master_id");
    if (!targetMasterId || conversations.length === 0) return;

    const match = conversations.find((c) => c.master_id === targetMasterId);
    if (!match) return;

    setActiveConvSummary(match);
    void selectConversation(match.master_id);
    didAutoSelectRef.current = true;

    const next = new URLSearchParams(searchParams);
    next.delete("master_id");
    setSearchParams(next, { replace: true });
  }, [conversations, searchParams, setSearchParams, selectConversation]);

  // Keep activeConversation sync
  useEffect(() => {
    if (activeConvSummary && !conversations.find((c) => c.master_id === activeConvSummary.master_id)) {
      if (conversations.length > 0) {
        setActiveConvSummary(conversations[0]);
        void selectConversation(conversations[0].master_id);
      } else {
        setActiveConvSummary(null);
      }
    }
  }, [conversations, activeConvSummary, selectConversation]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [activeMessages]);

  // when opening/switching a chat or tab, jump to bottom
  useEffect(() => {
    if (!activeConvSummary) return;
    const id = setTimeout(() => {
      scrollToBottom(false);
    }, 0);
    return () => clearTimeout(id);
  }, [activeConvSummary?.master_id, tab]);

  // ----- attachments: helpers -----
  const openFilePicker = () => {
    if (tab === "support") return;
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
    if (sendError) setSendError("");
    e.currentTarget.value = "";
  };

  const removeFile = (idx: number) =>
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));

  async function handleSend() {
    if (sendInFlightRef.current || sending || uploading) return;
    if (!activeConvSummary) return;

    const text = newMessage.trim();
    const hasFiles = attachedFiles.length > 0;

    if (tab === "support") {
      if (!text) return;
      try {
        sendInFlightRef.current = true;
        setSending(true);
        await messageService.sendMessage({
          master_id: activeConvSummary.master_id,
          content: text,
          to: "beluga_support",
          from_client: true,
        });

        // Refresh beluga messages
        const msgs = await messageService.getBelugaThread(activeConvSummary.master_id);
        setBelugaCache((prev) => ({ ...prev, [activeConvSummary.master_id]: msgs }));

        const newMsg: Message = {
          id: Date.now(),
          master_id: activeConvSummary.master_id,
          content: text,
          created_at: new Date().toISOString(),
          read: true,
          sender_name: "Client",
          senderType: "client",
          side: "right",
          patientName: activeConvSummary.patient_name,
          message_type: "client_to_beluga_support",
        };

        setBelugaCache((prev) => {
          const list = prev[activeConvSummary.master_id] || [];
          return { ...prev, [activeConvSummary.master_id]: [...list, newMsg] };
        });

        setNewMessage("");
        requestAnimationFrame(() => scrollToBottom(true));
      } catch (err) {
        console.error("Failed to send beluga message", err);
      } finally {
        setSending(false);
        sendInFlightRef.current = false;
      }
      return;
    }

    if (!text && !hasFiles) return;

    sendInFlightRef.current = true;
    setSending(true);
    setUploading(true);
    setSendError("");
    try {
      const uploads = await Promise.all(
        attachedFiles.map((f) => messageService.uploadAttachment(f))
      );

      const optimistic: Message[] = [];
      const sendTextFirst = !!text;

      if (sendTextFirst) {
        const first = uploads[0];
        await messageService.sendMessage({
          master_id: activeConvSummary.master_id,
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
          master_id: activeConvSummary.master_id,
          content: text,
          created_at: new Date().toISOString(),
          read: true,
          sender_name: "Support",
          senderType: "support",
          side: "right",
          patientName: activeConvSummary.patient_name,
          message_type: "support_to_patient",
          is_media: !!first,
          media_url: first?.url,
          media_mime_type: first?.mimeType,
          media_file_name: first?.fileName,
        });

        if (first) uploads.shift();
      }

      for (const up of uploads) {
        await messageService.sendMessage({
          master_id: activeConvSummary.master_id,
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
          master_id: activeConvSummary.master_id,
          content: up.fileName || "Attachment",
          created_at: new Date().toISOString(),
          read: true,
          sender_name: "Support",
          senderType: "support",
          side: "right",
          patientName: activeConvSummary.patient_name,
          message_type: "support_to_patient",
          is_media: true,
          media_url: up.url,
          media_mime_type: up.mimeType,
          media_file_name: up.fileName,
        });
      }

      setNewMessage("");
      setAttachedFiles([]);
      requestAnimationFrame(() => scrollToBottom(true));
    } catch (err) {
      console.error("Failed to send message with attachments", err);
      setSendError(err instanceof Error ? err.message : "Unable to send message. Please try again.");
    } finally {
      setUploading(false);
      setSending(false);
      sendInFlightRef.current = false;
    }
  }

  function openConversation(c: ConversationSummary) {
    setActiveConvSummary(c);
    const k = latestKey(c);
    setLastSeen((prev) => {
      const merged = { ...prev, [c.master_id]: k };
      writeLastSeenToStorage(merged);
      return merged;
    });
    lastNotifiedKeyRef.current[c.master_id] = k;
    void selectConversation(c.master_id);
    requestAnimationFrame(() => scrollToBottom(false));
  }

  function getRightPaneMessages(): Message[] {
    if (!activeConvSummary) return [];
    if (tab === "patient") return activeMessages;
    const list = belugaCache[activeConvSummary.master_id];
    return list ?? [];
  }
  const rightMessages = getRightPaneMessages();

  // keep it pinned to bottom when visible message count changes
  useEffect(() => {
    if (!activeConvSummary) return;
    requestAnimationFrame(() => scrollToBottom(true));
  }, [rightMessages.length, activeConvSummary?.master_id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-6"
        style={{ height: 'calc(100vh - 11rem)' }} >
        {/* LEFT: list */}
        <div className="bg-card rounded-xl border shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 pb-3 border-b shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">
                {tab === "patient" ? "Patient Chats" : "Support Chats"}
              </h2>
              <Tabs value={tab} onValueChange={handleTabChange} className="w-[180px]">
                <TabsList className="grid w-full grid-cols-2 h-8 p-0.5">
                  <TabsTrigger value="patient" className="text-xs h-7">Patient</TabsTrigger>
                  <TabsTrigger value="support" className="text-xs h-7">Support</TabsTrigger>
                </TabsList>
              </Tabs>
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

          <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
            {loading && conversations.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground text-center">Loading…</div>
            )}
            {error && <div className="p-4 text-red-500 text-sm">{error}</div>}

            {conversations.map((c, idx) => {
              const name = (c.patient_name || "").trim();
              const email = (c.patient_email || "").trim();
              const dName = name ? (email ? `${name} - ${email}` : name) : email || "Patient";
              const avatarFallback = (name || email || "P").trim().charAt(0).toUpperCase();

              const isActive = activeConvSummary?.master_id === c.master_id;
              const showNew = !!hasNewMap[c.master_id];

              const { text: previewText, time: previewTime } = getTabPreview(c, tab, belugaCache);

              return (
                <div key={c.master_id}>
                  <div
                    className={`relative flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-border/30 ${
                      isActive
                        ? "bg-primary/10 dark:bg-primary/15"
                        : "hover:bg-muted/60"
                    }`}
                    onClick={() => openConversation(c)}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-primary rounded-r-full" />
                    )}
                    <div className="relative shrink-0">
                      <Avatar className="h-11 w-11">
                        <AvatarFallback className={`text-sm font-semibold ${
                          isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>{avatarFallback}</AvatarFallback>
                      </Avatar>
                      {!isActive && showNew && (
                        <div className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 min-w-[18px] bg-red-500 rounded-full border-2 border-card flex items-center justify-center">
                          <span className="text-[9px] font-bold text-white leading-none">!</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className={`truncate text-[14px] ${isActive ? "font-semibold text-foreground" : "font-medium"}`}>
                          {dName}
                        </div>
                        <div className={`text-[11px] whitespace-nowrap ml-2 shrink-0 ${
                          showNew && !isActive ? "text-blue-600 font-semibold" : "text-muted-foreground"
                        }`}>
                          {previewTime
                            ? new Date(previewTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : c.last_time
                              ? new Date(c.last_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                              : ""}
                        </div>
                      </div>
                      <div className={`text-[13px] truncate ${
                        showNew && !isActive ? "text-foreground font-medium" : "text-muted-foreground"
                      }`}>
                        {previewText || (tab === "support" ? "" : c.last_message) || "No messages yet"}
                      </div>
                    </div>
                  </div>

                  {/* Infinite scroll sentinel at the last conversation */}
                  {idx === conversations.length - 1 && hasMoreConversations && (
                    <Sentinel onVisible={loadMoreConversations} />
                  )}
                </div>
              );
            })}

            {conversationsLoading && conversations.length > 0 && (
              <div className="flex justify-center p-3">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {conversationsError && (
              <div className="p-2 text-xs text-red-500 text-center">{conversationsError}</div>
            )}
          </div>
        </div>

        {/* RIGHT: chat */}
        <div className="bg-card rounded-xl border shadow-sm flex flex-col overflow-hidden relative">
          {activeConvSummary ? (
            <>
              <div className="px-5 py-3 border-b flex items-center justify-between shrink-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 z-10">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/15 text-primary font-semibold text-sm">
                      {(activeConvSummary.patient_name || activeConvSummary.patient_email || "P").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-[15px] leading-tight">
                      {activeConvSummary.patient_name || activeConvSummary.patient_email || "Patient"}
                    </div>
                    <div className="text-[12px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      {activeConvSummary.patient_email && activeConvSummary.patient_name && (
                        <span>{activeConvSummary.patient_email}</span>
                      )}
                      {activeConvSummary.patient_email && activeConvSummary.patient_name && <span className="opacity-40">•</span>}
                      <span className="font-mono">
                        {tab === "support"
                          ? `Beluga Support • Order ID: ${activeConvSummary.order_number || activeConvSummary.master_id}`
                          : `Order ID: ${activeConvSummary.order_number || activeConvSummary.master_id}`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground"
                    aria-label="View Profile"
                    onClick={handleViewProfile}
                    disabled={loadingProfile}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* ---- DATE-GROUPED MESSAGES ---- */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-5 pt-4 pb-4 space-y-1 min-h-0">
                {/* Infinite scroll sentinel at the TOP of messages (load older) */}
                {hasMoreMessages && !messagesLoading && (
                  <Sentinel onVisible={loadMoreMessages} />
                )}
                {messagesLoading && activeMessages.length > 0 && (
                  <div className="flex justify-center py-2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}

                {(() => {
                  const grouped = groupMessagesByDate(rightMessages);
                  const sortedDates = Object.keys(grouped).sort(
                    (a, b) => new Date(a).getTime() - new Date(b).getTime()
                  );

                  if (sortedDates.length === 0 && !messagesLoading) {
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
                        <div className="flex items-center justify-center my-6 gap-3">
                          <div className="flex-1 h-px bg-border/60" />
                          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                            {getMessageGroupLabel(dateKey)}
                          </span>
                          <div className="flex-1 h-px bg-border/60" />
                        </div>

                        {/* Messages for that day */}
                        <div className="space-y-0.5">
                          {dayMsgs.map((m, idx) => {
                            const isSent = m.side === "right";
                            const prevMsg = dayMsgs[idx - 1];
                            const isFirstInGroup = !prevMsg || prevMsg.senderType !== m.senderType;
                            const nextMsg = dayMsgs[idx + 1];
                            const isLastInGroup = !nextMsg || nextMsg.senderType !== m.senderType;

                            let displayName: string;
                            if (m.senderType === "patient") {
                              if (m.message_type === "patient_to_doctor") displayName = "Patient → Doctor";
                              else if (m.message_type === "patient_to_support") displayName = "Patient → Support";
                              else displayName = "Patient";
                            } else if (m.senderType === "client") {
                              displayName = "Client";
                            } else if (m.senderType === "doctor") displayName = "Doctor";
                            else if (m.senderType === "support") displayName = "Client Support";
                            else if (m.senderType === "super_support") displayName = "Super Admin";
                            else if (m.senderType === "beluga_support") displayName = "Beluga Support";
                            else displayName = m.sender_name;

                            const bubbleColor = isSent
                              ? "bg-gradient-to-r from-[hsl(199,85%,48%)] to-[hsl(215,85%,55%)] text-white shadow-sm"
                              : "bg-[hsl(220,14%,96%)] dark:bg-slate-800 text-foreground";

                            let radii = "rounded-2xl";
                            if (isSent) {
                              radii = isLastInGroup ? "rounded-2xl rounded-br-sm" : "rounded-2xl";
                            } else {
                              radii = isLastInGroup ? "rounded-2xl rounded-bl-sm" : "rounded-2xl";
                            }

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
                              <div key={m.id} className={`flex flex-col ${isSent ? "items-end" : "items-start"} ${isLastInGroup ? "mb-4" : "mb-0.5"}`}>
                                {!isSent && isFirstInGroup && (
                                  <div className="text-[11px] font-medium text-muted-foreground mb-1 ml-1">
                                    {displayName}
                                  </div>
                                )}
                                <div className={`relative max-w-[75%] lg:max-w-[65%] px-3.5 py-2.5 ${radii} ${bubbleColor}`}>
                                  {isMedia && mediaUrl ? (
                                    <>
                                      {imageLike ? (
                                        <a
                                          href={mediaUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="block -mx-1.5 -mt-1 mb-1 overflow-hidden rounded-xl"
                                        >
                                          <img
                                            src={mediaUrl}
                                            alt={fileName}
                                            className="w-full max-h-[280px] object-cover"
                                            loading="lazy"
                                          />
                                        </a>
                                      ) : (
                                        <div className="mb-1">
                                          <DocumentBubble url={mediaUrl} name={fileName} mime={mime} />
                                        </div>
                                      )}
                                      {Boolean(m.content?.trim()) &&
                                        m.content?.trim() !== (m.media_file_name || "").trim() && (
                                          <div className="text-[14px] whitespace-pre-wrap break-words leading-relaxed">
                                            {m.content}
                                          </div>
                                        )}
                                    </>
                                  ) : (
                                    <div className="text-[14px] whitespace-pre-wrap break-words leading-relaxed">{m.content}</div>
                                  )}
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-1 px-1">
                                  {new Date(m.created_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
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

              {/* Scroll-to-bottom FAB */}
              {showScrollToBottom && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-28 right-6 rounded-full shadow-lg border h-9 w-9 z-20 bg-card/90 backdrop-blur"
                  onClick={() => scrollToBottom(true)}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              )}

              {/* Composer */}
              <div className="px-4 py-3 border-t shrink-0 bg-card">
                <div className="flex items-end gap-2 bg-muted/50 rounded-2xl px-2 py-1.5 focus-within:ring-1 focus-within:ring-ring transition-all">
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
                        size="icon"
                        onClick={openFilePicker}
                        disabled={uploading || sending}
                        title="Attach images or documents"
                        aria-label="Attach files"
                        className="rounded-full h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  <textarea
                    ref={messageInputRef}
                    placeholder="Message…"
                    rows={1}
                    className="flex-1 bg-transparent text-[14px] px-2 py-2.5 border-0 focus:outline-none focus:ring-0 resize-none leading-relaxed max-h-[140px]"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      if (sendError) setSendError("");
                      resizeComposer();
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
                    disabled={sending}
                    size="icon"
                    className="rounded-full h-9 w-9 shrink-0 bg-gradient-to-r from-[hsl(199,85%,48%)] to-[hsl(215,85%,55%)] hover:from-[hsl(199,85%,42%)] hover:to-[hsl(215,85%,49%)] text-white shadow-sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {sendError && (
                  <div className="mt-2 px-1 text-sm text-destructive">
                    {sendError}
                  </div>
                )}

                {tab !== "support" && attachedFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 px-1">
                    {attachedFiles.map((f, idx) => (
                      <span
                        key={`${f.name}_${f.size}_${f.lastModified}`}
                        className="inline-flex items-center gap-2 text-xs px-2.5 py-1 border rounded-full bg-card shadow-sm"
                      >
                        <span className="font-medium text-muted-foreground">{f.type?.startsWith("image/") ? "IMG" : "DOC"}</span>
                        <span className="max-w-[120px] truncate">{f.name}</span>
                        <button
                          onClick={() => removeFile(idx)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
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
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-7 w-7 text-muted-foreground/60" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No conversation selected</h3>
              <p className="text-sm text-center max-w-[240px]">Choose a thread from the sidebar to start messaging.</p>
            </div>
          )}
        </div>
      </div>

      {selectedPatient && (
        <PatientDetailSheet
          patient={selectedPatient}
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
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
