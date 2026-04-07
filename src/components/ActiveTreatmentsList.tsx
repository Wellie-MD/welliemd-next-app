/**
 * Active Treatments List (Dashboard Section)
 * Uses kinmeds3 tracking — .km-atx classes and icons
 */

import { useEffect, useState } from "react";
import { Edit2 } from "lucide-react";
import { VisitService, Visit } from "@/features/visits/services/visit.service";

const INACTIVE_STATUSES = ["completed", "cancelled"];

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
        {[1, 2].map((i) => (
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

  return (
    <>
      {visits.map((visit) => (
        <div key={visit.id} className="km-atx">
          <div className="km-atxic">
            <Edit2 size={18} style={{ strokeWidth: 1.8 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="km-atxnm">{visit.visit_type}</div>
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
