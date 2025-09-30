import { useState, useEffect, Fragment, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
  Settings,
  MessageCircle,
  MapPin,
  ChevronDown,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = { unseenCount?: number };

const menuSections = [
  {
    label: "MANAGEMENT",
    items: [
      { title: "Home", url: "/dashboard", icon: BarChart3 },
      { title: "Patients", url: "/dashboard/patients", icon: Users },
      {
        title: "Treatments",
        icon: Stethoscope,
        children: [
          { title: "Treatments", url: "/dashboard/treatments" },
          { title: "Configurations", url: "/dashboard/treatments/configurations" },
        ],
      },
      {
        title: "Orders",
        icon: ShoppingBag,
        children: [
          { title: "Orders", url: "/dashboard/orders" },
          { title: "Payments", url: "/dashboard/orders/payments" },
          { title: "Disputes", url: "/dashboard/orders/disputes" },
          { title: "Resolution Queue", url: "/dashboard/orders/resolution-queue" },
        ],
      },
      { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
      {
        title: "Analytics",
        icon: TrendingUp,
        children: [
          { title: "Live View", url: "/dashboard/analytics/live" },
          { title: "Reports", url: "/dashboard/analytics/reports" },
          { title: "Cohorts", url: "/dashboard/analytics/cohorts" },
        ],
      },
      { title: "Prescriptions", url: "/dashboard/prescriptions", icon: ScrollText },
    ],
  },
  {
    label: "TOOLS & SERVICES",
    items: [
      { title: "Questionnaires", url: "/dashboard/questionnaires", icon: FileText },
      {
        title: "Products",
        icon: Package,
        children: [
          { title: "Products", url: "/dashboard/products" },
          { title: "Billing Plans", url: "/dashboard/products/billing-plans" },
          { title: "Routing", url: "/dashboard/products/routing" },
        ],
      },
    ],
  },
  {
    label: "SALES & CHANNELS",
    items: [
      {
        title: "Finances",
        icon: CreditCard,
        children: [
          { title: "Billing", url: "/dashboard/billing" },
          { title: "Invoices", url: "/dashboard/finances/invoices" },
        ],
      },
      {
        title: "Discounts",
        icon: Gift,
        children: [
          { title: "Coupon Codes", url: "/dashboard/coupon-codes" },
          { title: "Insights", url: "/dashboard/coupon-insights" },
        ],
      },
      { title: "Affiliates", url: "/dashboard/affiliates", icon: Users },
    ],
  },
  {
    label: "SUPPORT & CONFIG",
    items: [
      { title: "Settings", url: "/dashboard/settings", icon: Settings },
      { title: "Feedback", url: "/dashboard/feedback", icon: MessageCircle },
      { title: "Roadmap", url: "/dashboard/roadmap", icon: MapPin },
    ],
  },
];

export function AppSidebar({ unseenCount = 0 }: Props) {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const [openSections, setOpenSections] = useState<string[]>([]);
  const collapsed = state === "collapsed";

  // Auto-open sections when a child is active
  useEffect(() => {
    const activeParents: string[] = [];
    menuSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children?.some((child) => currentPath.startsWith(child.url))) {
          activeParents.push(item.title);
        }
      });
    });
    setOpenSections((prev) => [...new Set([...prev, ...activeParents])]);
  }, [currentPath]);

  const toggleSection = (title: string) => {
    if (collapsed) return;
    setOpenSections((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    );
  };

  const isItemActive = (item: any) => {
    if (item.children) {
      return item.children.some((child: any) => currentPath.startsWith(child.url));
    }
    return currentPath === item.url;
  };

  // Wrapper with tooltip when collapsed
  const MenuItemWrapper = ({
    children,
    title,
  }: {
    children: ReactNode;
    title: string;
  }) => {
    if (collapsed) {
      return (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {title}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return <>{children}</>;
  };

  return (
    <Sidebar collapsible="icon" className="border-r flex flex-col h-full overflow-hidden">
      <SidebarContent className="overflow-y-auto overflow-x-hidden flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex flex-col h-full">
          {menuSections.map((section, sectionIndex) => (
            <Fragment key={section.label}>
              {!collapsed && (
                <div className="px-3 pt-4 pb-2 first:pt-2">
                  <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {section.label}
                  </SidebarGroupLabel>
                </div>
              )}

              {collapsed && sectionIndex > 0 && (
                <div className="w-full h-px bg-gray-200 mx-2 my-1"></div>
              )}

              <SidebarGroup className={!collapsed ? "px-1" : "px-0 flex items-center"}>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = isItemActive(item);
                      const isOpen = !collapsed && (openSections.includes(item.title) || isActive);

                      return (
                        <SidebarMenuItem key={item.title}>
                          {item.children ? (
                            <MenuItemWrapper title={item.title}>
                              <Collapsible
                                open={isOpen}
                                onOpenChange={() => toggleSection(item.title)}
                              >
                                <CollapsibleTrigger asChild>
                                  <SidebarMenuButton
                                    className={`
                                      group flex items-center w-full text-sm rounded-lg transition-all duration-200 ease-in-out
                                      ${collapsed ? "p-2 justify-center w-10 h-10 mx-auto" : "px-3 py-2.5 justify-between"}
                                      ${isActive
                                        ? "bg-[#E6F1F6] text-[#12517A] font-semibold shadow-sm"
                                        : "text-gray-600 hover:text-[#12517A] hover:bg-[#F8FBFC]"
                                      }
                                    `}
                                  >
                                    <div className="flex items-center min-w-0">
                                      <item.icon
                                        className={`h-5 w-5 flex-shrink-0 ${
                                          isActive ? "text-[#12517A]" : "text-gray-500 group-hover:text-[#12517A]"
                                        }`}
                                      />
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
                                          ${isOpen ? "rotate-0" : "-rotate-90"}
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
                                    ${collapsed ? "p-2 justify-center w-10 h-10 mx-auto relative" : "px-3 py-2.5"}
                                    ${currentPath === item.url
                                      ? "bg-[#E6F1F6] text-[#12517A] font-semibold shadow-sm"
                                      : "text-gray-600 hover:text-[#12517A] hover:bg-[#F8FBFC]"
                                    }
                                  `}
                                >
                                  {/* icon wrapper lets us overlay a dot when collapsed */}
                                  <div className={`relative ${collapsed ? "" : "mr-3"}`}>
                                    <item.icon
                                      className={`h-5 w-5 flex-shrink-0 ${
                                        currentPath === item.url
                                          ? "text-[#12517A]"
                                          : "text-gray-500 group-hover:text-[#12517A]"
                                      }`}
                                    />
                                    {/* tiny dot when collapsed */}
                                    {item.title === "Messages" && unseenCount > 0 && collapsed && (
                                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                                    )}
                                  </div>

                                  {!collapsed && (
                                    <>
                                      <span className="font-medium truncate">{item.title}</span>
                                      {/* red count pill when expanded */}
                                      {item.title === "Messages" && unseenCount > 0 && (
                                        <span className="ml-auto inline-flex items-center justify-center min-w-[1.25rem] px-1.5 h-5 text-[10px] rounded-full bg-red-500 text-white">
                                          {unseenCount > 99 ? "99+" : unseenCount}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </NavLink>
                              </SidebarMenuButton>
                            </MenuItemWrapper>
                          )}
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </Fragment>
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
