import { useMemo, useState } from "react";
import { MessageSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useDropdown } from "@/contexts/DropdownContext";
import { useMessageNotifications } from "@/features/messages/hooks/useMessageNotifications";
import { formatDistanceToNow } from "date-fns";

type ChatType = "doctor" | "support" | "super_support";

function TypePill({ type }: { type: ChatType }) {
  if (type === "super_support") {
    return (
      <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 text-red-700 text-[10px] px-1.5 py-0.5">
        Super&nbsp;Admin
      </span>
    );
  }
  if (type === "support") {
    return (
      <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 text-purple-700 text-[10px] px-1.5 py-0.5">
        Support
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 text-[10px] px-1.5 py-0.5">
      Doctor
    </span>
  );
}

export const MessagesDropdown = ({ className }: { className?: string }) => {
  const navigate = useNavigate();
  const { isOpen, toggleDropdown } = useDropdown();
  const notifications = useMessageNotifications();

  // optional: optimistic “read” styling when a user clicks an item
  const [locallyReadIds, setLocallyReadIds] = useState<(number | string)[]>([]);
  const list = useMemo(
    () =>
      notifications.map((n) => ({
        ...n,
        read: n.read || locallyReadIds.includes(n.id),
      })),
    [notifications, locallyReadIds]
  );

  const unreadCount = list.filter((n) => !n.read).length;

  const handleMessageClick = (masterId?: string, chatType?: ChatType, id?: number | string) => {
    if (id != null) setLocallyReadIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    if (masterId && chatType) navigate(`/dashboard/messages?masterId=${masterId}&chatType=${chatType}`);
    else if (masterId) navigate(`/dashboard/messages?masterId=${masterId}`);
    else navigate("/dashboard/messages");
    toggleDropdown(null);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className={className}
        onClick={() => toggleDropdown("messages")}
        aria-label="Open messages"
      >
        <MessageSquare className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            aria-label={`${unreadCount} unread messages`}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] leading-none rounded-full px-1.5 py-0.5 min-w-[18px] text-center"
          >
            {unreadCount}
          </span>
        )}
      </Button>

      {isOpen("messages") && (
        <div
          role="menu"
          aria-label="Messages"
          className="absolute right-0 top-full mt-2 w-96 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto"
        >
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              Messages
              {unreadCount > 0 && (
                <span className="text-xs font-normal text-gray-600">({unreadCount} unread)</span>
              )}
            </h3>
          </div>

          {list.length === 0 && (
            <div className="px-4 py-6 text-sm text-gray-500 text-center">No new messages</div>
          )}

          {list.map((message) => (
            <button
              key={message.id}
              role="menuitem"
              onClick={() => handleMessageClick(message.masterId, message.chatType as ChatType, message.id)}
              className="flex items-start w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
            >
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              </div>

              <div className="ml-3 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-sm truncate ${message.read ? "text-gray-600" : "text-gray-900 font-medium"}`}
                    title={message.senderName}
                  >
                    {message.senderName}
                  </p>
                  <TypePill type={message.chatType as ChatType} />
                </div>

                <p className="text-sm text-gray-500 mt-0.5 truncate" title={message.content}>
                  {message.content}
                </p>

                <p className="text-[12px] text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                </p>
              </div>

              {!message.read && <span className="h-2 w-2 bg-blue-600 rounded-full ml-2 mt-1.5" />}
            </button>
          ))}

          <div className="border-t border-gray-100 mt-2 pt-2">
            <button
              onClick={() => handleMessageClick()}
              className="flex items-center justify-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 whitespace-nowrap"
            >
              View all messages
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
