// src/services/messageService.ts
import api from "@/api/axiosInstance";

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
  async getAllMessages(apiEndpoint?: string): Promise<Message[]> {
    const url = apiEndpoint ? join(apiEndpoint, "/api/v1/messages/all/") : "/messages/all/";
    const { data } = await api.get<Message[]>(url);
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

    // EITHER: traditional attachments array (keep supporting it)
    attachments?: NewAttachment[];

    // OR/AND: classic single-media fields (what you asked to populate)
    is_media?: boolean;
    media_url?: string;
    media_mime_type?: string;
    media_file_name?: string;
  }): Promise<{ sent: boolean; id: number }> {
    const { apiEndpoint, ...body } = payload;
    const url = apiEndpoint ? join(apiEndpoint, "/api/v1/messages/send/") : "/messages/send/";
    const { data } = await api.post(url, body);
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
  const url = apiEndpoint ? join(apiEndpoint, "/api/v1/messages/send/") : "/messages/send/";

  const form = new FormData();
  Object.entries(body).forEach(([k, v]) => {
    if (v !== undefined && v !== null) form.append(k, String(v));
  });
  files.forEach((f) => form.append("files", f));

  const { data } = await api.post(url, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}