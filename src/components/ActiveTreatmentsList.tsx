/**
 * Active Treatments List (Dashboard Section)
 * Uses kinmeds3 tracking — .km-atx classes and icons
 * Shows max 3 treatments on dashboard; "View all" shows rest
 */

import { useEffect, useState } from "react";
import { Edit2 } from "lucide-react";
import { VisitService, Visit } from "@/features/visits/services/visit.service";

const INACTIVE_STATUSES = ["completed", "cancelled"];
const DASHBOARD_LIMIT = 3;

/** Get the display name for a treatment — prefer template name over visit_type slug */
function getTreatmentName(visit: Visit): string {
  if (visit.assigned_template?.treatment_type) {
    return visit.assigned_template.treatment_type;
  }
  if (visit.assigned_template?.name) {
    return visit.assigned_template.name;
  }
  // Fallback: humanize the visit_type slug
  return visit.visit_type
    .replace(/([A-Z])/g, " $1")   // camelCase → spaces
    .replace(/[_-]+/g, " ")        // snake_case/kebab → spaces
    .replace(/\b\w/g, (c) => c.toUpperCase()) // capitalize words
    .trim();
}

export function ActiveTreatmentsList() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await VisitService.getPatientVisits();
        setVisits(data.filter((v) => !INACTIVE_STATUSES.includes(v.status.toLowerCase())));
      } catch {
        // Silent — dashboard section doesn't block
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="km-atx">
            <div className="km-skel" style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="km-skel" style={{ width: 100, height: 14, marginBottom: 4 }} />
              <div className="km-skel" style={{ width: 140, height: 10 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <div style={{ fontSize: 13, color: "var(--km-tm)", textAlign: "center", padding: "10px 0" }}>
        No active treatments.
      </div>
    );
  }

  // Only show first 3 on dashboard
  const displayedVisits = visits.slice(0, DASHBOARD_LIMIT);

  return (
    <>
      {displayedVisits.map((visit, idx) => (
        <div
          key={visit.id}
          className="km-atx"
          style={idx === displayedVisits.length - 1 ? { marginBottom: 0 } : undefined}
        >
          <div className="km-atxic">
            <Edit2 size={18} style={{ strokeWidth: 1.8 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="km-atxnm">{getTreatmentName(visit)}</div>
            <div className="km-atxmt">
              Started {formatDate(visit.created_at)}
            </div>
          </div>
          <span className="km-badge km-badge-blue">Active</span>
        </div>
      ))}
    </>
  );
}
