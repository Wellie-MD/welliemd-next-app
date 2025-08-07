import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full min-w-0 overflow-x-hidden">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
              <Header />
              <main className="flex-1 bg-background min-w-0 overflow-x-hidden">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/patients" element={<Patients />} />
                  <Route path="/treatments" element={<Treatments />} />
                  <Route path="/treatments/configurations" element={<TreatmentConfigurations />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/orders/payments" element={<Payments />} />
                  <Route path="/orders/disputes" element={<Disputes />} />
                  <Route path="/orders/resolution-queue" element={<ResolutionQueue />} />
                  <Route path="/prescriptions" element={<Prescriptions />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/billing-plans" element={<BillingPlans />} />
                  <Route path="/products/routing" element={<ProductsRouting />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/analytics/live" element={<Analytics />} />
                  <Route path="/affiliates" element={<Affiliates />} />
                  <Route path="/questionnaires" element={<Questionnaires />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;