import { MessageSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useDropdown } from "@/contexts/DropdownContext";
import { useMessageNotifications } from "@/features/messages/hooks/useMessageNotifications";
import { formatDistanceToNow } from "date-fns";

export const MessagesDropdown = ({ className }: { className?: string }) => {
  const navigate = useNavigate();
  const { isOpen, toggleDropdown } = useDropdown();
  const notifications = useMessageNotifications();

  const unreadCount = notifications.length;

  const handleMessageClick = (masterId?: string) => {
    if (masterId) {
      navigate(`/dashboard/messages?masterId=${masterId}`);
    } else {
      navigate("/dashboard/messages");
    }
    toggleDropdown(null);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className={className}
        onClick={() => toggleDropdown("messages")}
      >
        <MessageSquare className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
            {unreadCount}
          </span>
        )}
      </Button>

      {isOpen("messages") && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              Messages {unreadCount > 0 && `(${unreadCount} unread)`}
            </h3>
          </div>

          {notifications.map((message) => (
            <button
              key={message.id}
              onClick={() => handleMessageClick(message.masterId)}
              className="flex items-start w-full px-4 py-3 text-left hover:bg-gray-50"
            >
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-500" />
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p
                  className={`text-sm ${
                    message.read
                      ? "text-gray-600"
                      : "text-gray-900 font-medium"
                  }`}
                >
                  {message.senderName}
                </p>
                <p className="text-sm text-gray-500 mt-1 truncate">
                  {message.content}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(message.timestamp), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              {!message.read && (
                <div className="h-2 w-2 bg-blue-500 rounded-full ml-2 mt-1" />
              )}
            </button>
          ))}

          <div className="border-t border-gray-100 mt-2 pt-2">
            <button
              onClick={() => handleMessageClick()}
              className="flex items-center justify-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
            >
              View all messages
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
