import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LogOut } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/services/authService";
import { CorporateSidebar } from "./CorporateSidebar";
import { getCorporateClientMode } from "./config";
import CorporateWorkspace from "./CorporateWorkspace";
import CorporateEmployerDashboard from "./CorporateEmployerDashboard";
import CorporateUnavailable from "./CorporateUnavailable";

export default function CorporateFrame() {
  const user = useAuthStore((state) => state.user);
  const mode = getCorporateClientMode();
  if (!mode) return <CorporateUnavailable />;
  const home = mode === "employer" ? "/dashboard/corporate/employer" : "/dashboard/corporate/workspace";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/20">
        <CorporateSidebar />
        <div className="min-w-0 flex-1">
          <header className="flex h-[58px] items-center justify-between border-b bg-background px-4 sm:px-6">
            <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Pilot preview</p><p className="text-sm text-muted-foreground">{mode === "operator" ? "Operator control-plane preview" : "Employer tenant preview"}</p></div>
            <div className="flex items-center gap-3"><span className="hidden text-sm text-muted-foreground sm:inline">{user?.full_name || user?.email}</span><Button variant="ghost" size="sm" onClick={() => void authService.logout()}><LogOut className="mr-2 h-4 w-4" />Sign out</Button></div>
          </header>
          <main>
            <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading corporate workspace…</div>}>
              <Routes>
                <Route index element={<Navigate to={home} replace />} />
                <Route path="workspace" element={mode === "operator" ? <CorporateWorkspace /> : <Navigate to="/dashboard/corporate/unavailable" replace />} />
                <Route path="employer" element={mode === "employer" ? <CorporateEmployerDashboard /> : <Navigate to="/dashboard/corporate/unavailable" replace />} />
                <Route path="unavailable" element={<CorporateUnavailable />} />
                <Route path="*" element={<Navigate to="/dashboard/corporate/unavailable" replace />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
