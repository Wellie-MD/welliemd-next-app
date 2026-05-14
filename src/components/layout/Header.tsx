import { Search, Bell, User, Store, LogOut, Moon, Sun, CheckCircle2 } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { formatDistanceToNowStrict } from "date-fns"
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
import { useClientMessages } from "@/contexts/MessagesContext"
import api from "@/api/axiosInstance"
// import { SidebarTrigger } from "../ui/sidebar"

const formatNotificationTime = (raw: string): string => {
  if (!raw) return ""
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ""
  const elapsedMs = Date.now() - date.getTime()
  if (elapsedMs >= 0 && elapsedMs < 60_000) return "Just now"
  return formatDistanceToNowStrict(date, { addSuffix: true })
}

export function Header() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const { state } = useSidebar()
  const { logos, isLoading } = useBranding()
  const { theme, setTheme } = useTheme()
  const { reload } = useClientMessages()
  const isDark = theme === "dark"
  const [notifications, setNotifications] = useState<Array<{
    id: string
    title: string
    body: string
    master_id: string
    created_at: string
    is_read: boolean
  }>>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const lastUnreadCountRef = useRef(0)
  const lastTopNotificationIdRef = useRef<string>("")
  const notifInFlightRef = useRef(false)
  const notifErrorStreakRef = useRef(0)

  const loadNotifications = useCallback(async () => {
    if (notifInFlightRef.current) return
    notifInFlightRef.current = true
    try {
      const [listRes, countRes] = await Promise.all([
        api.get("/notifications/", { params: { unread_only: true, limit: 100 } }),
        api.get("/notifications/unread-count/"),
      ])
      const nextItems = Array.isArray(listRes.data) ? listRes.data : []
      const nextUnread = Number(countRes.data?.unread_count || 0)
      const nextTopId = nextItems.length ? String(nextItems[0]?.id || "") : ""

      const shouldSyncMessages =
        nextUnread > lastUnreadCountRef.current || (nextTopId && nextTopId !== lastTopNotificationIdRef.current)

      setNotifications(nextItems)
      setUnreadCount(nextUnread)

      lastUnreadCountRef.current = nextUnread
      lastTopNotificationIdRef.current = nextTopId

      if (shouldSyncMessages) {
        void reload()
      }
      notifErrorStreakRef.current = 0
    } finally {
      notifInFlightRef.current = false
    }
  }, [reload])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        await loadNotifications()
      } catch {
        if (!cancelled) {
          setNotifications([])
          setUnreadCount(0)
        }
      }
    }

    void load()
    const onFocus = () => void load()
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onFocus)
    return () => {
      cancelled = true
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onFocus)
    }
  }, [loadNotifications])

  useEffect(() => {
    let timer = 0
    const getDelay = () => {
      const hiddenFactor = typeof document !== "undefined" && document.hidden ? 3 : 1
      const backoffFactor = Math.min(2 ** Math.min(notifErrorStreakRef.current, 3), 8)
      const jitter = Math.floor(Math.random() * 1200)
      return 30000 * hiddenFactor * backoffFactor + jitter
    }
    const tick = () => {
      void loadNotifications()
        .catch(() => {
          notifErrorStreakRef.current += 1
        })
        .finally(() => {
          timer = window.setTimeout(tick, getDelay())
        })
    }
    timer = window.setTimeout(tick, getDelay())
    return () => window.clearTimeout(timer)
  }, [loadNotifications])

  useEffect(() => {
    const onRefetch = () => {
      void loadNotifications()
    }
    window.addEventListener("client:notifications-refetch", onRefetch)
    return () => {
      window.removeEventListener("client:notifications-refetch", onRefetch)
    }
  }, [loadNotifications])

  const handleLogout = async () => {
    await authService.logout()
    navigate('/auth/signin')
  }

  const handleNotificationClick = async (item: { id: string; master_id: string }) => {
    try {
      await api.post(`/notifications/${item.id}/read/`)
    } catch {
      // no-op
    }
    setNotifications((prev) => prev.filter((n) => n.id !== item.id))
    setUnreadCount((c) => Math.max(0, c - 1))
    navigate(`/dashboard/messages?master_id=${encodeURIComponent(item.master_id)}`)
  }

  const handleMarkAllRead = async () => {
    try {
      await api.post("/notifications/read-all/")
    } catch {
      // no-op
    }
    setNotifications([])
    setUnreadCount(0)
    lastUnreadCountRef.current = 0
    lastTopNotificationIdRef.current = ""
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
        <DropdownMenu onOpenChange={(open) => { if (open) void loadNotifications() }}>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="relative text-gray-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[92vw] min-w-[320px] max-w-[380px] sm:w-[380px] p-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-white dark:bg-slate-950">
              <DropdownMenuLabel className="p-0 text-sm font-semibold">Notifications</DropdownMenuLabel>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  void handleMarkAllRead()
                }}
                className="text-xs font-medium text-blue-700 hover:text-blue-800 disabled:text-slate-400"
                disabled={notifications.length === 0}
              >
                Mark all read
              </button>
            </div>
            <div className="px-4 py-2 border-b bg-white dark:bg-slate-950">
              <div className="text-xs font-medium text-sky-600">Activity</div>
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className="cursor-pointer items-start py-3 px-4 border-b last:border-b-0 bg-white dark:bg-slate-950"
                  >
                    <div className="flex w-full items-start gap-3">
                      <div className="mt-0.5 h-9 w-9 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 shrink-0 flex items-center justify-center text-xs font-semibold">
                        {(n.title || "N").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs font-semibold leading-5 line-clamp-2 break-words">{n.title}</div>
                          <div className="text-[11px] text-slate-400">
                            {n.created_at
                              ? formatNotificationTime(n.created_at)
                              : ""}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2 mt-1 break-words">{n.body}</div>
                      </div>
                      <div className="pt-0.5">
                        <CheckCircle2 className="h-4 w-4 text-sky-500" />
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="px-4 py-2 bg-white dark:bg-slate-950">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  navigate("/dashboard/messages")
                }}
                className="w-full text-center text-xs font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 border rounded-lg py-2 border-slate-200 dark:border-slate-700"
              >
                Open Messages
              </button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
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
