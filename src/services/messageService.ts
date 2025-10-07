import api from "../api/axiosInstance";

export interface Message {
  id: number;
  master_id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender_name: string;
  senderType: "patient" | "doctor" | "support" | "beluga_support" | "super_support";
  side: "left" | "right";
  patientName: string;
  message_type:
    | "doctor_to_patient"
    | "support_to_patient"
    | "patient_to_doctor"
    | "patient_to_support"
    | "client_to_beluga_support"
    | "beluga_support_to_client"
    | "super_support_to_patient"; // (kept optional for safety)
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const messageService = {
  async getAllMessages(): Promise<Message[]> {
    const { data } = await api.get<Message[]>("/messages/all/");
    return data;   // plain array
  },

  // 🆕 Beluga-only messages (client ↔ Beluga)
  async getBelugaMessages(): Promise<Message[]> {
    const { data } = await api.get<Message[]>("/messages/client-beluga/");
    return data;   // plain array
  },

  async markRead(master_id: string) {
    return fetch(`/api/messages/read?master_id=${encodeURIComponent(master_id)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).then((r) => {
      if (!r.ok) throw new Error("Failed to mark read");
      return r.json().catch(() => ({}));
    });
  },

  async sendMessage(payload: {
    master_id: string;
    content: string;
    to: "doctor" | "support" | "beluga_support"; // 🆕 allow beluga_support
    from_client?: boolean;
  }): Promise<{ sent: boolean; id: number }> {
    const { data } = await api.post("/messages/send/", payload);
    return data;
  },
};
