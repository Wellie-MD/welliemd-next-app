import { useState, useEffect, useCallback, type FC } from 'react';

import { Outlet, useLocation } from 'react-router-dom';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { NotificationsProvider } from '@/contexts/NotificationsContext';

const DashboardLayout: FC = () => {
  const location = useLocation();
  const isMessagesPage = location.pathname.includes('/messages');
  const isExplorePage = location.pathname === '/dashboard/explore';
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const closeMobileSidebar = useCallback(() => setIsMobileSidebarOpen(false), []);
  const toggleMobileSidebar = useCallback(() => setIsMobileSidebarOpen((prev) => !prev), []);

  useEffect(() => {
    closeMobileSidebar();
  }, [closeMobileSidebar]);

  useEffect(() => {
    const setViewportVar = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--app-vh', `${vh}px`);
    };

    setViewportVar();

    const handleResize = () => {
      const nextIsMobile = window.innerWidth < 1024;
      setIsMobile(nextIsMobile);
      setViewportVar();
      if (!nextIsMobile) closeMobileSidebar();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [closeMobileSidebar]);

  return (
    <NotificationsProvider>
      <div
        style={{
          minHeight: "calc(var(--app-vh, 1vh) * 100)",
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
          isMobile={isMobile}
        />

        <div style={{ display: "flex", minHeight: "calc((var(--app-vh, 1vh) * 100) - 60px)", paddingTop: 60 }}>
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
              className={isMessagesPage ? '' : 'km-pg'}
              style={isMessagesPage ? {
                padding: 0,
                maxWidth: '100%',
                margin: 0,
                height: 'calc((var(--app-vh, 1vh) * 100) - 60px)'
              } : {
                padding: isMobile ? "24px 20px 60px" : "32px 36px 60px",
                maxWidth: isMobile ? 680 : isExplorePage ? 1200 : 800,
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
