import { useState, useEffect } from "react"
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
  MapPin,        // <- used for Pharmacies
  ChevronDown,
  ChevronRight,
  Archive,
  ShieldCheck
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const menuSections = [
  {
    label: "MANAGEMENT",
    items: [
      { title: "Home", url: "/dashboard", icon: BarChart3 },
      { title: "Clients", url: "/dashboard/clients", icon: Users },
      { title: "Users & Permissions", url: "/dashboard/users-permissions", icon: ShieldCheck },
      // {
      //   title: "Treatments",
      //   icon: Stethoscope,
      //   children: [
      //     { title: "Treatments", url: "/dashboard/treatments" },
      //     { title: "Configurations", url: "/dashboard/treatments/configurations" }
      //   ]
      // },
      {
        title: "Orders",
        url: "/dashboard/orders",
        icon: ShoppingBag,
      },
      { title: "Payments", url: "/dashboard/payments", icon: CreditCard },
      { title: "Messenger", url: "/dashboard/messages", icon: MessageSquare },
      {
        title: "Analytics",
        icon: TrendingUp,
        children: [
          { title: "Client Performance", url: "/dashboard/analytics/performance" },
        ]
      },
      // { title: "Prescriptions", url: "/dashboard/prescriptions", icon: ScrollText } // --- Removed on request: https://telehealthknysys.atlassian.net/browse/KAN-3 --
    ]
  },
  {
    label: "TOOLS & SERVICES",
    items: [
      { title: "Questionnaires", url: "/dashboard/questionnaires", icon: FileText },

      // ✅ NEW: Pharmacies top-level item
      { title: "Pharmacies", url: "/dashboard/pharmacies", icon: MapPin },

      {
        title: "Products",
        icon: Package,
        children: [
          { title: "Medicine", url: "/dashboard/products" },
          { title: "Supplies", url: "/dashboard/products/supplies" },
          { title: "Labs", url: "/dashboard/products/labs" },
          { title: "Configuration", url: "/dashboard/products/config" }
        ]
      },

      {
        title: "Archive",
        icon: Archive,
        children: [
          { title: "Archive Products", url: "/dashboard/products/archive" },
          { title: "Archive Templates", url: "/dashboard/questionnaires/archive" }
        ]
      },
    ]
  },
  {
    label: "INVOICES",
    items: [
      {
        title: "Invoices",
        url: "/dashboard/billing",
        icon: CreditCard,
      },
    ],
  },

  // --- Removed "SALES & CHANNELS" on request: https://telehealthknysys.atlassian.net/browse/KAN-3 --

  //   {
  //     label: "SALES & CHANNELS", 
  //     items: [
  // {
  //         title: "Finances",
  //         icon: CreditCard,
  //         children: [
  //           { title: "Billing", url: "/dashboard/billing" },
  //         ]
  //       },
  //       // {
  //       //   title: "Discounts",
  //       //   icon: Gift,
  //       //   children: [
  //       //     { title: "Coupon Codes", url: "/dashboard/coupon-codes" },
  //       //     { title: "Insights", url: "/dashboard/coupon-insights" }
  //       //   ]
  //       // },
  //       // { title: "Affiliates", url: "/dashboard/affiliates", icon: Users }
  //     ]
  //   }
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const [openSections, setOpenSections] = useState<string[]>([])

  const collapsed = state === "collapsed"

  // Auto-open sections when a child is active
  useEffect(() => {
    const activeParents: string[] = []

    menuSections.forEach(section => {
      section.items.forEach(item => {
        if (item.children?.some(child => currentPath.startsWith(child.url))) {
          activeParents.push(item.title)
        }
      })
    })

    setOpenSections(prev => [...new Set([...prev, ...activeParents])])
  }, [currentPath])

  const toggleSection = (title: string) => {
    if (collapsed) return
    setOpenSections(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const isItemActive = (item: any) => {
    if (item.children) {
      return item.children.some((child: any) => currentPath.startsWith(child.url))
    }
    return currentPath === item.url
  }

  const MenuItemWrapper = ({ children, title, hasSubmenu = false }: { children: React.ReactNode, title: string, hasSubmenu?: boolean }) => {
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

  function SidebarLogo() {
    const { state } = useSidebar()

    if (state === "collapsed") return null

    return (
      <img
        src="/welliemd_logo.png"
        alt="Welliemd"
        className="h-8 w-auto"
      />
    )
  }

  return (
    <Sidebar collapsible="icon" className="border-r">
      <div className="flex w-full justify-between p-4">
        <SidebarLogo />
        <SidebarTrigger className="text-gray-600 hover:bg-white/50 rounded-md p-1" />
      </div>
      <SidebarContent className="overflow-y-auto overflow-x-hidden scrollbar-hide pb-4">
        {menuSections.map((section, sectionIndex) => (
          <SidebarGroup key={section.label} className={collapsed ? "mb-2" : "mb-6"}>
            {!collapsed && (
              <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {section.label}
              </SidebarGroupLabel>
            )}
            {collapsed && sectionIndex > 0 && (
              <div className="w-full h-px bg-gray-200 my-2 mx-2"></div>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {section.items.map((item) => {
                  const isActive = isItemActive(item)
                  const isOpen = !collapsed && (openSections.includes(item.title) || isActive)

                  return (
                    <SidebarMenuItem key={item.title}>
                      {item.children ? (
                        <MenuItemWrapper title={item.title} hasSubmenu>
                          <Collapsible open={isOpen} onOpenChange={() => toggleSection(item.title)}>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton
                                className={`
                                  group flex items-center w-full text-sm rounded-lg transition-all duration-200 ease-in-out
                                  ${collapsed ? "p-2 justify-center" : "px-3 py-2.5 justify-between"}
                                  ${isActive
                                    ? "bg-[#E6F1F6] text-[#12517A] font-semibold shadow-sm"
                                    : "text-gray-600 hover:text-[#12517A] hover:bg-[#F8FBFC]"
                                  }
                                `}
                              >
                                <div className="flex items-center min-w-0">
                                  <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-[#12517A]" : "text-gray-500 group-hover:text-[#12517A]"
                                    }`} />
                                  {!collapsed && (
                                    <span className="ml-3 font-medium truncate">
                                      {item.title}
                                    </span>
                                  )}
                                </div>
                                {!collapsed && (
                                  <ChevronDown
                                    className={`
                                      h-4 w-4 transition-all duration-200 ease-in-out flex-shrink-0
                                      ${isOpen ? "transform rotate-0" : "transform -rotate-90"}
                                      ${isActive ? "text-[#12517A]" : "text-gray-400 group-hover:text-[#12517A]"}
                                    `}
                                  />
                                )}
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            {!collapsed && (
                              <CollapsibleContent className="transition-all duration-300 ease-in-out">
                                <div className="ml-6 mt-2 space-y-1 border-l border-gray-200 pl-4">
                                  {item.children.map((child) => (
                                    <SidebarMenuButton key={child.title} asChild>
                                      <NavLink
                                        to={child.url}
                                        className={`
                                          flex items-center w-full px-3 py-2 text-sm rounded-md transition-all duration-150 ease-in-out
                                          ${currentPath === child.url
                                            ? "bg-[#E6F1F6] text-[#12517A] font-semibold shadow-sm border-l-2 border-[#12517A] -ml-[1px]"
                                            : "text-gray-600 hover:text-[#12517A] hover:bg-[#F8FBFC]"
                                          }
                                        `}
                                      >
                                        <span className="text-sm">{child.title}</span>
                                      </NavLink>
                                    </SidebarMenuButton>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            )}
                          </Collapsible>
                        </MenuItemWrapper>
                      ) : (
                        <MenuItemWrapper title={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              end
                              className={`
                                group flex items-center w-full text-sm rounded-lg transition-all duration-200 ease-in-out
                                ${collapsed ? "p-2 justify-center" : "px-3 py-2.5"}
                                ${currentPath === item.url
                                  ? "bg-[#E6F1F6] text-[#12517A] font-semibold shadow-sm"
                                  : "text-gray-600 hover:text-[#12517A] hover:bg-[#F8FBFC]"
                                }
                              `}
                            >
                              <item.icon
                                className={`h-5 w-5 flex-shrink-0 ${currentPath === item.url
                                  ? "text-[#12517A]"
                                  : "text-gray-500 group-hover:text-[#12517A]"
                                  }`}
                              />
                              {!collapsed && (
                                <span className="ml-3 font-medium truncate">
                                  {item.title}
                                </span>
                              )}
                            </NavLink>
                          </SidebarMenuButton>
                        </MenuItemWrapper>
                      )}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
