// src/services/messageService.ts — add uploadAttachment(file)

import api from "../api/axiosInstance";

/** Chat message shape used across the app */
export interface Message {
  id: number;
  master_id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender_name: string;
  senderType:
    | "patient"
    | "doctor"
    | "support"
    | "beluga_support"
    | "super_support"
    | "client";
  side: "left" | "right";
  patientName: string;
  message_type:
    | "doctor_to_patient"
    | "support_to_patient"
    | "patient_to_doctor"
    | "patient_to_support"
    | "client_to_beluga_support"
    | "beluga_support_to_client"
    | "super_support_to_patient";

  // media (optional)
  is_media?: boolean;
  media_url?: string;
  media_mime_type?: string;
  media_file_name?: string;

  // order number from API
  orderNumber?: string;
}

/* ---- S3 public base (only used as fallback when BE gives a key not a URL) ---- */
const S3_PUBLIC_BASE = "https://welliemd.s3.eu-north-1.amazonaws.com/";

/* Build a public URL from a raw key (bucket root) */
function buildPublicUrlFromKey(key?: string | null): string | undefined {
  if (!key) return undefined;
  if (key.startsWith("http") || key.startsWith("data:")) return key;
  return `${S3_PUBLIC_BASE}${key.replace(/^\/+/, "")}`;
}

function arraysEqual(a: Message[], b: Message[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].content !== b[i].content) return false;
  }
  return true;
}

export const messageService = {
  /** Upload a single file to S3 via BE StorageUploadView */
  async uploadAttachment(file: File): Promise<{ url: string; fileName: string; mimeType: string }> {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await api.post<{ url: string; fileName: string; mimeType: string; path: string }>(
      "/storage/upload/",
      fd,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return { url: data.url, fileName: data.fileName, mimeType: data.mimeType };
  },

  /** All patient/support/doctor messages (your BE /messages/all/) */
  async getAllMessages(): Promise<Message[]> {
    const { data } = await api.get<Message[]>("/messages/all/");
    return (data || []).map((m) => {
      const hasUrl = !!m.media_url && (m.media_url.startsWith("http") || m.media_url.startsWith("data:"));
      const inferredUrl =
        hasUrl ? m.media_url : m.is_media ? buildPublicUrlFromKey(m.media_url || m.content) : undefined;
      return { ...m, media_url: inferredUrl || m.media_url };
    });
  },

  /** Client ↔ Beluga thread for a master_id (your BE /messages/client-beluga/) */
  async getBelugaThread(master_id: string): Promise<Message[]> {
    const { data } = await api.get<any[]>("/messages/client-beluga/", { params: { master_id } });
    return (data || []).map((m) => {
      const fromBeluga = !!m.isFromDoctor;
      const is_media: boolean | undefined = m.is_media;
      const rawMediaUrl: string | undefined = m.media_url || (is_media ? m.content : undefined);
      const media_url = rawMediaUrl ? buildPublicUrlFromKey(rawMediaUrl) : undefined;

      const normalized: Message = {
        id: Number(m.id),
        master_id: String(m.masterId ?? ""),
        content: String(m.content ?? ""),
        created_at: String(m.timestamp ?? ""),
        read: !!m.read,
        sender_name: String(m.senderName ?? ""),
        senderType: fromBeluga ? "beluga_support" : "client",
        side: fromBeluga ? "left" : "right",
        patientName: "",
        message_type: fromBeluga ? "beluga_support_to_client" : "client_to_beluga_support",
        is_media,
        media_url,
        media_mime_type: m.media_mime_type,
        media_file_name: m.media_file_name,
      };
      return normalized;
    });
  },

  /** Mark thread read */
  async markRead(master_id: string) {
    const res = await fetch(`/api/messages/read?master_id=${encodeURIComponent(master_id)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to mark read");
    try {
      return await res.json();
    } catch {
      return {};
    }
  },

  /** Send a message */
  async sendMessage(payload: {
    master_id: string;
    content: string;
    to: "doctor" | "support" | "beluga_support";
    from_client?: boolean;
    is_media?: boolean;
    media_url?: string;
    media_mime_type?: string;
    media_file_name?: string;
  }): Promise<{ sent: boolean; id: number }> {
    const { data } = await api.post("/messages/send/", payload);
    return data;
  },
};

export { arraysEqual };
