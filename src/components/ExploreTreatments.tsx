/**
 * Explore Treatments Page — kinmeds3 design system
 *
 * Fully dynamic page - all copy (title, subtitle, sections) comes from
 * EXPLORE_PAGE_CONTENT, not hardcoded here. Only the "Get Started" button stub is static.
 * Matches kinmeds3 reference `pg-explore` exactly.
 */

import { AvailableTreatmentsList } from "@/features/treatments";
import { EXPLORE_PAGE_CONTENT as content } from "@/features/treatments/config/pageContent";
import { Shield } from "lucide-react";

export default function ExploreTreatments() {
  return (
    <div id="pg-explore">
      {/* Header - Dynamic title and subtitle */}
      <div className="km-fade" style={{ marginBottom: 18 }}>
        <p className="km-page-title">{content.title}</p>
        <p className="km-page-sub">{content.subtitle}</p>
      </div>

      {/* How it works banner - Dynamic content */}
      <div
        className="km-card km-fade"
        style={{
          marginBottom: 16,
          background: "linear-gradient(135deg, rgba(79,142,247,0.08), rgba(167,139,250,0.06))",
          borderColor: "rgba(79,142,247,0.15)",
          borderRadius: "var(--km-r)",
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
              {content.howItWorks.title}
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--km-tm)", lineHeight: 1.5 }}>
              {content.howItWorks.description}
            </div>
          </div>
        </div>
      </div>

      {/* Treatments list - Dynamic from API */}
      <div className="km-fade">
        <AvailableTreatmentsList
          browseLabel={content.browseLabel}
          emptyStateTitle={content.emptyState.title}
          emptyStateDescription={content.emptyState.description}
        />
      </div>
    </div>
  );
}
