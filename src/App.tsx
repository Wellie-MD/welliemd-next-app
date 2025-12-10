import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { SettingsLayout } from "./components/layout/SettingsLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { authService } from "./services/authService";
import { useAuthStore } from "./store/useAuthStore";
import { Loader2 } from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { groupMessages } from "@/utils/groupMessages";
import { Toaster } from "@/components/ui/toaster";

// pages
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Products from "./pages/Products";
import ProductsRouting from "./pages/ProductsRouting";
import Messages from "./pages/Messages";
import Analytics from "./pages/Analytics";
import Affiliates from "./pages/Affiliates";
import Orders from "./pages/Orders";
import Payments from "./pages/Payments";
import NotFound from "./pages/NotFound";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AnalyticsCohorts from "./pages/AnalyticsCohorts";
import AnalyticsReports from "./pages/AnalyticsReports";
import CouponInsights from "./pages/CouponInsights";
import Billing from "./pages/Billing";
import FinancesInvoices from "./pages/finances/Invoices";
import TemplateManagement from "./pages/TemplateManagement";
import TemplateQuestions from "./pages/TemplateQuestions";
import FlowBuilder from "./pages/FlowBuilder";
import ManageAccount from "./pages/ManageAccount";
import CouponCodes from "./pages/CouponCodes";
import AcceptInvitation from "./pages/AcceptInvitation";
import RegisterInvitation from "./pages/auth/RegisterInvitation";
import Forbidden from "./pages/Forbidden";
import { Permissions } from "@/constants/permissions";


const LS_KEY = "msg_last_seen";

/* ---------- helpers ---------- */
function readSeen(): Record<string, string | number | undefined> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
}
function writeSeen(seen: Record<string, string | number | undefined>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(seen)); } catch {}
}
const latestKey = (c: any) => {
  const last = c.messages[c.messages.length - 1];
  return (last?.id as number | string | undefined) ?? last?.created_at ?? c.lastTime;
};

// chime
async function playChime() {
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const g = ctx.createGain(); g.connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.35, now + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    const a = ctx.createOscillator(); const b = ctx.createOscillator();
    a.type = "triangle"; b.type = "square";
    a.frequency.setValueAtTime(880, now); b.frequency.setValueAtTime(1318.51, now);
    a.connect(g); b.connect(g); a.start(now); b.start(now + 0.06);
    a.stop(now + 0.5); b.stop(now + 0.5);
  } catch {}
}
function showBrowserNotification(title: string, body: string) {
  try {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") new Notification(title, { body });
    else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") new Notification(title, { body });
      });
    }
  } catch { /* empty */ }
}

/* ---------- global chime listener ---------- */
function MessageChime({ conversations }: { conversations: any[] }) {
  const { pathname } = useLocation();
  const lastNotifiedRef = useRef<Record<string, string | number | undefined>>({});

  // seed on first mount (prevent chime for history)
  useEffect(() => {
    const seen = readSeen();
    const seed: Record<string, string | number | undefined> = {};
    conversations.forEach((c) => (seed[c.id] = seen[c.id] ?? latestKey(c)));
    lastNotifiedRef.current = seed;
  }, []); // eslint-disable-line

  useEffect(() => {
    // avoid double ring on Messages page (that page already handles intra-chat sounds)
    const onMessagesPage = pathname.startsWith("/dashboard/messages");
    if (onMessagesPage) return;

    const seen = readSeen();
    conversations.forEach((c) => {
      const k = latestKey(c);
      const unseen = seen[c.id] !== undefined && seen[c.id] !== k;
      const notNotified = lastNotifiedRef.current[c.id] !== k;
      if (unseen && notNotified) {
        playChime();
        showBrowserNotification("New message", `${(c.patientName || c.patientEmail || "Patient")} • ${c.lastMessage}`);
        lastNotifiedRef.current[c.id] = k;
      }
    });
  }, [conversations, pathname]);

  return null;
}

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { isAuthenticated } = useAuthStore();

  // lightweight poll for sidebar badge + global chime
  const { messages } = useMessages(10000);
  const conversations = useMemo(() => groupMessages(messages), [messages]);

  // tick when Messages.tsx updates localStorage (instant sidebar update)
  const [lsTick, setLsTick] = useState(0);
  useEffect(() => {
    const onSeen = () => setLsTick((t) => t + 1);
    window.addEventListener("msg:last-seen-updated", onSeen);
    return () => window.removeEventListener("msg:last-seen-updated", onSeen);
  }, []);

  const unseenCount = useMemo(() => {
    const seen = readSeen();
    let count = 0;
    conversations.forEach((c) => {
      const key = latestKey(c);
      if (seen[c.id] === undefined) {
        seen[c.id] = key; // seed so history isn't "new"
      } else if (seen[c.id] !== key) {
        count += 1;
      }
    });
    writeSeen(seen);
    return count;
  }, [conversations, lsTick]);

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
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<RegisterInvitation />} />
        <Route path="/accept-invitation" element={<AcceptInvitation />} />
        
        {/* Error pages */}
        <Route path="/forbidden" element={<Forbidden />} />


        {/* Dashboard routes */}
        <Route
          path="/dashboard/*"
          element={
            <SidebarProvider>
              <div className="min-h-screen flex w-full min-w-0 overflow-x-hidden">
                {/* sidebar with badge */}
                <AppSidebar unseenCount={unseenCount} />

                <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
                  {/* global chime (outside Messages page) */}
                  <MessageChime conversations={conversations} />

                  <Header />
                  <main className="flex-1 bg-background min-w-0 overflow-x-hidden">
                    <Routes>
                      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                      <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
                      <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                      <Route path="/orders/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
                      <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                      <Route path="/products/routing" element={<ProtectedRoute><ProductsRouting /></ProtectedRoute>} />
                      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                      <Route 
                        path="/billing" 
                        element={
                          <ProtectedRoute requiredPermission={Permissions.BILLING_VIEW}>
                            <Billing />
                          </ProtectedRoute>
                        } 
                      />
                      <Route path="/analytics/live" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                      <Route path="/analytics/cohorts" element={<ProtectedRoute><AnalyticsCohorts /></ProtectedRoute>} />
                      <Route path="/analytics/reports" element={<ProtectedRoute><AnalyticsReports /></ProtectedRoute>} />
                      <Route path="/coupon-codes" element={<ProtectedRoute><CouponCodes /></ProtectedRoute>} />
                      <Route path="/coupon-insights" element={<ProtectedRoute><CouponInsights /></ProtectedRoute>} />
                      <Route path="/finances/invoices" element={<ProtectedRoute><FinancesInvoices /></ProtectedRoute>} />
                      <Route path="/coupon-codes" element={<ProtectedRoute><CouponCodes /></ProtectedRoute>} />
                      <Route path="/affiliates" element={<ProtectedRoute><Affiliates /></ProtectedRoute>} />
                      <Route path="/questionnaires" element={<ProtectedRoute><TemplateManagement /></ProtectedRoute>} />
                      <Route path="/templates" element={<ProtectedRoute><TemplateManagement /></ProtectedRoute>} />
                      <Route path="/templates/:templateId" element={<ProtectedRoute><TemplateQuestions /></ProtectedRoute>} />
                      <Route path="/templates/:templateId/flow-builder" element={<ProtectedRoute><FlowBuilder /></ProtectedRoute>} />
                      <Route path="/manage-account" element={<ProtectedRoute><ManageAccount /></ProtectedRoute>} />
                    </Routes>
                  </main>
                </div>
              </div>
            </SidebarProvider>
          }
        />

        <Route
          path="/dashboard/settings/*"
          element={
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
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
