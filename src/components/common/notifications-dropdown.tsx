/**
 * Notifications Dropdown Component
 * 
 * Shows real-time notifications received via WebSocket.
 * Notifications persist in localStorage via NotificationsContext.
 */

import { Check, Trash2, Package } from "lucide-react";
import { useDropdown } from "@/contexts/DropdownContext";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/contexts/NotificationsContext";

// Format relative time (e.g., "2 mins ago")
function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  
  return date.toLocaleDateString();
}

export const NotificationsDropdown = () => {
  const { isOpen, toggleDropdown } = useDropdown();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, refresh } = useNotifications();

  const handleNotificationClick = (notification: { id: string; type: string; data?: Record<string, unknown> }) => {
    markAsRead(notification.id);
    
    const masterId = typeof notification.data?.master_id === "string" ? notification.data.master_id : "";

    // Route notifications
    if (notification.type === 'order_status_changed' && notification.data?.order_id) {
      navigate('/dashboard/orders');
    } else if (masterId) {
      navigate(`/dashboard/messages?masterId=${encodeURIComponent(masterId)}`);
    } else {
      navigate('/dashboard/messages');
    }
    
    toggleDropdown(null);
  };

  return (
    <>
      <div
        className="km-nbtn"
        onClick={(e) => {
          e.stopPropagation();
          const opening = !isOpen("notifications");
          toggleDropdown("notifications");
          if (opening) void refresh();
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unreadCount > 0 && <div className="km-ndot"></div>}
      </div>

      <div 
        className={`km-notif-panel ${isOpen("notifications") ? "open" : ""}`} 
        id="notifPanel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="km-notif-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            Notifications {unreadCount > 0 && <span style={{ color: "var(--km-ac)" }}>({unreadCount})</span>}
          </div>
          {unreadCount > 0 && (
            <div 
              style={{ fontSize: 11, color: "var(--km-ac)", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontWeight: 600 }}
              onClick={markAllAsRead}
            >
              <Check size={11} strokeWidth={3} /> Mark all read
            </div>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="km-notif-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <div className="km-notif-empty-title">No notifications yet</div>
            <div className="km-notif-empty-sub">You'll receive updates about your orders here</div>
          </div>
        ) : (
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "12px 14px",
                  borderBottom: "1px solid var(--km-b)",
                  cursor: "pointer",
                  background: !notification.read ? "rgba(79, 142, 247, 0.05)" : "transparent",
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => {
                  if (notification.read) e.currentTarget.style.background = "var(--km-s2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = !notification.read ? "rgba(79, 142, 247, 0.05)" : "transparent";
                }}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: notification.priority === 'urgent' ? "var(--km-rep)" : "var(--km-acp)",
                  color: notification.priority === 'urgent' ? "var(--km-re)" : "var(--km-ac)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 2
                }}>
                  <Package size={16} strokeWidth={1.8} />
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
                    <div style={{ fontSize: 13, fontWeight: !notification.read ? 700 : 500, color: "var(--km-t)", lineHeight: 1.3 }}>
                      {notification.title}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--km-tm)", flexShrink: 0, marginLeft: 8 }}>
                      {formatTimeAgo(notification.timestamp)}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--km-tm)", lineHeight: 1.4, opacity: 0.9 }}>
                    {notification.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {notifications.length > 0 && (
          <div style={{ padding: 10, borderTop: "1px solid var(--km-b)", background: "var(--km-s1)" }}>
            <div 
              onClick={clearAll}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                padding: "8px",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--km-re)",
                cursor: "pointer",
                borderRadius: "var(--km-rs)",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--km-rep)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <Trash2 size={12} strokeWidth={2.5} />
              Clear all
            </div>
          </div>
        )}
      </div>
    </>
  );
};
