import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Treatments from "./pages/Treatments";
import Products from "./pages/Products";
import BillingPlans from "./pages/BillingPlans";
import ProductsRouting from "./pages/ProductsRouting";
import Messages from "./pages/Messages";
import Disputes from "./pages/Disputes";
import ResolutionQueue from "./pages/ResolutionQueue";
import Analytics from "./pages/Analytics";
import Affiliates from "./pages/Affiliates";
import Questionnaires from "./pages/Questionnaires";
import TreatmentConfigurations from "./pages/TreatmentConfigurations";
import Orders from "./pages/Orders";
import Prescriptions from "./pages/Prescriptions";
import NotFound from "./pages/NotFound";
import Payments from "./pages/Payments";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AnalyticsCohorts from "./pages/AnalyticsCohorts";
import AnalyticsReports from "./pages/AnalyticsReports";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
          
          {/* Auth routes - without sidebar */}
          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Dashboard routes - with sidebar */}
          <Route path="/dashboard/*" element={
            <SidebarProvider>
              <div className="min-h-screen flex w-full min-w-0 overflow-x-hidden">
                <AppSidebar />
                <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
                  <Header />
                  <main className="flex-1 bg-background min-w-0 overflow-x-hidden">
                    <Routes>
                      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                      <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
                      <Route path="/treatments" element={<ProtectedRoute><Treatments /></ProtectedRoute>} />
                      <Route path="/treatments/configurations" element={<ProtectedRoute><TreatmentConfigurations /></ProtectedRoute>} />
                      <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                      <Route path="/orders/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
                      <Route path="/orders/disputes" element={<ProtectedRoute><Disputes /></ProtectedRoute>} />
                      <Route path="/orders/resolution-queue" element={<ProtectedRoute><ResolutionQueue /></ProtectedRoute>} />
                      <Route path="/prescriptions" element={<ProtectedRoute><Prescriptions /></ProtectedRoute>} />
                      <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                      <Route path="/products/billing-plans" element={<ProtectedRoute><BillingPlans /></ProtectedRoute>} />
                      <Route path="/products/routing" element={<ProtectedRoute><ProductsRouting /></ProtectedRoute>} />
                      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                      <Route path="/analytics/live" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                      <Route path="/analytics/cohorts" element={<ProtectedRoute><AnalyticsCohorts /></ProtectedRoute>} />
                      <Route path="/analytics/reports" element={<ProtectedRoute><AnalyticsReports /></ProtectedRoute>} />
                      <Route path="/affiliates" element={<ProtectedRoute><Affiliates /></ProtectedRoute>} />
                      <Route path="/questionnaires" element={<ProtectedRoute><Questionnaires /></ProtectedRoute>} />
                    </Routes>
                  </main>
                </div>
              </div>
            </SidebarProvider>
          } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );

export default App;