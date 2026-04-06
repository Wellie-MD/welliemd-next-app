/**
 * Notifications Dropdown Component
 * 
 * Shows real-time notifications received via WebSocket.
 * Notifications persist in localStorage via NotificationsContext.
 */

import { Bell, Check, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export const NotificationsDropdown = ({ className, style }: { className?: string; style?: React.CSSProperties }) => {
  const { isOpen, toggleDropdown } = useDropdown();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

  const handleNotificationClick = (notification: { id: string; type: string; data?: Record<string, unknown> }) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.type === 'order_status_changed' && notification.data?.order_id) {
      navigate('/dashboard/orders');
    } else {
      navigate('/dashboard/notifications');
    }
    
    toggleDropdown(null);
  };

  return (
    <div className="relative">
      <button
        style={{
          ...style
        }}
        className={className}
        onClick={() => toggleDropdown("notifications")}
      >
        <Bell size={14} style={{ color: 'var(--km-tm)' }} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen("notifications") && (
        <div className="absolute w-max top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-0 z-50 max-h-[480px] overflow-hidden flex flex-col" style={{right:'-100px'}}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications {unreadCount > 0 && <span className="text-blue-600">({unreadCount})</span>}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium text-gray-900">No notifications yet</p>
                <p className="text-xs text-gray-500 mt-1">
                  You'll receive updates about your orders here
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-b-0 transition-colors ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`p-2 rounded-full ${
                      notification.priority === 'high' || notification.priority === 'urgent'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      <Package className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm ${
                          notification.read ? 'text-gray-600' : 'text-gray-900 font-medium'
                        }`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(notification.timestamp)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 bg-blue-500 rounded-full ml-2 mt-1.5 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 p-2 bg-gray-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className="w-full flex items-center justify-center px-4 py-2 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
