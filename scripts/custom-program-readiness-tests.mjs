/**
 * Assigned Custom Program readiness contract (plan phase P7.1).
 *
 * The client portal has no test runner configured, so this lane transpiles the
 * pure readiness helper with the esbuild binary vite already provides and runs
 * it under node's built-in test runner. No new dependency is introduced.
 */

import { strict as assert } from "node:assert";
import {
  readinessToneClass,
  resolveCustomProgramReadiness,
} from "../src/features/treatments/custom-programs/utils/customProgramReadiness.ts";
import { mapBuilderSectionsFromFlowItems } from "../src/features/treatments/custom-programs/utils/customProgramFlowProjection.ts";

const test = (name, run) => {
  run();
  console.log(`PASS ${name}`);
};

test("a runtime-ready assignment is runnable and needs no Admin action", () => {
  const readiness = resolveCustomProgramReadiness({
    assignmentRuntimeState: "runtime_ready",
    runtimeSummary: { status: "ready" },
  });
  assert.equal(readiness.status, "ready");
  assert.equal(readiness.runnable, true);
  assert.equal(readiness.requiresAdminAction, false);
});

test("pending dependencies block the Custom Program and name the cause", () => {
  const readiness = resolveCustomProgramReadiness({
    assignmentRuntimeState: "dependencies_pending",
  });
  assert.equal(readiness.status, "dependencies_pending");
  assert.equal(readiness.runnable, false);
  assert.equal(readiness.requiresAdminAction, true);
  assert.match(readiness.detail, /Consents, Sections or Programs/);
});

test("a parity failure is actionable and never silently runnable", () => {
  const readiness = resolveCustomProgramReadiness({
    assignmentRuntimeState: "parity_failed",
    runtimeSummary: { status: "ready" },
  });
  assert.equal(readiness.status, "parity_failed");
  assert.equal(readiness.runnable, false);
  assert.match(readiness.detail, /reassign/i);
});

test("republish-required keeps the tenant on its assigned frozen release", () => {
  // The tenant must keep serving the release it was assigned; a newer Admin
  // revision does not change tenant behaviour until it is reassigned.
  const readiness = resolveCustomProgramReadiness({
    assignmentRuntimeState: "runtime_ready",
    runtimeSummary: { status: "republish_required" },
  });
  assert.equal(readiness.status, "republish_required");
  assert.equal(readiness.runnable, true);
  assert.equal(readiness.requiresAdminAction, true);
  assert.match(readiness.detail, /continue on the assigned release/);
});

test("an unknown or absent assignment state is never reported as ready", () => {
  for (const input of [{}, { assignmentRuntimeState: null }, { assignmentRuntimeState: "" }]) {
    const readiness = resolveCustomProgramReadiness(input);
    assert.equal(readiness.status, "unknown");
    assert.equal(readiness.runnable, false);
  }
});

test("every status has a distinct visual tone", () => {
  const tones = new Set(
    ["ready", "republish_required", "dependencies_pending", "parity_failed", "unknown"]
      .map(readinessToneClass),
  );
  assert.equal(tones.size, 5);
});

test("selected section fields remain visible as distinct Stage 1 items", () => {
  const items = mapBuilderSectionsFromFlowItems([
    {
      id: "flow-section-1",
      kind: "section",
      sourceId: "section-1",
      metadata: { title: "Patient History", required: true },
    },
    {
      id: "flow-section-field-1",
      kind: "section_field",
      sourceId: "section-1",
      metadata: {
        title: "Please list all of your known allergies",
        subtitle: "Section field (allergies)",
        dependency_label: "Patient History",
        mapped_field: "field-1",
        required: true,
      },
    },
  ]);

  assert.equal(items.length, 2);
  assert.equal(items[0].kind, "section");
  assert.equal(items[1].kind, "section_field");
  assert.equal(items[1].title, "Please list all of your known allergies");
  assert.equal(items[1].sourceId, "section-1");
  assert.equal(items[1].mappedField, "field-1");
  assert.equal(items[1].subtitle, "Section field (allergies)");
});

console.log("\nAll Custom Program readiness tests passed.");
