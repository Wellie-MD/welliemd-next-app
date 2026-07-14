import { useEffect, useRef, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import type { ConversationSummary } from "@/services/messageService";
import BillingSuspendedBanner from "@/components/billing/BillingSuspendedBanner";
import { useClientMessages } from "@/contexts/MessagesContext";
import { Permissions } from "@/constants/permissions";

import Dashboard from "@/pages/Dashboard";
import Patients from "@/pages/Patients";
import PatientDetailPage from "@/pages/PatientDetailPage";
import Products from "@/pages/Products";
import ProductsRouting from "@/pages/ProductsRouting";
import Labs from "@/features/labs/pages/Labs";
import LabOrders from "@/features/labs/pages/LabOrders";
import LabOrderDetail from "@/features/labs/pages/LabOrderDetail";
import Messages from "@/pages/Messages";
import Analytics from "@/pages/Analytics";
import Affiliates from "@/pages/Affiliates";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import Payments from "@/pages/Payments";
import AnalyticsCohorts from "@/pages/AnalyticsCohorts";
import AnalyticsReports from "@/pages/AnalyticsReports";
import CouponInsights from "@/pages/CouponInsights";
import Billing from "@/pages/Billing";
import FinancesInvoices from "@/pages/finances/Invoices";
import TemplateManagement from "@/pages/TemplateManagement";
import TemplateQuestions from "@/pages/TemplateQuestions";
import FlowBuilder from "@/pages/FlowBuilder";
import ManageAccount from "@/pages/ManageAccount";
import CouponCodes from "@/pages/CouponCodes";
import CreateCouponPage from "@/pages/CreateCouponPage";

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
      <div className="min-h-screen flex w-full min-w-0 overflow-x-hidden">
        <AppSidebar unseenCount={unseenCount} />

        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <MessageChime conversations={conversations} />

          <Header />

          <BillingSuspendedBanner />

          <main className="flex-1 bg-background min-w-0 overflow-x-hidden">
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
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
