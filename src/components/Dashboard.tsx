import {
  MessageSquare,
  Package,
  TestTubes,
  Compass,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FollowUpList } from "@/features/followups";
import { ActiveTreatmentsList } from "@/components/ActiveTreatmentsList";
import { useViewerIdentity } from "@/features/auth/hooks/use-viewer-identity";
import { VisitService } from "@/features/visits/services/visit.service";
import { getOrders } from "@/shared/api/ordersApi";
import { useNotifications } from "@/contexts/NotificationsContext";
import { getPatientFollowUps } from "@/features/followups/api";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning 👋";
  if (hour < 17) return "Good afternoon ☀️";
  if (hour < 21) return "Good evening 🌆";
  return "Good night 🌙";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const viewerIdentity = useViewerIdentity();
  const fullName = viewerIdentity.fullName;
  
  // Sanitize display name - avoid showing system IDs, UUIDs, or email addresses
  const isValidName = fullName.length > 1 && 
    !fullName.includes('@') &&
    !/^[0-9a-f]{8}-/.test(fullName); // reject UUID-like strings
  const safeName = isValidName ? fullName : "there";
  
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    treatments: 0,
    orders: 0,
  });
  const [pendingFollowUps, setPendingFollowUps] = useState<number | null>(null);
  const { unreadCount } = useNotifications();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const [visitsRes, ordersRes] = await Promise.all([
          VisitService.getPatientVisits(),
          getOrders(1, 1) // Just get the count
        ]);
        
        // Active treatments = visits with a paid order (not just non-completed visits)
        const PAID_ORDER_STATUSES = [
          "processing", "visit_pending",
          "consult_scheduled", "consult_rescheduled", "no_show", "referred",
          "prescribed", "billing_pending", "rx_sent", "shipped",
        ];
        const activeTreatmentsCount = visitsRes.filter(v => 
          !['completed', 'cancelled'].includes(v.status.toLowerCase()) &&
          v.order_status &&
          PAID_ORDER_STATUSES.includes(v.order_status.toLowerCase())
        ).length;
        
        setStats({
          treatments: activeTreatmentsCount,
          orders: ordersRes.count || 0
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setStatsLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  // Fetch pending follow-up count
  useEffect(() => {
    const fetchFollowUps = async () => {
      try {
        const data = await getPatientFollowUps();
        const pending = (data || []).filter(f => ['CREATED', 'VIEWED', 'IN_PROGRESS'].includes(f.status));
        setPendingFollowUps(pending.length);
      } catch {
        setPendingFollowUps(0);
      }
    };
    fetchFollowUps();
  }, []);

  return (
    <div>
      {/* ── Greeting ── */}
      <div className="km-fade" style={{ paddingTop: 4, marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "var(--km-tm)", marginBottom: 2 }}>
          {getGreeting()}
        </div>
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: -0.4,
            color: "var(--km-t)",
            maxWidth: "100%",
            wordWrap: "break-word",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {safeName}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="km-stats-grid km-fade">
        <div className="km-stat" onClick={() => navigate("/dashboard/treatments")}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, lineHeight: 1, marginBottom: 3, color: "var(--km-ac)" }}>
            {statsLoading ? <span className="km-skel" style={{ width: 20, height: 20, display: 'inline-block', borderRadius: 4 }} /> : stats.treatments}
          </div>
          <div style={{ fontSize: 11, color: "var(--km-tm)", fontWeight: 500, display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--km-ac)" }} />
            Treatments
          </div>
        </div>
        <div className="km-stat" onClick={() => navigate("/dashboard/orders")}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, lineHeight: 1, marginBottom: 3, color: "var(--km-gr)" }}>
            {statsLoading ? <span className="km-skel" style={{ width: 20, height: 20, display: 'inline-block', borderRadius: 4 }} /> : stats.orders}
          </div>
          <div style={{ fontSize: 11, color: "var(--km-tm)", fontWeight: 500, display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--km-gr)" }} />
            Orders
          </div>
        </div>
        <div className="km-stat" onClick={() => navigate("/dashboard/messages")}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, lineHeight: 1, marginBottom: 3, color: "var(--km-am)" }}>
            {unreadCount}
          </div>
          <div style={{ fontSize: 11, color: "var(--km-tm)", fontWeight: 500, display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--km-am)" }} />
            Messages
          </div>
        </div>
      </div>

      {/* ── Follow-Up Questionnaires ── */}
      <div className="km-dash-card km-fade">
        <div className="km-dash-ch">
          <div className="km-dash-ctrow">
            <div className="km-dash-ci blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
                <path d="M9 12h6M9 16h4"/>
              </svg>
            </div>
            <span className="km-dash-ct">Follow-Up Questionnaires</span>
          </div>
          {pendingFollowUps !== null && pendingFollowUps > 0 && (
            <span className="km-badge km-badge-red" style={{ fontSize: 10 }}>{pendingFollowUps} pending</span>
          )}
        </div>
        <div style={{ padding: "10px 14px 14px", display: "flex", flexDirection: "column", gap: 0 }}>
          <FollowUpList />
        </div>
      </div>

      {/* ── Active Treatments ── */}
      <div className="km-dash-card km-fade">
        <div className="km-dash-ch">
          <div className="km-dash-ctrow">
            <div className="km-dash-ci purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18.5 2.5a2.121 2.121 0 013 3L7 20l-4 1 1-4L18.5 2.5z"/>
              </svg>
            </div>
            <span className="km-dash-ct">Active Treatments</span>
          </div>
          <span className="km-dash-va" onClick={() => navigate("/dashboard/treatments")}>
            View all
          </span>
        </div>
        <div style={{ padding: "10px 14px 14px" }}>
          <ActiveTreatmentsList />
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="km-dash-card km-fade">
        <div className="km-dash-ch" style={{ paddingBottom: 4 }}>
          <div className="km-dash-ctrow">
            <div className="km-dash-ci blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
              </svg>
            </div>
            <span className="km-dash-ct">Quick Actions</span>
          </div>
        </div>
        <div className="km-qagrid">
          {[
            { icon: MessageSquare, label: "Message", desc: "Contact your care team", path: "/dashboard/messages?prefill=" + encodeURIComponent("Hi, I have a question for my care team.") },
            { icon: Package, label: "Orders", desc: "Track your deliveries", path: "/dashboard/orders" },
            { icon: TestTubes, label: "Labs", desc: "View lab results", path: "/dashboard/labs" },
            { icon: Compass, label: "Explore", desc: "Browse treatments", path: "/dashboard/explore" },
          ].map((qa) => (
            <div key={qa.label} className="km-qaitem" onClick={() => navigate(qa.path)}>
              <div className="km-qaico">
                <qa.icon size={18} strokeWidth={1.8} />
              </div>
              <div className="km-qalbl">{qa.label}</div>
              <div className="km-qasub">{qa.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
