import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/shared/api/client';
import { VisitService } from '@/features/visits/services/visit.service';
import { MessageService, type RawMessage } from '@/features/messages/services/message.service';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  timestamp: string;
  read: boolean;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

type InboxItem = {
  id: string;
  category?: string;
  event_type?: string;
  title?: string;
  body?: string;
  is_read?: boolean;
  created_at?: string;
  master_id?: string;
  message_id?: number | null;
};

type MessageNotification = {
  id: string;
  type: 'doctor_message' | 'support_message' | 'super_support_message';
  title: string;
  message: string;
  data: {
    master_id: string;
    message_id: number | string;
    source: 'message';
    chat_type: 'doctor' | 'support' | 'super_support';
  };
  timestamp: string;
  read: boolean;
  priority: 'normal';
};

function displaySenderName(senderName: string | undefined, fallback: 'Doctor' | 'Support') {
  const raw = (senderName || '').trim();
  if (!raw) return fallback;
  // Avoid showing raw email-like values in patient notifications.
  if (raw.includes('@')) return fallback;
  return raw;
}

function notificationIdentity(n: Notification): string {
  const data = n.data || {};
  const masterId = typeof data.master_id === "string" ? data.master_id : "";
  const messageId = data.message_id as number | string | null | undefined;
  if (masterId && messageId !== null && messageId !== undefined && String(messageId).trim() !== "") {
    return `msg:${masterId}:${String(messageId)}`;
  }
  return `notif:${n.id}`;
}

function isInboundFor(type: 'doctor' | 'support', msg: RawMessage) {
  if (type === 'doctor') return msg.isFromDoctor === true && (msg.chatType === 'doctor' || !msg.chatType);
  return msg.isFromDoctor === true && (msg.chatType === 'support' || msg.chatType === 'super_support');
}

function byNewest(a: RawMessage, b: RawMessage) {
  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const mapInboxToNotification = useCallback((item: InboxItem): Notification => {
    let rawTitle = item.title || 'New notification';
    // Sanitize titles that look like system-generated IDs or contain @ symbols
    // Patterns like: "knysys-a -b -f -5-3", "abc-1-2-3", etc.
    const isSystemId = /^([a-z0-9]+-){2,}[a-z0-9-]+$/i.test(rawTitle.trim()) || 
                       /^knysys/i.test(rawTitle) ||
                       rawTitle.includes('@') ||
                       /^[a-z0-9]+\s*[-–]\s*[a-z0-9]/.test(rawTitle);
    const sanitizedTitle = isSystemId ? 'New notification' : rawTitle;
    return {
      id: String(item.id),
      type: item.event_type || item.category || 'message',
      title: sanitizedTitle,
      message: item.body || '',
      data: {
        master_id: item.master_id || '',
        message_id: item.message_id ?? null,
      },
      timestamp: item.created_at || new Date().toISOString(),
      read: Boolean(item.is_read),
      priority: 'normal',
    };
  }, []);

  const refresh = useCallback(async () => {
    let mappedInbox: Notification[] = [];
    try {
      const res = await apiClient.get<InboxItem[]>('/notifications/', {
        params: { limit: 20 },
      });
      const rows = Array.isArray(res.data) ? res.data : [];
      // Message notifications are resolved from message endpoints (doctor/support)
      // so read state always matches chat. Keep non-message inbox items here.
      mappedInbox = rows
        .filter((item) => item.message_id == null)
        .map(mapInboxToNotification);
    } catch (error) {
      console.error('Failed to load notifications from API:', error);
    }

    let mappedMessages: MessageNotification[] = [];
    try {
      const visits = await VisitService.getPatientVisits();
      const collected: MessageNotification[] = [];

      for (const visit of visits) {
        const masterId = visit.master_id;
        if (!masterId) continue;

        const [docRaw, supRaw] = await Promise.all([
          MessageService.getDoctorMessages(masterId),
          MessageService.getSupportMessages(masterId),
        ]);

        const docMsgs = (docRaw ?? []).slice().sort(byNewest);
        const supMsgs = (supRaw ?? []).slice().sort(byNewest);

        const docUnread = docMsgs.filter(
          (m) => isInboundFor('doctor', m) && (m.readByPatient ?? m.read) === false
        );
        for (const msg of docUnread) {
          const sender = displaySenderName(msg.senderName, 'Doctor');
          collected.push({
            id: `msg:${masterId}:${msg.id}`,
            type: 'doctor_message',
            title: `New message from ${sender}`,
            message: msg.content,
            data: {
              master_id: masterId,
              message_id: msg.id,
              source: 'message',
              chat_type: 'doctor',
            },
            timestamp: msg.timestamp,
            read: false,
            priority: 'normal',
          });
        }

        const supportUnread = supMsgs.filter(
          (m) => isInboundFor('support', m) && (m.readByPatient ?? m.read) === false
        );
        for (const msg of supportUnread) {
          const isSuper = msg.chatType === 'super_support';
          const sender = displaySenderName(msg.senderName, 'Support');
          collected.push({
            id: `msg:${masterId}:${msg.id}`,
            type: isSuper ? 'super_support_message' : 'support_message',
            title: `New message from ${sender}`,
            message: msg.content,
            data: {
              master_id: masterId,
              message_id: msg.id,
              source: 'message',
              chat_type: isSuper ? 'super_support' : 'support',
            },
            timestamp: msg.timestamp,
            read: false,
            priority: 'normal',
          });
        }
      }

      mappedMessages = collected;
    } catch (error) {
      console.error('Failed to load message notifications:', error);
    }

    const deduped = new Map<string, Notification>();
    [...mappedMessages, ...mappedInbox].forEach((n) => {
      const identity = notificationIdentity(n as Notification);
      deduped.set(identity, n as Notification);
    });

    const combined = Array.from(deduped.values())
      .filter((n) => !n.read)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setNotifications(combined.slice(0, 50));
  }, [mapInboxToNotification]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!mounted) return;
      await refresh();
    };

    void load();
    const id = window.setInterval(() => {
      void load();
    }, 30000);

    const onFocus = () => void load();
    const onRefetch = () => void load();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('patient:notifications-refetch', onRefetch);

    return () => {
      mounted = false;
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('patient:notifications-refetch', onRefetch);
    };
  }, [refresh]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
  }, []);

  const markAsRead = useCallback((id: string) => {
    const target = notifications.find((n) => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));

    if (target?.data?.source === 'message' && target.data?.message_id != null) {
      void MessageService.markAsReadByPatient(target.data.message_id as string | number).catch(() => undefined);
      return;
    }
    void apiClient.post(`/notifications/${id}/read/`).catch(() => undefined);
  }, [notifications]);

  const markAllAsRead = useCallback(() => {
    const unreadMessageIds = notifications
      .filter((n) => !n.read && n.data?.source === 'message' && n.data?.message_id != null)
      .map((n) => n.data.message_id as string | number);

    setNotifications([]);
    unreadMessageIds.forEach((messageId) => {
      void MessageService.markAsReadByPatient(messageId).catch(() => undefined);
    });
    void apiClient.post('/notifications/read-all/').catch(() => undefined);
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        refresh,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
}
