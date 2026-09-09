import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import LabsTable from "../src/features/labs/components/LabsTable";
import type { LabPanel } from "../src/api/labs";
import type { CombinedLabPanel } from "../src/features/labs/types";
import { getCombinedApprovalBasis } from "../src/features/labs/utils";

const pendingAssignedLab: LabPanel = {
  id: "panel-pending-live",
  name: "Metabolic At-Home Panel",
  description: "",
  lab_provider: "Quest",
  biomarkers: [],
  fasting_required: "no",
  collection_method: "at_home_phlebotomy",
  cost_to_client: 20,
  cost_to_welliemd: 10,
  is_active: true,
  junction_status: "pending",
  service_states: [],
  configuration_status: "complete",
  configuration_missing: [],
  is_assignable: true,
};

const combined: CombinedLabPanel = {
  id: "combined-1",
  name: "Comprehensive Metabolic Panel (At-home + Walk-in)",
  description: "",
  category: "General",
  is_combined: true,
  derived_status: "ready",
  configuration_status: "ready_to_assign",
  configuration_missing: [],
  is_assignable: true,
  compatibility_status: "approved",
  lifecycle_state: "published",
  members: [
    {
      id: "member-1",
      panel_id: "panel-1",
      panel_name: "Comprehensive Metabolic Panel",
      collection_method: "at_home_phlebotomy",
      junction_status: "active",
      junction_lab_test_id: "junction-1",
      lab_provider: "Quest Diagnostics",
      is_orderable: true,
      display_order: 1,
    },
    {
      id: "member-2",
      panel_id: "panel-2",
      panel_name: "Comprehensive Metabolic Panel (Walk-in)",
      collection_method: "walk_in_test",
      junction_status: "active",
      junction_lab_test_id: "junction-2",
      lab_provider: "LabCorp",
      is_orderable: true,
      display_order: 2,
    },
  ],
  cost_to_client: { amount: "45.00", currency: "USD" },
  cost_to_welliemd: { amount: "12.00", currency: "USD" },
  is_active: true,
  is_archived: false,
  service_states: ["TX", "NY"],
  created_at: "2026-09-07T00:00:00Z",
  updated_at: "2026-09-07T00:00:00Z",
};

const html = renderToStaticMarkup(
  <LabsTable
    labs={[]}
    combinedPanels={[combined]}
    assignmentSummary={{}}
    search=""
    onSearchChange={() => undefined}
    statusFilter="All"
    onStatusFilterChange={() => undefined}
    selectedRowIds={[]}
    onRowSelect={() => undefined}
    onSelectAll={() => undefined}
    onToggleActive={async () => undefined}
    onEditOpen={() => undefined}
    onAssignOpenSingle={async () => undefined}
    onAssignOpenCombined={async () => undefined}
    onArchive={async () => undefined}
    onArchiveCombined={async () => undefined}
  />,
);

assert.match(html, /Comprehensive Metabolic Panel \(At-home \+ Walk-in\)/);
assert.match(html, />COMBINED</);
assert.match(html, /Comprehensive Metabolic Panel \(Walk-in\)/);
assert.match(html, /\$45\.00/);
assert.match(html, /cost \$12\.00/);
assert.match(html, />Linked</);
assert.doesNotMatch(html, /aria-label="Edit Comprehensive Metabolic Panel/);
assert.doesNotMatch(html, /aria-label="Review Comprehensive Metabolic Panel/);
assert.match(html, /overflow-x-auto/);

console.log("Admin Labs combined-row prototype render contract passed.");

const pendingAssignedHtml = renderToStaticMarkup(
  <LabsTable
    labs={[pendingAssignedLab]}
    combinedPanels={[]}
    assignmentSummary={{
      [pendingAssignedLab.id]: { assigned: 1, submitted: 1, live: 1 },
    }}
    search=""
    onSearchChange={() => undefined}
    statusFilter="All"
    onStatusFilterChange={() => undefined}
    selectedRowIds={[]}
    onRowSelect={() => undefined}
    onSelectAll={() => undefined}
    onToggleActive={async () => undefined}
    onEditOpen={() => undefined}
    onAssignOpenSingle={async () => undefined}
    onArchive={async () => undefined}
  />,
);

assert.match(pendingAssignedHtml, />Pending approval</);
assert.match(pendingAssignedHtml, />1 client live</);
assert.doesNotMatch(pendingAssignedHtml, /1 client synced/);

console.log("Admin Labs Junction/local-status separation contract passed.");

const pendingFilterHtml = renderToStaticMarkup(
  <LabsTable
    labs={[pendingAssignedLab]}
    combinedPanels={[]}
    assignmentSummary={{
      [pendingAssignedLab.id]: { assigned: 1, submitted: 1, live: 1 },
    }}
    search=""
    onSearchChange={() => undefined}
    statusFilter="Pending approval"
    onStatusFilterChange={() => undefined}
    selectedRowIds={[]}
    onRowSelect={() => undefined}
    onSelectAll={() => undefined}
    onToggleActive={async () => undefined}
    onEditOpen={() => undefined}
    onAssignOpenSingle={async () => undefined}
    onArchive={async () => undefined}
  />,
);

assert.match(pendingFilterHtml, /Metabolic At-Home Panel/);

console.log("Admin Labs pending Junction filter contract passed.");

const needsReviewHtml = renderToStaticMarkup(
  <LabsTable
    labs={[]}
    combinedPanels={[{ ...combined, lifecycle_state: "needs_review", compatibility_status: "exact_candidate" }]}
    assignmentSummary={{}}
    search=""
    onSearchChange={() => undefined}
    statusFilter="All"
    onStatusFilterChange={() => undefined}
    selectedRowIds={[]}
    onRowSelect={() => undefined}
    onSelectAll={() => undefined}
    onToggleActive={async () => undefined}
    onEditOpen={() => undefined}
    onAssignOpenSingle={async () => undefined}
    onAssignOpenCombined={async () => undefined}
    onReviewCombined={() => undefined}
    onArchive={async () => undefined}
  />,
);

assert.match(needsReviewHtml, />Ready for approval</);
assert.match(needsReviewHtml, />Review and publish</);
assert.match(needsReviewHtml, /disabled=""/);

console.log("Admin Labs Combined review gate render contract passed.");

assert.equal(getCombinedApprovalBasis("unvalidated", "looks_like_match"), "exact_loinc");
assert.equal(getCombinedApprovalBasis("unvalidated", "differences_found"), "manual_review");
assert.equal(getCombinedApprovalBasis("exact_candidate"), "exact_loinc");

console.log("Admin Labs legacy Combined review decision contract passed.");
