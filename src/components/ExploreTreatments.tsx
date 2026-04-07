/**
 * Explore Treatments Page — kinmeds3 design system
 * 
 * Standalone page showing all available treatments a patient can start.
 * Matches kinmeds3 reference `pg-explore` exactly.
 */

import { AvailableTreatmentsList } from "@/features/treatments";
import { Shield } from "lucide-react";

export default function ExploreTreatments() {
  return (
    <div>
      {/* Header */}
      <div className="km-fade" style={{ marginBottom: 18 }}>
        <p className="km-page-title">Explore Treatments</p>
        <p className="km-page-sub">Browse available options and get started</p>
      </div>

      {/* How it works banner */}
      <div
        className="km-card km-fade"
        style={{
          marginBottom: 16,
          background: "linear-gradient(135deg, rgba(79,142,247,0.08), rgba(167,139,250,0.06))",
          borderColor: "rgba(79,142,247,0.15)",
        }}
      >
        <div style={{ padding: 14, display: "flex", alignItems: "center", gap: 11 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--km-acp)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Shield size={18} style={{ color: "var(--km-ac)" }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--km-t)", marginBottom: 2 }}>
              How it works
            </div>
            <div style={{ fontSize: 12, color: "var(--km-tm)", lineHeight: 1.5 }}>
              Select a treatment, complete a short intake questionnaire, and a licensed provider
              will review your case. Visit type may vary based on your state.
            </div>
          </div>
        </div>
      </div>

      {/* Treatments list */}
      <div className="km-fade">
        <AvailableTreatmentsList />
      </div>
    </div>
  );
}
