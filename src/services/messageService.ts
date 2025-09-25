import api from "../api/axiosInstance";

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
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const messageService = {
  async getAllMessages(): Promise<PaginatedResponse<Message>> {
    const { data } = await api.get<PaginatedResponse<Message>>("/messages/all/");
    return data;
  },

  async sendMessage(payload: {
    master_id: string;
    content: string;
    to: "doctor" | "support";
    from_client?: boolean; 
  }): Promise<{ sent: boolean; id: number }> {
    const { data } = await api.post("/messages/send/", payload);
    return data;
  },
};