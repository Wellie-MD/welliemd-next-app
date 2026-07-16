import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { SettingsLayout } from "./components/layout/SettingsLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { authService } from './services/authService';
import { useAuthStore } from './store/useAuthStore';
import { Loader2 } from 'lucide-react';
import { reportPerfMetrics } from './utils/perfMetrics';

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clients = lazy(() => import("./pages/Clients"));
const Patients = lazy(() => import("./pages/Patients"));
const ClientForm = lazy(() => import("./pages/ClientForm"));
const ClientLifecycle = lazy(() => import("./pages/ClientLifecycle"));
const Treatments = lazy(() => import("./pages/Treatments"));
const Products = lazy(() => import("./pages/Products"));
const Messages = lazy(() => import("./pages/Messages"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Affiliates = lazy(() => import("./pages/Affiliates"));
const Questionnaires = lazy(() => import("./pages/Questionnaires"));
const QuestionnaireQuestions = lazy(() => import("./pages/QuestionnaireQuestions"));
const FlowBuilder = lazy(() => import("./pages/FlowBuilder"));
const TemplateAssignment = lazy(() => import("./pages/TemplateAssignment"));
const TemplateAssignmentHistory = lazy(() => import("./pages/TemplateAssignmentHistory"));
const Pharmacies = lazy(() => import("./pages/Pharmacies"));
const TreatmentConfigurations = lazy(() => import("./pages/TreatmentConfigurations"));
const Orders = lazy(() => import("./pages/Orders"));
const Prescriptions = lazy(() => import("./pages/Prescriptions"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Payments = lazy(() => import("./pages/Payments"));
const SignIn = lazy(() => import("./pages/auth/SignIn"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const RegisterInvitation = lazy(() => import("./pages/auth/RegisterInvitation"));
const AnalyticsCohorts = lazy(() => import("./pages/AnalyticsCohorts"));
const AnalyticsReports = lazy(() => import("./pages/AnalyticsReports"));
const CouponInsights = lazy(() => import("./pages/CouponInsights"));
const Billing = lazy(() => import("./pages/Billing"));
const ProductDoseMappings = lazy(() => import("./pages/ProductDoseMappings"));
const ProductConfig = lazy(() => import("./pages/ProductConfig"));
const Supplies = lazy(() => import("./pages/Supplies"));
const ArchiveTemplates = lazy(() => import("./pages/ArchiveTemplates"));
const ArchiveProducts = lazy(() => import("./pages/ArchiveProducts"));
const ManageAccount = lazy(() => import("./pages/ManageAccount"));
const UsersPermissions = lazy(() => import("./pages/management/UsersPermissions"));
const MasterKeyAccess = lazy(() => import("./pages/MasterKeyAccess"));
const CrossTenantAccessUsers = lazy(() => import("./pages/CrossTenantAccessUsers"));
const ClientPerformance = lazy(() => import("./pages/ClientPerformance"));
const LabOrders = lazy(() => import("./pages/LabOrders"));
const Labs = lazy(() => import("./pages/Labs"));
const LabSettings = lazy(() => import("./pages/LabSettings"));
const TestCatalog = lazy(() => import("./pages/TestCatalog"));
const SenseInsights = lazy(() => import("./pages/SenseInsights"));

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAuthStore();
  const canAccessCrossTenantUsers = Boolean(
    user?.is_platform_owner || user?.can_access_cross_tenant_access_users
  );

  useEffect(() => {
    const initializeAuth = async () => {
      const authStore = useAuthStore.getState();
      authStore.clearExpiredSession();

      const authStart = performance.now();
      try {
        await authService.hydrateAuth();
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        const authDuration = performance.now() - authStart;
        const existing = (window as any).__perfMetrics || {};
        (window as any).__perfMetrics = { ...existing, auth_hydration_ms: authDuration };
        setIsInitialized(true);
        reportPerfMetrics();
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    const AUTH_SYNC_EVENT_KEY = "admin-auth-sync-event";

    const handleStorage = async (event: StorageEvent) => {
      if (event.key !== AUTH_SYNC_EVENT_KEY || !event.newValue) {
        return;
      }

      try {
        const payload = JSON.parse(event.newValue) as { type?: "login" | "logout" };
        const authStore = useAuthStore.getState();

        if (payload.type === "logout") {
          authStore.logout();
          return;
        }

        if (payload.type === "login") {
          authStore.clearExpiredSession();
          await authService.hydrateAuth();
        }
      } catch (error) {
        console.warn("Failed to process auth sync event:", error);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const PageLoader = () => (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />

        {/* Auth routes */}
        <Route path="/auth/signin" element={<SignIn />} />
        {/* <Route path="/signup" element={<SignUp />} /> */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<RegisterInvitation />} />
        <Route path="/admin/master-key/access/:token" element={<MasterKeyAccess />} />

        {/* Dashboard routes */}
        <Route path="/dashboard/*" element={
          <SidebarProvider>
            <div className="min-h-screen flex w-full min-w-0 overflow-x-hidden">
              <AppSidebar />
              <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
                <Header />
                <main className="flex-1 bg-background min-w-0 overflow-x-hidden">
                  <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
                    <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
                    <Route path="/clients/create" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
                    <Route path="/clients/edit/:id" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
                    <Route path="/clients/:id/lifecycle" element={<ProtectedRoute><ClientLifecycle /></ProtectedRoute>} />
                    <Route
                      path="/access-users"
                      element={
                        <ProtectedRoute>
                          {canAccessCrossTenantUsers ? (
                            <CrossTenantAccessUsers />
                          ) : (
                            <Navigate to="/dashboard" replace />
                          )}
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/treatments" element={<ProtectedRoute><Treatments /></ProtectedRoute>} />
                    <Route path="/treatments/configurations" element={<ProtectedRoute><TreatmentConfigurations /></ProtectedRoute>} />
                    <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                    <Route path="/orders/labs" element={<ProtectedRoute><LabOrders /></ProtectedRoute>} />
                    <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
                    {/* <Route path="/orders/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} /> // Route disabled on request: https://telehealthknysys.atlassian.net/browse/KAN-2 */}
                    {/* <Route path="/prescriptions" element={<ProtectedRoute><Prescriptions /></ProtectedRoute>} />  */} // Route disabled on request: https://telehealthknysys.atlassian.net/browse/KAN-3
                    <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                    <Route path="/products/assign" element={<ProtectedRoute><Navigate to="/dashboard/products" replace /></ProtectedRoute>} />
                    <Route path="/products/dose-mappings" element={<ProtectedRoute><ProductDoseMappings /></ProtectedRoute>} />
                    <Route path="/products/config" element={<ProtectedRoute><ProductConfig /></ProtectedRoute>} />
                    <Route path="/products/supplies" element={<ProtectedRoute><Supplies /></ProtectedRoute>} />
                    <Route path="/products/labs" element={<ProtectedRoute><Labs /></ProtectedRoute>} />
                    <Route path="/products/labs/settings" element={<ProtectedRoute><LabSettings /></ProtectedRoute>} />
                    <Route path="/products/labs/catalog" element={<ProtectedRoute><TestCatalog /></ProtectedRoute>} />
                    <Route path="/tools/sense" element={<ProtectedRoute><SenseInsights /></ProtectedRoute>} />
                    <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                    <Route path="/analytics/performance" element={<ProtectedRoute><ClientPerformance /></ProtectedRoute>} />
                    <Route path="/analytics/live" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                    <Route path="/analytics/cohorts" element={<ProtectedRoute><AnalyticsCohorts /></ProtectedRoute>} />
                    <Route path="/analytics/reports" element={<ProtectedRoute><AnalyticsReports /></ProtectedRoute>} />
                    {/* <Route path="/coupon-codes" element={<ProtectedRoute><CouponCodes /></ProtectedRoute>} /> */}
                    <Route path="/coupon-insights" element={<ProtectedRoute><CouponInsights /></ProtectedRoute>} />
                    <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
                    <Route path="/affiliates" element={<ProtectedRoute><Affiliates /></ProtectedRoute>} />
                    <Route path="/questionnaires" element={<ProtectedRoute><Questionnaires /></ProtectedRoute>} />
                    <Route path="/questionnaires/assign" element={<ProtectedRoute><TemplateAssignment /></ProtectedRoute>} />
                    <Route path="/questionnaires/assignment-history" element={<ProtectedRoute><TemplateAssignmentHistory /></ProtectedRoute>} />
                    <Route path="/questionnaires/:templateId" element={<ProtectedRoute><QuestionnaireQuestions /></ProtectedRoute>} />
                    <Route path="/questionnaires/:templateId/questions" element={<ProtectedRoute><QuestionnaireQuestions /></ProtectedRoute>} />
                    <Route path="/questionnaires/:templateId/flow-builder" element={<ProtectedRoute><FlowBuilder /></ProtectedRoute>} />
                    <Route path="/questionnaires/archive" element={<ProtectedRoute><ArchiveTemplates /></ProtectedRoute>} />
                    <Route path="/pharmacies" element={<ProtectedRoute><Pharmacies /></ProtectedRoute>} />
                    <Route path="/products/archive" element={<ProtectedRoute><ArchiveProducts /></ProtectedRoute>} />
                    <Route path="/manage-account" element={<ProtectedRoute><ManageAccount /></ProtectedRoute>} />
                    <Route path="/users-permissions" element={<ProtectedRoute><UsersPermissions /></ProtectedRoute>} />
                  </Routes>
                  </Suspense>
                </main>
              </div>
            </div>
          </SidebarProvider>
        } />

        <Route path="/dashboard/settings/*" element={
          <ProtectedRoute>
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
          </ProtectedRoute>
        } />


        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
