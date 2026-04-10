import { Search, Bell, User, Store, LogOut, CheckCircle2 } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
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
import api from "@/api/axiosInstance"
import { useNavigate } from "react-router-dom"
import { useSidebar } from "../ui/sidebar"
import { useClients } from "@/hooks/useClients"
// import { SidebarTrigger } from "../ui/sidebar"

export function Header() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const { clients } = useClients()
  const [items, setItems] = useState<Array<{
    id: string
    title: string
    body: string
    master_id: string
    client_id: string
    client_name: string
    created_at: string
    is_read: boolean
  }>>([])
  const [seenIds, setSeenIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("admin_seen_message_notifications")
      const arr = raw ? (JSON.parse(raw) as string[]) : []
      return new Set(arr)
    } catch {
      return new Set<string>()
    }
  })
  const notifInFlightRef = useRef(false)
  const notifErrorStreakRef = useRef(0)

  const handleLogout = async () => {
    await authService.logout()
    navigate('/auth/signin')
  }

  const handleLogoClick = () => {
    navigate('/')
  }

  const { state } = useSidebar()

  useEffect(() => {
    let cancelled = false

    const fetchAll = async () => {
      if (notifInFlightRef.current) return
      notifInFlightRef.current = true
      try {
        const [listRes, countRes] = await Promise.all([
          api.get("/admin/dashboard/notifications/", {
            params: { unread_only: true, limit: 100 },
          }),
          api.get("/admin/dashboard/notifications/unread-count/"),
        ])
        const rows = Array.isArray(listRes.data) ? listRes.data : []
        if (cancelled) return
        const merged = rows
          .map((r: any) => {
            const clientId = r.source_client_id || ""
            const clientName =
              r.client_name || clients.find((c) => c.id === clientId)?.name || "Unknown Client"
            return {
              id: String(r.id),
              title: r.title || "New notification",
              body: r.body || "",
              master_id: r.master_id || "",
              client_id: clientId,
              client_name: clientName,
              created_at: r.created_at || "",
              is_read: false,
            }
          })
          .sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
        setItems(merged.slice(0, 100))
        setServerUnreadCount(Number(countRes.data?.unread_count || 0))
        notifErrorStreakRef.current = 0
      } catch {
        notifErrorStreakRef.current += 1
        if (!cancelled) setItems([])
      } finally {
        notifInFlightRef.current = false
      }
    }

    void fetchAll()
    const getDelay = () => {
      const hiddenFactor = typeof document !== "undefined" && document.hidden ? 3 : 1
      const backoffFactor = Math.min(2 ** Math.min(notifErrorStreakRef.current, 3), 8)
      const jitter = Math.floor(Math.random() * 1200)
      return 30000 * hiddenFactor * backoffFactor + jitter
    }
    let timer = window.setTimeout(function tick() {
      void fetchAll().finally(() => {
        timer = window.setTimeout(tick, getDelay())
      })
    }, getDelay())

    const onVisibility = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(function tick() {
        void fetchAll().finally(() => {
          timer = window.setTimeout(tick, getDelay())
        })
      }, getDelay())
    }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", onVisibility)
      window.clearTimeout(timer)
    }
  }, [clients])

  useEffect(() => {
    const onSeen = (event: Event) => {
      const custom = event as CustomEvent<{ compositeIds?: string[] }>;
      const incoming = custom.detail?.compositeIds || [];
      if (!incoming.length) return;

      setSeenIds((prev) => {
        const next = new Set(prev);
        incoming.forEach((id) => next.add(id));
        try {
          localStorage.setItem("admin_seen_message_notifications", JSON.stringify(Array.from(next)));
        } catch {
          // non-blocking
        }
        return next;
      });

      setItems((prev) =>
        prev.filter((it) => !incoming.includes(`${it.client_id}:${it.id}`))
      );
    };

    window.addEventListener("admin:notifications-seen", onSeen as EventListener);
    return () => {
      window.removeEventListener("admin:notifications-seen", onSeen as EventListener);
    };
  }, []);

  const [serverUnreadCount, setServerUnreadCount] = useState(0)

  const unreadCount = useMemo(() => {
    const localUnread = items.filter((i) => !i.is_read).length
    return Math.max(localUnread, serverUnreadCount)
  }, [items, serverUnreadCount])

  const handleNotificationClick = async (item: {
    id: string
    master_id: string
    client_id: string
    client_name: string
  }) => {
    const compositeId = `${item.client_id}:${item.id}`
    setSeenIds((prev) => {
      const next = new Set(prev)
      next.add(compositeId)
      try {
        localStorage.setItem("admin_seen_message_notifications", JSON.stringify(Array.from(next)))
      } catch {
        // non-blocking
      }
      return next
    })
    setItems((prev) => prev.filter((it) => !(it.client_id === item.client_id && it.id === item.id)))
    setServerUnreadCount((c) => Math.max(0, c - 1))
    try {
      await api.post(`/admin/dashboard/notifications/${item.id}/read/`, {
        client_id: item.client_id,
      })
    } catch {
      // non-blocking
    }
    navigate(`/dashboard/messages?client_id=${encodeURIComponent(item.client_id)}&master_id=${encodeURIComponent(item.master_id)}`)
  }

  const handleMarkAllRead = async () => {
    try {
      await api.post("/admin/dashboard/notifications/read-all/")
    } catch {
      // non-blocking
    }
    setItems([])
    setServerUnreadCount(0)
    setSeenIds((prev) => {
      const next = new Set(prev)
      for (const n of items) next.add(`${n.client_id}:${n.id}`)
      try {
        localStorage.setItem("admin_seen_message_notifications", JSON.stringify(Array.from(next)))
      } catch {
        // non-blocking
      }
      return next
    })
  }

  return (
<header className="h-16 bg-[#12517A] text-white flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
           {state === "collapsed" && (
          <img 
            src="/welliemd_logo.png" 
            alt="Welliemd" 
            className="h-8 w-auto cursor-pointer"
            onClick={handleLogoClick}
          />
           )}
        </div>
        {/* <SidebarTrigger className="text-white-600 hover:bg-white/50 rounded-md p-1" /> */}
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="relative text-white-600 hover:bg-white/50">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[min(92vw,380px)] max-w-[380px] p-0 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
              <DropdownMenuLabel className="p-0 text-sm font-semibold">Notifications</DropdownMenuLabel>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  void handleMarkAllRead()
                }}
                className="text-xs font-medium text-blue-700 hover:text-blue-800 disabled:text-slate-400"
                disabled={items.length === 0}
              >
                Mark all read
              </button>
            </div>
            <div className="px-4 py-2 border-b bg-white">
              <div className="text-xs font-medium text-sky-600">Activity</div>
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-500">No new notifications</div>
              ) : (
                items.slice(0, 10).map((item) => (
                  <DropdownMenuItem
                    key={`${item.client_id}:${item.id}`}
                    className="cursor-pointer items-start py-3 px-4 border-b last:border-b-0 bg-white"
                    onClick={() => handleNotificationClick(item)}
                  >
                    <div className="flex w-full items-start gap-3">
                      <div className="mt-0.5 h-9 w-9 rounded-full bg-rose-100 text-rose-700 shrink-0 flex items-center justify-center text-xs font-semibold">
                        {(item.title || item.client_name || "N").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs font-semibold leading-5 line-clamp-2 break-words">{item.title}</div>
                          <div className="text-[11px] text-slate-400">
                            {item.created_at
                              ? `${formatDistanceToNowStrict(new Date(item.created_at), { addSuffix: true })}`
                              : ""}
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">{item.client_name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.body}</div>
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
            <div className="px-4 py-2 bg-white">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  navigate("/dashboard/messages")
                }}
                className="w-full text-center text-xs font-medium text-slate-700 hover:text-slate-900 border rounded-lg py-2"
              >
                Open Messages
              </button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 focus-visible:ring-0">
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
