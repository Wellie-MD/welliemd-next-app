// src/services/messageService.ts
import api from "@/api/axiosInstance";

export interface Message {
  id: number;
  master_id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender_name: string;
  senderType: "patient" | "doctor" | "support";
  side: "left" | "right";
  patientName: string;
  message_type:
    | "doctor_to_patient"
    | "support_to_patient"
    | "patient_to_doctor"
    | "patient_to_support";
}

function join(base: string | undefined, path: string) {
  if (!base) return path;
  const b = base.endsWith("/") ? base : base + "/";
  const p = path.startsWith("/") ? path.slice(1) : path;
  return b + p;
}

export const messageService = {
  async getAllMessages(apiEndpoint?: string): Promise<Message[]> {
    const url = apiEndpoint ? join(apiEndpoint, "/messages/all/") : "/messages/all/";
    const { data } = await api.get<Message[]>(url);
    return data;
  },

  async sendMessage(payload: {
    master_id: string;
    content: string;
    to: "doctor" | "support";
    from_client?: boolean;     // keep for client portal semantics
    apiEndpoint?: string;      // NEW for admin mode
  }): Promise<{ sent: boolean; id: number }> {
    const { apiEndpoint, ...body } = payload;
    const url = apiEndpoint ? join(apiEndpoint, "/messages/send/") : "/messages/send/";
    const { data } = await api.post(url, body);
    return data;
  },
};

/* === ADD: Attachment types & multipart helper (no change to existing exports) === */
export type NewAttachment = {
  url: string;
  file_name: string;
  mime_type: string;
  width?: number;
  height?: number;
};

export async function sendMessageWithFiles(payload: {
  apiEndpoint?: string;
  master_id: string;
  to: "doctor" | "support";
  from_client?: boolean;
  from_super_admin?: boolean;
  content?: string;
  files: File[]; // required for this helper
}): Promise<{ sent: boolean; id: number; attachments?: NewAttachment[] }> {
  const { apiEndpoint, files, ...body } = payload;
  const url = apiEndpoint ? join(apiEndpoint, "/messages/send/") : "/messages/send/";

  const form = new FormData();
  Object.entries(body).forEach(([k, v]) => {
    if (v !== undefined && v !== null) form.append(k, String(v));
  });
  files.forEach((f) => form.append("files", f)); // BE should accept "files"

  const { data } = await api.post(url, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
