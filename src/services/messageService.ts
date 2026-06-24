// src/services/messageService.ts — lazy-load paginated conversations

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
}

/** Lightweight conversation summary returned by /messages/conversations/ */
export interface ConversationSummary {
  master_id: string;
  patient_name: string;
  patient_email: string;
  order_number: string;
  last_message: string;
  last_time: string;
  unread_count: number;
}

/** Paginated response shape */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
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

function uploadErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string; error?: string } } }).response;
    const detail = response?.data?.detail || response?.data?.error;
    if (detail) return detail;
  }
  return error instanceof Error ? error.message : "File upload failed.";
}

export const messageService = {
  /** Upload a single file to S3 via BE StorageUploadView */
  async uploadAttachment(file: File): Promise<{ url: string; fileName: string; mimeType: string }> {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post<{
        url: string;
        fileName: string;
        mimeType: string;
        path: string;
        originalFileName?: string;
        original_file_name?: string;
      }>(
        "/storage/upload/",
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const originalName = data.originalFileName || data.original_file_name || file.name;
      return { url: data.url, fileName: originalName, mimeType: data.mimeType };
    } catch (error: unknown) {
      throw new Error(uploadErrorMessage(error));
    }
  },

  /** Paginated conversation summaries (BE /messages/conversations/) */
  async getConversations(params?: {
    page?: number;
    perPage?: number;
    search?: string;
    type?: "patient" | "beluga";
  }): Promise<PaginatedResponse<ConversationSummary>> {
    const query: Record<string, string | number> = {};
    if (params?.page) query.page = params.page;
    if (params?.perPage) query.per_page = params.perPage;
    if (params?.search) query.search = params.search;
    if (params?.type) query.type = params.type;
    const { data } = await api.get<PaginatedResponse<ConversationSummary>>(
      "/messages/conversations/",
      { params: query }
    );
    return data;
  },

  /** Messages for a specific conversation with pagination (BE /messages/all/?master_id=X&limit=N&offset=M) */
  async getMessagesForConversation(params: {
    masterId: string;
    limit?: number;
    offset?: number;
  }): Promise<Message[]> {
    const query: Record<string, string | number> = {
      master_id: params.masterId,
    };
    if (params.limit != null) query.limit = params.limit;
    if (params.offset != null) query.offset = params.offset;
    const { data } = await api.get<Message[]>("/messages/all/", { params: query });
    return (data || []).map((m) => {
      const hasUrl = !!m.media_url && (m.media_url.startsWith("http") || m.media_url.startsWith("data:"));
      const inferredUrl =
        hasUrl ? m.media_url : m.is_media ? buildPublicUrlFromKey(m.media_url || m.content) : undefined;
      return { ...m, media_url: inferredUrl || m.media_url };
    });
  },

  /** All patient/support/doctor messages (BE /messages/all/). Pass afterId for incremental polls (unscoped only). */
  async getAllMessages(opts?: { afterId?: number }): Promise<Message[]> {
    const params: Record<string, number> = {};
    if (opts?.afterId != null && opts.afterId > 0) {
      params.after_id = opts.afterId;
    }
    const { data } = await api.get<Message[]>("/messages/all/", {
      params: Object.keys(params).length ? params : undefined,
    });
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

  async markNotificationsReadForMaster(master_id: string): Promise<number> {
    try {
      const { data } = await api.get<any[]>("/notifications/", {
        params: { unread_only: true, limit: 100 },
      });
      const rows = Array.isArray(data) ? data : [];
      const normalizedMaster = String(master_id || "");
      const targets = rows.filter((row: any) => {
        const rowMaster =
          String(
            row?.master_id ||
            row?.data?.master_id ||
            row?.payload?.master_id ||
            ""
          );
        return rowMaster === normalizedMaster;
      });
      if (!targets.length) return 0;

      await Promise.all(
        targets.map((row: any) =>
          api.post(`/notifications/${row.id}/read/`).catch(() => undefined)
        )
      );
      return targets.length;
    } catch {
      return 0;
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
