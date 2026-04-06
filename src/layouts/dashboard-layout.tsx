import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { NotificationsProvider } from '@/contexts/NotificationsContext';

const DashboardLayout: React.FC = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const closeMobileSidebar = useCallback(() => setIsMobileSidebarOpen(false), []);
  const toggleMobileSidebar = useCallback(() => setIsMobileSidebarOpen((prev) => !prev), []);

  useEffect(() => {
    closeMobileSidebar();
  }, [closeMobileSidebar]);

  useEffect(() => {
    const handleResize = () => {
      const nextIsMobile = window.innerWidth < 1024;
      setIsMobile(nextIsMobile);
      if (!nextIsMobile) closeMobileSidebar();
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [closeMobileSidebar]);

  return (
    <NotificationsProvider>
      <div
        style={{
          minHeight: "100vh",
          overflowX: "hidden",
          background: "var(--km-bg)",
          color: "var(--km-t)",
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        <Header
          onMenuClick={toggleMobileSidebar}
          isSidebarOpen={isMobileSidebarOpen}
          showMenuButton={isMobile}
        />

        <div style={{ display: "flex", minHeight: "calc(100vh - 60px)" }}>
          <Sidebar
            isMobile={isMobile}
            isMobileOpen={isMobileSidebarOpen}
            onMobileClose={closeMobileSidebar}
          />

          <main
            style={{
              flex: 1,
              minWidth: 0,
              marginLeft: isMobile ? 0 : 240,
              transition: "margin-left 0.3s",
            }}
          >
            {/* kinmeds3: pg padding 24px 20px → 28px 28px → 32px 36px, max-width 680→800→900 */}
            <div
              style={{
                padding: isMobile ? "24px 20px 60px" : "32px 36px 60px",
                maxWidth: isMobile ? 680 : 800,
                margin: "0 auto",
              }}
            >
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </NotificationsProvider>
  );
};

export default DashboardLayout;
