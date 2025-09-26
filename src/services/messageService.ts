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
  message_type: "doctor_to_patient" | "support_to_patient" | "patient_to_doctor" | "patient_to_support";  // 👈 add

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
    return data;   // now it's a plain array
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
