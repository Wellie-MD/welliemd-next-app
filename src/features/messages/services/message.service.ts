// src/features/messages/services/message.service.ts
import { apiClient } from "@/shared/api/client";

export type ChatRecipient = "doctor" | "support"; // patient UI only

function uploadErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string; error?: string } } }).response;
    const detail = response?.data?.detail || response?.data?.error;
    if (detail) return detail;
  }
  return error instanceof Error ? error.message : "File upload failed.";
}

export interface RawMessage {
  id: number | string;
  content: string;
  timestamp: string;           // ISO
  read?: boolean;
  readByPatient?: boolean;
  masterId: string;
  senderName?: string;
  isFromDoctor?: boolean;

  // From BE
  senderType?: "patient" | "doctor" | "support" | "super_support" | "beluga_support" | "unknown";
  side?: "left" | "right";
  message_type?: string;

  // Convenience
  chatType?: "doctor" | "support" | "super_support";

  // NEW: media fields (FE renders attachments with these)
  is_media?: boolean;
  media_url?: string;
  mime_type?: string;
  file_name?: string;
}

export const MessageService = {
  /** Unified list for a given master_id (doctor + support; beluga is excluded by BE) */
  async getAllMessages(masterId: string): Promise<RawMessage[]> {
    const res = await apiClient.get(`/messages/all/`, { params: { master_id: masterId } });
    return (res.data as any[]).map((m) => {
      const msgType = m.message_type as string;
      const chatType: RawMessage["chatType"] =
        msgType === "doctor_to_patient" || msgType === "patient_to_doctor"
          ? "doctor"
          : msgType === "super_support_to_patient"
          ? "super_support"
          : "support";

      return {
        id: m.id,
        content: m.content,
        timestamp: m.created_at ?? m.timestamp,
        read: m.read,
        readByPatient: m.readByPatient ?? m.read_by_patient,
        masterId: m.master_id ?? m.masterId,
        senderName: m.sender_name ?? m.senderName,
        isFromDoctor: m.isFromDoctor ?? m.is_from_doctor,
        senderType: m.senderType,
        side: m.side,
        message_type: msgType,
        chatType,

        // media
        is_media: !!m.is_media,
        media_url: m.media_url || undefined,
        mime_type: m.media_mime_type || undefined,
        file_name: m.media_file_name || undefined,
      };
    });
  },

  async getDoctorMessages(masterId: string): Promise<RawMessage[]> {
    const res = await apiClient.get(`/messages/doctor/`, { params: { master_id: masterId } });
    return res.data as RawMessage[];
  },

  async getSupportMessages(masterId: string): Promise<RawMessage[]> {
    const res = await apiClient.get(`/messages/support/`, { params: { master_id: masterId } });
    return res.data as RawMessage[];
  },

  async markAsReadByPatient(messageId: string | number) {
    const res = await apiClient.post(`/messages/${messageId}/read-by-patient/`);
    return res.data;
  },

  /** POST /messages/send/ (patient UI: no from_client flag) */
  async sendMessage(payload: {
    master_id: string;
    to: ChatRecipient; // "doctor" | "support"
    content?: string;  // optional when is_media is true
    is_media?: boolean;
    media_url?: string;
    media_mime_type?: string;
    media_file_name?: string;
    first_name?: string;
    last_name?: string;
    app_name?: string; // VITE_APP_NAME - used by backend to resolve client for Beluga
  }): Promise<{ sent: boolean; id: number }> {
    const res = await apiClient.post(`/messages/send/`, payload);
    return res.data;
  },

  async uploadAttachment(file: File): Promise<{ url: string; fileName: string; mimeType: string; path: string }> {
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await apiClient.post<{
        url: string;
        fileName: string;
        mimeType: string;
        path: string;
        originalFileName?: string;
        original_file_name?: string;
      }>(`/storage/upload/`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = res.data;
      return {
        ...data,
        fileName: data.originalFileName || data.original_file_name || file.name,
      };
    } catch (error: unknown) {
      throw new Error(uploadErrorMessage(error));
    }
  },
};
