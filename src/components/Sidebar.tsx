import { useState, CSSProperties, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  MessageSquare,
  User,
  FileText,
  Pill,
  TestTube,
  FlaskConical,
  HelpCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Package,
  LucideIcon,
  X,
  BookOpen,
} from "lucide-react";
import { cn } from "./ui/utils";

interface NavigationItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

const navigationItems: NavigationItem[] = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: User, label: "Profile", path: "/dashboard/profile" },
  { icon: Calendar, label: "Appointments", path: "/dashboard/appointments" },
  { icon: FileText, label: "Medical Records", path: "/dashboard/medical-records" },
  { icon: FlaskConical, label: "Labs", path: "/dashboard/labs" },
  { icon: Pill, label: "Prescriptions", path: "/dashboard/prescriptions" },
  { icon: Package, label: "Orders", path: "/dashboard/orders" },
  { icon: TestTube, label: "Treatments", path: "/dashboard/treatments" },
  { icon: MessageSquare, label: "Messages", path: "/dashboard/messages" },
  { icon: BookOpen, label: "Resources", path: "/dashboard/blog" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
  { icon: HelpCircle, label: "Help", path: "/dashboard/help" },
];

interface SidebarProps {
  isMobile: boolean;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ isMobile, isMobileOpen, onMobileClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  // Close mobile sidebar when route changes
  useEffect(() => {
    onMobileClose();
  }, [location.pathname, onMobileClose]);

  const NavItem = ({ item }: { item: NavigationItem }) => {
    const Icon = item.icon;

    // Improved active logic: sirf current page highlight ho
    const isActive = location.pathname === item.path ||
      (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

    // On mobile, always show full size. On desktop, respect collapsed state
    const shouldShowCollapsed = isCollapsed && !isMobile;

    const iconStyle: CSSProperties = {
      minWidth: shouldShowCollapsed ? '24px' : '18px',
      minHeight: shouldShowCollapsed ? '24px' : '18px',
      width: shouldShowCollapsed ? '24px' : '18px',
      height: shouldShowCollapsed ? '24px' : '18px',
      ...(isActive && { color: 'var(--brand-primary)' })
    };

    const linkStyle: CSSProperties | undefined = isActive ? { color: 'var(--brand-primary)' } : undefined;

    return (
      <li className="relative group">
        <NavLink
          to={item.path}
          end={item.path === '/dashboard'}
          className={() =>
            cn(
              "flex items-center w-full text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-md text-sm font-medium transition-colors duration-200",
              shouldShowCollapsed ? "justify-center px-3 py-3" : "justify-start px-3 py-2",
              isActive && "bg-blue-50 dark:bg-slate-800"
            )
          }
          {...(linkStyle && { style: linkStyle })}
        >
          <Icon
            size={shouldShowCollapsed ? 24 : 18}
            className={cn("flex-none", !shouldShowCollapsed && "mr-3")}
            style={iconStyle}
          />
          {!shouldShowCollapsed && <span className="truncate">{item.label}</span>}
        </NavLink>

        {shouldShowCollapsed && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-gray-900 dark:bg-slate-700 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
            {item.label}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1 w-0 h-0 border-r-4 border-r-gray-900 dark:border-r-slate-700 border-t-2 border-b-2 border-t-transparent border-b-transparent"></div>
          </div>
        )}
      </li>
    );
  };

  const mainItems = navigationItems;

  const shouldShowCollapsed = isCollapsed && !isMobile;

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      {isMobile && isMobileOpen && (
        <div className="fixed inset-y-0 left-0 w-64 bg-background border-r border-border flex flex-col z-50 min-h-screen">
          <div className="p-4 flex items-center justify-between bg-background border-r border-border">
            <p className="text-sm text-gray-500 dark:text-slate-400 uppercase tracking-wide">MENU</p>
            <button
              onClick={onMobileClose}
              className="p-1.5 rounded-md text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors duration-200"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4">
            <ul className="space-y-1">
              {mainItems.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </ul>
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div
          className={cn(
            "bg-background border-r border-border flex flex-col z-30 transition-all duration-300 ease-in-out min-h-screen",
            shouldShowCollapsed ? "w-16" : "w-64"
          )}
        >
          <div className={cn(
            "p-4 flex items-center",
            shouldShowCollapsed ? "justify-center" : "justify-between"
          )}>
            {!shouldShowCollapsed && (
              <p className="text-sm text-gray-500 dark:text-slate-400 uppercase tracking-wide">MENU</p>
            )}

            <div className="flex items-center">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(
                  "p-1.5 rounded-md text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors duration-200",
                  shouldShowCollapsed ? "flex justify-center" : "block"
                )}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRight size={20} />
                ) : (
                  <ChevronLeft size={20} />
                )}
              </button>
            </div>
          </div>

          <nav className="flex-1 px-4">
            <ul className="space-y-1">
              {mainItems.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
