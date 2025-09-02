import React from 'react';
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
  Users,
  BarChart3,
  Shield,
  Settings,
} from "lucide-react";
import { cn } from "./ui/utils";
import { useAuth, usePermissions } from "@/features/auth";
import { UserRole, PERMISSIONS } from "@/features/auth/types/auth.types";

interface NavigationItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  requiredPermissions?: string[];
  allowedRoles?: UserRole[];
}

const getNavigationItems = (userRole?: UserRole): NavigationItem[] => {
  const baseItems: NavigationItem[] = [
    { 
      icon: Home, 
      label: "Dashboard", 
      path: "/dashboard",
    },
    { 
      icon: User, 
      label: "Profile", 
      path: "/dashboard/profile",
    },
  ];

  const patientItems: NavigationItem[] = [
    { 
      icon: Calendar, 
      label: "Appointments", 
      path: "/dashboard/appointments",
      requiredPermissions: [PERMISSIONS.PATIENT_VIEW_APPOINTMENTS],
      allowedRoles: [UserRole.PATIENT, UserRole.PROVIDER, UserRole.ADMIN],
    },
    { 
      icon: FileText, 
      label: "Medical Records", 
      path: "/dashboard/medical-records",
      requiredPermissions: [PERMISSIONS.PATIENT_VIEW_MEDICAL_RECORDS],
      allowedRoles: [UserRole.PATIENT, UserRole.PROVIDER, UserRole.ADMIN],
    },
    { 
      icon: Pill, 
      label: "Prescriptions", 
      path: "/dashboard/prescriptions",
      requiredPermissions: [PERMISSIONS.PATIENT_VIEW_PRESCRIPTIONS],
      allowedRoles: [UserRole.PATIENT, UserRole.PROVIDER, UserRole.ADMIN],
    },
    { 
      icon: TestTube, 
      label: "Treatments", 
      path: "/dashboard/treatments",
      requiredPermissions: [PERMISSIONS.PATIENT_VIEW_MEDICAL_RECORDS],
      allowedRoles: [UserRole.PATIENT, UserRole.PROVIDER, UserRole.ADMIN],
    },
    { 
      icon: MessageSquare, 
      label: "Messages", 
      path: "/dashboard/messages",
      requiredPermissions: [PERMISSIONS.PATIENT_SEND_MESSAGES],
      allowedRoles: [UserRole.PATIENT, UserRole.PROVIDER, UserRole.ADMIN],
    },
  ];

  const providerItems: NavigationItem[] = [
    { 
      icon: Users, 
      label: "Patients", 
      path: "/dashboard/patients",
      requiredPermissions: [PERMISSIONS.PROVIDER_VIEW_PATIENTS],
      allowedRoles: [UserRole.PROVIDER, UserRole.ADMIN],
    },
    { 
      icon: BarChart3, 
      label: "Analytics", 
      path: "/dashboard/analytics",
      requiredPermissions: [PERMISSIONS.PROVIDER_VIEW_ANALYTICS],
      allowedRoles: [UserRole.PROVIDER, UserRole.ADMIN],
    },
  ];

  const adminItems: NavigationItem[] = [
    { 
      icon: Shield, 
      label: "Admin Panel", 
      path: "/dashboard/admin",
      requiredPermissions: [PERMISSIONS.ADMIN_MANAGE_USERS],
      allowedRoles: [UserRole.ADMIN],
    },
  ];

  const bottomItems: NavigationItem[] = [
    { 
      icon: Settings, 
      label: "Settings", 
      path: "/dashboard/settings",
    },
    { 
      icon: HelpCircle, 
      label: "Help", 
      path: "/dashboard/help",
    },
  ];

  let allItems = [...baseItems];

  // Add role-specific items
  if (userRole === UserRole.PATIENT || userRole === UserRole.PROVIDER || userRole === UserRole.ADMIN) {
    allItems = [...allItems, ...patientItems];
  }
  
  if (userRole === UserRole.PROVIDER || userRole === UserRole.ADMIN) {
    allItems = [...allItems, ...providerItems];
  }
  
  if (userRole === UserRole.ADMIN) {
    allItems = [...allItems, ...adminItems];
  }

  return [...allItems, ...bottomItems];
};

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { hasPermission, hasAnyPermission } = usePermissions();

  const navigationItems = getNavigationItems(user?.role);

  const isItemVisible = (item: NavigationItem): boolean => {
    // If no permissions required, show item
    if (!item.requiredPermissions && !item.allowedRoles) {
      return true;
    }

    // Check role-based access
    if (item.allowedRoles && user?.role && !item.allowedRoles.includes(user.role)) {
      return false;
    }

    // Check permission-based access
    if (item.requiredPermissions && !hasAnyPermission(item.requiredPermissions as any[])) {
      return false;
    }

    return true;
  };

  const NavItem = ({ item }: { item: NavigationItem }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || 
      (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
    
    if (!isItemVisible(item)) {
      return null;
    }

    return (
      <li>
        <NavLink
          to={item.path}
          className={({ isActive: linkIsActive }) =>
            cn(
              "flex items-center w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              (isActive || linkIsActive) && "text-blue-600 bg-blue-50"
            )
          }
        >
          <Icon className="h-4 w-4 mr-3" />
          <span>{item.label}</span>
        </NavLink>
      </li>
    );
  };

  // Split items into main navigation and bottom items
  const mainItems = navigationItems.slice(0, -2); // All except settings and help
  const bottomItems = navigationItems.slice(-2); // Settings and help

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-4">
        <p className="text-sm text-gray-500 uppercase tracking-wide">MENU</p>
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