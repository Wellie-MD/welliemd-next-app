/**
 * Patient Treatments Page — kinmeds3 design system
 * 
 * Matches kinmeds3 pg-treatments exactly:
 * - Page title + subtitle
 * - Each treatment card: icon + name + date + badge + Last Visit/Upcoming Visit grid + View Visits button
 * - Footer CTA: "Want to add a treatment? Explore options →"
 */

import { useEffect, useState } from "react";
import { Edit2, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { VisitService, Visit } from "@/features/visits/services/visit.service";

export default function Treatments() {
  const navigate = useNavigate();
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
      setVisits(data);
    } catch (err) {
      console.error("Failed to load visits:", err);
      setError("Failed to load treatments. Please try again.");
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

  // Compute an upcoming visit date (30 days after last visit as estimate)
  const getUpcomingDate = (visit: Visit) => {
    const base = visit.submitted_at || visit.created_at;
    if (!base) return "—";
    const d = new Date(base);
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Active vs completed
  const activeTreatments = visits.filter(
    (v) => !["completed", "cancelled"].includes(v.status.toLowerCase())
  );

  return (
    <div id="pg-treatments">
      {/* Header */}
      <div className="km-fade" style={{ marginBottom: 18 }}>
        <div className="km-page-title">Treatments</div>
        <div className="km-page-sub">Your active treatments</div>
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="km-card" style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div className="km-skel" style={{ width: 36, height: 36, borderRadius: 10 }} />
                <div style={{ flex: 1 }}>
                  <div className="km-skel" style={{ width: "50%", height: 14, marginBottom: 6 }} />
                  <div className="km-skel" style={{ width: "35%", height: 10 }} />
                </div>
              </div>
              <div className="km-info-grid" style={{ marginBottom: 12 }}>
                <div className="km-skel" style={{ height: 52, borderRadius: 8 }} />
                <div className="km-skel" style={{ height: 52, borderRadius: 8 }} />
              </div>
              <div className="km-skel" style={{ height: 36, borderRadius: 8 }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="km-vbox km-vbox-red km-fade">
          <div style={{ flex: 1 }}>
            <div style={{ color: "var(--km-t)", fontWeight: 600, marginBottom: 2 }}>{error}</div>
            <button
              onClick={loadVisits}
              style={{
                background: "none",
                border: "none",
                color: "var(--km-ac)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Try again
            </button>
          </div>
        </div>
      ) : activeTreatments.length > 0 ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activeTreatments.map((visit) => (
              <div key={visit.id} className="km-card km-fade" style={{ marginBottom: 0 }}>
                <div style={{ padding: 14 }}>
                  {/* Treatment header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      className="km-atx-icon"
                      style={{ background: "var(--km-acp)", color: "var(--km-ac)" }}
                    >
                      <Edit2 size={18} style={{ strokeWidth: 1.8 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="km-atx-name">{visit.visit_type}</div>
                      <div className="km-atx-meta">
                        Started {formatDate(visit.created_at)}
                        {visit.visit_type && " · "}
                        {visit.visit_type === "async" || !visit.visit_type ? "Async" : visit.visit_type}
                      </div>
                    </div>
                    <span className="km-badge km-badge-blue">Active</span>
                  </div>

                  {/* Last Visit / Upcoming Visit grid */}
                  <div className="km-info-grid">
                    <div className="km-info-box">
                      <div className="km-info-label">Last Visit</div>
                      <div className="km-info-value">
                        {formatDate(visit.submitted_at || visit.created_at)}
                      </div>
                    </div>
                    <div className="km-info-box">
                      <div className="km-info-label">Upcoming Visit</div>
                      <div className="km-info-value">{getUpcomingDate(visit)}</div>
                    </div>
                  </div>

                  {/* View Visits button */}
                  <button
                    className="km-btn km-btn-outline"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      fontSize: 12,
                    }}
                    onClick={() => navigate("/dashboard/appointments")}
                  >
                    <Calendar size={13} />
                    View Visits
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="km-fade" style={{ textAlign: "center", padding: "14px 0 4px" }}>
            <span style={{ fontSize: 13, color: "var(--km-tm)" }}>
              Want to add a treatment?{" "}
            </span>
            <span
              style={{
                fontSize: 13,
                color: "var(--km-ac)",
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={() => navigate("/dashboard/explore")}
            >
              Explore options →
            </span>
          </div>
        </>
      ) : (
        <div className="km-card km-fade">
          <div className="km-empty">
            <Edit2 size={36} style={{ color: "var(--km-td)", marginBottom: 10, strokeWidth: 1.5 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--km-t)", marginBottom: 4 }}>
              No active treatments
            </div>
            <div style={{ fontSize: 12, color: "var(--km-tm)", marginBottom: 12 }}>
              Start a treatment to begin your care journey.
            </div>
            <button
              className="km-btn km-btn-primary"
              onClick={() => navigate("/dashboard/explore")}
            >
              Explore Treatments
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
