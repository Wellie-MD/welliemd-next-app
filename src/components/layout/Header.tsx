import { Search, Bell, Menu } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function Header() {
  return (
    <header className="h-16 bg-blue-100 border-b border-gray-200 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded"></div>
          </div>
          <span className="font-semibold text-purple-600">Kickstart Social.co</span>
        </div>
        <SidebarTrigger className="text-gray-600 hover:bg-white/50 rounded-md p-1" />
      </div>

      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search"
            className="pl-10 bg-white border-gray-300 text-gray-800 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <kbd className="px-2 py-1 text-xs bg-gray-200 rounded text-gray-600">
              Ctrl K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="text-gray-600 hover:bg-white/50">
          <Bell className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2 text-gray-800">
          <span className="text-sm">Admin</span>
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatars/admin.jpg" />
            <AvatarFallback className="bg-blue-100 text-blue-600">AD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}