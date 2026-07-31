import {
  MessageSquare,
  Package,
  TestTubes,
  Compass,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FollowUpList } from "@/features/followups";
import { ActiveTreatmentsList } from "@/components/ActiveTreatmentsList";
import { useViewerIdentity } from "@/features/auth/hooks/use-viewer-identity";
import NeedsAttentionCard from "@/components/NeedsAttentionCard";
import { VisitService } from "@/features/visits/services/visit.service";
import { getActiveTreatmentVisits } from "@/features/visits/utils/activeTreatments";
import { getOrders } from "@/shared/api/ordersApi";
import { useNotifications } from "@/contexts/NotificationsContext";
import { getPatientFollowUps } from "@/features/followups/api";
import { getConnections, getDeviceData, formatConnection, getVitalsHistory, logWeight, getHealthGoal } from "@/features/devices/api";
import { WeightTrendCard, ReadinessCard } from "@/features/devices/components/TelemetryDashboard";
import LogWeightModal from "@/features/devices/components/LogWeightModal";
import { WEIGHT_DEFAULT, DEVICE_METRICS_DEFAULT } from "@/features/devices/constants";
import type { WeightData, DeviceMetrics, VitalsEntry } from "@/features/devices/types";
import { profileService } from "@/features/profile/services/profile.service";

/**
 * Build the dashboard's WeightData from the persisted vitals history
 * (questionnaire baseline + manual entries + wearable-synced entries).
 */
function buildWeightData(entries: VitalsEntry[], prev: WeightData, priorityList: string[]): WeightData {
  const byDate = new Map<string, VitalsEntry>();
  
  for (const entry of entries) {
    if (entry.weight_lbs == null) continue;
    
    // Group by YYYY-MM-DD
    const dateKey = entry.measured_at.split('T')[0]!;
    const existing = byDate.get(dateKey);
    
    if (!existing) {
      byDate.set(dateKey, entry);
    } else {
      const existingRank = priorityList.indexOf(existing.source);
      const newRank = priorityList.indexOf(entry.source);
      
      const eRank = existingRank === -1 ? 999 : existingRank;
      const nRank = newRank === -1 ? 999 : newRank;
      
      if (nRank < eRank) {
        byDate.set(dateKey, entry);
      } else if (nRank === eRank && new Date(entry.measured_at).getTime() > new Date(existing.measured_at).getTime()) {
        byDate.set(dateKey, entry);
      }
    }
  }

  const sorted = Array.from(byDate.values())
    .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());

  if (sorted.length === 0) {
    return prev;
  }

  const points = sorted.map((e) => ({
    date: e.measured_at,
    weight: Number(e.weight_lbs),
    bmi: e.bmi != null ? Number(e.bmi) : null,
    height: e.height_inches != null ? Number(e.height_inches) : null,
  }));
  const series = points.map((p) => p.weight);
  const checkins = points.map((p) => ({
    label: new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    w: p.weight,
  }));

  const latestHeight = [...sorted].reverse().find((e) => e.height_inches != null)?.height_inches;
  const latest = sorted[sorted.length - 1]!;

  return {
    ...prev,
    series,
    checkins,
    points,
    start: prev.start || series[0]!,
    heightIn: latestHeight ?? prev.heightIn,
    latestBmi: latest.bmi != null ? Number(latest.bmi) : null,
    latestBmiCategory: latest.bmi_category ?? null,
  };
}

function WeightAndReadinessSkeleton() {
  const cardStyle = {
    background: "var(--km-s1)",
    border: "1px solid var(--km-b)",
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
  } as const;

  return (
    <>
      <div style={{ ...cardStyle, padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div className="km-skel" style={{ width: 32, height: 32, borderRadius: 9 }} />
          <div className="km-skel" style={{ width: 120, height: 14 }} />
        </div>
        <div className="km-skel" style={{ width: 90, height: 26, marginBottom: 16 }} />
        <div className="km-skel" style={{ width: "100%", height: 130, borderRadius: 10 }} />
      </div>
      <div style={{ ...cardStyle, padding: "14px 18px" }}>
        <div className="km-skel" style={{ width: 140, height: 14, marginBottom: 14 }} />
        <div className="km-skel" style={{ width: 90, height: 32 }} />
      </div>
    </>
  );
}

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
  const [weight, setWeight] = useState<WeightData>({ ...WEIGHT_DEFAULT });
  const [deviceMetrics, setDeviceMetrics] = useState<DeviceMetrics>({ ...DEVICE_METRICS_DEFAULT });
  const [weightSyncSource, setWeightSyncSource] = useState<string | null>(null);
  const [logWeightOpen, setLogWeightOpen] = useState(false);
  const [wearablesLoading, setWearablesLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const [visitsRes, ordersRes] = await Promise.all([
          VisitService.getPatientVisits(),
          getOrders(1, 1) // Just get the count
        ]);
        
        const activeTreatmentsCount = getActiveTreatmentVisits(visitsRes).length;
        
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

  // Fetch weight/BMI history (baseline + manual + wearable, persisted) and
  // today's readiness from connected wearables.
  useEffect(() => {
    const fetchWearables = async () => {
      try {
        const [connections, vitalsHistory, patientProfile, healthGoal] = await Promise.all([
          getConnections(),
          getVitalsHistory(),
          profileService.getPatientProfile(),
          getHealthGoal().catch(() => null),
        ]);
        
        const priorityList = patientProfile?.vitals_source_priority || ['questionnaire', 'patient_portal', 'wearable'];

        const [firstConnected] = connections.filter((c) => c.status === "connected");
        if (firstConnected) {
          setWeightSyncSource(formatConnection(firstConnected).name);

          const data = await getDeviceData();
          if (data) {
            setDeviceMetrics((prev) => ({
              ...prev,
              ...(data.readiness && { readiness: data.readiness }),
              ...(data.recovery && { recovery: data.recovery }),
              ...(data.sleepScore && { sleepScore: data.sleepScore }),
              ...(data.restingHr && { restingHr: data.restingHr }),
            }));
          }
        }

        setWeight((prev) => {
          const next = buildWeightData(vitalsHistory, prev, priorityList);
          return {
            ...next,
            targetWeightLbs: healthGoal?.goal?.target_weight_lbs != null
              ? Number(healthGoal.goal.target_weight_lbs)
              : next.targetWeightLbs,
            targetBmi: healthGoal?.goal?.target_bmi != null
              ? Number(healthGoal.goal.target_bmi)
              : next.targetBmi,
          };
        });
      } catch (error) {
        console.error("Failed to fetch wearables summary", error);
      } finally {
        setWearablesLoading(false);
      }
    };

    fetchWearables();
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

  const handleSaveLogWeight = async (v: number) => {
    try {
      await logWeight(v);
      const [history, patientProfile] = await Promise.all([
        getVitalsHistory(),
        profileService.getPatientProfile(),
      ]);
      const priorityList = patientProfile?.vitals_source_priority || ['questionnaire', 'patient_portal', 'wearable'];
      setWeight((prev) => buildWeightData(history, prev, priorityList));
    } catch (error: any) {
      if (error?.error) {
        const errorMsg = typeof error.error === 'string' 
          ? error.error 
          : error.error.message || "Failed to log weight.";
        toast.error(errorMsg);
      } else {
        toast.error(error?.message || "Failed to log weight.");
      }
    }
  };

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

      {/* ── Needs your attention ── */}
      <NeedsAttentionCard />

      {/* ── Follow-Up Questionnaires ── */}
      <div id="follow-up-questionnaires" className="km-dash-card km-fade">
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

      {/* ── Weight progress & Today's readiness ── */}
      <div className="km-fade">
        {wearablesLoading ? (
          <WeightAndReadinessSkeleton />
        ) : (
          <>
            {weight.series.length > 0 && (
              <WeightTrendCard
                weight={weight}
                onOpenGoalModal={() => navigate("/dashboard/devices")}
                bottomAction={{
                  label: "Log today's weight",
                  onClick: () => setLogWeightOpen(true),
                }}
                {...(weightSyncSource ? { syncedFrom: weightSyncSource } : {})}
              />
            )}
            <ReadinessCard deviceMetrics={deviceMetrics} />
          </>
        )}
      </div>

      <LogWeightModal
        open={logWeightOpen}
        onClose={() => setLogWeightOpen(false)}
        onSave={handleSaveLogWeight}
      />

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
