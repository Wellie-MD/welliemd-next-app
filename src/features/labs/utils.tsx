/** Shared utility functions for the admin Labs feature. */
import React from "react";
import type { CombinedLabPanel } from "./types";

export function getCollectionMethodLabel(method: string): string {
  const map: Record<string, string> = {
    at_home_phlebotomy: "At-home phlebotomy",
    on_site_collection: "On-site collection",
    walk_in_test: "Walk-in test",
    testkit: "Test kit",
  };
  return map[method] ?? method.replace(/_/g, " ");
}

export function isPendingJunctionStatus(status: string | undefined): boolean {
  return ["pending", "pending_approval", "pending_submission"].includes(
    (status || "").toLowerCase(),
  );
}

export function isCombinedAssignmentReady(panel: CombinedLabPanel): boolean {
  return panel.is_assignable === true
    && panel.is_active
    && !panel.is_archived
    && panel.lifecycle_state === "published"
    && panel.compatibility_status === "approved";
}

export function getCombinedApprovalBasis(
  compatibilityStatus: string | undefined,
  evidenceStatus?: "looks_like_match" | "differences_found" | "not_enough_information",
): "exact_loinc" | "manual_review" | null {
  if (compatibilityStatus === "exact_candidate") return "exact_loinc";
  if (compatibilityStatus === "review_required") return "manual_review";
  if (compatibilityStatus !== "unvalidated") return null;
  if (evidenceStatus === "looks_like_match") return "exact_loinc";
  if (evidenceStatus === "differences_found" || evidenceStatus === "not_enough_information") return "manual_review";
  return null;
}

export function getCombinedWorkflowLabel(panel: CombinedLabPanel): string {
  if (isCombinedAssignmentReady(panel)) return "Published";
  if (!panel.is_active) return "Disabled";
  if (panel.compatibility_status === "approved") return "Ready to publish";
  if (panel.compatibility_status === "exact_candidate") return "Ready for approval";
  return "Manual review required";
}

export function getCombinedJunctionStatus(
  methods: Array<Record<string, unknown>> | undefined,
  fallback = "pending_submission",
): string {
  if (!methods?.length) return fallback;
  const statuses = methods.map(method => String(method.junction_status ?? "").toLowerCase());
  if (statuses.some(status => ["failed", "rejected", "needs_support"].includes(status))) {
    return "failed";
  }
  if (methods.every(method => method.is_orderable === true || String(method.operational_status ?? "").toLowerCase() === "active")) {
    return "active";
  }
  if (statuses.some(status => status === "pending_approval")) return "pending_approval";
  return "pending_submission";
}

export function renderJunctionStatusBadge(status: string): React.ReactElement {
  // Importing React here via JSX transform — no explicit import needed in modern TS setups,
  // but we import it explicitly to be safe in environments without the automatic JSX transform.
  const normalized = (status || "").toLowerCase();

  if (normalized === "active") {
    return (
      <span className="inline-block border px-[10px] py-[3px] rounded-[11px] text-[11px] font-semibold bg-[#dcfce7] text-[#166534] border-[#bbf7d0]">
        Active
      </span>
    );
  }
  if (
    normalized === "pending" ||
    normalized === "pending_approval" ||
    normalized === "pending_submission"
  ) {
    return (
      <span className="inline-block border px-[10px] py-[3px] rounded-[11px] text-[11px] font-semibold bg-[#fef3c7] text-[#92400e] border-[#fde68a]">
        {normalized === "pending_submission" ? "Pending submission" : "Pending approval"}
      </span>
    );
  }
  if (normalized === "failed") {
    return (
      <span className="inline-block border px-[10px] py-[3px] rounded-[11px] text-[11px] font-semibold bg-[#fee2e2] text-[#991b1b] border-[#fecaca]">
        Failed
      </span>
    );
  }
  if (normalized === "archived") {
    return (
      <span className="inline-block border px-[10px] py-[3px] rounded-[11px] text-[11px] font-semibold bg-[#f8fafc] text-[#94a3b8] border-[#e2e8f0]">
        Archived
      </span>
    );
  }
  return (
    <span className="inline-block border px-[10px] py-[3px] rounded-[11px] text-[11px] font-semibold bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]">
      Draft
    </span>
  );
}
