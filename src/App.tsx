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
import Products from "./pages/Products";
import Analytics from "./pages/Analytics";
import Affiliates from "./pages/Affiliates";
import Questionnaires from "./pages/Questionnaires";
import TreatmentConfigurations from "./pages/TreatmentConfigurations";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-white overflow-hidden">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Header />
              <main className="flex-1 bg-white overflow-hidden">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/patients" element={<Patients />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/analytics/*" element={<Analytics />} />
                  <Route path="/affiliates" element={<Affiliates />} />
                  <Route path="/questionnaires" element={<Questionnaires />} />
                  <Route path="/treatments/configurations" element={<TreatmentConfigurations />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
