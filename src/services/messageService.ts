import api from "../api/axiosInstance";

export interface Message {
  id: number;
  master_id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender_name: string;
  senderType: "patient" | "doctor" | "support" | "beluga_support" | "super_support"; // widened
  side: "left" | "right";
  patientName: string;
  message_type:
    | "doctor_to_patient"
    | "support_to_patient"
    | "patient_to_doctor"
    | "patient_to_support"
    | "client_to_beluga_support"       // added
    | "beluga_support_to_client"       // added
    | "super_support_to_patient";      // (already exists on BE, safe to include)
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

  // 🆕 fetch a single beluga thread by master_id (prevents 400)
  async getBelugaThread(master_id: string): Promise<Message[]> {
    const { data } = await api.get<Message[]>(
      `/messages/client-beluga/?master_id=${encodeURIComponent(master_id)}`
    );
    return data;
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
    to: "doctor" | "support" | "beluga_support";   // 🆕 allow beluga_support
    from_client?: boolean;
  }): Promise<{ sent: boolean; id: number }> {
    const { data } = await api.post("/messages/send/", payload);
    return data;
  },
};
