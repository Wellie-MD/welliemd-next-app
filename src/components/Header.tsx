import React from "react";
import { Bell, MessageSquare, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { UserProfileDropdown } from "./common/user-profile-dropdown";
import { useAuth } from "@/features/auth";

export function Header() {
  const { isAuthenticated } = useAuth();

  return (
    <header style={{ backgroundColor: '#98C6DE' }} className="px-6 py-4 border-b border-white/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-white text-2xl font-semibold">WellieMD</h1>
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
        
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
          </Button>
          
          {isAuthenticated && (
            <UserProfileDropdown className="text-white hover:bg-white/10" />
          )}
        </div>
      </div>
    </header>
  );
}