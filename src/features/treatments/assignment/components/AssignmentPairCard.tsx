import {
  AlertCircle,
  Check,
  Clock3,
  RefreshCw,
  ShieldAlert,
  StopCircle,
} from "lucide-react";

import {
  ASSIGNMENT_ACTION_LABELS,
  ASSIGNMENT_STAGE_LABELS,
  ASSIGNMENT_STEP_LABELS,
  DEPENDENCY_LABELS,
  OPERATION_STATUS,
  RETRYABLE_OPERATION_STATUSES,
  TERMINAL_OPERATION_STATUSES,
} from "@/features/treatments/assignment/constants";
import type {
  AssignmentOperation,
  AssignmentPreflight,
} from "@/api/treatmentAssignmentApi";

export interface AssignmentPairState {
  key: string;
  sourceId: string;
  sourceName: string;
  clientId: string;
  clientName: string;
  preflight?: AssignmentPreflight;
  operation?: AssignmentOperation;
  error?: string;
  errorCode?: string;
  errorAction?: string;
}

export function AssignmentPairCard(props: {
  pair: AssignmentPairState;
  onRetry: () => void;
  onCancel: () => void;
  onRecheck: () => void;
}) {
  const { pair } = props;
  const preflight = pair.preflight;
  const operation = pair.operation;
  const issues = [
    ...(preflight?.blockers || []),
    ...(preflight?.external_pending || []),
  ];
  return (
    <article className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {pair.sourceName}
          </h3>
          <p className="text-xs text-slate-500">{pair.clientName}</p>
        </div>
        <StatusBadge
          status={
            operation?.status ||
            preflight?.status ||
            (pair.error ? "error" : "loading")
          }
        />
      </div>
      {pair.error && (
        <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          <p>{pair.error}</p>
          {pair.errorAction === "configure_client" && (
            <button
              type="button"
              onClick={() =>
                window.open(
                  "/dashboard/clients",
                  "_blank",
                  "noopener,noreferrer"
                )
              }
              className="mt-2 rounded-md border border-red-200 bg-white px-2.5 py-1 font-medium"
            >
              Configure client
            </button>
          )}
        </div>
      )}
      {preflight && !operation && (
        <>
          <ol className="mt-4 space-y-2">
            {preflight.sequence.map((stage) => (
              <li
                key={stage.key}
                className={`rounded-lg border px-3 py-2 ${
                  stage.actionable
                    ? "border-blue-200 bg-blue-50/50"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold">
                      {stage.order}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-slate-800">
                        {stage.label}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {ASSIGNMENT_STAGE_LABELS[stage.status] || stage.status}
                        {stage.nodes.length
                          ? ` · ${stage.nodes.length} item${
                              stage.nodes.length === 1 ? "" : "s"
                            }`
                          : ""}
                      </p>
                    </div>
                  </div>
                  {stage.actionable && stage.action !== "assign_parent" && (
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          stage.action_route,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                      className="shrink-0 rounded-md border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-medium text-blue-700"
                    >
                      {ASSIGNMENT_ACTION_LABELS[stage.action] || stage.action}
                    </button>
                  )}
                </div>
                {stage.nodes
                  .filter((node) => node.message)
                  .map((node) => (
                    <p
                      key={`${node.kind}:${node.source_id}`}
                      className="ml-8 mt-1 text-[11px] text-amber-700"
                    >
                      {node.name}: {node.message}
                    </p>
                  ))}
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={props.onRecheck}
            className="mt-3 flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Recheck readiness
          </button>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(preflight.counts).map(([kind, count]) => (
              <span
                key={kind}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs"
              >
                {count} {DEPENDENCY_LABELS[kind] || kind}
              </span>
            ))}
          </div>
          {issues.map((issue) => (
            <p
              key={`${issue.kind}:${issue.source_id}`}
              className="mt-2 flex gap-2 text-xs text-amber-800"
            >
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>
                <strong>{issue.name}:</strong>{" "}
                {issue.message || issue.code}
              </span>
            </p>
          ))}
        </>
      )}
      {operation && (
        <>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {operation.steps.map((step) => (
              <div key={step.key} className="rounded-lg border px-3 py-2">
                <p className="text-xs font-medium text-slate-700">
                  {ASSIGNMENT_STEP_LABELS[step.key] || step.key}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {step.status}
                </p>
              </div>
            ))}
          </div>
          {operation.last_error_detail && (
            <p className="mt-2 text-xs text-red-700">
              {operation.last_error_detail}
            </p>
          )}
          <details className="mt-3 rounded-lg border px-3 py-2 text-xs">
            <summary className="cursor-pointer font-medium text-slate-700">
              Support diagnostics
            </summary>
            <div className="mt-2 space-y-1 text-slate-500">
              <p>Correlation ID: {operation.correlation_id}</p>
              <p>Attempt: {operation.attempt_count}</p>
              <p>Current step: {operation.current_step || "waiting"}</p>
            </div>
          </details>
          <div className="mt-3 flex gap-2">
            {RETRYABLE_OPERATION_STATUSES.has(operation.status) &&
              operation.retryable && (
                <button
                  type="button"
                  onClick={props.onRetry}
                  className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Retry failed steps
                </button>
              )}
            {!TERMINAL_OPERATION_STATUSES.has(operation.status) && (
              <button
                type="button"
                onClick={props.onCancel}
                className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium text-red-700"
              >
                <StopCircle className="h-3.5 w-3.5" /> Cancel
              </button>
            )}
          </div>
        </>
      )}
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const complete = status === OPERATION_STATUS.completed;
  const active =
    status === OPERATION_STATUS.pending || status === OPERATION_STATUS.running;
  return (
    <span
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
        complete
          ? "bg-emerald-100 text-emerald-800"
          : active
            ? "bg-sky-100 text-sky-800"
            : "bg-amber-100 text-amber-800"
      }`}
    >
      {complete ? (
        <Check className="h-3.5 w-3.5" />
      ) : active ? (
        <Clock3 className="h-3.5 w-3.5" />
      ) : (
        <AlertCircle className="h-3.5 w-3.5" />
      )}
      {status.replaceAll("_", " ")}
    </span>
  );
}
