import {
  MessageSquare,
  Package,
  ClipboardList,
  FlaskConical,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FollowUpList } from "@/features/followups";
import { AvailableTreatmentsList } from "@/features/treatments";
import { useAuth } from "@/features/auth";
import { VisitService } from "@/features/visits/services/visit.service";
import { getOrders } from "@/shared/api/ordersApi";
import { useNotifications } from "@/contexts/NotificationsContext";

/* ─────────────────────────────────────────────
   kinmeds3 reference spacing (from .pg, .card, .ch, .stats, .qagrid, etc.):
   - card margin-bottom: 12px
   - card header padding: 14px 14px 0
   - card body padding: 14px
   - stats gap: 8px, mb:12px, stat padding: 12px 10px
   - qa grid gap: 8px
   - greeting mb: ~20px
   ───────────────────────────────────────────── */

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user?.first_name || "there";
  
  const [stats, setStats] = useState({
    treatments: 0,
    orders: 0,
  });
  const { unreadCount } = useNotifications();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [visitsRes, ordersRes] = await Promise.all([
          VisitService.getPatientVisits(),
          getOrders(1, 1) // Just get the count
        ]);
        
        // Active treatments = non-completed/cancelled visits
        const activeTreatmentsCount = visitsRes.filter(v => 
          !['completed', 'cancelled'].includes(v.status.toLowerCase())
        ).length;
        
        setStats({
          treatments: activeTreatmentsCount,
          orders: ordersRes.count || 0
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div>
      {/* ── Greeting ── */}
      <div className="km-fade" style={{ paddingTop: 4, marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "var(--km-tm)", marginBottom: 2 }}>
          Good morning 👋
        </div>
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: -0.4,
            color: "var(--km-t)",
          }}
        >
          {firstName}
        </div>
      </div>

      {/* ── Stats ── */}
      <div
        className="km-fade"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          marginBottom: 12,
        }}
      >
        {[
          { label: "Treatments", color: "var(--km-ac)", path: "/dashboard/treatments", value: stats.treatments },
          { label: "Orders", color: "var(--km-gr)", path: "/dashboard/orders", value: stats.orders },
          { label: "Messages", color: "var(--km-am)", path: "/dashboard/messages", value: unreadCount },
        ].map((s) => (
          <div
            key={s.label}
            className="km-stat"
            onClick={() => navigate(s.path)}
          >
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 22,
                lineHeight: 1,
                marginBottom: 3,
                color: s.color,
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: "var(--km-tm)", fontWeight: 500 }}>
              <span
                style={{
                  display: "inline-block",
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: s.color,
                  marginRight: 3,
                  verticalAlign: "middle",
                  position: "relative",
                  top: -1,
                }}
              />
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Follow-Up Questionnaires ── */}
      <div className="km-card km-fade" style={{ marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 14px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "var(--km-acp)",
                color: "var(--km-ac)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ClipboardList size={14} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--km-t)" }}>
              Follow-Up Questionnaires
            </span>
          </div>
        </div>
        <div style={{ padding: 14 }}>
          <FollowUpList />
        </div>
      </div>

      {/* ── Explore Treatments ── */}
      <div className="km-card km-fade" style={{ marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 14px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "var(--km-grp)",
                color: "var(--km-gr)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Search size={14} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--km-t)" }}>
              Explore Treatments
            </span>
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--km-ac)",
              cursor: "pointer",
              opacity: 0.85,
            }}
            onClick={() => navigate("/dashboard/explore")}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = "1"; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = "0.85"; }}
          >
            View all
          </span>
        </div>
        <div style={{ padding: 14 }}>
          <AvailableTreatmentsList />
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="km-card km-fade" style={{ marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "14px 14px 0",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "var(--km-acp)",
              color: "var(--km-ac)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Package size={14} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--km-t)" }}>
            Quick Actions
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 8,
            padding: 14,
          }}
        >
          {[
            { icon: MessageSquare, label: "Message", desc: "Contact your care team", path: "/dashboard/messages" },
            { icon: Package, label: "Orders", desc: "Track your deliveries", path: "/dashboard/orders" },
            { icon: FlaskConical, label: "Labs", desc: "View lab results", path: "/dashboard/labs" },
            { icon: Search, label: "Explore", desc: "Browse treatments", path: "/dashboard/explore" },
          ].map((qa) => (
            <div
              key={qa.label}
              className="km-qa-item"
              onClick={() => navigate(qa.path)}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "var(--km-acp)",
                  color: "var(--km-ac)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <qa.icon size={18} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--km-t)" }}>
                {qa.label}
              </div>
              <div style={{ fontSize: 11, color: "var(--km-tm)", marginTop: -2 }}>
                {qa.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
