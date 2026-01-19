import React from 'react';
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
  return (
    <NotificationsProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </NotificationsProvider>
  );
};

export default DashboardLayout;
