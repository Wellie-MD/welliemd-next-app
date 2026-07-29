import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Suspense, useEffect, useState } from "react";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { authService } from "./services/authService";
import { useAuthStore } from "./store/useAuthStore";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { useSocialTags } from "@/hooks/useSocialTags";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { MessagesProvider } from "@/contexts/MessagesContext";
import { IntercomBannersProvider } from "@/features/announcements/IntercomBannersContext";
import { lazyWithRetry } from "@/utils/lazyWithRetry";

// pages
const DashboardFrame = lazyWithRetry(() => import("./components/layout/DashboardFrame"));
const SettingsFrame = lazyWithRetry(() => import("./components/layout/SettingsFrame"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const SignIn = lazyWithRetry(() => import("./pages/auth/SignIn"));
const ForgotPassword = lazyWithRetry(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazyWithRetry(() => import("./pages/auth/ResetPassword"));
const AcceptInvitation = lazyWithRetry(() => import("./pages/AcceptInvitation"));
const RegisterInvitation = lazyWithRetry(() => import("./pages/auth/RegisterInvitation"));
const Forbidden = lazyWithRetry(() => import("./pages/Forbidden"));
const SuperAdminAccessLaunch = lazyWithRetry(() => import("./pages/SuperAdminAccessLaunch"));

const RouteLoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const DashboardRouteProviders = () => (
  <ProtectedRoute>
    <BrandingProvider>
      <MessagesProvider pollIntervalMs={30000}>
        <IntercomBannersProvider>
          <Outlet />
        </IntercomBannersProvider>
      </MessagesProvider>
    </BrandingProvider>
  </ProtectedRoute>
);

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useSocialTags();

  useEffect(() => {
    const initializeAuth = async () => {
      if (window.location.pathname.replace(/\/+$/, "") === "/superadmin-access/launch") {
        setIsInitialized(true);
        return;
      }

      try {
        await authService.hydrateAuth();
      } catch (error) {
        console.error("Failed to initialize auth:", error);
      } finally {
        setIsInitialized(true);
      }
    };
    initializeAuth();
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster />
      <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />

        {/* Auth routes */}
        <Route path="/auth/signin" element={<SignIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<RegisterInvitation />} />
        <Route path="/accept-invitation" element={<AcceptInvitation />} />
        <Route path="/superadmin-access/launch" element={<SuperAdminAccessLaunch />} />

        {/* Error pages */}
        <Route path="/forbidden" element={<Forbidden />} />

        {/* Keep shared dashboard providers mounted across dashboard/settings navigation. */}
        <Route element={<DashboardRouteProviders />}>
          <Route path="/dashboard/settings/*" element={<SettingsFrame />} />
          <Route path="/dashboard/*" element={<DashboardFrame />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
