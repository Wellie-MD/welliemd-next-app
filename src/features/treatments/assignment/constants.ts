export const ASSIGNMENT_SOURCE = {
  program: "program",
  customProgram: "custom_program",
} as const;

export const PREFLIGHT_STATUS = {
  ready: "ready",
  blocked: "blocked",
  pendingExternal: "pending_external",
  stale: "stale",
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

export const RUNTIME_STATE_LABELS: Record<string, string> = {
  pending_dependencies: "Pending dependencies",
  runtime_ready: "Runtime ready",
  blocked: "Blocked",
  stale: "Update available",
  retired: "Retired",
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
