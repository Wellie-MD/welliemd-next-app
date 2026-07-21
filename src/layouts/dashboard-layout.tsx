import { useState, useEffect, useCallback, type FC } from 'react';

import { Outlet, useLocation } from 'react-router-dom';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { ImpersonationBanner } from '@/components/auth/ImpersonationBanner';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { IntercomWidget } from '@/features/integrations/IntercomWidget';
import { IntercomBannersProvider } from '@/features/announcements/IntercomBannersContext';
import { IntercomCardBanner } from '@/features/announcements/IntercomBanners';

const DashboardLayout: FC = () => {
  const location = useLocation();
  const isMessagesPage = location.pathname.includes('/messages');
  const isExplorePage = location.pathname === '/dashboard/explore';
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isImpersonated = useAuthStore((state) => state.isImpersonated);
  const bannerH = isImpersonated ? 44 : 0;
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

  useEffect(() => {
    document.documentElement.style.setProperty('--km-banner-h', `${bannerH}px`);
  }, [bannerH]);

  return (
    <IntercomBannersProvider>
    <NotificationsProvider>
      <div
        style={{
          minHeight: "calc(var(--app-vh, 1vh) * 100)",
          overflowX: "hidden",
          background: "var(--km-bg)",
          color: "var(--km-t)",
          fontFamily: "'Outfit', sans-serif",
          paddingTop: bannerH,
        }}
      >
        <Header
          onMenuClick={toggleMobileSidebar}
          isSidebarOpen={isMobileSidebarOpen}
          showMenuButton={isMobile}
          isMobile={isMobile}
        />

        <div style={{ display: "flex", flexDirection: "column", minHeight: `calc((var(--app-vh, 1vh) * 100) - 60px - ${bannerH}px)`, paddingTop: 60 }}>
          <ImpersonationBanner />
          <div style={{ display: "flex", flex: 1, minHeight: `calc((var(--app-vh, 1vh) * 100) - 60px - ${bannerH}px)` }}>
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
              {/* kinmeds3: pg padding 24px 20px → 28px 28px → 32px 36px, max-width 680→800→900 */}
              <div
                className={location.pathname.includes('/messages') ? '' : 'km-pg'}
                style={location.pathname.includes('/messages') ? {
                  padding: 0,
                  maxWidth: '100%',
                  margin: 0,
                  height: `calc((var(--app-vh, 1vh) * 100) - 60px - ${bannerH}px)`
                } : {
                  padding: isMobile ? "24px 20px 60px" : "32px 36px 60px",
                  maxWidth: isMobile ? 680 : isExplorePage ? 1200 : 800,
                  margin: "0 auto",
                }}
              >
                <Outlet />
              </div>
            </div>
            </main>
          </div>
        </div>
        <IntercomWidget />
        <IntercomCardBanner />
      </div>
    </NotificationsProvider>
    </IntercomBannersProvider>
  );
};

export default DashboardLayout;
