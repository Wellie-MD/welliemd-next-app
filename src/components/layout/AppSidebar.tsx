import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
  BarChart3,
  Users,
  Stethoscope,
  ShoppingBag,
  ScrollText,
  MessageSquare,
  Package,
  TrendingUp,
  Gift,
  FileText,
  CreditCard,
  Wrench,
  Settings,
  MessageCircle,
  MapPin,
  ChevronDown,
  ChevronRight
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { title } from "process"

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
  { title: "Clients", url: "/dashboard/clients", icon: Users },
  {
    title: "Treatments",
    icon: Stethoscope,
    children: [
      { title: "Treatments", url: "/dashboard/treatments" },
      { title: "Configurations", url: "/dashboard/treatments/configurations" }
    ]
  },
  {
    title: "Orders",
    icon: ShoppingBag,
    children: [
      { title: "Orders", url: "/dashboard/orders" },
      { title: "Payments", url: "/dashboard/orders/payments" },
      { title: "Disputes", url: "/dashboard/orders/disputes" },
      { title: "Resolution Queue", url: "/dashboard/orders/resolution-queue" }
    ]
  },
  { title: "Prescription", url: "/dashboard/prescriptions", icon: ScrollText },
  { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
  {
    title: "Products",
    icon: Package,
    children: [
      { title: "Products", url: "/dashboard/products" },
      { title: "Billing Plans", url: "/dashboard/products/billing-plans" },
      { title: "Routing", url: "/dashboard/products/routing" }
    ]
  },
  // {
  //   title: "Analytics",
  //   icon: TrendingUp,
  //   children: [
  //     { title: "Live View", url: "/dashboard/analytics/live" },
  //     { title: "Reports", url: "/dashboard/analytics/reports" },
  //     { title: "Cohorts", url: "/dashboard/analytics/cohorts" }
  //   ]
  // },
  {
    title: "Coupon Codes",
    icon: Gift,
    children: [
      { title: "Codes", url: "/dashboard/coupon-codes" },
      { title: "Insights", url: "/dashboard/coupon-insights" }
    ]
  },
  // { title: "Affiliates", url: "/dashboard/affiliates", icon: CreditCard },
  {
    title: "Questionnaires",
    icon: FileText,
    children: [
      { title: "Questionnaires", url: "/dashboard/questionnaires" }
    ]
  },
  { title: "Billing", url: "/dashboard/billing", icon: CreditCard },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
  { title: "Feedback", url: "/dashboard/feedback", icon: MessageCircle },
  { title: "Roadmap", url: "/dashboard/roadmap", icon: MapPin }
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname

  const [openSections, setOpenSections] = useState<string[]>([])

  const toggleSection = (title: string) => {
    setOpenSections(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const isActive = (path: string) => currentPath === path
const getNavCls = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? "bg-[#E6F1F6] text-[#12517A] font-semibold"  // Active state
    : "text-black hover:text-[#12517A] hover:bg-muted/50" // Hover state

  const collapsed = state === "collapsed"

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-60"}
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.children ? (
                    <Collapsible
                      open={openSections.includes(item.title)}
                      onOpenChange={() => toggleSection(item.title)}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="hover:bg-muted/50">
                          <item.icon className="mr-2 h-4 w-4" />
                          {!collapsed && (
                            <>
                              <span>{item.title}</span>
                              {openSections.includes(item.title) ? 
                                <ChevronDown className="ml-auto h-4 w-4" /> : 
                                <ChevronRight className="ml-auto h-4 w-4" />
                              }
                            </>
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {!collapsed && (
                        <CollapsibleContent>
                          <div className="ml-6 mt-1 space-y-1">
                            {item.children.map((child) => (
                              <SidebarMenuButton key={child.title} asChild>
                                <NavLink to={child.url} className={getNavCls}>
                                  <span className="text-sm">{child.title}</span>
                                </NavLink>
                              </SidebarMenuButton>
                            ))}
                          </div>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end className={getNavCls}>
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}