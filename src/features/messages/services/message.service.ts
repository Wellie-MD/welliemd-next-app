// src/features/messages/services/message.service.ts
import { apiClient } from "@/shared/api/client";

export type ChatRecipient = "doctor" | "support";

export interface RawMessage {
  id: number | string;
  content: string;
  timestamp: string;           // ISO (created_at)
  read?: boolean;              // legacy mirror
  readByPatient?: boolean;     // preferred
  masterId: string;            // master_id
  senderName?: string;

  // From BE (/messages/all/)
  senderType?: "patient" | "doctor" | "support" | "super_support" | "unknown";
  side?: "left" | "right";     // relative to patient (left = patient)
  message_type?: string;

  // convenience for styling
  chatType?: "doctor" | "support" | "super_support";
}

export const MessageService = {
  /** NEW: unified list for a given master_id */
  async getAllMessages(masterId: string): Promise<RawMessage[]> {
    const res = await apiClient.get(`/messages/all/`, { params: { master_id: masterId } });

    return (res.data as any[]).map((m) => ({
      id: m.id,
      content: m.content,
      timestamp: m.created_at ?? m.timestamp,
      read: m.read,
      readByPatient: m.readByPatient,
      masterId: m.master_id ?? m.masterId,
      senderName: m.sender_name ?? m.senderName,
      senderType: m.senderType,
      side: m.side,
      message_type: m.message_type,
      chatType:
        m.message_type === "doctor_to_patient" || m.message_type === "patient_to_doctor"
          ? "doctor"
          : m.message_type === "super_support_to_patient"
          ? "super_support"
          : "support",
    }));
  },

  /** Keep if other parts still call them */
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

  async sendMessage(payload: {
    master_id: string;
    to: ChatRecipient; // "doctor" | "support"
    content: string;
    is_media?: boolean;
    media_url?: string;
  }): Promise<{ sent: boolean; id: number }> {
    const res = await apiClient.post(`/messages/send/`, payload);
    return res.data;
  },
};
