import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, ClipboardList, CalendarDays } from "lucide-react";
import { getOrdersByStatus, type PatientOrder, type PaginatedOrdersResponse } from "@/shared/api/ordersApi";
import { getPatientFollowUps, type FollowUp } from "@/features/followups/api";
import { getStandaloneLabSubmissions, type StandaloneLabSubmission } from "@/features/labs/api/index";

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function isLabAwaitingBooking(sub: StandaloneLabSubmission): boolean {
  const stage = (sub.stage || "").toLowerCase();
  const bucket = (sub.bucket || "").toLowerCase();
  const hasBooking = Boolean(sub.booking_link || sub.booking_url);
  return stage.includes("appointment_pending") || (bucket === "needs_attention" && hasBooking);
}

export default function NeedsAttentionCard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingOrders, setPendingOrders] = useState<PatientOrder[]>([]);
  const [pendingFollowUps, setPendingFollowUps] = useState<FollowUp[]>([]);
  const [pendingLab, setPendingLab] = useState<StandaloneLabSubmission | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const emptyOrders: PaginatedOrdersResponse = { count: 0, next: null, previous: null, results: [] };
      const [ordersRes, followUps, labSubmissions] = await Promise.all([
        getOrdersByStatus("payment_pending").catch(() => emptyOrders),
        getPatientFollowUps(),
        getStandaloneLabSubmissions(),
      ]);
      if (cancelled) return;

      setPendingOrders(ordersRes.results || []);
      setPendingFollowUps(
        (followUps || []).filter(
          (f) => f.is_active !== false && ["CREATED", "VIEWED", "IN_PROGRESS"].includes(f.status)
        )
      );
      setPendingLab((labSubmissions || []).find(isLabAwaitingBooking) || null);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return null;

  const hasOrders = pendingOrders.length > 0;
  const hasFollowUps = pendingFollowUps.length > 0;
  const hasLab = Boolean(pendingLab);

  if (!hasOrders && !hasFollowUps && !hasLab) return null;

  const totalDue = pendingOrders.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
  const orderNames = Array.from(new Set(pendingOrders.map((o) => o.product_name).filter(Boolean)));
  const followUpTypes = Array.from(new Set(pendingFollowUps.map((f) => f.treatment_type).filter(Boolean)));

  const handlePayNow = () => {
    if (pendingOrders.length === 1 && pendingOrders[0].checkout_url) {
      window.location.assign(pendingOrders[0].checkout_url);
    } else {
      navigate("/dashboard/orders");
    }
  };

  const handleCompleteFollowUps = () => {
    document.getElementById("follow-up-questionnaires")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleBookLab = () => {
    navigate("/dashboard/labs");
  };

  return (
    <div className="km-dash-card km-fade">
      <div className="km-dash-ch" style={{ paddingBottom: 10 }}>
        <div className="km-dash-ctrow">
          <div className="km-dash-ci amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
          </div>
          <span className="km-dash-ct">Needs your attention</span>
        </div>
      </div>

      <div>
        {hasOrders && (
          <>
            <div className="km-attn-item">
              <div className="km-attn-icon amber">
                <CreditCard size={17} strokeWidth={2} />
              </div>
              <div className="km-attn-body">
                <div className="km-attn-title">
                  {pendingOrders.length} order{pendingOrders.length > 1 ? "s" : ""} awaiting payment
                </div>
                <div className="km-attn-sub">{orderNames.join(" & ")}</div>
              </div>
              <div className="km-attn-action">
                <div className="km-attn-amount">{formatCurrency(totalDue)}</div>
                <button className="km-btn km-btn-primary" style={{ fontSize: 11, padding: "6px 12px" }} onClick={handlePayNow}>
                  Pay Now
                </button>
              </div>
            </div>
            {(hasFollowUps || hasLab) && <div className="km-attn-divider" />}
          </>
        )}

        {hasFollowUps && (
          <>
            <div className="km-attn-item">
              <div className="km-attn-icon blue">
                <ClipboardList size={17} strokeWidth={2} />
              </div>
              <div className="km-attn-body">
                <div className="km-attn-title">
                  {pendingFollowUps.length} follow-up{pendingFollowUps.length > 1 ? "s" : ""} pending
                </div>
                <div className="km-attn-sub">
                  {followUpTypes.length > 0
                    ? `${followUpTypes.join(" & ")} follow-up questionnaire${pendingFollowUps.length > 1 ? "s" : ""}`
                    : "Questionnaires ready for your response"}
                </div>
              </div>
              <div className="km-attn-action">
                <button className="km-btn km-btn-outline" style={{ fontSize: 11, padding: "6px 12px" }} onClick={handleCompleteFollowUps}>
                  Complete
                </button>
              </div>
            </div>
            {hasLab && <div className="km-attn-divider" />}
          </>
        )}

        {hasLab && pendingLab && (
          <div className="km-attn-item">
            <div className="km-attn-icon purple">
              <CalendarDays size={17} strokeWidth={2} />
            </div>
            <div className="km-attn-body">
              <div className="km-attn-title">Book your lab appointment</div>
              <div className="km-attn-sub">
                {pendingLab.lab_panel_name || "Lab panel"}
                {pendingLab.lab_provider ? ` at ${pendingLab.lab_provider}` : ""}
              </div>
            </div>
            <div className="km-attn-action">
              <button className="km-btn km-btn-outline" style={{ fontSize: 11, padding: "6px 12px" }} onClick={handleBookLab}>
                Book Appointment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
