import { NavLink, useLocation } from "react-router-dom";
import { BarChart3, Building2, CreditCard, FileText, Settings, Users } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { getCorporateClientMode } from "./config";

export function CorporateSidebar() {
  const { state } = useSidebar();
  const { pathname } = useLocation();
  const collapsed = state === "collapsed";
  const mode = getCorporateClientMode();
  const activePath = mode === "employer" ? "/dashboard/corporate/employer" : "/dashboard/corporate/workspace";
  const activeLabel = mode === "employer" ? "Employer dashboard" : "Corporate workspace";
  const activeIcon = mode === "employer" ? Building2 : BarChart3;
  const ActiveIcon = activeIcon;
  const placeholders = mode === "employer"
    ? [{ label: "Employees", icon: Users }, { label: "Assigned program", icon: FileText }, { label: "Billing", icon: CreditCard }, { label: "Administration", icon: Settings }]
    : [{ label: "Programs", icon: FileText }, { label: "Billing", icon: CreditCard }, { label: "Reporting", icon: BarChart3 }];

  return (
    <Sidebar collapsible="icon" className="border-r">
      <div className="flex items-center justify-between p-4">
        {!collapsed && <div><p className="text-sm font-bold">WellieMD</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Corporate pilot</p></div>}
        <SidebarTrigger />
      </div>
      <SidebarContent className="px-2">
        {!collapsed && <SidebarGroupLabel>Corporate</SidebarGroupLabel>}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === activePath}>
              <NavLink to={activePath}><ActiveIcon className="h-5 w-5" />{!collapsed && <span>{activeLabel}</span>}</NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {placeholders.map(({ label, icon: Icon }) => (
            <SidebarMenuItem key={label}>
              <SidebarMenuButton disabled aria-disabled="true" title={`${label} — Day 2`} className="opacity-50">
                <Icon className="h-5 w-5" />{!collapsed && <span>{label} <span className="ml-1 text-[10px]">Day 2</span></span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
