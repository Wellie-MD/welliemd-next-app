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

const menuItems = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Patients", url: "/patients", icon: Users },
  {
    title: "Treatments",
    icon: Stethoscope,
    children: [
      { title: "Treatments", url: "/treatments" },
      { title: "Configurations", url: "/treatments/configurations" }
    ]
  },
  {
    title: "Orders",
    icon: ShoppingBag,
    children: [
      { title: "Orders", url: "/orders" }
    ]
  },
  { title: "Prescription", url: "/prescription", icon: ScrollText },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  {
    title: "Products",
    icon: Package,
    children: [
      { title: "Products", url: "/products" },
      { title: "Billing Plans", url: "/products/billing-plans" },
      { title: "Routing", url: "/products/routing" }
    ]
  },
  {
    title: "Analytics",
    icon: TrendingUp,
    children: [
      { title: "Live View", url: "/analytics/live" },
      { title: "Reports", url: "/analytics/reports" },
      { title: "Cohorts", url: "/analytics/cohorts" }
    ]
  },
  { title: "Coupon Codes", url: "/coupon-codes", icon: Gift },
  { title: "Affiliates", url: "/affiliates", icon: CreditCard },
  {
    title: "Questionnaires",
    icon: FileText,
    children: [
      { title: "Questionnaires", url: "/questionnaires" }
    ]
  },
  { title: "Billing", url: "/billing", icon: CreditCard },
  {
    title: "Builder",
    icon: Wrench,
    children: [
      { title: "Builder", url: "/builder" }
    ]
  },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Feedback", url: "/feedback", icon: MessageCircle },
  { title: "Roadmap", url: "/roadmap", icon: MapPin }
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
    isActive ? "bg-blue-100 text-blue-600 font-medium" : "hover:bg-gray-50 text-gray-600"
  
  const collapsed = state === "collapsed"

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-60"}
      collapsible="icon"
    >
      <SidebarContent className="bg-white border-r border-gray-200">
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
                        <SidebarMenuButton className="hover:bg-gray-50 text-gray-600">
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