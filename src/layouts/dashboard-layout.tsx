import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { NotificationsProvider } from '@/contexts/NotificationsContext';

/**
 * Dashboard layout component that provides the main structure for authenticated pages
 * Includes header, sidebar, and main content area
 * Uses simple HTTP polling for updates (no WebSocket complexity)
 */
const DashboardLayout: React.FC = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const closeMobileSidebar = useCallback(() => setIsMobileSidebarOpen(false), []);
  const toggleMobileSidebar = useCallback(() => setIsMobileSidebarOpen((prev) => !prev), []);

  // Ensure drawer never sticks open as a default state on mount.
  useEffect(() => {
    closeMobileSidebar();
  }, [closeMobileSidebar]);

  // Keep an explicit mobile/desktop mode and close drawer when switching to desktop.
  useEffect(() => {
    const handleResize = () => {
      const nextIsMobile = window.innerWidth < 768;
      setIsMobile(nextIsMobile);
      if (!nextIsMobile) {
        closeMobileSidebar();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [closeMobileSidebar]);

  return (
    <NotificationsProvider>
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Header 
          onMenuClick={toggleMobileSidebar}
          isSidebarOpen={isMobileSidebarOpen}
          showMenuButton={isMobile}
        />
        <div className="flex">
          <Sidebar 
            isMobile={isMobile}
            isMobileOpen={isMobileSidebarOpen}
            onMobileClose={closeMobileSidebar}
          />
          <main className="flex-1 overflow-auto transition-all duration-300 pt-16 md:pt-0">
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
