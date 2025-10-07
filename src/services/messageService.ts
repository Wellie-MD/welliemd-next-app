import api from "../api/axiosInstance";

export interface Message {
  id: number;
  master_id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender_name: string;
  senderType: "patient" | "doctor" | "support" | "beluga_support" | "super_support" | "client"; // widened
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
// services/messageService.ts
export const messageService = {
  async getAllMessages(): Promise<Message[]> {
    const { data } = await api.get<Message[]>("/messages/all/");
    return data;
  },

  // ✅ Normalize Beluga to your Message shape
  async getBelugaThread(master_id: string): Promise<Message[]> {
    const { data } = await api.get(
      "/messages/client-beluga/",
      { params: { master_id } }
    );

    // data is like:
    // [{ id, content, timestamp, isFromDoctor, read, readByPatient, masterId, senderName, chatType }]
    return (data as any[]).map((m) => {
      const fromBeluga = !!m.isFromDoctor; // BE sets true when Beluga → Client
      return {
        id: m.id as number,
        master_id: (m.masterId as string) ?? "",
        content: (m.content as string) ?? "",
        created_at: (m.timestamp as string) ?? "",       // 🔑 map timestamp -> created_at
        read: !!m.read,
        sender_name: (m.senderName as string) ?? "",
        senderType: fromBeluga ? "beluga_support" : "client",
        side: fromBeluga ? "left" : "right",             // align “Beluga” on left (inbound)
        patientName: "",                                  // optional; your UI derives header from left list
        message_type: fromBeluga
          ? "beluga_support_to_client"
          : "client_to_beluga_support",
      } as Message;
    });
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
    to: "doctor" | "support" | "beluga_support";
    from_client?: boolean;
  }): Promise<{ sent: boolean; id: number }> {
    const { data } = await api.post("/messages/send/", payload);
    return data;
  },
};
