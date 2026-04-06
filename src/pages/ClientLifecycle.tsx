import { useMemo, useState } from "react";
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
} from "@/api/clientApi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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

const ACTIVE_LIFECYCLE_STATUSES = new Set(["pending", "previewed", "running", "cancel_requested"]);

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
            </div>
          ) : null}
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
  const teardownJobs = useMemo(
    () => data?.jobs.filter((job) => job.operation_type === "teardown") ?? [],
    [data?.jobs]
  );
  const activeTeardownJobs = useMemo(
    () => teardownJobs.filter(isTeardownCancellable),
    [teardownJobs]
  );
  const latestTeardownJob = activeTeardownJobs[0] ?? teardownJobs[0] ?? null;
  const teardownBlockers = getBlockers(latestTeardownJob);
  const requiredConfirmationText = (latestTeardownJob?.summary?.required_confirmation_text as string) || "";
  const hasActiveLifecycleJob = useMemo(
    () => Boolean(data?.jobs.some((job) => ACTIVE_LIFECYCLE_STATUSES.has(job.status))),
    [data?.jobs]
  );
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

  if (lifecycleQuery.isError || !client) {
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
          <CardHeader>
            <CardTitle>Lifecycle Timeline</CardTitle>
            <CardDescription>
              Step-level history for the latest job.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StepTimeline
              steps={latestJob?.steps || []}
              isRetrying={lifecycleMutation.isPending}
              onRetryStep={
                latestJob && latestJob.operation_type !== "teardown"
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
            Preview and request infra-only teardown. The client record stays for audit, but the tenant infrastructure is destroyed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="archive-bucket">Archive Bucket</Label>
              <Input
                id="archive-bucket"
                value={archiveBucket}
                onChange={(event) => setArchiveBucket(event.target.value)}
                placeholder="required when tenant assets live in S3"
              />
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

          <div className="flex flex-wrap gap-2">
            <Button
              variant="destructive"
              disabled={lifecycleMutation.isPending}
              onClick={() => runAction(() => clientApi.previewTeardown(client.id, { archive_bucket: archiveBucket, reason }), "Teardown preview generated.")}
            >
              Preview Teardown
            </Button>
            {isTeardownRetryable(latestTeardownJob) ? (
              <Button
                variant="outline"
                disabled={lifecycleMutation.isPending}
                onClick={() => runAction(() => clientApi.retryTeardown(client.id, { archive_bucket: archiveBucket, reason }), "Teardown preview regenerated.")}
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
                onClick={() => runAction(() => clientApi.cancelTeardown(client.id, { job_id: latestTeardownJob?.id }), "Teardown cancellation requested.")}
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
                    confirmationText !== requiredConfirmationText ||
                    teardownBlockers.length > 0
                  }
                  onClick={() =>
                    runAction(
                      () =>
                        clientApi.requestTeardown(client.id, {
                          preview_job_id: latestTeardownJob.id,
                          archive_bucket: archiveBucket,
                          reason,
                          confirmation_text: confirmationText,
                        }),
                      "Teardown requested. The grace period countdown is now active."
                    )
                  }
                >
                  Request Teardown
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
