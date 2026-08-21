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

const ASSIGNMENT_ERROR_MESSAGES: Record<string, string> = {
  tenant_manifest_parity_failed:
    "The client imported a different checkout option contract than the approved Program release. This may involve its role, group, label, duration, quantity, or visibility. Update the client importer and retry the assignment; the parity guard blocked activation, so no runtime configuration was published.",
  tenant_activation_blocked:
    "The Program was imported and checked, but the client portal could not make it available to patients. Confirm that the client is active, its assignment endpoint is reachable, and all required Products, Labs, and member Programs are ready. Then refresh the assignment and retry. If it still fails, contact support with the Correlation ID.",
  source_changed:
    "The Program or its published release changed while this assignment was running. The existing assignment was stopped to prevent an older configuration from reaching the client. Recheck readiness, publish the latest changes if needed, and start a new assignment.",
  assignment_configuration_changed:
    "The Program configuration changed while the assignment was in progress. This can include Products, questions, consents, Labs, or member Programs. Recheck readiness so the dependency list is refreshed, then start the assignment again.",
  parent_assignment_failed:
    "The main Program could not be imported into the client. Check that the client is active, the assignment endpoint and signing secret are configured, and the client portal is reachable. Correct any issue, then retry the assignment.",
  member_program_assignment_failed:
    "A required member Program could not be imported into the client. Open the assignment readiness details, identify the member Program needing attention, publish or configure it, and retry the parent assignment.",
  product_assignment_failed:
    "A required Product or supply could not be assigned to the client. Confirm it is active, assigned to this client, linked to the correct Treatment Type, and has complete pricing or fulfillment configuration. Recheck readiness and retry.",
};

export function assignmentOperationErrorMessage(code?: string, step?: string): string {
  if (code && ASSIGNMENT_ERROR_MESSAGES[code]) return ASSIGNMENT_ERROR_MESSAGES[code];
  if (step === "activate") {
    return "The client runtime could not be activated after the import completed. Confirm the client is active and reachable, then refresh readiness and retry. If activation fails again, contact support with the Correlation ID.";
  }
  if (step === "verify") {
    return "The imported client configuration could not be verified against the approved Program release. Refresh readiness to fetch the current release, then retry the assignment. If it continues, contact support with the Correlation ID.";
  }
  if (step === "parent") {
    return "The Program could not be imported into the client. Check the client connection, endpoint, signing secret, and active tenant status. Correct the client configuration, then retry the assignment.";
  }
  return "The assignment could not be completed. Review the failed step and its dependency details, correct the indicated Program, Product, Lab, or client configuration, then retry. If no dependency is identified, contact support with the Correlation ID.";
}

/**
 * Historical assignment operations may contain an exact backend validation
 * detail but no structured issue list. Show that detail only for the known
 * checkout configuration contract; do not render arbitrary transport errors.
 */
export function assignmentOperationDetailMessage(detail?: string): string | null {
  const value = detail?.trim();
  if (!value) return null;
  if (/^Checkout question \d+,\s*Product option \d+:/i.test(value)) {
    return value;
  }
  return null;
}

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
  configure_product: "Configure product",
  assign_products: "Assign products",
  assign_supplies: "Assign supplies",
  configure_labs: "Configure labs",
  assign_program: "Assign program",
  configure_client: "Configure client",
  recheck: "Recheck readiness",
  assign_parent: "Assign",
};

/**
 * A structured assignment issue returned by preflight or import.
 *
 * `message` is safe to render as-is. Identifiers under `diagnostics` are numeric
 * or UUID references whose database boundary (control plane vs tenant) is
 * ambiguous, so they are support-only and must never be the sole thing shown to
 * an operator.
 */
export type AssignmentIssue = {
  code: string;
  message: string;
  label?: string;
  corrective_action?: {
    code: string;
    label: string;
  };
  action: string;
  action_route?: string;
  context: {
    program_name?: string;
    product_name?: string | null;
    treatment_type_name?: string | null;
    product_treatment_type_name?: string;
    option_treatment_type_name?: string;
    checkout_question_order?: number;
    checkout_question_label?: string;
    product_option_order?: number;
    category?: string | null;
    regimen?: string | null;
    dose?: string | null;
    source_product_reference?: string;
    required_visit_stage?: string;
  };
  diagnostics?: Record<string, unknown>;
};

export type AssignmentIssueSummary = {
  issue_count: number;
  product_count: number;
  first_action: string;
  first_action_route: string;
  headline: string;
};

/** Permission required before a `configure_product` action can be offered. */
export const CONFIGURE_PRODUCT_PERMISSION = "product:manage";

/**
 * The identifiers that disambiguate one checkout option, in the order an
 * operator scans them. These labels disambiguate Products that share a name.
 */
export function issueSelectionLabels(issue: AssignmentIssue): string[] {
  return [issue.context.category, issue.context.regimen, issue.context.dose]
    .filter((value): value is string => Boolean(value));
}

export function issueCheckoutLocation(issue: AssignmentIssue): string {
  const { checkout_question_label: label, product_option_order: option } =
    issue.context;
  if (!label) return "";
  return option ? `Checkout: "${label}" · Option ${option}` : `Checkout: "${label}"`;
}
