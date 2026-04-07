/**
 * Patient Visits Page — kinmeds3 design system
 * 
 * Matches kinmeds3 pg-visits exactly:
 * - Visit type legend (Async / Scheduled dots)
 * - Month group headers (Uppercase, bold)
 * - Visit cards with type dot, name, master_id, status badge
 * - Action-required amber boxes for pending visits
 * - Full-width grey action button
 * - Completed visits with subtle opacity
 */

import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { VisitService, Visit } from "@/features/visits/services/visit.service";

// Status → km-badge mapping
const STATUS_CONFIG: Record<string, { label: string; css: string }> = {
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
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      setError("Failed to load visits. Please try again.");
    } finally {
      setLoading(false);
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

  const groupByMonth = (visits: Visit[]) => {
    const groups: { label: string; visits: Visit[] }[] = [];
    const map = new Map<string, Visit[]>();

    for (const v of visits) {
      const d = new Date(v.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { year: "numeric", month: "long" }).toUpperCase();
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

  const isPending = (v: Visit) =>
    ["pending", "visit_pending", "in_review", "submitted"].includes(v.status.toLowerCase());

  const monthGroups = groupByMonth(visits);

  return (
    <div className="pg" id="pg-visits">
      <div className="km-fade" style={{ marginBottom: 24 }}>
        <p className="km-page-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: 32 }}>Visits</p>
        <p className="km-page-sub">All visits across your treatments</p>
      </div>

      <div className="km-fade" style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--km-tm)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
          Async
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--km-tm)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6' }} />
          Scheduled
        </div>
      </div>

      {loading ? (
        <div className="km-empty" style={{ padding: '60px 0' }}>
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--km-ac)' }} />
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
            <div key={group.label} style={{ marginBottom: 32 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--km-tm)', marginBottom: 12, letterSpacing: '0.05em' }}>
                {group.label}
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {group.visits.map((visit) => {
                  const status = getStatusConfig(visit.status);
                  const isScheduled = (visit.visit_type || "").toLowerCase().includes("scheduled");
                  const pending = isPending(visit);
                  const completed = visit.status.toLowerCase() === 'completed';

                  return (
                    <div 
                      key={visit.id} 
                      className="km-sc" 
                      style={{ 
                        padding: 20, 
                        opacity: completed ? 0.7 : 1,
                        border: pending ? '1px solid var(--km-am)' : '1px solid var(--km-b)',
                        boxShadow: pending ? '0 4px 12px rgba(251, 191, 36, 0.05)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: pending ? 16 : 0 }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <div style={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            background: isScheduled ? '#8b5cf6' : '#3b82f6',
                            marginTop: 6
                          }} />
                          <div>
                            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--km-t)', marginBottom: 4 }}>
                              {visit.visit_type}
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--km-tm)', fontFamily: 'monospace' }}>
                              {(visit.master_id || "wellie-00000").toLowerCase()} · {isScheduled ? "Scheduled" : "Async"} · {formatDate(visit.created_at)}
                            </p>
                          </div>
                        </div>
                        <span className={status.css}>{status.label}</span>
                      </div>

                      {pending && (
                        <div className="km-fade" style={{ marginTop: 16 }}>
                          <div className="km-vbox-warning">
                            <p className="km-vbox-warning-title">Action required</p>
                            <p className="km-vbox-warning-desc">
                              Complete your follow-up questionnaire to {isScheduled ? 'unlock scheduling' : 'continue care'}
                            </p>
                          </div>
                          <button 
                            className="km-btn-large-grey"
                            onClick={() => alert("Redirecting to questionnaire...")}
                          >
                            Complete Questionnaire
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
