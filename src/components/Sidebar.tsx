import { useState, CSSProperties } from 'react';
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
  // BookOpen, // Unused - Resources page disabled
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
  // { icon: BookOpen, label: "Resources", path: "/dashboard/blog" }, // Hidden - Resources page disabled
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
  { icon: HelpCircle, label: "Help", path: "/dashboard/help" },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const NavItem = ({ item }: { item: NavigationItem }) => {
    const Icon = item.icon;
    
    const isActive = item.path === '/dashboard' 
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(item.path);

    const iconStyle: CSSProperties = {
      minWidth: isCollapsed ? '24px' : '18px',
      minHeight: isCollapsed ? '24px' : '18px',
      width: isCollapsed ? '24px' : '18px',
      height: isCollapsed ? '24px' : '18px',
      ...(isActive && { color: 'var(--brand-primary)' })
    };

    const linkStyle: CSSProperties | undefined = isActive ? { color: 'var(--brand-primary)' } : undefined;

    return (
      <li className="relative group">
        <NavLink
          to={item.path}
          className={() =>
            cn(
              "flex items-center w-full text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md text-sm font-medium transition-colors duration-200",
              isCollapsed ? "justify-center px-3 py-3" : "justify-start px-3 py-2",
              isActive && "bg-blue-50"
            )
          }
          {...(linkStyle && { style: linkStyle })}
        >
          <Icon 
            size={isCollapsed ? 24 : 18}
            className={cn("flex-none", !isCollapsed && "mr-3")}
            style={iconStyle}
          />
          {!isCollapsed && <span className="truncate">{item.label}</span>}
        </NavLink>

        {isCollapsed && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
            {item.label}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1 w-0 h-0 border-r-4 border-r-gray-900 border-t-2 border-b-2 border-t-transparent border-b-transparent"></div>
          </div>
        )}
      </li>
    );
  };

  const mainItems = navigationItems.slice(0, -2);
  const bottomItems = navigationItems.slice(-2);

  return (
    <div 
      className={cn(
        "bg-white border-r border-gray-200 min-h-screen flex flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn("p-4 flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
        {!isCollapsed && (
          <p className="text-sm text-gray-500 uppercase tracking-wide">MENU</p>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200",
            isCollapsed && "w-full flex justify-center"
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
      
      <nav className="flex-1 px-4">
        <ul className="space-y-1">
          {mainItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <ul className="space-y-1">
          {bottomItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </ul>
      </div>
    </div>
  );
}