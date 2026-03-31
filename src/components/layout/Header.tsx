import { Search, Bell, User, Store, LogOut, Moon, Sun } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/store/useAuthStore"
import { authService } from "@/services/authService"
import { useNavigate } from "react-router-dom"
import { useSidebar } from "../ui/sidebar"
import { useBranding } from "@/contexts/BrandingContext"
import { useTheme } from "next-themes"
// import { SidebarTrigger } from "../ui/sidebar"

export function Header() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const { state } = useSidebar()
  const { logos, isLoading } = useBranding()
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  const handleLogout = async () => {
    await authService.logout()
    navigate('/auth/signin')
  }


  return (
    <header className="h-16 bg-blue-100 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {state === "collapsed" && !isLoading && logos?.square && (
          <div className="brand-logo-shell">
            <img 
              src={logos.square}
              alt="Logo" 
              className="h-8 w-auto max-w-[200px] object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          </div>
             )}
        </div>
        {/* <SidebarTrigger className="text-gray-600 hover:bg-white/50 rounded-md p-1" /> // button moved to sidebar */}
      </div>

      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-slate-400" />
          <Input
            placeholder="Search"
            className="pl-10 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-800 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-slate-700 rounded text-gray-600 dark:text-slate-300">
              Ctrl K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="text-gray-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800">
          <Bell className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="text-gray-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 focus-visible:ring-0 text-gray-700 dark:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-800">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar_url || ""} alt={user?.full_name} />
                <AvatarFallback>
                  {user?.full_name?.charAt(0).toUpperCase() || user?.first_name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline-block font-medium">{user?.full_name || "User"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/dashboard/manage-account')}>
              <User className="mr-2 h-4 w-4" />
              <span>Manage account</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Store className="mr-2 h-4 w-4" />
              <span>Stores</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
