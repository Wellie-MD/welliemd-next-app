/**
 * Assigned Custom Program readiness for the tenant portal (plan phase P7.1).
 *
 * The tenant does not author Admin content and does not re-resolve inheritance.
 * What it must be able to see is whether an assigned Custom Program is actually
 * runnable, and — when it is not — what is blocking it, in terms an operator can
 * act on rather than a raw checksum mismatch.
 */

export type CustomProgramReadinessStatus =
  | "ready"
  | "republish_required"
  | "dependencies_pending"
  | "parity_failed"
  | "unknown";

export interface CustomProgramReadinessInput {
  /** Tenant-side assignment state mirrored from the control plane. */
  assignmentRuntimeState?: string | null;
  runtimeReadyAt?: string | null;
  sourceAssignmentChecksum?: string | null;
  runtimeSummary?: { status?: string | null } | null;
}

export interface CustomProgramReadiness {
  status: CustomProgramReadinessStatus;
  label: string;
  detail: string;
  /** True when a patient can actually be sent to this Custom Program. */
  runnable: boolean;
  /** True when the tenant needs the control plane to act, not itself. */
  requiresAdminAction: boolean;
}

const READY_STATES = new Set(["runtime_ready", "ready"]);
const PENDING_STATES = new Set([
  "pending",
  "dependencies_pending",
  "awaiting_dependencies",
  "importing",
  "assigned",
]);
const FAILED_STATES = new Set(["parity_failed", "failed", "blocked", "error"]);

const normalize = (value: string | null | undefined) =>
  String(value || "").trim().toLowerCase();

export function resolveCustomProgramReadiness(
  input: CustomProgramReadinessInput,
): CustomProgramReadiness {
  const assignmentState = normalize(input.assignmentRuntimeState);
  const summaryStatus = normalize(input.runtimeSummary?.status);

  if (FAILED_STATES.has(assignmentState)) {
    return {
      status: "parity_failed",
      label: "Assignment failed",
      detail:
        "This Custom Program did not match the published release when it was assigned. WellieMD needs to reassign it before patients can start.",
      runnable: false,
      requiresAdminAction: true,
    };
  }

  if (PENDING_STATES.has(assignmentState)) {
    return {
      status: "dependencies_pending",
      label: "Waiting on dependencies",
      detail:
        "Required Consents, Sections or Programs have not finished arriving yet. This Custom Program becomes available once every dependency is ready.",
      runnable: false,
      requiresAdminAction: true,
    };
  }

  // A republish-required summary means the tenant is still running a valid
  // frozen release while a newer Admin revision exists. It is runnable.
  if (summaryStatus === "republish_required") {
    return {
      status: "republish_required",
      label: "Update available",
      detail:
        "Patients continue on the assigned release. A newer version exists in WellieMD and needs to be republished and reassigned before it takes effect.",
      runnable: true,
      requiresAdminAction: true,
    };
  }

  if (READY_STATES.has(assignmentState) || summaryStatus === "ready") {
    return {
      status: "ready",
      label: "Ready",
      detail: "Patients can start this Custom Program.",
      runnable: true,
      requiresAdminAction: false,
    };
  }

  return {
    status: "unknown",
    label: "Not available",
    detail:
      "This Custom Program has no runnable assigned release yet. Contact WellieMD if it stays in this state.",
    runnable: false,
    requiresAdminAction: true,
  };
}

/** Tailwind classes for the readiness chip. */
export function readinessToneClass(status: CustomProgramReadinessStatus): string {
  switch (status) {
    case "ready":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "republish_required":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "dependencies_pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "parity_failed":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}
