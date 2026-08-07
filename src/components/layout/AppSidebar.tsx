import { useState, useEffect } from "react"
import { NavLink, useLocation } from "react-router-dom"
import type { LucideIcon } from "lucide-react"
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
  ShieldCheck,
  Activity,      // <- used for Sense insights
  Building2,
} from "lucide-react"
import { isCorporatePlatformPreview } from "@/features/corporate/config"

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

type MenuChild = {
  title: string
  url: string
}

type MenuItem = {
  title: string
  url?: string
  icon: LucideIcon
  children?: MenuChild[]
}

type MenuSection = {
  label: string
  items: MenuItem[]
}

  ...(isCorporatePlatformPreview ? [{
    label: "CORPORATE",
    items: [
      { title: "Corporate", url: "/dashboard/corporate", icon: Building2 },
    ],
  }] : []),
  {
    label: "MANAGEMENT",
    items: [
      { title: "Home", url: "/dashboard", icon: BarChart3 },
      { title: "Clients", url: "/dashboard/clients", icon: Users },
      { title: "Patients", url: "/dashboard/patients", icon: Users },
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
        icon: ShoppingBag,
        children: [
          { title: "Rx Orders", url: "/dashboard/orders" },
          { title: "Lab Orders", url: "/dashboard/orders/labs" },
        ],
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
      {
        title: "Treatments",
        icon: Stethoscope,
        children: [
          { title: "Custom Programs", url: "/dashboard/treatments/custom-programs" },
          { title: "Programs", url: "/dashboard/treatments/programs" },
          { title: "Sections", url: "/dashboard/treatments/sections" },
          { title: "Consents", url: "/dashboard/treatments/consents" },
          { title: "Treatment Types", url: "/dashboard/treatments/treatment-types" },
        ]
      },
      { title: "Questionnaires", url: "/dashboard/questionnaires", icon: FileText },

      {
        title: "Pharmacies",
        icon: MapPin,
        children: [
          { title: "Pharmacies", url: "/dashboard/pharmacies" },
          { title: "Find Beluga Pharmacies", url: "/dashboard/pharmacies/beluga-lookup" },
        ]
      },

      
      {
        title: "Products",
        icon: Package,
        children: [
          { title: "Medicine", url: "/dashboard/products" },
          { title: "Supplies", url: "/dashboard/products/supplies" },
          { title: "Labs", url: "/dashboard/products/labs" },
          { title: "Test Catalog", url: "/dashboard/products/labs/catalog" },
          { title: "Junction Settings", url: "/dashboard/products/labs/settings" },
          { title: "Configuration", url: "/dashboard/products/config" }
        ]
      },
      
      {
        title: "Archive",
        icon: Archive,
        children: [
          { title: "Archive", url: "/dashboard/archive" },
          { title: "Archive Products", url: "/dashboard/products/archive" },
          { title: "Archive Templates", url: "/dashboard/questionnaires/archive" },
        ],
      },
      { title: "Sense", url: "/dashboard/tools/sense", icon: Activity },
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

type SidebarChildItem = {
  title: string;
  url: string;
};

type SidebarItem = {
  title: string;
  url?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: SidebarChildItem[];
};

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

  const isItemActive = (item: SidebarItem) => {
    if (item.children) {
      return item.children.some((child) => currentPath.startsWith(child.url))
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
        src="/welliemd_dark_logo_transparent.png"
        alt="Welliemd"
        className="h-7 w-auto"
      />
    )
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-white/[0.06]">
      <div className="flex w-full justify-between border-b border-white/[0.06] px-5 pb-3.5 pt-[18px]">
        <SidebarLogo />
        <SidebarTrigger className="rounded-md p-1 text-slate-400 hover:bg-white/5 hover:text-slate-200" />
      </div>
      <SidebarContent className="overflow-y-auto overflow-x-hidden scrollbar-hide pb-4">
        {menuSections.map((section, sectionIndex) => (
          <SidebarGroup key={section.label} className={collapsed ? "mb-2" : "mb-6"}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.08em]">
                {section.label}
              </SidebarGroupLabel>
            )}
            {collapsed && sectionIndex > 0 && (
              <div className="w-full h-px bg-white/[0.08] my-2 mx-2"></div>
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
                                  group flex w-full text-sm rounded-lg transition-all duration-200 ease-in-out
                                  ${collapsed ? "items-center p-2 justify-center" : "h-auto min-h-10 items-start overflow-visible px-3 py-2.5 justify-between"}
                                  ${isActive
                                    ? "bg-blue-600/[0.18] text-blue-400 font-semibold"
                                    : "text-slate-400 hover:text-slate-300 hover:bg-white/5"
                                  }
                                `}
                              >
                                <div className="flex items-center min-w-0">
                                  <item.icon className={`h-[15px] w-[15px] flex-shrink-0 ${isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-300"
                                    }`} />
                                  {!collapsed && (
                                    <span className="ml-3 min-w-0 whitespace-normal break-words font-medium leading-tight">
                                      {item.title}
                                    </span>
                                  )}
                                </div>
                                {!collapsed && (
                                  <ChevronDown
                                    className={`
                                      h-4 w-4 transition-all duration-200 ease-in-out flex-shrink-0
                                      ${isOpen ? "transform rotate-0" : "transform -rotate-90"}
                                      ${isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"}
                                    `}
                                  />
                                )}
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            {!collapsed && (
                              <CollapsibleContent className="transition-all duration-300 ease-in-out">
                                <div className="ml-6 mt-2 space-y-1 border-l border-white/[0.08] pl-4">
                                  {item.children.map((child) => (
                                    <SidebarMenuButton key={child.title} asChild>
                                      <NavLink
                                        to={child.url}
                                        className={`
                                          flex items-center w-full px-3 py-2 text-sm rounded-md transition-all duration-150 ease-in-out
                                          ${currentPath === child.url || currentPath.startsWith(`${child.url}/`)
                                            ? "bg-blue-600/[0.18] text-blue-400 font-semibold"
                                            : "text-slate-400 hover:text-slate-300 hover:bg-white/5"
                                          }
                                        `}
                                      >
                                        <span className="min-w-0 whitespace-normal break-words text-sm leading-tight">{child.title}</span>
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
                                group flex w-full text-sm rounded-lg transition-all duration-200 ease-in-out
                                ${collapsed ? "items-center p-2 justify-center" : "h-auto min-h-10 items-start overflow-visible px-3 py-2.5"}
                                ${currentPath === item.url
                                  ? "bg-blue-600/[0.18] text-blue-400 font-semibold"
                                  : "text-slate-400 hover:text-slate-300 hover:bg-white/5"
                                }
                              `}
                            >
                              <item.icon
                                className={`h-5 w-5 flex-shrink-0 ${currentPath === item.url
                                  ? "text-blue-400"
                                  : "text-slate-400 group-hover:text-slate-300"
                                  }`}
                              />
                              {!collapsed && (
                                <span className="ml-3 min-w-0 whitespace-normal break-words font-medium leading-tight">
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
