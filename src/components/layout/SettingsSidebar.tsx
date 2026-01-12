import { NavLink, useNavigate, useLocation } from "react-router-dom"
import { ChevronLeft, ChevronsRight, X } from "lucide-react"
import {
  Store,
  Plug2,
  Users,
  Package,
  Stethoscope,
  CreditCard,
  Bell,
  Webhook,
  FileText,
  Shield,
  Tag,
  Globe,
  Palette,
  TrendingUp,
  Settings2,
  Mail
} from "lucide-react"
import {
  // Sidebar,
  // SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  // SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const settingsMenuItems = [
  { title: "Store Details", url: "/dashboard/settings/store-details", icon: Store },
  { title: "Users and Permissions", url: "/dashboard/settings/users-permissions", icon: Users },
  { title: "Payments", url: "/dashboard/settings/payments", icon: CreditCard },
  { title: "Notifications", url: "/dashboard/settings/notifications", icon: Bell },
  { title: "Notification Templates", url: "/dashboard/settings/notification-templates", icon: Mail },
  { title: "Policies", url: "/dashboard/settings/policies", icon: Shield },
  { title: "Metafields", url: "/dashboard/settings/metafields", icon: Tag },
  // { title: "Domains", url: "/dashboard/settings/domains", icon: Globe }, /* Domains tab removed on request: https://telehealthknysys.atlassian.net/browse/KAN-3 */
  { title: "Brand", url: "/dashboard/settings/brand", icon: Palette },
  { title: "Analytics and SEO", url: "/dashboard/settings/analytics-seo", icon: TrendingUp },
  { title: "Email and Sending Domain", url: "/dashboard/settings/email-domain", icon: Globe },
]

export function SettingsSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {

  // const { state } = useSidebar()
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname
  // const collapsed = state === "collapsed"

  const isActive = (path: string) => currentPath === path

  // Wrapper for menu items with tooltip when collapsed
  const MenuItemWrapper = ({ children, title }: { children: React.ReactNode, title: string }) => {
    if (collapsed) {
      return (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              {children}
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {title}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
    return <>{children}</>
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 h-svh bg-background border-r transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
     {/* <Sidebar collapsible="icon" className="border-r flex flex-col h-full overflow-hidden"> */}
      <div  className={`flex w-full p-4 ${
    collapsed ? "justify-center" : "justify-between"
  }`}>
        {!collapsed && (
  <img
    src="/welliemd_logo.png"
    alt="Welliemd"
    className="h-8 w-auto"
  />
)}

        {/* <SidebarTrigger className="text-gray-600 hover:bg-white/50 rounded-md p-1" /> */}
        <button
  onClick={onToggle}
  className="text-gray-600 hover:bg-muted rounded-md p-1 "
>
  {collapsed ? <ChevronsRight className="h-4 w-4" /> : <X className="h-4 w-4" />}
</button>
      </div>
      {/* <SidebarContent className="overflow-y-auto overflow-x-hidden flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"> */}
      <div className="flex-1 overflow-y-auto">

        <div className="flex flex-col overflow-y-auto h-[calc(100vh-64px)] overflow-x-hidden flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Back Button */}
                <SidebarMenuItem>
                  <MenuItemWrapper title="Back to App">
                    <SidebarMenuButton 
                      onClick={() => navigate("/dashboard")}
                      className={`
                        group flex items-center w-full text-sm rounded-lg transition-all duration-200 ease-in-out
                        ${collapsed ? "p-2 justify-center w-10 h-10 mx-auto" : "px-3 py-2.5"}
                        text-gray-600 hover:text-[#12517A] hover:bg-[#F8FBFC]
                      `}
                    >
                      <ChevronLeft className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="ml-3">Back to App</span>}
                    </SidebarMenuButton>
                  </MenuItemWrapper>
                </SidebarMenuItem>

                {!collapsed && (
                  <div className="px-3 pt-4 pb-2">
                    <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      SETTINGS
                    </SidebarGroupLabel>
                  </div>
                )}

                {/* Settings Menu Items */}
                {settingsMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <MenuItemWrapper title={item.title}>
                      <NavLink
                        to={item.url}
                        className={`
                          group flex items-center w-full text-sm rounded-lg transition-all duration-200 ease-in-out
                          ${collapsed ? "p-2 justify-center w-10 h-10 mx-auto" : "px-3 py-2.5"}
                          ${isActive(item.url) 
                            ? "bg-[#E6F1F6] text-[#12517A] font-semibold shadow-sm" 
                            : "text-gray-600 hover:text-[#12517A] hover:bg-[#F8FBFC]"
                          }
                        `}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!collapsed && <span className="ml-3 truncate">{item.title}</span>}
                      </NavLink>
                    </MenuItemWrapper>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      {/* </SidebarContent> */}
      </div>
    {/* </Sidebar> */}
    </aside>
  )
}