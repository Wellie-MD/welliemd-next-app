import { useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import { UserProfileDropdown } from "./common/user-profile-dropdown";
import { NotificationsDropdown } from "./common/notifications-dropdown";
import { useAuth } from "@/features/auth";
import { useDropdown } from "@/contexts/DropdownContext";
import { MessagesDropdown } from "@/components/common/messages-dropdown";
import { env } from "@/config/env";
import { useBranding } from "@/features/branding/hooks/useBranding";



interface HeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

export default function Header({ onMenuClick, isSidebarOpen }: HeaderProps) {
  const { isAuthenticated } = useAuth();
  const { closeAll } = useDropdown();
  const { logos } = useBranding();
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
    <header style={{ backgroundColor: 'var(--brand-primary)' }} className="px-6 py-4 border-b border-white/20">
      <div className="flex items-center justify-between">
        {/* Left side - Hamburger menu (mobile only) and Logo */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Hamburger menu for mobile only */}
          <button 
            onClick={onMenuClick}
            className="block md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors navbar"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div>
            {logos?.square ? (
              <img 
                src={logos.square} 
                alt={env.VITE_APP_NAME} 
                className="h-10 w-auto object-contain"
              />
            ) : (
              <h1 className="text-white text-2xl font-semibold truncate max-w-[240px]">
                {env.VITE_APP_NAME}
              </h1>
            )}
          </div>
        </div>
        
        {/* Search bar  */}
        {/* <div className="hidden md:flex items-center space-x-4 flex-1 max-w-md mx-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
            <Input
              placeholder="Search..."
              className="pl-10 bg-white/10 border-white/20 text-white placeholder-white/60 focus:bg-white/20"
            />
          </div>
        </div> */}
        
        {/* Right side - Icons */}
        <div ref={headerRef} className="flex items-center space-x-1 md:space-x-2">
          <MessagesDropdown className="text-white hover:bg-white/10 hidden md:block" />
          
          <NotificationsDropdown className="text-white hover:bg-white/10" />
          
          {isAuthenticated && (
            <UserProfileDropdown className="text-white hover:bg-white/10" />
          )}
        </div>
      </div>
    </header>
  );
}