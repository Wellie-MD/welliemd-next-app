// src/features/messages/services/message.service.ts
import { apiClient } from "@/shared/api/client";

export const MessageService = {
  async getDoctorMessages(masterId: string) {
    const res = await apiClient.get(`/messages/doctor/`, {
      params: { master_id: masterId },
    });
    return res.data; // array of messages
  },

  async getSupportMessages(masterId: string) {
    const res = await apiClient.get(`/messages/support/`, {
      params: { master_id: masterId },
    });
    return res.data;
  },

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
