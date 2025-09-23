import { Bell, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDropdown } from "@/contexts/DropdownContext";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "appointment" | "message" | "reminder";
  isRead: boolean;
  masterId?: string; // 👈 add for message navigation
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "New Message from Dr. Smith",
    message: "Please review your treatment plan.",
    time: "2 mins ago",
    type: "message",
    isRead: false,
    masterId: "visit-123", // 👈 this should come from backend
  },
  {
    id: "2",
    title: "Upcoming Appointment",
    message: "Your appointment is tomorrow at 10:00 AM",
    time: "2 hours ago",
    type: "appointment",
    isRead: false,
  },
];

export const NotificationsDropdown = ({ className }: { className?: string }) => {
  const { isOpen, toggleDropdown } = useDropdown();
  const navigate = useNavigate();

  const unreadCount = mockNotifications.filter((n) => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === "message" && notification.masterId) {
      navigate(`/dashboard/messages?masterId=${notification.masterId}&chatType=support`);
    } else if (notification.type === "appointment") {
      navigate("/dashboard/appointments");
    } else if (notification.type === "reminder") {
      navigate("/dashboard/reminders");
    } else {
      navigate("/dashboard/notifications");
    }

    toggleDropdown(null);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className={`relative ${className}`}
        onClick={() => toggleDropdown("notifications")}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full text-xs" />
        )}
      </Button>

      {isOpen("notifications") && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </h3>
          </div>

          {mockNotifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className="flex items-start w-full px-4 py-3 text-left hover:bg-gray-50"
            >
              <div className="flex-shrink-0 mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p
                      className={`text-sm ${
                        notification.isRead
                          ? "text-gray-600"
                          : "text-gray-900 font-medium"
                      }`}
                    >
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {notification.time}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="h-2 w-2 bg-blue-500 rounded-full ml-2 mt-1" />
                  )}
                </div>
              </div>
            </button>
          ))}

          <div className="border-t border-gray-100 mt-2 pt-2">
            <button
              onClick={() => {
                navigate("/dashboard/notifications");
                toggleDropdown(null);
              }}
              className="flex items-center justify-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
