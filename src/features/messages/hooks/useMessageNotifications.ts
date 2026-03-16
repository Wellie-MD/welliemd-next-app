// src/features/messages/hooks/useMessageNotifications.ts
import { useEffect, useState } from "react";
import { MessageService, RawMessage } from "@/features/messages/services/message.service";
import { VisitService, Visit } from "@/features/visits/services/visit.service";

export interface MessageNotification {
  id: number | string;
  content: string;
  timestamp: string;
  read: boolean; // ← mirrored from readByPatient for convenience
  senderName: string;
  masterId: string;
  chatType: "doctor" | "support" | "super_support";
}

function isInboundFor(type: "doctor" | "support", msg: RawMessage) {
  if (type === "doctor") return msg.isFromDoctor === true && (msg.chatType === "doctor" || !msg.chatType);
  // support thread: includes super_support inbound too
  return msg.isFromDoctor === true && (msg.chatType === "support" || msg.chatType === "super_support");
}

function byNewest(a: RawMessage, b: RawMessage) {
  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
}

export function useMessageNotifications() {
  const [notifications, setNotifications] = useState<MessageNotification[]>([]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const visits: Visit[] = await VisitService.getPatientVisits();
        const notifs: MessageNotification[] = [];

        for (const v of visits) {
          const masterId = v.master_id;
          if (!masterId) continue;

          const [docRaw, supRaw] = await Promise.all([
            MessageService.getDoctorMessages(masterId),
            MessageService.getSupportMessages(masterId),
          ]);

          const docMsgs = (docRaw ?? []).slice().sort(byNewest);
          const supMsgs = (supRaw ?? []).slice().sort(byNewest);

          // doctor inbound, unread by patient
          const latestDocInboundUnread = docMsgs.find(
            (m) => isInboundFor("doctor", m) && (m.readByPatient ?? m.read) === false
          );
          if (latestDocInboundUnread) {
            notifs.push({
              id: latestDocInboundUnread.id,
              content: latestDocInboundUnread.content,
              timestamp: latestDocInboundUnread.timestamp,
              read: false,
              senderName: `${v.visit_type} – Doctor`,
              masterId,
              chatType: "doctor",
            });
          }

          // super support inbound unread takes precedence; else support inbound unread
          const latestSuperUnread = supMsgs.find(
            (m) => m.chatType === "super_support" && m.isFromDoctor === true && (m.readByPatient ?? m.read) === false
          );
          if (latestSuperUnread) {
            notifs.push({
              id: latestSuperUnread.id,
              content: latestSuperUnread.content,
              timestamp: latestSuperUnread.timestamp,
              read: false,
              senderName: `${v.visit_type} – Client Support`,
              masterId,
              chatType: "super_support",
            });
          } else {
            const latestSupportInboundUnread = supMsgs.find(
              (m) => isInboundFor("support", m) && (m.readByPatient ?? m.read) === false
            );
            if (latestSupportInboundUnread) {
              notifs.push({
                id: latestSupportInboundUnread.id,
                content: latestSupportInboundUnread.content,
                timestamp: latestSupportInboundUnread.timestamp,
                read: false,
                senderName: `${v.visit_type} – Support`,
                masterId,
                chatType: "support",
              });
            }
          }
        }

        // sort final list by time desc + de-dupe
        const map = new Map<string | number, MessageNotification>();
        for (const n of notifs) map.set(n.id, n);
        const finalList = Array.from(map.values()).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        if (alive) setNotifications(finalList);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
        if (alive) setNotifications([]);
      }
    };

    load();
    const i = setInterval(load, 10000); // Poll every 10 seconds
    return () => {
      alive = false;
      clearInterval(i);
    };
  }, []);

  return notifications;
}
