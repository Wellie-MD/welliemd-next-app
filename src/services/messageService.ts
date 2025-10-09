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

/** Utility to join optional external endpoint with route */
function join(base: string | undefined, path: string) {
  if (!base) return path;
  const b = base.endsWith("/") ? base : base + "/";
  const p = path.startsWith("/") ? path.slice(1) : path;
  return b + p;
}

export const messageService = {
  /** Get all messages for the current user (or a specific client when apiEndpoint is given). */
  async getAllMessages(apiEndpoint?: string): Promise<Message[]> {
    const url = apiEndpoint ? join(apiEndpoint, "/messages/all/") : "/messages/all/";
    const { data } = await api.get<Message[]>(url);
    return data;
  },

  /** Send a text message (no attachments). */
  async sendMessage(payload: {
    master_id: string;
    content: string;
    to: "doctor" | "support" | "beluga_support";
    from_client?: boolean;     // client portal semantics
    from_super_admin?: boolean; // admin portal semantics
    apiEndpoint?: string;       // when targeting a specific client from admin
  }): Promise<{ sent: boolean; id: number }> {
    const { apiEndpoint, ...body } = payload;
    const url = apiEndpoint ? join(apiEndpoint, "/messages/send/") : "/messages/send/";
    const { data } = await api.post(url, body);
    return data;
  },
};

/* ---------- Multipart helper for attachments ---------- */

export type NewAttachment = {
  url: string;
  file_name: string;
  mime_type: string;
  width?: number;
  height?: number;
};

/**
 * Send a message that can include one or more files.
 * Backend should accept "files" as a multi-part field.
 */
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
  const url = apiEndpoint ? join(apiEndpoint, "/messages/send/") : "/messages/send/";

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
