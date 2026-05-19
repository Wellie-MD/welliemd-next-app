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
import { toast } from "@/components/ui/use-toast";

const getBadgeVariant = (status?: string) => {
  if (!status) return "outline" as const;
  if (["ready", "completed"].includes(status)) return "default" as const;
  if (["failed", "blocked", "error", "cancel_requested"].includes(status)) return "destructive" as const;
  if (["previewed", "pending", "running", "provisioning", "repairing", "tearing_down", "scheduled"].includes(status)) {
    return "secondary" as const;
  }
  return "outline" as const;
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

const ERROR_JOB_STATUSES = new Set(["partial_failed", "failed", "blocked"]);

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

const getLifecycleJobMessage = (job: LifecycleJob) => {
  const message = stringifyValue(job.error_payload?.message);
  if (message) return message;
  const failedSteps = job.steps
    .filter((step) => ERROR_JOB_STATUSES.has(step.status) || hasPayload(step.error_payload))
    .map((step) => `${step.display_name || step.name}: ${stringifyValue(step.error_payload?.message) || step.status}`);
  if (failedSteps.length) return failedSteps.join(" · ");
  return job.status;
};

const formatLifecycleJobOption = (job: LifecycleJob, latestJobId?: string) => {
  const marker = latestJobId === job.id ? "Latest · " : "";
  return `${marker}${formatDate(job.created_at)} · ${getLifecycleActionLabel(job)} · ${job.status}`;
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
            <Badge variant={getBadgeVariant(step.status)}>{step.status}</Badge>
          </div>
          {step.error_payload && Object.keys(step.error_payload).length > 0 ? (
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
            <Badge variant={getBadgeVariant(resource.teardown_status)}>{resource.teardown_status}</Badge>
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
  const lifecycleJobs = data?.jobs ?? [];
  const selectedLifecycleJob = useMemo(() => {
    if (selectedLifecycleJobId === "latest") return latestJob;
    return lifecycleJobs.find((job) => job.id === selectedLifecycleJobId) || latestJob;
  }, [latestJob, lifecycleJobs, selectedLifecycleJobId]);
  const lifecycleStats = useMemo(() => {
    const operationCounts = data?.job_counts?.by_operation ?? {};
    const totalJobs = data?.job_counts?.total ?? lifecycleJobs.length;
    const returnedJobs = data?.job_counts?.returned ?? lifecycleJobs.length;
    const erroredJobs =
      data?.job_counts?.errored ??
      lifecycleJobs.filter((job) => ERROR_JOB_STATUSES.has(job.status) || hasPayload(job.error_payload)).length;
    return {
      totalJobs,
      returnedJobs,
      verificationRuns: operationCounts.verify ?? lifecycleJobs.filter((job) => job.operation_type === "verify").length,
      repairRuns: operationCounts.repair ?? lifecycleJobs.filter((job) => job.operation_type === "repair").length,
      provisionRuns: operationCounts.provision ?? lifecycleJobs.filter((job) => job.operation_type === "provision").length,
      erroredJobs,
    };
  }, [data?.job_counts, lifecycleJobs]);
  const lifecycleErrorJobs = useMemo(
    () => lifecycleJobs.filter((job) => ERROR_JOB_STATUSES.has(job.status) || hasPayload(job.error_payload)),
    [lifecycleJobs]
  );
  const teardownJobs = useMemo(
    () => lifecycleJobs.filter((job) => job.operation_type === "teardown"),
    [lifecycleJobs]
  );
  const activeTeardownJobs = useMemo(
    () => teardownJobs.filter(isTeardownCancellable),
    [teardownJobs]
  );
  const latestTeardownJob = activeTeardownJobs[0] ?? teardownJobs[0] ?? null;
  const latestTeardownRequest = (latestTeardownJob?.request_payload || {}) as Record<string, unknown>;
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
    latestTeardownJob?.id,
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
          <Badge variant={getBadgeVariant(client.lifecycle_state)}>{client.lifecycle_state || "unknown"}</Badge>
          <Badge variant={getBadgeVariant(client.provisioning_status)}>{client.provisioning_status || "unknown"}</Badge>
          <Badge variant={getBadgeVariant(client.teardown_status)}>{client.teardown_status || "unknown"}</Badge>
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
              <p className="font-medium">{latestJob ? `${latestJob.operation_type} (${latestJob.status})` : "No lifecycle job yet"}</p>
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

          {latestJob?.error_payload && Object.keys(latestJob.error_payload).length > 0 ? (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Latest Lifecycle Error</AlertTitle>
              <AlertDescription>
                {(latestJob.error_payload.message as string) || "The latest lifecycle job failed."}
                <LifecycleErrorDetails payload={latestJob.error_payload} />
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={lifecycleMutation.isPending || hasActiveLifecycleJob}
              onClick={() => runAction(() => clientApi.retryProvisioning(client.id), "Provisioning retry queued.")}
            >
              {lifecycleMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Retry Provisioning
            </Button>
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
              Cancel active teardown jobs before retrying provisioning or running verification.
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
                        Latest · {formatDate(latestJob.created_at)} · {getLifecycleActionLabel(latestJob)} · {latestJob.status}
                      </SelectItem>
                    ) : (
                      <SelectItem value="latest">No lifecycle job yet</SelectItem>
                    )}
                    {lifecycleJobs.map((job) => (
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
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            </div>

            {lifecycleStats.totalJobs > lifecycleStats.returnedJobs ? (
              <p className="text-xs text-muted-foreground">
                Showing latest {lifecycleStats.returnedJobs} of {lifecycleStats.totalJobs} lifecycle jobs.
              </p>
            ) : null}

            {selectedLifecycleJob ? (
              <div className="rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={getBadgeVariant(selectedLifecycleJob.status)}>
                    {getLifecycleActionLabel(selectedLifecycleJob)}
                  </Badge>
                  <Badge variant={getBadgeVariant(selectedLifecycleJob.status)}>{selectedLifecycleJob.status}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Created {formatDate(selectedLifecycleJob.created_at)}
                  </span>
                  {selectedLifecycleJob.completed_at ? (
                    <span className="text-xs text-muted-foreground">
                      Completed {formatDate(selectedLifecycleJob.completed_at)}
                    </span>
                  ) : null}
                </div>
                {hasPayload(selectedLifecycleJob.error_payload) ? (
                  <div className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive break-words whitespace-pre-wrap">
                    {(selectedLifecycleJob.error_payload.message as string) || "Lifecycle job failed."}
                    <LifecycleErrorDetails payload={selectedLifecycleJob.error_payload} />
                  </div>
                ) : null}
              </div>
            ) : null}

            {lifecycleErrorJobs.length ? (
              <div className="space-y-2 rounded-md border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-sm font-medium text-destructive">Historical errors</p>
                <div className="space-y-2">
                  {lifecycleErrorJobs.map((job) => (
                    <button
                      type="button"
                      key={job.id}
                      className="w-full rounded-md border bg-background p-3 text-left text-sm transition-colors hover:bg-muted"
                      onClick={() => setSelectedLifecycleJobId(job.id)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={getBadgeVariant(job.status)}>{job.status}</Badge>
                        <span className="font-medium">{getLifecycleActionLabel(job)}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(job.created_at)}</span>
                      </div>
                      <p className="mt-1 break-words text-xs text-muted-foreground">
                        {getLifecycleJobMessage(job)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <StepTimeline
              steps={selectedLifecycleJob?.steps || []}
              isRetrying={lifecycleMutation.isPending}
              onRetryStep={
                selectedLifecycleJob && selectedLifecycleJob.operation_type !== "teardown"
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
