import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { SettingsLayout } from "./components/layout/SettingsLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { authService } from './services/authService';
import { useAuthStore } from './store/useAuthStore';
import { Loader2 } from 'lucide-react';

// Import pages
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientForm from "./pages/ClientForm";
import Treatments from "./pages/Treatments";
import Products from "./pages/Products";
import Messages from "./pages/Messages";
import Analytics from "./pages/Analytics";
import Affiliates from "./pages/Affiliates";
import Questionnaires from "./pages/Questionnaires";
import QuestionnaireQuestions from "./pages/QuestionnaireQuestions";
import FlowBuilder from "./pages/FlowBuilder";
import TemplateAssignment from "./pages/TemplateAssignment";
import TemplateAssignmentHistory from "./pages/TemplateAssignmentHistory";
import Pharmacies from "./pages/Pharmacies";
import TreatmentConfigurations from "./pages/TreatmentConfigurations";
import Orders from "./pages/Orders";
import Prescriptions from "./pages/Prescriptions";
import NotFound from "./pages/NotFound";
import Payments from "./pages/Payments";
import ProductAssignment from "./pages/ProductAssignment";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import RegisterInvitation from "./pages/auth/RegisterInvitation";
import AnalyticsCohorts from "./pages/AnalyticsCohorts";
import AnalyticsReports from "./pages/AnalyticsReports";
import CouponCodes from "./pages/CouponCodes";
import CouponInsights from "./pages/CouponInsights";
import Billing from "./pages/Billing";
import ProductDoseMappings from "./pages/ProductDoseMappings";
import ProductConfig from "./pages/ProductConfig";
import ArchiveTemplates from "./pages/ArchiveTemplates";
import ArchiveProducts from "./pages/ArchiveProducts";
import ManageAccount from "./pages/ManageAccount";
import UsersPermissions from "./pages/management/UsersPermissions";
import MasterKeyAccess from "./pages/MasterKeyAccess";

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      const authStore = useAuthStore.getState();
      authStore.clearExpiredSession();

      try {
        await authService.hydrateAuth();
      } catch (error) {
        console.error('Failed to initialize auth:', error);
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
      <Routes>
        <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
        
        {/* Auth routes */}
        <Route path="/auth/signin" element={<SignIn />} />
        {/* <Route path="/signup" element={<SignUp />} /> */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<RegisterInvitation />} />
        
        {/* Master Key Access - no auth required, accessed via email link */}
        <Route path="/admin/master-key/access/:token" element={<MasterKeyAccess />} />
        
        {/* Dashboard routes */}
        <Route path="/dashboard/*" element={
          <SidebarProvider>
            <div className="min-h-screen flex w-full min-w-0 overflow-x-hidden">
              <AppSidebar />
              <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
                <Header />
                <main className="flex-1 bg-background min-w-0 overflow-x-hidden">
                  <Routes>
                    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
                    <Route path="/clients/create" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
                    <Route path="/clients/edit/:id" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
                    <Route path="/treatments" element={<ProtectedRoute><Treatments /></ProtectedRoute>} />
                    <Route path="/treatments/configurations" element={<ProtectedRoute><TreatmentConfigurations /></ProtectedRoute>} />
                    <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                    {/* <Route path="/orders/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} /> // Route disabled on request: https://telehealthknysys.atlassian.net/browse/KAN-2 */}
                    {/* <Route path="/prescriptions" element={<ProtectedRoute><Prescriptions /></ProtectedRoute>} />  */} // Route disabled on request: https://telehealthknysys.atlassian.net/browse/KAN-3
                    <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                    <Route path="/products/assign" element={<ProtectedRoute><ProductAssignment /></ProtectedRoute>} />
                    <Route path="/products/dose-mappings" element={<ProtectedRoute><ProductDoseMappings /></ProtectedRoute>} />
                    <Route path="/products/config" element={<ProtectedRoute><ProductConfig /></ProtectedRoute>} />
                    <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
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
