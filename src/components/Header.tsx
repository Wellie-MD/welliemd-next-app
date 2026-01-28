import { useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { UserProfileDropdown } from "./common/user-profile-dropdown";
import { NotificationsDropdown } from "./common/notifications-dropdown";
import { useAuth } from "@/features/auth";
import { useDropdown } from "@/contexts/DropdownContext";
import { MessagesDropdown } from "@/components/common/messages-dropdown";
import { env } from "@/config/env";

export default function Header() {
  const { isAuthenticated } = useAuth();
  const { closeAll } = useDropdown();
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        closeAll();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeAll]);

  return (
    <header style={{ backgroundColor: '#98C6DE' }} className="px-6 py-4 border-b border-white/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-white text-2xl font-semibold truncate max-w-[240px]">
              {env.VITE_APP_NAME}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 flex-1 max-w-md mx-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
            <Input
              placeholder="Search..."
              className="pl-10 bg-white/10 border-white/20 text-white placeholder-white/60 focus:bg-white/20"
            />
          </div>
        </div>
        
        <div ref={headerRef} className="flex items-center space-x-2">
          <MessagesDropdown className="text-white hover:bg-white/10" />
          
          <NotificationsDropdown className="text-white hover:bg-white/10" />
          
          {isAuthenticated && (
            <UserProfileDropdown className="text-white hover:bg-white/10" />
          )}
        </div>
      </div>
    </header>
  );
}
