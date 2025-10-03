// src/features/messages/services/message.service.ts
import { apiClient } from "@/shared/api/client";

export interface RawMessage {
  id: number | string;
  content: string;
  timestamp: string; // ISO
  isFromDoctor: boolean;
  read?: boolean;            // legacy (BE maps to read_by_patient for compatibility)
  readByPatient?: boolean;   // new field (preferred)
  masterId: string;
  senderName?: string;
  chatType?: "doctor" | "support" | "super_support";
}

export const MessageService = {
  async getDoctorMessages(masterId: string): Promise<RawMessage[]> {
    const res = await apiClient.get(`/messages/doctor/`, {
      params: { master_id: masterId },
    });
    return res.data as RawMessage[];
  },

  async getSupportMessages(masterId: string): Promise<RawMessage[]> {
    const res = await apiClient.get(`/messages/support/`, {
      params: { master_id: masterId },
    });
    return res.data as RawMessage[];
  },

  // 🚨 new: patient-reads
  async markAsReadByPatient(messageId: string | number) {
    const res = await apiClient.post(`/messages/${messageId}/read-by-patient/`);
    return res.data;
  },

  // (optional) keep legacy around if admin/staff apps still use it
  async markAsRead(messageId: string | number) {
    const res = await apiClient.post(`/messages/${messageId}/read/`);
    return res.data;
  },

  async sendMessage(payload: {
    master_id: string;
    to: "doctor" | "support";
    content: string;
  }) {
    const res = await apiClient.post(`/messages/send/`, payload);
    return res.data;
  },
};
