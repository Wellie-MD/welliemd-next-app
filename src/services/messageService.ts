// src/services/messageService.ts
import api from "@/api/axiosInstance";
import { useAuthStore } from "@/store/useAuthStore";

/** Message shape returned by /messages/all/ across portals */
export interface Message {
  id: number;
  master_id: string;
  content: string;
  created_at: string;
  read: boolean;
  readByPatient?: boolean;

  sender_name: string;
  senderType:
    | "patient"
    | "doctor"
    | "support"
    | "super_support"
    | "client"
    | "beluga_support";
  side: "left" | "right";

  patientName: string;
  message_type:
    | "doctor_to_patient"
    | "support_to_patient"
    | "super_support_to_patient"
    | "patient_to_doctor"
    | "patient_to_support"
    | "client_to_beluga_support"
    | "beluga_support_to_client";

  /** Some backends send a single media file via these fields */
  is_media?: boolean;
  media_url?: string;
  media_mime_type?: string;
  media_file_name?: string;

  /** Some backends send an attachments array instead (or in addition) */
  attachments?: Array<{
    url: string;
    file_name: string;
    mime_type: string;
    width?: number;
    height?: number;
  }>;
  delivery_status?: "sending" | "sent" | "failed";
}
export interface SendMessageResult {
  sent?: boolean;
  id?: number;
  queued?: boolean;
  request_id?: string;
  status?: "sending" | "sent" | "failed";
}
export type NewAttachment = {
  url: string;
  file_name: string;
  mime_type: string;
  width?: number;
  height?: number;
};
function join(base: string | undefined, path: string) {
  if (!base) return path;
  const b = base.endsWith("/") ? base : base + "/";
  const p = path.startsWith("/") ? path.slice(1) : path;
  return b + p;
}

function normalizeTenantApiBase(apiEndpoint: string): string {
  const normalized = apiEndpoint.endsWith("/") ? apiEndpoint : `${apiEndpoint}/`;
  if (normalized.includes("/api/v1/") || normalized.endsWith("/api/v1")) {
    return normalized.endsWith("/") ? normalized : `${normalized}/`;
  }
  return `${normalized}api/v1/`;
}

async function tenantRequest<T>(apiEndpoint: string, path: string, init?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const url = join(normalizeTenantApiBase(apiEndpoint), path);

  const headers = new Headers(init?.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  // Let browser set multipart boundary automatically for FormData
  if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Tenant request failed (${res.status}): ${body || res.statusText}`);
  }

  return (await res.json()) as T;
}

// src/services/messageService.ts

export async function uploadToAdminS3(files: File[]): Promise<NewAttachment[]> {
  // Many backends accept one file per request. Do them sequentially.
  const results: NewAttachment[] = [];

  for (const file of files) {
    const form = new FormData();
    form.append("file", file);

    const { data } = await api.post("/storage/upload/", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // Accept: array, { files: [...] }, { results: [...] }, or single object
    const items = Array.isArray(data)
      ? data
      : Array.isArray(data?.files)
      ? data.files
      : Array.isArray(data?.results)
      ? data.results
      : [data]; // <-- single object fallback

    for (const it of items) {
      const url =
        it?.url ?? it?.location ?? it?.Location ?? it?.file_url ?? it?.path ?? "";

      if (!url) continue;

      results.push({
        url,
        // support both snake_case and camelCase keys
        file_name:
          it?.original_file_name ??
          it?.originalFileName ??
          it?.file_name ??
          it?.fileName ??
          it?.name ??
          it?.original_name ??
          file.name ??
          "file",
        mime_type:
          it?.mime_type ??
          it?.mimeType ??
          it?.content_type ??
          it?.ContentType ??
          file.type ??
          "application/octet-stream",
        width: it?.width,
        height: it?.height,
      });
    }
  }

  return results;
}


export const messageService = {
  async getAllMessages(apiEndpoint?: string, clientId?: string): Promise<Message[]> {
    if (clientId) {
      const { data } = await api.get<Message[]>(`/admin/dashboard/clients/${clientId}/messages/`);
      return data;
    }
    if (apiEndpoint) {
      return tenantRequest<Message[]>(apiEndpoint, "messages/all/");
    }
    const { data } = await api.get<Message[]>("/messages/all/");
    return data;
  },

  /** ---------- UPDATED: allow classic media fields ---------- */
  async sendMessage(payload: {
    master_id: string;
    content?: string;
    to: "doctor" | "support" | "beluga_support";
    from_client?: boolean;
    from_super_admin?: boolean;
    apiEndpoint?: string;
    clientId?: string;

    // EITHER: traditional attachments array (keep supporting it)
    attachments?: NewAttachment[];

    // OR/AND: classic single-media fields (what you asked to populate)
    is_media?: boolean;
    media_url?: string;
    media_mime_type?: string;
    media_file_name?: string;
  }): Promise<SendMessageResult> {
    const { apiEndpoint, clientId, ...body } = payload;
    if (clientId) {
      const { data } = await api.post<SendMessageResult>(
        `/admin/dashboard/clients/${clientId}/messages/`,
        body
      );
      return data;
    }
    if (apiEndpoint) {
      return tenantRequest<SendMessageResult>(apiEndpoint, "messages/send/", {
        method: "POST",
        body: JSON.stringify(body),
      });
    }
    const { data } = await api.post("/messages/send/", body);
    return data;
  },
};


export async function sendMessageWithFiles(payload: {
  apiEndpoint?: string;
  master_id: string;
  to: "doctor" | "support" | "beluga_support";
  from_client?: boolean;
  from_super_admin?: boolean;
  content?: string; // optional text to send with files
  files: File[];
}): Promise<{ sent: boolean; id: number; attachments?: NewAttachment[] }> {
  const { apiEndpoint, files, ...body } = payload;

  const form = new FormData();
  Object.entries(body).forEach(([k, v]) => {
    if (v !== undefined && v !== null) form.append(k, String(v));
  });
  files.forEach((f) => form.append("files", f));

  if (apiEndpoint) {
    return tenantRequest<{ sent: boolean; id: number; attachments?: NewAttachment[] }>(
      apiEndpoint,
      "messages/send/",
      {
        method: "POST",
        body: form,
      }
    );
  }

  const { data } = await api.post("/messages/send/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function markAdminNotificationsReadForConversation(
  clientId: string,
  masterId: string
): Promise<string[]> {
  if (!clientId || !masterId) return [];

  try {
    const { data } = await api.get<any[]>("/admin/dashboard/notifications/", {
      params: { unread_only: false, limit: 200 },
    });
    const rows = Array.isArray(data) ? data : [];
    const normalizedMaster = String(masterId || "");
    const targets = rows.filter(
      (row: any) =>
        String(row.source_client_id || "") === String(clientId) &&
        String(
          row.master_id ||
          row.data?.master_id ||
          row.payload?.master_id ||
          ""
        ) === normalizedMaster
    );
    if (!targets.length) return [];

    const results = await Promise.all(
      targets.map((row: any) =>
        api
          .post(`/admin/dashboard/notifications/${row.id}/read/`, { client_id: clientId })
          .then(() => ({ ok: true, id: row.id }))
          .catch(() => ({ ok: false, id: row.id }))
      )
    );

    return results
      .filter((r) => r.ok)
      .map((r) => `${clientId}:${r.id}`);
  } catch {
    return [];
  }
}
