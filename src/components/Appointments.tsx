/**
 * Patient Visits Page — kinmeds3 design system
 * 
 * Matches kinmeds3 pg-visits exactly:
 * - Visit type legend (Async / Scheduled dots)
 * - Month group headers (Uppercase, bold)
 * - Visit cards with type dot, name, master_id, status badge
 * - Action-required amber boxes for pending/dropped visits
 * - Full-width "Complete Questionnaire" button
 * - Completed visits with subtle opacity
 */

import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { VisitService, Visit } from "@/features/visits/services/visit.service";

/** Get the display name for a treatment — prefer template name over visit_type slug */
function getTreatmentName(visit: Visit): string {
  if (visit.assigned_template?.treatment_type) {
    return visit.assigned_template.treatment_type;
  }
  if (visit.assigned_template?.name) {
    return visit.assigned_template.name;
  }
  return visit.visit_type
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// Status → badge config per kinmeds3
const STATUS_CONFIG: Record<string, { label: string; css: string }> = {
  draft:                { label: "Pending",         css: "km-badge km-badge-amber" },
  submitted:            { label: "Submitted",       css: "km-badge km-badge-blue" },
  approved:             { label: "Approved",        css: "km-badge km-badge-green" },
  in_review:            { label: "In Review",       css: "km-badge km-badge-amber" },
  pending:              { label: "Pending",         css: "km-badge km-badge-amber" },
  completed:            { label: "Completed",       css: "km-badge km-badge-green-soft" },
  cancelled:            { label: "Cancelled",       css: "km-badge km-badge-red" },
  canceled:             { label: "Cancelled",       css: "km-badge km-badge-red" },
  visit_pending:        { label: "Pending",         css: "km-badge km-badge-amber" },
  visit_scheduled:      { label: "Scheduled",       css: "km-badge km-badge-blue" },
  visit_rescheduled:    { label: "Rescheduled",     css: "km-badge km-badge-amber" },
  visit_failed:         { label: "Failed",          css: "km-badge km-badge-red" },
  visit_cancelled:      { label: "Cancelled",       css: "km-badge km-badge-red" },
  consult_canceled:     { label: "Canceled",        css: "km-badge km-badge-red" },
  referred:             { label: "Referred",        css: "km-badge km-badge-purple" },
  prescribed:           { label: "Prescribed",      css: "km-badge km-badge-blue" },
  rx_sent:              { label: "Rx Sent",         css: "km-badge km-badge-green" },
  shipped:              { label: "Shipped",         css: "km-badge km-badge-green" },
  sending_to_beluga:    { label: "Processing",      css: "km-badge km-badge-gray" },
  sent_to_beluga:       { label: "Processing",      css: "km-badge km-badge-gray" },
  no_show:              { label: "No Show",         css: "km-badge km-badge-red" },
  order_created:        { label: "Order Created",   css: "km-badge km-badge-gray" },
  refunded:             { label: "Refunded",        css: "km-badge km-badge-green" },
};

export default function Appointments() {
  const navigate = useNavigate();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumingId, setResumingId] = useState<string | null>(null);

  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await VisitService.getPatientVisits();
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setVisits(data);
    } catch {
      setError("Failed to load visits. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async (visitId: string) => {
    setResumingId(visitId);
    try {
      const result = await VisitService.resumeQuestionnaire(visitId);
      if (result.success && result.questionnaire_url) {
        window.location.assign(result.questionnaire_url);
      } else if (result.can_restart) {
        // Session expired or not found — redirect to start fresh
        navigate('/dashboard/treatments');
      } else {
        setError(result.error || 'Could not resume questionnaire.');
      }
    } catch {
      navigate('/dashboard/treatments');
    } finally {
      setResumingId(null);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (d: string | null) => {
    if (!d) return "";
    return new Date(d).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const groupByMonth = (visits: Visit[]) => {
    const groups: { label: string; visits: Visit[] }[] = [];
    const map = new Map<string, Visit[]>();

    for (const v of visits) {
      const d = new Date(v.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
      if (!map.has(key)) {
        map.set(key, []);
        groups.push({ label, visits: map.get(key)! });
      }
      map.get(key)!.push(v);
    }
    return groups;
  };

  const getStatusConfig = (status: string) =>
    STATUS_CONFIG[status.toLowerCase()] || { label: status, css: "km-badge km-badge-gray" };

  const canCompleteCheckout = (v: Visit) => {
    const isDraft = v.status.toLowerCase() === 'draft';
    const canPay = ['created', 'payment_pending'].includes((v.order_status || '').toLowerCase());
    return isDraft && canPay && Boolean(v.checkout_url);
  };

  // Statuses that need action (dropped/incomplete questionnaire)
  const needsAction = (v: Visit) =>
    canCompleteCheckout(v) || ["pending", "visit_pending", "in_review", "submitted"].includes(v.status.toLowerCase());

  const isCompleted = (v: Visit) =>
    v.status.toLowerCase() === "completed";

  const isScheduled = (v: Visit) =>
    (v.visit_type || "").toLowerCase().includes("scheduled");

  const monthGroups = groupByMonth(visits);

  return (
    <div className="pg" id="pg-visits">
      <div className="km-fade" style={{ marginBottom: 24 }}>
        <p className="km-page-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: 32 }}>Visits</p>
        <p className="km-page-sub">All visits across your treatments</p>
      </div>

      {/* Legend */}
      <div className="km-fade" style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--km-tm)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--km-ac)' }} />
          Async
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--km-tm)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--km-pu)' }} />
          Scheduled
        </div>
      </div>

      {loading ? (
        <div className="km-empty" style={{ padding: '60px 0' }}>
          <Loader2 size={24} style={{ color: 'var(--km-ac)', animation: 'spin 2s linear infinite' }} />
          <div className="km-et" style={{ marginTop: 12 }}>Loading your visits...</div>
        </div>
      ) : error ? (
        <div className="km-empty" style={{ padding: '60px 0' }}>
          <AlertCircle size={24} style={{ color: 'var(--km-re)' }} />
          <div className="km-et" style={{ marginTop: 12 }}>{error}</div>
          <button onClick={loadVisits} className="km-btn km-btn-outline" style={{ marginTop: 12 }}>Try again</button>
        </div>
      ) : visits.length === 0 ? (
        <div className="km-empty" style={{ padding: '60px 0' }}>
          <div className="km-et">No visits found</div>
          <div className="km-es">Start a treatment to see your journey here.</div>
        </div>
      ) : (
        <div className="km-fade">
          {monthGroups.map((group) => (
            <div key={group.label}>
              {/* Month header */}
              <div className="km-fade" style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '.5px', color: 'var(--km-tm)',
                marginBottom: 8, marginTop: 6,
              }}>
                {group.label}
              </div>

              {group.visits.map((visit) => {
                const status = getStatusConfig(visit.status);
                const pending = needsAction(visit);
                const checkoutPending = canCompleteCheckout(visit);
                const completed = isCompleted(visit);
                const scheduled = isScheduled(visit);
                const dotColor = scheduled ? 'var(--km-pu)' : 'var(--km-ac)';

                return (
                  <div
                    key={visit.id}
                    className="km-sc km-fade"
                    style={{
                      marginBottom: 8,
                      opacity: completed ? 0.75 : 1,
                      borderColor: pending
                        ? 'rgba(245, 158, 11, 0.25)'
                        : 'var(--km-b)',
                    }}
                  >
                    <div style={{ padding: 14 }}>
                      {/* Header row: dot + name + meta | badge */}
                      <div style={{
                        display: 'flex', alignItems: 'flex-start',
                        justifyContent: 'space-between', gap: 10,
                        marginBottom: pending ? 10 : 0,
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <div style={{
                              width: 7, height: 7, borderRadius: '50%',
                              background: dotColor, flexShrink: 0,
                            }} />
                            <span style={{ fontSize: 13, fontWeight: 700 }}>
                              {getTreatmentName(visit)}
                            </span>
                          </div>
                          <div style={{
                            fontSize: 11, color: 'var(--km-tm)',
                            marginLeft: 13, fontFamily: 'monospace',
                          }}>
                            {(visit.master_id || "wellie-00000").toLowerCase()}
                            {' · '}
                            {scheduled ? 'Scheduled' : 'Async'}
                            {scheduled && visit.submitted_at
                              ? ` · ${formatDate(visit.submitted_at)} · ${formatTime(visit.submitted_at)}`
                              : ` · ${formatDate(visit.created_at)}`
                            }
                          </div>
                        </div>
                        <span className={status.css}>{status.label}</span>
                      </div>

                      {/* Action required box for pending/dropped visits */}
                      {pending && (
                        <>
                          <div style={{
                            background: 'var(--km-amp)',
                            border: '1px solid rgba(245, 158, 11, 0.2)',
                            borderRadius: 8,
                            padding: '10px 12px',
                            marginBottom: 10,
                          }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--km-am)', marginBottom: 2 }}>
                              Action required
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--km-tm)' }}>
                              {scheduled
                                ? 'Complete your questionnaire to unlock scheduling'
                                : 'Complete your questionnaire to continue care'}
                            </div>
                          </div>
                          <button
                            className="km-btn-large-grey"
                            disabled={resumingId === visit.id}
                            onClick={() => {
                              if (checkoutPending && visit.checkout_url) {
                                window.location.assign(visit.checkout_url);
                                return;
                              }
                              void handleResume(visit.id);
                            }}
                          >
                            {resumingId === visit.id ? (
                              <>
                                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />
                                Resuming…
                              </>
                            ) : (
                              'Complete Questionnaire'
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
