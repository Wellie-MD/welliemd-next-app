import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import type { ConversationSummary } from "@/services/messageService";
import BillingSuspendedBanner from "@/components/billing/BillingSuspendedBanner";
import { useClientMessages } from "@/contexts/MessagesContext";
import { Permissions } from "@/constants/permissions";
import { IntercomWidget } from "@/features/integrations/IntercomWidget";
import { IntercomCardBanner, IntercomInlineBanner } from "@/features/announcements/IntercomBanners";
import { Loader2 } from "lucide-react";
import { ProgramLegacyRouteRedirect } from "@/features/treatments/navigation/ProgramLegacyRouteRedirect";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Patients = lazy(() => import("@/pages/Patients"));
const PatientDetailPage = lazy(() => import("@/pages/PatientDetailPage"));
const Products = lazy(() => import("@/pages/Products"));
const ProductsRouting = lazy(() => import("@/pages/ProductsRouting"));
const Labs = lazy(() => import("@/features/labs/pages/Labs"));
const LabOrders = lazy(() => import("@/features/labs/pages/LabOrders"));
const LabOrderDetail = lazy(() => import("@/features/labs/pages/LabOrderDetail"));
const Messages = lazy(() => import("@/pages/Messages"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Affiliates = lazy(() => import("@/pages/Affiliates"));
const Orders = lazy(() => import("@/pages/Orders"));
const OrderDetail = lazy(() => import("@/pages/OrderDetail"));
const Payments = lazy(() => import("@/pages/Payments"));
const AnalyticsCohorts = lazy(() => import("@/pages/AnalyticsCohorts"));
const AnalyticsReports = lazy(() => import("@/pages/AnalyticsReports"));
const CouponInsights = lazy(() => import("@/pages/CouponInsights"));
const Billing = lazy(() => import("@/pages/Billing"));
const FinancesInvoices = lazy(() => import("@/pages/finances/Invoices"));
const TemplateManagement = lazy(() => import("@/pages/TemplateManagement"));
const TemplateQuestions = lazy(() => import("@/pages/TemplateQuestions"));
const FlowBuilder = lazy(() => import("@/pages/FlowBuilder"));
const ManageAccount = lazy(() => import("@/pages/ManageAccount"));
const CouponCodes = lazy(() => import("@/pages/CouponCodes"));
const CreateCouponPage = lazy(() => import("@/pages/CreateCouponPage"));
const Wearables = lazy(() => import("@/pages/Wearables"));
const ProgramsPage = lazy(() => import("@/features/treatments/programs/pages/ProgramsPage"));
const ProgramDetailPage = lazy(() => import("@/features/treatments/programs/pages/ProgramDetailPage"));
const CustomProgramsPage = lazy(() => import("@/features/treatments/custom-programs/pages/CustomProgramsPage"));
const CustomProgramBuilderPage = lazy(() => import("@/features/treatments/custom-programs/pages/CustomProgramBuilderPage"));
const EmailAnalytics = lazy(() => import("@/pages/EmailAnalytics"));
const SmsAnalytics = lazy(() => import("@/pages/SmsAnalytics"));

function PageLoadingFallback() {
  return <div className="flex min-h-[calc(100vh-58px)] items-center justify-center bg-background" role="status" aria-label="Loading page">
    <Loader2 className="h-7 w-7 animate-spin text-primary" />
  </div>;
}
const LS_KEY = "msg_last_seen";


function readSeen(): Record<string, string | number | undefined> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}
function writeSeen(seen: Record<string, string | number | undefined>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(seen));
  } catch {
    /* empty */
  }
}
const latestKey = (c: ConversationSummary) => c.last_time || c.master_id;

async function playChime() {
  try {
    const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const AudioCtx = w.AudioContext || w.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const g = ctx.createGain();
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.35, now + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    const a = ctx.createOscillator();
    const b = ctx.createOscillator();
    a.type = "triangle";
    b.type = "square";
    a.frequency.setValueAtTime(880, now);
    b.frequency.setValueAtTime(1318.51, now);
    a.connect(g);
    b.connect(g);
    a.start(now);
    b.start(now + 0.06);
    a.stop(now + 0.5);
    b.stop(now + 0.5);
  } catch {
    /* empty */
  }
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
  } catch {
    /* empty */
  }
}

function MessageChime({ conversations }: { conversations: ConversationSummary[] }) {
  const { pathname } = useLocation();
  const lastNotifiedRef = useRef<Record<string, string | number | undefined>>({});

  useEffect(() => {
    const seen = readSeen();
    const seed: Record<string, string | number | undefined> = {};
    conversations.forEach((c) => (seed[c.master_id] = seen[c.master_id] ?? latestKey(c)));
    lastNotifiedRef.current = seed;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onMessagesPage = pathname.startsWith("/dashboard/messages");
    if (onMessagesPage) return;

    const seen = readSeen();
    conversations.forEach((c) => {
      const k = latestKey(c);
      const unseen = seen[c.master_id] !== undefined && seen[c.master_id] !== k;
      const notNotified = lastNotifiedRef.current[c.master_id] !== k;
      if (unseen && notNotified) {
        void playChime();
        showBrowserNotification(
          "New message",
          `${c.patient_name || c.patient_email || "Patient"} • ${c.last_message}`
        );
        lastNotifiedRef.current[c.master_id] = k;
      }
    });
  }, [conversations, pathname]);

  return null;
}

export default function DashboardFrame() {
  const { conversations } = useClientMessages();

  const [lsTick, setLsTick] = useState(0);
  useEffect(() => {
    const onSeen = () => setLsTick((t) => t + 1);
    window.addEventListener("msg:last-seen-updated", onSeen);
    return () => window.removeEventListener("msg:last-seen-updated", onSeen);
  }, []);

  const unseenCount = (() => {
    const seen = readSeen();
    let count = 0;
    conversations.forEach((c) => {
      const key = latestKey(c);
      if (seen[c.master_id] === undefined) {
        seen[c.master_id] = key;
      } else if (seen[c.master_id] !== key) {
        count += 1;
      }
    });
    writeSeen(seen);
    return count;
  })();

  return (
    <SidebarProvider>
      <div className="h-svh min-h-0 flex w-full min-w-0 overflow-hidden">
        <AppSidebar unseenCount={unseenCount} />

        <div className="h-full min-h-0 flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <MessageChime conversations={conversations} />

          <Header />

          <BillingSuspendedBanner />

          <IntercomWidget />

          <IntercomCardBanner />

          {/* pb-20 (80px) reserves space for the fixed Intercom launcher
              (bottom:60px + 56px tall = 116px) so it never overlaps page
              content — buttons, table pagination, etc. — at the bottom of
              the viewport. Note: 80px is less than the launcher's 116px
              footprint, so some overlap can still occur; bump to pb-32
              (128px) if that's seen in practice. */}
          <main className="min-h-0 flex-1 bg-background min-w-0 overflow-x-hidden overflow-y-auto pb-20">
            <IntercomInlineBanner className="mx-6 mt-4" />
            <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
              <Route path="/patients/:patientId" element={<ProtectedRoute><PatientDetailPage /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/orders/labs" element={<ProtectedRoute><LabOrders /></ProtectedRoute>} />
              <Route path="/orders/labs/:orderId" element={<ProtectedRoute><LabOrderDetail /></ProtectedRoute>} />
              <Route path="/orders/details/:orderId" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
              <Route path="/orders/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
              <Route path="/products/labs" element={<ProtectedRoute><Labs /></ProtectedRoute>} />
              <Route path="/products/supplies" element={<ProtectedRoute><Products /></ProtectedRoute>} />
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
              <Route path="/analytics/email" element={<ProtectedRoute><EmailAnalytics /></ProtectedRoute>} />
              <Route path="/analytics/sms" element={<ProtectedRoute><SmsAnalytics /></ProtectedRoute>} />
              <Route path="/analytics/cohorts" element={<ProtectedRoute><AnalyticsCohorts /></ProtectedRoute>} />
              <Route path="/analytics/reports" element={<ProtectedRoute><AnalyticsReports /></ProtectedRoute>} />
              <Route path="/coupon-codes" element={<ProtectedRoute><CouponCodes /></ProtectedRoute>} />
              <Route path="/coupon-codes/new" element={<ProtectedRoute><CreateCouponPage /></ProtectedRoute>} />
              <Route path="/coupon-codes/:id/edit" element={<ProtectedRoute><CreateCouponPage /></ProtectedRoute>} />
              <Route path="/coupon-insights" element={<ProtectedRoute><CouponInsights /></ProtectedRoute>} />
              <Route path="/finances/invoices" element={<ProtectedRoute><FinancesInvoices /></ProtectedRoute>} />
              <Route path="/affiliates" element={<ProtectedRoute><Affiliates /></ProtectedRoute>} />
              <Route path="/questionnaires" element={<ProtectedRoute><TemplateManagement /></ProtectedRoute>} />
              <Route path="/templates" element={<ProtectedRoute><TemplateManagement /></ProtectedRoute>} />
              <Route path="/templates/:templateId" element={<ProtectedRoute><TemplateQuestions /></ProtectedRoute>} />
              <Route path="/templates/:templateId/flow-builder" element={<ProtectedRoute><FlowBuilder /></ProtectedRoute>} />
              <Route path="/manage-account" element={<ProtectedRoute><ManageAccount /></ProtectedRoute>} />
              <Route path="/wearables" element={<ProtectedRoute><Wearables /></ProtectedRoute>} />
              <Route path="/treatments/programs" element={<ProtectedRoute><ProgramsPage /></ProtectedRoute>} />
              <Route path="/treatments/programs/:programId/questions" element={<ProtectedRoute><ProgramDetailPage /></ProtectedRoute>} />
              <Route path="/treatments/programs/:programId/flow-builder" element={<ProtectedRoute><ProgramLegacyRouteRedirect /></ProtectedRoute>} />
              <Route path="/treatments/programs/:programId" element={<ProtectedRoute><ProgramLegacyRouteRedirect /></ProtectedRoute>} />
              <Route path="/treatments/custom-programs" element={<ProtectedRoute><CustomProgramsPage /></ProtectedRoute>} />
              <Route path="/treatments/custom-programs/:customProgramId/builder" element={<ProtectedRoute><CustomProgramBuilderPage /></ProtectedRoute>} />
            </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
