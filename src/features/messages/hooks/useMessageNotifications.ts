// src/features/messages/hooks/useMessageNotifications.ts
import { useEffect, useState } from "react";
import { MessageService } from "@/features/messages/services/message.service";
import { VisitService, Visit } from "@/features/visits/services/visit.service";

export interface MessageNotification {
  id: number | string;
  content: string;
  timestamp: string;
  read: boolean;
  senderName: string;
  masterId: string;
  chatType: "doctor" | "support";   // 👈 crucial
}

export function useMessageNotifications() {
  const [notifications, setNotifications] = useState<MessageNotification[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const visits: Visit[] = await VisitService.getPatientVisits();
        const notifs: MessageNotification[] = [];

        for (const visit of visits) {
          const masterId = visit.master_id;
          if (!masterId) continue;

          const [doctorMsgs, supportMsgs] = await Promise.all([
            MessageService.getDoctorMessages(masterId),
            MessageService.getSupportMessages(masterId),
          ]);

          const latestDoctor = doctorMsgs?.[doctorMsgs.length - 1];
          const latestSupport = supportMsgs?.[supportMsgs.length - 1];

          if (latestDoctor && !latestDoctor.read) {
            notifs.push({
              id: latestDoctor.id,
              content: latestDoctor.content,
              timestamp: latestDoctor.timestamp,
              read: latestDoctor.read,
              senderName: `${visit.visit_type} – Doctor`,
              masterId,
              chatType: "doctor",              // 👈 add chatType
            });
          }

          if (latestSupport && !latestSupport.read) {
            notifs.push({
              id: latestSupport.id,
              content: latestSupport.content,
              timestamp: latestSupport.timestamp,
              read: latestSupport.read,
              senderName: `${visit.visit_type} – Support`,
              masterId,
              chatType: "support",             // 👈 add chatType
            });
          }
        }

        setNotifications(notifs);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return notifications;
}
