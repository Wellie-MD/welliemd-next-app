import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { cn } from '@/components/ui/utils'; // Import cn

/**
 * Dashboard layout component that provides the main structure for authenticated pages
 * Includes header, sidebar, and main content area
 * Uses simple HTTP polling for updates (no WebSocket complexity)
 */
const DashboardLayout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Close mobile sidebar when window resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <NotificationsProvider>
      <div className="min-h-screen bg-gray-50 overflow-x-hidden">
        <Header 
          onMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          isSidebarOpen={isMobileSidebarOpen}
        />
        <div className="flex">
          <Sidebar 
            isMobileOpen={isMobileSidebarOpen}
            onMobileClose={() => setIsMobileSidebarOpen(false)}
          />
          <main className={cn(
            "flex-1 overflow-auto transition-all duration-300 pt-16 md:pt-0"
          )}>
            <div className="p-4 md:p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </NotificationsProvider>
  );
};

export default DashboardLayout;
