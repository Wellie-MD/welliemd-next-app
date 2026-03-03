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
  { icon: Pill, label: "Prescriptions", path: "/dashboard/prescriptions" },
  { icon: Package, label: "Orders", path: "/dashboard/orders" },
  { icon: TestTube, label: "Treatments", path: "/dashboard/treatments" },
  { icon: MessageSquare, label: "Messages", path: "/dashboard/messages" },
  { icon: BookOpen, label: "Resources", path: "/dashboard/blog" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
  { icon: HelpCircle, label: "Help", path: "/dashboard/help" },
];

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  // Close mobile sidebar when route changes
  useEffect(() => {
    onMobileClose();
  }, [location.pathname]);

  const NavItem = ({ item }: { item: NavigationItem }) => {
    const Icon = item.icon;
    
    // Improved active logic: sirf current page highlight ho
    const isActive = location.pathname === item.path ||
                     (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

    // On mobile, always show full size. On desktop, respect collapsed state
    const shouldShowCollapsed = isCollapsed && !isMobileOpen;

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
              "flex items-center w-full text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md text-sm font-medium transition-colors duration-200",
              shouldShowCollapsed ? "justify-center px-3 py-3" : "justify-start px-3 py-2",
              isActive && "bg-blue-50"
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
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
            {item.label}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1 w-0 h-0 border-r-4 border-r-gray-900 border-t-2 border-b-2 border-t-transparent border-b-transparent"></div>
          </div>
        )}
      </li>
    );
  };

  const mainItems = navigationItems;

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}

     
      <div 
        className={cn(
          "bg-white border-r border-gray-200 flex flex-col z-50 transition-all duration-300 ease-in-out min-h-screen",

          // Mobile drawer behavior
            isMobileOpen ? "fixed inset-y-0 left-0 w-64 translate-x-0 " : "inset-y-0 left-0 w-64 -translate-x-full md:static md:translate-x-0 sidebar",
            isCollapsed && !isMobileOpen ? "w-16" : "w-64",
          // Desktop collapse only
          !isMobileOpen && isCollapsed 
            ? "md:w-16" 
            : "md:w-64"
        )}
      >
        {/* Mobile header for sidebar */}
        <div className={cn(
          "p-4 flex items-center",
          isCollapsed && !isMobileOpen ? "justify-center" : "justify-between"
        )}>
          {(!isCollapsed || isMobileOpen) && (
            <p className="text-sm text-gray-500 uppercase tracking-wide">MENU</p>
          )}
          
          {/* Close button for mobile, collapse/expand for desktop */}
          <div className="flex items-center">
            {isMobileOpen ? (
              <button
                onClick={onMobileClose}
                className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            ) : (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(
                  "p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200",
                  isCollapsed && !isMobileOpen ? "flex justify-center" : "block",
                  "hidden md:flex"
                )}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRight size={20} />
                ) : (
                  <ChevronLeft size={20} />
                )}
              </button>
            )}
          </div>
        </div>
        
        <nav className="flex-1 px-4">
          <ul className="space-y-1">
            {mainItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </ul>
        </nav>
        
        {/* <div className="p-4 border-t border-gray-200">
          <ul className="space-y-1">
            {bottomItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </ul>
        </div> */}
      </div>
    </>
  );
}