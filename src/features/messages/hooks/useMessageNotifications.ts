import { useEffect, useState } from "react";
import { MessageService } from "@/features/messages/services/message.service";
import { VisitService, Visit } from "@/features/visits/services/visit.service";

export function useMessageNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const visits: Visit[] = await VisitService.getPatientVisits();
        const notifs: any[] = [];

        for (const visit of visits) {
          if (!visit.master_id) continue;

          const [doctorMsgs, supportMsgs] = await Promise.all([
            MessageService.getDoctorMessages(visit.master_id),
            MessageService.getSupportMessages(visit.master_id),
          ]);

          const latestDoctor = doctorMsgs[doctorMsgs.length - 1];
          const latestSupport = supportMsgs[supportMsgs.length - 1];

          if (latestDoctor && !latestDoctor.read) {
            notifs.push({
              ...latestDoctor,
              senderName: `${visit.visit_type} – Doctor`,
              masterId: visit.master_id,
            });
          }
          if (latestSupport && !latestSupport.read) {
            notifs.push({
              ...latestSupport,
              senderName: `${visit.visit_type} – Support`,
              masterId: visit.master_id,
            });
          }
        }

        setNotifications(notifs);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    load();
    const interval = setInterval(load, 5000); // poll every 5s
    return () => clearInterval(interval);
  }, []);

  return notifications;
}
