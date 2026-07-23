export const ASSIGNMENT_SOURCE = {
  program: "program",
  customProgram: "custom_program",
} as const;

export const PREFLIGHT_STATUS = {
  ready: "ready",
  blockedConfiguration: "blocked_configuration",
  blockedDependency: "blocked_dependency",
  pendingExternal: "pending_external",
  unreachable: "unreachable",
  unauthorized: "unauthorized",
  stale: "stale_release",
} as const;

export const OPERATION_STATUS = {
  pending: "pending",
  running: "running",
  blocked: "blocked",
  failed: "failed",
  completed: "completed",
  cancelled: "cancelled",
} as const;

export const TERMINAL_OPERATION_STATUSES = new Set<string>([
  OPERATION_STATUS.blocked,
  OPERATION_STATUS.failed,
  OPERATION_STATUS.completed,
  OPERATION_STATUS.cancelled,
]);

export const RETRYABLE_OPERATION_STATUSES = new Set<string>([
  OPERATION_STATUS.blocked,
  OPERATION_STATUS.failed,
]);

export const ASSIGNMENT_POLL_INTERVAL_MS = 1200;
export const ASSIGNMENT_MAX_POLL_ATTEMPTS = 50;

export const RUNTIME_STATE_LABELS: Record<string, string> = {
  pending_dependencies: "Pending dependencies",
  runtime_ready: "Runtime ready",
  blocked: "Blocked",
  stale: "Update available",
  retired: "Retired",
};

export const RUNTIME_STATE_DESCRIPTIONS: Record<string, string> = {
  pending_dependencies:
    "Not patient-runnable yet. One or more Treatment Types, Products, supplies, labs, Programs, sections, consents, or immutable releases still needs assignment or runtime activation. Assignment preflight lists the exact dependency.",
  runtime_ready:
    "All required dependencies were imported, manifest parity was verified, and this item can be used by the tenant questionnaire runtime.",
  blocked:
    "Runtime activation stopped because a required dependency failed validation or import. Review the assignment operation for the exact blocker.",
  stale:
    "The admin configuration changed after the tenant copy was assigned. Reassign it to publish and activate the new immutable configuration.",
  retired:
    "This assigned configuration was withdrawn and is no longer available for new patient runtime sessions.",
};

export const RUNTIME_STATE = {
  pending: "pending_dependencies",
  ready: "runtime_ready",
  blocked: "blocked",
  stale: "stale",
  retired: "retired",
} as const;

export const ASSIGNMENT_STEP_LABELS: Record<string, string> = {
  preflight: "Confirm dependency state",
  products: "Assign products and supplies",
  labs: "Verify lab readiness",
  programs: "Assign member programs",
  parent: "Import parent",
  verify: "Verify manifest parity",
  activate: "Activate tenant runtime",
};

export const DEPENDENCY_LABELS: Record<string, string> = {
  treatment_type: "Treatment Types",
  product: "Products",
  supply: "Required supplies",
  lab: "Labs",
  program: "Programs",
  section: "Sections",
  consent: "Consents",
  custom_program: "Custom Programs",
};

export const ASSIGNMENT_STAGE_LABELS: Record<string, string> = {
  ready: "Ready",
  complete: "Complete",
  action_required: "Action required",
  pending_external: "Pending externally",
  update_required: "Update required",
};

export const ASSIGNMENT_ACTION_LABELS: Record<string, string> = {
  publish: "Publish",
  configure_treatment: "Configure treatment",
  assign_products: "Assign products",
  assign_supplies: "Assign supplies",
  configure_labs: "Configure labs",
  assign_program: "Assign program",
  configure_client: "Configure client",
  recheck: "Recheck readiness",
  assign_parent: "Assign",
};
