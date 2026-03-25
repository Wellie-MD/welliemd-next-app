import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Header } from "@/components/layout/Header";
import { SettingsLayout } from "./components/layout/SettingsLayout";
import DashboardFrame from "./components/layout/DashboardFrame";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { authService } from "./services/authService";
import { useAuthStore } from "./store/useAuthStore";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { useSocialTags } from "@/hooks/useSocialTags";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { MessagesProvider } from "@/contexts/MessagesContext";

// pages
import NotFound from "./pages/NotFound";
import SignIn from "./pages/auth/SignIn";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AcceptInvitation from "./pages/AcceptInvitation";
import RegisterInvitation from "./pages/auth/RegisterInvitation";
import Forbidden from "./pages/Forbidden";

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useSocialTags();

  useEffect(() => {
    const initializeAuth = async () => {
      const authStore = useAuthStore.getState();
      authStore.clearExpiredSession();
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
      <Routes>
        <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />

        {/* Auth routes */}
        <Route path="/auth/signin" element={<SignIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<RegisterInvitation />} />
        <Route path="/accept-invitation" element={<AcceptInvitation />} />

        {/* Error pages */}
        <Route path="/forbidden" element={<Forbidden />} />

        {/* Dashboard routes — single MessagesProvider + poller for all dashboard pages */}
        <Route
          path="/dashboard/*"
          element={
            <BrandingProvider>
              <MessagesProvider pollIntervalMs={30000}>
                <DashboardFrame />
              </MessagesProvider>
            </BrandingProvider>
          }
        />

        <Route
          path="/dashboard/settings/*"
          element={
            <ProtectedRoute>
              <BrandingProvider>
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <div className="flex-1 flex flex-col">
                      <Header />
                      <div className="flex flex-1">
                        <SettingsLayout />
                      </div>
                    </div>
                  </div>
                </SidebarProvider>
              </BrandingProvider>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
