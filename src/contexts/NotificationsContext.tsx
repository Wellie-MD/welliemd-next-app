import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { apiClient } from '@/shared/api/client';

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
  clearAll: () => void;
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

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dismissedIds = useRef<Set<string>>(new Set());

  const mapInboxToNotification = useCallback((item: InboxItem): Notification => {
    return {
      id: String(item.id),
      type: item.event_type || item.category || 'message',
      title: item.title || 'New notification',
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
    try {
      const res = await apiClient.get<InboxItem[]>('/notifications/', {
        params: { limit: 20 },
      });
      const rows = Array.isArray(res.data) ? res.data : [];
      const mapped = rows
        .map(mapInboxToNotification)
        .filter(n => !dismissedIds.current.has(n.id))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(mapped);
    } catch (error) {
      console.error('Failed to load notifications from API:', error);
      setNotifications([]);
    }
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
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      mounted = false;
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
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
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    void apiClient.post(`/notifications/${id}/read/`).catch(() => undefined);
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    void apiClient.post('/notifications/read-all/').catch(() => undefined);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications(prev => {
      prev.forEach(n => dismissedIds.current.add(n.id));
      return [];
    });
    void apiClient.post('/notifications/read-all/').catch(() => undefined);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
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
