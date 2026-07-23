/** Shared utility functions for the admin Labs feature. */
import React from "react";

/** Turns a raw snake_case/keyword status ("in_process") into a plain-English label ("In Process"). */
export function humanizeStatus(value?: string): string {
  const trimmed = (value || "").trim();
  if (!trimmed) return "-";
  return trimmed.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getCollectionMethodLabel(method: string): string {
  const map: Record<string, string> = {
    at_home_phlebotomy: "At-home phlebotomy",
    on_site_collection: "On-site collection",
    walk_in_test: "Walk-in test",
    testkit: "Test kit",
  };
  return map[method] ?? method.replace(/_/g, " ");
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
