import { RefreshCw, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  ASSIGNMENT_ACTION_LABELS,
  CONFIGURE_PRODUCT_PERMISSION,
  issueCheckoutLocation,
  issueSelectionLabels,
  type AssignmentIssue,
  type AssignmentIssueSummary,
} from "@/features/treatments/assignment/constants";
import { navigateToAssignmentAction } from "@/features/treatments/assignment/navigation";

/** Renders assignment issues with record-specific corrective actions. */
export function AssignmentIssueList(props: {
  issues: AssignmentIssue[];
  summary?: AssignmentIssueSummary;
  onRecheck?: () => void;
  rechecking?: boolean;
  /** Called after a corrective action navigates away, so the modal can close
   * instead of floating over the page it just navigated to. */
  onNavigate?: () => void;
  /** Permissions used to authorize corrective actions. */
  permissions: ReadonlySet<string>;
}) {
  const { issues, summary, permissions, onNavigate } = props;
  if (!issues.length) return null;

  const canConfigureProduct = permissions.has(CONFIGURE_PRODUCT_PERMISSION);

  return (
    <section className="mt-3 rounded-lg border border-red-200 bg-red-50/60 px-3 py-2">
      <h4 className="flex items-center gap-2 text-xs font-semibold text-red-800">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        {summary?.headline ||
          `Import blocked: ${issues.length} issue${issues.length === 1 ? "" : "s"}`}
      </h4>
      <ul className="mt-2 space-y-3">
        {issues.map((issue, index) => (
          <AssignmentIssueRow
            key={`${issue.code}:${index}`}
            issue={issue}
            canConfigureProduct={canConfigureProduct}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
      {props.onRecheck && (
        <button
          type="button"
          disabled={props.rechecking}
          onClick={props.onRecheck}
          className="mt-3 flex items-center gap-1 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${props.rechecking ? "animate-spin" : ""}`} />
          {props.rechecking ? "Rechecking…" : "Recheck readiness"}
        </button>
      )}
    </section>
  );
}

function AssignmentIssueRow(props: {
  issue: AssignmentIssue;
  canConfigureProduct: boolean;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const { issue, canConfigureProduct } = props;
  const subject =
    issue.context.product_name || issue.context.program_name || "Configuration";
  const location = issueCheckoutLocation(issue);
  const selectors = issueSelectionLabels(issue);
  const actionBlocked =
    issue.action === "configure_product" && !canConfigureProduct;

  return (
    <li className="text-xs text-red-900">
      <p className="font-semibold">{subject}</p>
      {location && <p className="text-[11px] text-red-700">{location}</p>}
      {selectors.length > 0 && (
        <p className="text-[11px] text-red-700">{selectors.join(" · ")}</p>
      )}
      {issue.label && <p className="text-[11px] text-red-700">{issue.label}</p>}
      <p className="mt-1">Problem: {issue.message}</p>
      {issue.action_route && !actionBlocked && (
        <button
          type="button"
          onClick={() => {
            if (navigateToAssignmentAction(navigate, issue.action_route)) {
              props.onNavigate?.();
            }
          }}
          className="mt-1.5 rounded-md border border-red-200 bg-white px-2.5 py-1 font-medium"
        >
          {ASSIGNMENT_ACTION_LABELS[issue.action] || issue.action}
          {issue.context.product_name ? ` ${issue.context.product_name}` : ""}
        </button>
      )}
      {actionBlocked && (
        <p className="mt-1.5 text-[11px] italic text-red-700">
          Ask an administrator with product permissions to make this change.
        </p>
      )}
      {issue.corrective_action && (
        <p className="mt-1.5 font-medium text-red-800">
          Next step: {issue.corrective_action.label}
        </p>
      )}
    </li>
  );
}
