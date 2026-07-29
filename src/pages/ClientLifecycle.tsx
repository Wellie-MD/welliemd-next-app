import { useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  TimerReset,
  Trash2,
} from "lucide-react";

import {
  clientApi,
  type Client,
  type ClientLifecycleResponse,
  type InfraResource,
  type LifecycleJob,
  type LifecycleStep,
  type TeardownOptionsPayload,
  type TeardownRdsSnapshotMode,
  type TeardownS3Mode,
} from "@/api/clientApi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";

const getBadgeVariant = (status?: string) => {
  if (!status) return "outline" as const;
  if (["ready", "completed"].includes(status)) return "default" as const;
  if (["ready_with_warnings", "completed_with_warnings"].includes(status)) return "secondary" as const;
  if (["failed", "blocked", "error", "cancel_requested"].includes(status)) return "destructive" as const;
  if (["previewed", "pending", "running", "provisioning", "repairing", "tearing_down", "scheduled"].includes(status)) {
    return "secondary" as const;
  }
  return "outline" as const;
};

const formatStatusLabel = (status?: string | null) => {
  if (!status) return "unknown";
  return status.replace(/_/g, " ");
};

const formatDate = (value?: string | null) => {
  if (!value) return "Not set";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const getBlockers = (job?: LifecycleJob | null) => {
  const blockers = job?.summary?.blockers;
  return Array.isArray(blockers) ? (blockers as string[]) : [];
};

const parseBoolean = (value: unknown) => value === true || value === "true" || value === 1 || value === "1";

const ACTIVE_LIFECYCLE_STATUSES = new Set(["pending", "previewed", "running", "cancel_requested"]);

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const stringifyValue = (value: unknown) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
};

const hasPayload = (payload?: Record<string, unknown> | null) =>
  Boolean(payload && Object.keys(payload).length > 0);

const isAutoRetryScheduledPayload = (payload?: Record<string, unknown> | null) =>
  asRecord(payload).code === "auto_retry_scheduled";

const shouldShowLifecycleError = (payload?: Record<string, unknown> | null, status?: string | null) =>
  hasPayload(payload) && !isAutoRetryScheduledPayload(payload) && !["pending", "running"].includes(status || "");

const ERROR_JOB_STATUSES = new Set(["partial_failed", "failed", "blocked"]);
const WARNING_JOB_STATUSES = new Set(["completed_with_warnings"]);
const PROVISIONING_RETRY_JOB_STATUSES = new Set(["partial_failed", "failed", "blocked"]);
const PROVISIONING_RETRY_EXCLUDED_STEPS = new Set(["frontend_ready", "verification"]);
const RESOLVED_LIFECYCLE_STATES = new Set(["ready", "ready_with_warnings"]);
const SUCCESSFUL_LIFECYCLE_JOB_STATUSES = new Set(["completed", "completed_with_warnings"]);
const PROVISIONING_RESOLUTION_OPERATIONS = new Set(["provision", "repair", "verify"]);
const WARNING_STATUSES = new Set(["ready_with_warnings", "completed_with_warnings"]);

const getWarningBadgeClassName = (status?: string | null) =>
  status && WARNING_STATUSES.has(status)
    ? "border-amber-300 bg-amber-100 text-amber-950 hover:bg-amber-100"
    : undefined;

const getWarnings = (job?: LifecycleJob | null) => {
  const warnings = job?.summary?.warnings;
  return Array.isArray(warnings) ? warnings.map(asRecord).filter((item) => Object.keys(item).length > 0) : [];
};

const getAutoRetry = (payload?: Record<string, unknown> | null) => {
  const retry = payload?.auto_retry;
  return retry && typeof retry === "object" && !Array.isArray(retry) ? (retry as Record<string, unknown>) : null;
};

const getAutoRetryAttempts = (retry?: Record<string, unknown> | null) => {
  const attempts = retry?.attempts;
  return Array.isArray(attempts) ? attempts.map(asRecord).filter((item) => Object.keys(item).length > 0) : [];
};

const getLifecycleActionLabel = (job: LifecycleJob) => {
  const request = asRecord(job.request_payload);
  const resumeFromStep = stringifyValue(request.resume_from_step);
  if (job.operation_type === "verify") return "Run Verification";
  if (job.operation_type === "repair") {
    return resumeFromStep ? `Retry ${resumeFromStep}` : "Retry Provisioning";
  }
  if (job.operation_type === "provision") return "Initial Provisioning";
  if (job.operation_type === "teardown") return "Teardown";
  return job.operation_type;
};

const formatLifecycleJobOption = (job: LifecycleJob, latestJobId?: string) => {
  const marker = latestJobId === job.id ? "Latest · " : "";
  return `${marker}${formatDate(job.created_at)} · ${getLifecycleActionLabel(job)} · ${formatStatusLabel(job.status)}`;
};

const getProvisioningRetryStepName = (job?: LifecycleJob | null) => {
  if (
    !job ||
    !["provision", "repair"].includes(job.operation_type) ||
    !PROVISIONING_RETRY_JOB_STATUSES.has(job.status)
  ) {
    return null;
  }

  const failedStep = job.steps.find(
    (step) => ["failed", "blocked"].includes(step.status) && !PROVISIONING_RETRY_EXCLUDED_STEPS.has(step.name)
  );
  if (failedStep) return failedStep.display_name || failedStep.name;

  const details = asRecord(job.error_payload?.details);
  const logContext = asRecord(job.error_payload?.log_context);
  const candidates = [
    job.current_step_name,
    stringifyValue(job.error_payload?.step),
    stringifyValue(details.step),
    stringifyValue(logContext.step),
  ];
  const stepName = candidates.find((candidate) => {
    const value = String(candidate || "").trim();
    return value && !PROVISIONING_RETRY_EXCLUDED_STEPS.has(value);
  });
  return stepName || null;
};

const getRetryableProvisioningJob = (
  latestJob: LifecycleJob | null | undefined,
  lifecycleJobs: LifecycleJob[]
) => {
  const candidates = latestJob ? [latestJob, ...lifecycleJobs] : lifecycleJobs;
  const seen = new Set<string>();

  return candidates.find((job) => {
    if (seen.has(job.id)) return false;
    seen.add(job.id);
    return Boolean(getProvisioningRetryStepName(job));
  }) || null;
};

const isProvisioningResolved = (client: Client | null | undefined, latestJob: LifecycleJob | null | undefined) =>
  Boolean(
    client?.lifecycle_state &&
      RESOLVED_LIFECYCLE_STATES.has(client.lifecycle_state) &&
      !hasPayload(client.last_lifecycle_error) &&
      latestJob &&
      PROVISIONING_RESOLUTION_OPERATIONS.has(latestJob.operation_type) &&
      SUCCESSFUL_LIFECYCLE_JOB_STATUSES.has(latestJob.status)
  );

const getRetryProvisioningDisabledReason = (
  latestJob: LifecycleJob | null | undefined,
  hasActiveLifecycleJob: boolean,
  retryableStepName: string | null,
  provisioningResolved: boolean
) => {
  if (provisioningResolved) return "Provisioning is already resolved for this client.";
  if (hasActiveLifecycleJob) return "A lifecycle job is already active.";
  if (!latestJob) return "No failed provisioning job is available to retry.";
  if (retryableStepName) return null;
  if (latestJob.operation_type === "verify" || PROVISIONING_RETRY_EXCLUDED_STEPS.has(latestJob.current_step_name || "")) {
    return "Use Run Verification for frontend readiness or verification-only failures.";
  }
  return "Retry Provisioning is enabled only after a failed provisioning or repair step.";
};

const getFailureDetails = (payload?: Record<string, unknown>) => {
  const details = asRecord(payload?.details);
  const explicitDetails = details.failure_details;
  if (Array.isArray(explicitDetails)) {
    return explicitDetails.map(asRecord).filter((item) => Object.keys(item).length > 0);
  }

  const failures = Array.isArray(details.failures) ? details.failures : [];
  const results = asRecord(details.results);
  return failures
    .map((failure) => {
      const name = String(failure);
      const result = asRecord(results[name]);
      return { name, ...result };
    })
    .filter((item) => Object.keys(item).length > 0);
};

const getCheckNames = (payload: Record<string, unknown>, key: "pending_checks" | "failed_checks") => {
  const details = asRecord(payload.details);
  const direct = payload[key];
  const nested = details[key];
  const value = Array.isArray(direct) ? direct : nested;
  return Array.isArray(value) ? value.map(String) : [];
};

const LifecycleErrorDetails = ({ payload }: { payload?: Record<string, unknown> }) => {
  if (!payload || Object.keys(payload).length === 0) return null;
  const failures = getFailureDetails(payload);
  const pendingChecks = getCheckNames(payload, "pending_checks");
  const failedChecks = getCheckNames(payload, "failed_checks");

  if (!failures.length && !pendingChecks.length && !failedChecks.length) return null;

  return (
    <div className="mt-3 space-y-2 text-xs">
      {failedChecks.length ? (
        <div>
          <p className="font-medium">Failed checks</p>
          <p className="break-words">{failedChecks.join(", ")}</p>
        </div>
      ) : null}
      {pendingChecks.length ? (
        <div>
          <p className="font-medium">Pending checks</p>
          <p className="break-words">{pendingChecks.join(", ")}</p>
        </div>
      ) : null}
      {failures.map((failure, index) => {
        const name = stringifyValue(failure.name) || `Failure ${index + 1}`;
        const facts = [
          ["URL", failure.url],
          ["HTTP", failure.status_code],
          ["Error", failure.error],
          ["AWS status", failure.domain_status || failure.job_status || failure.state],
          ["AWS reason", failure.status_reason || failure.reason || failure.aws_error],
        ]
          .map(([label, value]) => [label, stringifyValue(value)] as const)
          .filter(([, value]) => value);

        return (
          <div key={`${name}-${index}`} className="rounded-md border border-destructive/20 bg-background/60 p-2">
            <p className="font-medium">{name}</p>
            {facts.map(([label, value]) => (
              <p key={label} className="break-words">
                <span className="text-muted-foreground">{label}:</span> {value}
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
};

const LifecycleWarningDetails = ({ warnings }: { warnings: Record<string, unknown>[] }) => {
  if (!warnings.length) return null;

  return (
    <div className="mt-3 space-y-2 text-xs">
      {warnings.map((warning, index) => {
        const message = stringifyValue(warning.message) || "Lifecycle warning";
        const source = stringifyValue(warning.source);
        const step = stringifyValue(warning.step);
        return (
          <div key={`${message}-${index}`} className="rounded-md border border-amber-300 bg-amber-50 p-2 text-amber-900">
            <p className="font-medium">{message}</p>
            {step || source ? (
              <p className="break-words">
                {[step ? `Step: ${step}` : null, source ? `Source: ${source}` : null].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

const LifecycleAutoRetryDetails = ({
  outputPayload,
  errorPayload,
}: {
  outputPayload?: Record<string, unknown> | null;
  errorPayload?: Record<string, unknown> | null;
}) => {
  const retry = getAutoRetry(outputPayload);
  const attempts = getAutoRetryAttempts(retry);
  const error = asRecord(errorPayload);
  const scheduled = error.code === "auto_retry_scheduled" ? error : null;
  if (!retry && !scheduled) return null;

  const status = stringifyValue(retry?.status) || (scheduled ? "scheduled" : "unknown");
  const nextRetryAt = stringifyValue(retry?.next_retry_at ?? scheduled?.next_retry_at);
  const finalError = asRecord(retry?.final_error);

  return (
    <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
      <p className="font-medium">Automatic retry {formatStatusLabel(status)}</p>
      {nextRetryAt ? <p>Next retry: {formatDate(nextRetryAt)}</p> : null}
      {attempts.length ? (
        <div className="mt-2 space-y-1">
          {attempts.map((attempt, index) => (
            <p key={`${stringifyValue(attempt.code) || "retry"}-${index}`} className="break-words">
              Attempt {stringifyValue(attempt.attempt) || index + 1}: {stringifyValue(attempt.code) || "failed"}
              {stringifyValue(attempt.failed_at) ? ` at ${formatDate(stringifyValue(attempt.failed_at))}` : ""}
              {stringifyValue(attempt.message) ? ` - ${stringifyValue(attempt.message)}` : ""}
            </p>
          ))}
        </div>
      ) : null}
      {scheduled ? (
        <p className="mt-2 break-words">
          First failure: {stringifyValue(asRecord(scheduled.first_error).message) || stringifyValue(scheduled.message)}
        </p>
      ) : null}
      {Object.keys(finalError).length ? (
        <p className="mt-2 break-words">
          Final failure: {stringifyValue(finalError.message) || stringifyValue(finalError.code)}
        </p>
      ) : null}
    </div>
  );
};

const FrontendReadyPendingDetails = ({ step }: { step: LifecycleStep }) => {
  if (step.name !== "frontend_ready" || !["pending", "running"].includes(step.status)) return null;
  const output = asRecord(step.output_payload);
  const pendingChecks = getCheckNames(output, "pending_checks");
  const lastChecked = stringifyValue(output.last_checked_at);
  if (!pendingChecks.length && !lastChecked) return null;
  return (
    <div className="mt-3 rounded-md bg-muted p-3 text-xs text-muted-foreground">
      {pendingChecks.length ? <p>Waiting on: {pendingChecks.join(", ")}</p> : null}
      {lastChecked ? <p>Last checked: {formatDate(lastChecked)}</p> : null}
      <p>Next readiness check is queued automatically.</p>
    </div>
  );
};

const isTeardownCancellable = (job?: LifecycleJob | null) =>
  Boolean(job && ACTIVE_LIFECYCLE_STATUSES.has(job.status));

const isTeardownRetryable = (job?: LifecycleJob | null) =>
  Boolean(job && ["failed", "blocked", "cancelled"].includes(job.status));

const StepTimeline = ({
  steps,
  onRetryStep,
  isRetrying,
}: {
  steps: LifecycleStep[];
  onRetryStep?: (stepName: string) => void;
  isRetrying?: boolean;
}) => {
  if (!steps.length) {
    return <p className="text-sm text-muted-foreground">No lifecycle steps recorded yet.</p>;
  }

  return (
    <div className="space-y-3">
      {steps.map((step) => (
        <div key={step.id} className="rounded-lg border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{step.display_name || step.name}</p>
              <p className="text-xs text-muted-foreground">
                Attempt {step.attempts} · Started {formatDate(step.started_at)} · Completed {formatDate(step.completed_at)}
              </p>
            </div>
            <Badge variant={getBadgeVariant(step.status)} className={getWarningBadgeClassName(step.status)}>
              {formatStatusLabel(step.status)}
            </Badge>
          </div>
          <LifecycleAutoRetryDetails outputPayload={step.output_payload} errorPayload={step.error_payload} />
          {shouldShowLifecycleError(step.error_payload, step.status) ? (
            <div className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive break-words whitespace-pre-wrap">
              {(step.error_payload.message as string) || "Step failed"}
              <LifecycleErrorDetails payload={step.error_payload} />
            </div>
          ) : null}
          <FrontendReadyPendingDetails step={step} />
          {onRetryStep && ["failed", "blocked"].includes(step.status) ? (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                disabled={isRetrying}
                onClick={() => onRetryStep(step.name)}
              >
                Retry This Step
              </Button>
            </div>
          ) : null}
          {step.logs ? (
            <pre className="mt-3 max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs leading-5">
              {step.logs}
            </pre>
          ) : null}
        </div>
      ))}
    </div>
  );
};

const ResourceList = ({ resources }: { resources: InfraResource[] }) => {
  if (!resources.length) {
    return <p className="text-sm text-muted-foreground">No active infrastructure resources recorded yet.</p>;
  }

  return (
    <div className="space-y-3">
      {resources.map((resource) => (
        <div key={resource.id} className="rounded-lg border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{resource.human_label || resource.resource_type}</p>
              <p className="text-xs text-muted-foreground break-all">{resource.external_id}</p>
            </div>
            <Badge variant={getBadgeVariant(resource.teardown_status)}>{formatStatusLabel(resource.teardown_status)}</Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {resource.resource_type} · {resource.provider}:{resource.region}
          </p>
        </div>
      ))}
    </div>
  );
};

export default function ClientLifecycle() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [archiveBucket, setArchiveBucket] = useState("");
  const [reason, setReason] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [s3Mode, setS3Mode] = useState<TeardownS3Mode>("archive");
  const [rdsSnapshotMode, setRdsSnapshotMode] = useState<TeardownRdsSnapshotMode>("retain");
  const [deleteClientRecord, setDeleteClientRecord] = useState(false);
  const [selectedLifecycleJobId, setSelectedLifecycleJobId] = useState("latest");

  const lifecycleQuery = useQuery<ClientLifecycleResponse>({
    queryKey: ["client-lifecycle", id],
    queryFn: () => clientApi.getLifecycle(id!),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const latestJob = query.state.data?.latest_job;
      return latestJob && ["pending", "running", "previewed", "cancel_requested"].includes(latestJob.status) ? 10000 : false;
    },
  });

  const refreshLifecycle = () => {
    queryClient.invalidateQueries({ queryKey: ["client-lifecycle", id] });
    queryClient.invalidateQueries({ queryKey: ["clients"] });
    if (id) {
      queryClient.invalidateQueries({ queryKey: ["client", id] });
    }
  };

  const lifecycleMutation = useMutation({
    mutationFn: async (action: () => Promise<unknown>) => action(),
    onSuccess: () => {
      refreshLifecycle();
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<{ message?: string; detail?: string }>;
      toast({
        title: "Lifecycle action failed",
        description: axiosError.response?.data?.message || axiosError.response?.data?.detail || "Please check the latest job error payload.",
        variant: "destructive",
      });
    },
  });

  const data = lifecycleQuery.data;
  const client = data?.client;
  const latestJob = data?.latest_job;
  const lifecycleJobs = useMemo(() => data?.jobs ?? [], [data?.jobs]);
  const selectedLifecycleJob = useMemo(() => {
    if (selectedLifecycleJobId === "latest") return latestJob;
    return lifecycleJobs.find((job) => job.id === selectedLifecycleJobId) || latestJob;
  }, [latestJob, lifecycleJobs, selectedLifecycleJobId]);
  const latestWarnings = useMemo(() => getWarnings(latestJob), [latestJob]);
  const selectedWarnings = useMemo(() => getWarnings(selectedLifecycleJob), [selectedLifecycleJob]);
  const lifecycleStats = useMemo(() => {
    const operationCounts = data?.job_counts?.by_operation ?? {};
    const totalJobs = data?.job_counts?.total ?? lifecycleJobs.length;
    const returnedJobs = data?.job_counts?.returned ?? lifecycleJobs.length;
    const erroredJobs =
      data?.job_counts?.errored ??
      lifecycleJobs.filter((job) => ERROR_JOB_STATUSES.has(job.status) || hasPayload(job.error_payload)).length;
    const warningJobs =
      data?.job_counts?.warnings ??
      lifecycleJobs.filter((job) => WARNING_JOB_STATUSES.has(job.status) || getWarnings(job).length > 0).length;
    return {
      totalJobs,
      returnedJobs,
      verificationRuns: operationCounts.verify ?? lifecycleJobs.filter((job) => job.operation_type === "verify").length,
      repairRuns: operationCounts.repair ?? lifecycleJobs.filter((job) => job.operation_type === "repair").length,
      provisionRuns: operationCounts.provision ?? lifecycleJobs.filter((job) => job.operation_type === "provision").length,
      erroredJobs,
      warningJobs,
    };
  }, [data?.job_counts, lifecycleJobs]);
  const teardownJobs = useMemo(
    () => lifecycleJobs.filter((job) => job.operation_type === "teardown"),
    [lifecycleJobs]
  );
  const activeTeardownJobs = useMemo(
    () => teardownJobs.filter(isTeardownCancellable),
    [teardownJobs]
  );
  const latestTeardownJob = activeTeardownJobs[0] ?? teardownJobs[0] ?? null;
  const latestTeardownRequest = useMemo(
    () => (latestTeardownJob?.request_payload || {}) as Record<string, unknown>,
    [latestTeardownJob?.request_payload]
  );
  const teardownBlockers = getBlockers(latestTeardownJob);
  const requiredConfirmationText = (latestTeardownJob?.summary?.required_confirmation_text as string) || "";
  const teardownSummaryModes = (latestTeardownJob?.summary?.teardown_modes as Record<string, unknown>) || {};
  const requestedTeardownS3Mode =
    (latestTeardownRequest.s3_mode as TeardownS3Mode | undefined) ||
    (teardownSummaryModes.s3_mode as TeardownS3Mode | undefined) ||
    "archive";
  const requestedTeardownRdsSnapshotMode =
    (latestTeardownRequest.rds_snapshot_mode as TeardownRdsSnapshotMode | undefined) ||
    (teardownSummaryModes.rds_snapshot_mode as TeardownRdsSnapshotMode | undefined) ||
    "retain";
  const requestedDeleteClientRecord =
    parseBoolean(latestTeardownRequest.delete_client_record) ||
    parseBoolean(teardownSummaryModes.delete_client_record);
  const effectiveTeardownS3Mode = deleteClientRecord ? "purge" : s3Mode;
  const effectiveTeardownRdsSnapshotMode = deleteClientRecord ? "purge" : rdsSnapshotMode;
  const archiveBucketRequired = effectiveTeardownS3Mode === "archive";
  const hasArchiveBucket = !archiveBucketRequired || archiveBucket.trim().length > 0;
  const teardownModeValid = !deleteClientRecord || (effectiveTeardownS3Mode === "purge" && effectiveTeardownRdsSnapshotMode === "purge");
  const hasActiveLifecycleJob = useMemo(
    () => Boolean(lifecycleJobs.some((job) => ACTIVE_LIFECYCLE_STATUSES.has(job.status))),
    [lifecycleJobs]
  );
  const retryableProvisioningJob = useMemo(
    () => getRetryableProvisioningJob(latestJob, lifecycleJobs),
    [latestJob, lifecycleJobs]
  );
  const retryProvisioningStepName = useMemo(
    () => getProvisioningRetryStepName(retryableProvisioningJob),
    [retryableProvisioningJob]
  );
  const provisioningResolved = useMemo(
    () => isProvisioningResolved(client, latestJob),
    [client, latestJob]
  );
  const retryProvisioningDisabledReason = getRetryProvisioningDisabledReason(
    latestJob,
    hasActiveLifecycleJob,
    retryProvisioningStepName,
    provisioningResolved
  );
  const canRetryProvisioning = Boolean(
    retryProvisioningStepName && !provisioningResolved && !hasActiveLifecycleJob && !lifecycleMutation.isPending
  );
  const showBlockingProvisioningError = Boolean(
    !provisioningResolved &&
    retryableProvisioningJob &&
    retryableProvisioningJob.id !== latestJob?.id &&
    shouldShowLifecycleError(retryableProvisioningJob.error_payload, retryableProvisioningJob.status)
  );

  useEffect(() => {
    if (
      selectedLifecycleJobId !== "latest" &&
      lifecycleJobs.length > 0 &&
      !lifecycleJobs.some((job) => job.id === selectedLifecycleJobId)
    ) {
      setSelectedLifecycleJobId("latest");
    }
  }, [lifecycleJobs, selectedLifecycleJobId]);

  useEffect(() => {
    if (!latestTeardownJob) {
      return;
    }
    setArchiveBucket(typeof latestTeardownRequest.archive_bucket === "string" ? latestTeardownRequest.archive_bucket : "");
    setReason(typeof latestTeardownRequest.reason === "string" ? latestTeardownRequest.reason : "");
    setS3Mode((latestTeardownRequest.s3_mode as TeardownS3Mode | undefined) || requestedTeardownS3Mode);
    setRdsSnapshotMode(
      (latestTeardownRequest.rds_snapshot_mode as TeardownRdsSnapshotMode | undefined) ||
        requestedTeardownRdsSnapshotMode
    );
    setDeleteClientRecord(parseBoolean(latestTeardownRequest.delete_client_record) || requestedDeleteClientRecord);
    setConfirmationText("");
  }, [
    latestTeardownJob,
    latestTeardownRequest.archive_bucket,
    latestTeardownRequest.delete_client_record,
    latestTeardownRequest.rds_snapshot_mode,
    latestTeardownRequest.reason,
    latestTeardownRequest.s3_mode,
    requestedDeleteClientRecord,
    requestedTeardownRdsSnapshotMode,
    requestedTeardownS3Mode,
  ]);

  useEffect(() => {
    if (deleteClientRecord) {
      setS3Mode("purge");
      setRdsSnapshotMode("purge");
      setArchiveBucket("");
    }
  }, [deleteClientRecord]);

  useEffect(() => {
    if (s3Mode === "purge") {
      setArchiveBucket("");
    }
  }, [s3Mode]);

  const teardownPayload: TeardownOptionsPayload = {
    archive_bucket: effectiveTeardownS3Mode === "archive" ? archiveBucket.trim() : "",
    reason,
    s3_mode: effectiveTeardownS3Mode,
    rds_snapshot_mode: effectiveTeardownRdsSnapshotMode,
    delete_client_record: deleteClientRecord,
  };

  const teardownPreviewLabel = deleteClientRecord ? "Preview Hard Delete" : "Preview Teardown";
  const teardownRequestLabel = deleteClientRecord ? "Request Hard Delete" : "Request Teardown";
  const cancelAllTeardownJobs = async () => {
    const jobsToCancel = [...activeTeardownJobs].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    for (const teardownJob of jobsToCancel) {
      await clientApi.cancelTeardown(client.id, { job_id: teardownJob.id });
    }
  };

  if (lifecycleQuery.isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const lifecycleLoadError = lifecycleQuery.error as AxiosError<{ message?: string; detail?: string }> | null;
  const lifecycleLoadStatus = lifecycleLoadError?.response?.status;

  if (lifecycleQuery.isError || !client) {
    if (lifecycleLoadStatus === 404) {
      return (
        <div className="p-6">
          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Client record deleted</AlertTitle>
            <AlertDescription>
              This client record no longer exists. The teardown purge likely completed successfully.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button variant="outline" onClick={() => navigate("/dashboard/clients")}>
              Back to Clients
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Lifecycle unavailable</AlertTitle>
          <AlertDescription>
            The lifecycle state for this client could not be loaded.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    await lifecycleMutation.mutateAsync(action);
    toast({ title: "Success", description: successMessage });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button variant="ghost" className="mb-2 px-0" onClick={() => navigate("/dashboard/clients")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
          <h1 className="text-2xl font-bold">{client.name} Lifecycle</h1>
          <p className="text-sm text-muted-foreground">
            Track provisioning, verification, and teardown without leaving the control plane.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={getBadgeVariant(client.lifecycle_state)}>{formatStatusLabel(client.lifecycle_state)}</Badge>
          <Badge variant={getBadgeVariant(client.provisioning_status)}>{formatStatusLabel(client.provisioning_status)}</Badge>
          <Badge variant={getBadgeVariant(client.teardown_status)}>{formatStatusLabel(client.teardown_status)}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
          <CardDescription>
            Latest lifecycle job, current step, and the important tenant URLs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Latest Job</p>
              <p className="font-medium">{latestJob ? `${latestJob.operation_type} (${formatStatusLabel(latestJob.status)})` : "No lifecycle job yet"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Current Step</p>
              <p className="font-medium">{latestJob?.current_step_name || "Not running"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">API</p>
              <a className="text-sm text-primary underline underline-offset-2" href={client.api_endpoint} target="_blank" rel="noreferrer">
                {client.api_endpoint}
              </a>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Client Portal</p>
              <a className="text-sm text-primary underline underline-offset-2" href={client.admin_panel_domain} target="_blank" rel="noreferrer">
                {client.admin_panel_domain}
              </a>
            </div>
          </div>

          {latestJob && isAutoRetryScheduledPayload(latestJob.error_payload) ? (
            <Alert className="border-amber-300 bg-amber-50 text-amber-950">
              <RefreshCcw className="h-4 w-4" />
              <AlertTitle>Automatic Retry Scheduled</AlertTitle>
              <AlertDescription>
                The first retryable failure was recorded. The lifecycle will retry once automatically.
                <LifecycleAutoRetryDetails errorPayload={latestJob.error_payload} />
              </AlertDescription>
            </Alert>
          ) : null}

          {showBlockingProvisioningError && retryableProvisioningJob ? (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Blocking Provisioning Error</AlertTitle>
              <AlertDescription>
                <div className="space-y-2">
                  <p>
                    {(retryableProvisioningJob.error_payload.message as string) ||
                      "A previous provisioning job failed before this client became ready."}
                  </p>
                  <p className="text-xs">
                    Failed step: {retryProvisioningStepName || retryableProvisioningJob.current_step_name || "unknown"} ·
                    Source job: {getLifecycleActionLabel(retryableProvisioningJob)} ·
                    Recorded {formatDate(retryableProvisioningJob.updated_at)}
                  </p>
                  <LifecycleErrorDetails payload={retryableProvisioningJob.error_payload} />
                </div>
              </AlertDescription>
            </Alert>
          ) : null}

          {latestJob && shouldShowLifecycleError(latestJob.error_payload, latestJob.status) ? (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Latest Lifecycle Error</AlertTitle>
              <AlertDescription>
                {(latestJob.error_payload.message as string) || "The latest lifecycle job failed."}
                <LifecycleErrorDetails payload={latestJob.error_payload} />
              </AlertDescription>
            </Alert>
          ) : null}

          {latestWarnings.length ? (
            <Alert className="border-amber-300 bg-amber-50 text-amber-950">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Ready With Warnings</AlertTitle>
              <AlertDescription>
                This client became usable, but onboarding was not clean. Review the recovered issues before handoff.
                <LifecycleWarningDetails warnings={latestWarnings} />
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button
                      variant="outline"
                      disabled={!canRetryProvisioning}
                      className={!canRetryProvisioning ? "pointer-events-none" : undefined}
                      onClick={() => runAction(() => clientApi.retryProvisioning(client.id), "Provisioning retry queued.")}
                    >
                      {lifecycleMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                      Retry Provisioning
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canRetryProvisioning && retryProvisioningDisabledReason ? (
                  <TooltipContent className="max-w-xs">
                    {retryProvisioningDisabledReason}
                  </TooltipContent>
                ) : null}
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="outline"
              disabled={lifecycleMutation.isPending || hasActiveLifecycleJob}
              onClick={() => runAction(() => clientApi.runVerification(client.id), "Verification job queued.")}
            >
              <TimerReset className="mr-2 h-4 w-4" />
              Run Verification
            </Button>
          </div>
          {hasActiveLifecycleJob ? (
            <p className="text-xs text-muted-foreground">
              Wait for the active lifecycle job to finish before retrying provisioning or running verification.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr] xl:items-start">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle>Lifecycle Timeline</CardTitle>
                <CardDescription>
                  Step-level history for provisioning, verification, and repair jobs.
                </CardDescription>
              </div>
              <div className="w-full space-y-2 lg:max-w-md">
                <Label htmlFor="lifecycle-job-select">Lifecycle job</Label>
                <Select value={selectedLifecycleJobId} onValueChange={setSelectedLifecycleJobId}>
                  <SelectTrigger id="lifecycle-job-select">
                    <SelectValue placeholder="Select lifecycle job" />
                  </SelectTrigger>
                  <SelectContent>
                    {latestJob ? (
                      <SelectItem value="latest">
                        Latest · {formatDate(latestJob.created_at)} · {getLifecycleActionLabel(latestJob)} · {formatStatusLabel(latestJob.status)}
                      </SelectItem>
                    ) : (
                      <SelectItem value="latest">No lifecycle job yet</SelectItem>
                    )}
                    {lifecycleJobs.filter((job) => job.id !== latestJob?.id).map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {formatLifecycleJobOption(job, latestJob?.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs uppercase text-muted-foreground">Run Verification</p>
                <p className="text-lg font-semibold">{lifecycleStats.verificationRuns}</p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs uppercase text-muted-foreground">Retry Provisioning</p>
                <p className="text-lg font-semibold">{lifecycleStats.repairRuns}</p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs uppercase text-muted-foreground">Initial Provisioning</p>
                <p className="text-lg font-semibold">{lifecycleStats.provisionRuns}</p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs uppercase text-muted-foreground">Errored Jobs</p>
                <p className="text-lg font-semibold">{lifecycleStats.erroredJobs}</p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs uppercase text-muted-foreground">Warning Jobs</p>
                <p className="text-lg font-semibold">{lifecycleStats.warningJobs}</p>
              </div>
            </div>

            {lifecycleStats.totalJobs > lifecycleStats.returnedJobs ? (
              <p className="text-xs text-muted-foreground">
                Showing latest {lifecycleStats.returnedJobs} of {lifecycleStats.totalJobs} lifecycle jobs.
              </p>
            ) : null}

            {selectedLifecycleJob ? (
              <div className="rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={getBadgeVariant(selectedLifecycleJob.status)}
                    className={getWarningBadgeClassName(selectedLifecycleJob.status)}
                  >
                    {getLifecycleActionLabel(selectedLifecycleJob)}
                  </Badge>
                  <Badge
                    variant={getBadgeVariant(selectedLifecycleJob.status)}
                    className={getWarningBadgeClassName(selectedLifecycleJob.status)}
                  >
                    {formatStatusLabel(selectedLifecycleJob.status)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Created {formatDate(selectedLifecycleJob.created_at)}
                  </span>
                  {selectedLifecycleJob.completed_at ? (
                    <span className="text-xs text-muted-foreground">
                      Completed {formatDate(selectedLifecycleJob.completed_at)}
                    </span>
                  ) : null}
                </div>
                <LifecycleAutoRetryDetails errorPayload={selectedLifecycleJob.error_payload} />
                {shouldShowLifecycleError(selectedLifecycleJob.error_payload, selectedLifecycleJob.status) ? (
                  <div className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive break-words whitespace-pre-wrap">
                    {(selectedLifecycleJob.error_payload.message as string) || "Lifecycle job failed."}
                    <LifecycleErrorDetails payload={selectedLifecycleJob.error_payload} />
                  </div>
                ) : null}
                {selectedWarnings.length ? (
                  <div className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-950 break-words">
                    Completed with warnings.
                    <LifecycleWarningDetails warnings={selectedWarnings} />
                  </div>
                ) : null}
              </div>
            ) : null}

            <StepTimeline
              steps={selectedLifecycleJob?.steps || []}
              isRetrying={lifecycleMutation.isPending}
              onRetryStep={
                selectedLifecycleJob && ["provision", "repair"].includes(selectedLifecycleJob.operation_type)
                  ? (stepName) =>
                      runAction(
                        () => clientApi.retryProvisioningStep(client.id, stepName),
                        `${stepName} retry queued.`
                      )
                  : undefined
              }
            />
          </CardContent>
        </Card>

        <Card className="xl:sticky xl:top-6 xl:self-start">
          <CardHeader>
            <CardTitle>Active Infrastructure</CardTitle>
            <CardDescription>
              Recorded resources eligible for repair or teardown.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResourceList resources={data.active_resources} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Preview and request teardown. Purge mode can also delete the client record and billing history after the infra is removed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="s3-mode">S3 Mode</Label>
              <Select
                value={s3Mode}
                onValueChange={(value) => setS3Mode(value as TeardownS3Mode)}
                disabled={deleteClientRecord}
              >
                <SelectTrigger id="s3-mode">
                  <SelectValue placeholder="Select S3 mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="archive">Archive</SelectItem>
                  <SelectItem value="purge">Purge</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rds-snapshot-mode">RDS Snapshot Mode</Label>
              <Select
                value={rdsSnapshotMode}
                onValueChange={(value) => setRdsSnapshotMode(value as TeardownRdsSnapshotMode)}
                disabled={deleteClientRecord}
              >
                <SelectTrigger id="rds-snapshot-mode">
                  <SelectValue placeholder="Select snapshot mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retain">Retain final snapshot</SelectItem>
                  <SelectItem value="purge">Purge without snapshot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                <div>
                  <Label htmlFor="delete-client-record" className="text-sm font-medium">
                    Delete Client Record
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Hard-delete the control-plane row after teardown succeeds.
                  </p>
                </div>
                <Switch
                  id="delete-client-record"
                  checked={deleteClientRecord}
                  onCheckedChange={setDeleteClientRecord}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="teardown-reason">Reason</Label>
              <Textarea
                id="teardown-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Explain why teardown is requested"
              />
            </div>
          </div>

          {archiveBucketRequired ? (
            <div className="space-y-2">
              <Label htmlFor="archive-bucket">Archive Bucket</Label>
              <Input
                id="archive-bucket"
                value={archiveBucket}
                onChange={(event) => setArchiveBucket(event.target.value)}
                placeholder="required when tenant assets live in S3"
              />
            </div>
          ) : (
            <Alert>
              <AlertTitle>Archive bucket not required</AlertTitle>
              <AlertDescription>
                Purge mode skips the S3 archive copy step and deletes the tenant bucket directly.
              </AlertDescription>
            </Alert>
          )}

          {deleteClientRecord ? (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Hard delete enabled</AlertTitle>
              <AlertDescription>
                This will purge billing rows and delete the client record after teardown completes. Use purge mode only.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p className="font-medium">Selected teardown modes</p>
            <p className="text-muted-foreground">
              S3: {effectiveTeardownS3Mode} · RDS snapshot: {effectiveTeardownRdsSnapshotMode} · Delete client record: {deleteClientRecord ? "yes" : "no"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="destructive"
              disabled={lifecycleMutation.isPending || !teardownModeValid || !hasArchiveBucket}
              onClick={() =>
                runAction(
                  () => clientApi.previewTeardown(client.id, teardownPayload),
                  "Teardown preview generated."
                )
              }
            >
              {teardownPreviewLabel}
            </Button>
            {isTeardownRetryable(latestTeardownJob) ? (
              <Button
                variant="outline"
                disabled={lifecycleMutation.isPending || !teardownModeValid || !hasArchiveBucket}
                onClick={() =>
                  runAction(
                    () => clientApi.retryTeardown(client.id, teardownPayload),
                    "Teardown preview regenerated."
                  )
                }
              >
                Retry Teardown
              </Button>
            ) : null}
            {teardownJobs.length > 1 && activeTeardownJobs.length > 0 ? (
              <Button
                variant="destructive"
                disabled={lifecycleMutation.isPending}
                onClick={() =>
                  runAction(cancelAllTeardownJobs, "All active teardown jobs were cancelled.")
                }
              >
                Cancel All Teardown Jobs
              </Button>
            ) : null}
            {isTeardownCancellable(latestTeardownJob) ? (
              <Button
                variant="outline"
                disabled={lifecycleMutation.isPending}
                onClick={() =>
                  runAction(
                    () => clientApi.cancelTeardown(client.id, { job_id: latestTeardownJob?.id }),
                    "Teardown cancellation requested."
                  )
                }
              >
                Cancel Teardown
              </Button>
            ) : null}
          </div>

          {latestTeardownJob ? (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={getBadgeVariant(latestTeardownJob.status)}>
                    Teardown {latestTeardownJob.status}
                  </Badge>
                  <Badge variant="outline">
                    S3 {requestedTeardownS3Mode}
                  </Badge>
                  <Badge variant="outline">
                    RDS {requestedTeardownRdsSnapshotMode}
                  </Badge>
                  <Badge variant="outline">
                    {requestedDeleteClientRecord ? "Client delete on" : "Client delete off"}
                  </Badge>
                  {latestTeardownJob.preview_expires_at ? (
                    <span className="text-xs text-muted-foreground">
                      Preview expires {formatDate(latestTeardownJob.preview_expires_at)}
                    </span>
                  ) : null}
                  {latestTeardownJob.grace_period_until ? (
                    <span className="text-xs text-muted-foreground">
                      Grace period until {formatDate(latestTeardownJob.grace_period_until)}
                    </span>
                  ) : null}
                </div>

                {teardownBlockers.length ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Teardown Blockers</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-4 space-y-1">
                        {teardownBlockers.map((blocker) => (
                          <li key={blocker}>{blocker}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <AlertTitle>Preview Ready</AlertTitle>
                    <AlertDescription>
                      Review the impact, type the exact confirmation string, then request teardown. The backend enforces the preview TTL and grace period.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="teardown-confirmation">Typed Confirmation</Label>
                  <Input
                    id="teardown-confirmation"
                    value={confirmationText}
                    onChange={(event) => setConfirmationText(event.target.value)}
                    placeholder={requiredConfirmationText || "Generate a preview first"}
                  />
                  {requiredConfirmationText ? (
                    <p className="text-xs text-muted-foreground">
                      Required text: <span className="font-mono">{requiredConfirmationText}</span>
                    </p>
                  ) : null}
                </div>

                <Button
                  variant="destructive"
                  disabled={
                    lifecycleMutation.isPending ||
                    !latestTeardownJob ||
                    latestTeardownJob.status !== "previewed" ||
                    !requiredConfirmationText ||
                    confirmationText.trim().replace(/\s+/g, ' ') !== requiredConfirmationText.trim().replace(/\s+/g, ' ') ||
                    teardownBlockers.length > 0 ||
                    !teardownModeValid ||
                    !hasArchiveBucket
                  }
                  onClick={() =>
                    runAction(
                      () =>
                        clientApi.requestTeardown(client.id, {
                          preview_job_id: latestTeardownJob.id,
                          ...teardownPayload,
                          confirmation_text: confirmationText,
                        }),
                      "Teardown requested. The grace period countdown is now active."
                    )
                  }
                >
                  {teardownRequestLabel}
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
