import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, LogIn, RefreshCw, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  QUESTIONNAIRE_PREVIEW_DEFAULTS,
  QUESTIONNAIRE_PREVIEW_IDENTITY,
  QUESTIONNAIRE_PREVIEW_MESSAGE,
  type QuestionnairePreviewIdentity,
} from "@/features/treatments/preview/constants";
import {
  buildCapabilityQuestionnairePreviewUrl,
  getQuestionnairePreviewApiBaseUrl,
} from "@/features/treatments/utils/previewUrl";
import {
  issuePreviewCapability,
  type PreviewCapability,
} from "@/features/treatments/preview/api";
import { isMatchingPreviewIdentityAcknowledgement } from "@/features/treatments/preview/identitySwitch";
import type { PreviewContext } from "@/features/treatments/types";

interface QuestionnairePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewContext: PreviewContext;
  subtitle: string;
}

interface PreviewMessage {
  type?: string;
  version?: number;
  requestId?: number;
  resetDurationMs?: number | null;
  requestReceivedAt?: number | null;
  height?: number;
  pathname?: string;
  message?: string;
  identity?: QuestionnairePreviewIdentity;
}

const withShellContext = (
  rawUrl: string,
  identity: QuestionnairePreviewIdentity,
) => {
  const url = new URL(rawUrl);
  url.searchParams.set("preview_identity", identity);
  url.searchParams.set("parent_origin", window.location.origin);
  return url.toString();
};

export function QuestionnairePreviewDialog({
  open,
  onOpenChange,
  previewContext,
  subtitle,
}: QuestionnairePreviewDialogProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const appliedIdentityRef = useRef<QuestionnairePreviewIdentity>(
    QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient,
  );
  const appliedIdentityRequestRef = useRef<number | null>(null);
  const identitySwitchTimerRef = useRef<number | null>(null);
  const loadingTimeoutRef = useRef<number | null>(null);
  const identityRequestSequenceRef = useRef(0);
  const identitySwitchStartedAtRef = useRef<number | null>(null);
  const [identity, setIdentity] = useState<QuestionnairePreviewIdentity>(
    QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient,
  );
  const [appliedIdentity, setAppliedIdentity] = useState<QuestionnairePreviewIdentity>(
    QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient,
  );
  const [identityRequestId, setIdentityRequestId] = useState(0);
  const [identitySwitching, setIdentitySwitching] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [isSlowLoading, setIsSlowLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [reportedHeight, setReportedHeight] = useState<number | undefined>();
  const [reportedPath, setReportedPath] = useState<string | undefined>();
  const [capability, setCapability] = useState<PreviewCapability | null>(null);
  const previewApiBaseUrl =
    "apiBaseUrl" in previewContext
      ? previewContext.apiBaseUrl
      : getQuestionnairePreviewApiBaseUrl();

  const capabilityUrl = useMemo(
    () => capability
      ? buildCapabilityQuestionnairePreviewUrl({
          capabilityToken: capability.capabilityToken,
          apiBaseUrl: previewApiBaseUrl,
          snapshotChecksum: capability.snapshotChecksum,
          snapshotId: capability.snapshotId,
        })
      : null,
    [capability, previewApiBaseUrl],
  );
  const previewUrl = useMemo(
    () => capabilityUrl ? withShellContext(capabilityUrl, identity) : null,
    [capabilityUrl, identity],
  );
  const iframeUrl = useMemo(
    () => capabilityUrl
      ? withShellContext(capabilityUrl, QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient)
      : null,
    [capabilityUrl],
  );
  const previewOrigin = useMemo(
    () => previewUrl ? new URL(previewUrl).origin : null,
    [previewUrl],
  );

  const clearTimers = () => {
    if (identitySwitchTimerRef.current !== null) {
      window.clearTimeout(identitySwitchTimerRef.current);
      identitySwitchTimerRef.current = null;
    }
    if (loadingTimeoutRef.current !== null) {
      window.clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!open) {
      clearTimers();
      appliedIdentityRequestRef.current = null;
      setCapability(null);
      return;
    }
    let active = true;
    setIdentity(QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient);
    setAppliedIdentity(QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient);
    appliedIdentityRef.current = QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient;
    setIdentityRequestId(0);
    identityRequestSequenceRef.current = 0;
    appliedIdentityRequestRef.current = null;
    setIdentitySwitching(false);
    setReportedHeight(undefined);
    setReportedPath(undefined);
    setStatus("loading");
    setIsSlowLoading(false);
    setErrorMessage("");

    // Start a 3s safety timer to detect if popup/iframe is blocked or slow to handshake
    loadingTimeoutRef.current = window.setTimeout(() => {
      if (active) {
        setIsSlowLoading(true);
      }
    }, 3000);

    issuePreviewCapability(previewContext)
      .then((issued) => {
        if (active) setCapability(issued);
      })
      .catch((error) => {
        if (!active) return;
        if (loadingTimeoutRef.current !== null) {
          window.clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
        const details = error?.response?.data?.details;
        setStatus("error");
        setErrorMessage(
          (typeof details === "string" ? details : null) ||
          error?.response?.data?.detail ||
          error?.message ||
          "The questionnaire preview could not be prepared.",
        );
      });
    return () => {
      active = false;
      clearTimers();
      appliedIdentityRequestRef.current = null;
    };
  }, [open, previewContext.id, previewContext.type]);

  useEffect(() => {
    if (!open || !previewOrigin) return;
    setStatus("loading");
    setErrorMessage("");

    const handleMessage = (event: MessageEvent<PreviewMessage>) => {
      if (
        event.origin !== previewOrigin ||
        event.source !== iframeRef.current?.contentWindow ||
        event.data?.version !== QUESTIONNAIRE_PREVIEW_DEFAULTS.protocolVersion
      ) {
        return;
      }

      if (event.data.type === QUESTIONNAIRE_PREVIEW_MESSAGE.ready) {
        if (loadingTimeoutRef.current !== null) {
          window.clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
        setIsSlowLoading(false);
        setStatus("ready");
      } else if (
        event.data.type === QUESTIONNAIRE_PREVIEW_MESSAGE.identityReady &&
        isMatchingPreviewIdentityAcknowledgement({
          activeRequestId: appliedIdentityRequestRef.current,
          requestId: event.data.requestId,
          requestedIdentity: identity,
          identity: event.data.identity,
          identities: Object.values(QUESTIONNAIRE_PREVIEW_IDENTITY) as QuestionnairePreviewIdentity[],
        })
      ) {
        if (identitySwitchTimerRef.current !== null) {
          window.clearTimeout(identitySwitchTimerRef.current);
          identitySwitchTimerRef.current = null;
        }
        appliedIdentityRequestRef.current = null;
        const duration = identitySwitchStartedAtRef.current
          ? Math.round(performance.now() - identitySwitchStartedAtRef.current)
          : null;
        identitySwitchStartedAtRef.current = null;
        setIdentitySwitching(false);
        setStatus("ready");
        setIsSlowLoading(false);
        if (event.data.message) {
          setErrorMessage(event.data.message);
        } else {
          const nextIdentity = event.data.identity as QuestionnairePreviewIdentity;
          appliedIdentityRef.current = nextIdentity;
          setAppliedIdentity(nextIdentity);
          setErrorMessage("");
        }
        if (import.meta.env.DEV) {
          console.debug("[TreatmentPreview] identity switch acknowledged", {
            durationMs: duration,
            requestId: event.data.requestId,
            childResetDurationMs: event.data.resetDurationMs,
            childRequestReceivedAt: event.data.requestReceivedAt,
          });
        }
      } else if (
        event.data.type === QUESTIONNAIRE_PREVIEW_MESSAGE.identityState &&
        Object.values(QUESTIONNAIRE_PREVIEW_IDENTITY).includes(
          event.data.identity as QuestionnairePreviewIdentity,
        ) &&
        appliedIdentityRequestRef.current === null
      ) {
        const nextIdentity = event.data.identity as QuestionnairePreviewIdentity;
        appliedIdentityRef.current = nextIdentity;
        setAppliedIdentity(nextIdentity);
        setIdentity(nextIdentity);
        setIdentitySwitching(false);
        setErrorMessage("");
      } else if (
        event.data.type === QUESTIONNAIRE_PREVIEW_MESSAGE.resize &&
        Number.isFinite(event.data.height)
      ) {
        setReportedHeight(event.data.height);
      } else if (event.data.type === QUESTIONNAIRE_PREVIEW_MESSAGE.navigation) {
        setReportedPath(event.data.pathname);
      } else if (event.data.type === QUESTIONNAIRE_PREVIEW_MESSAGE.close) {
        onOpenChange(false);
      } else if (event.data.type === QUESTIONNAIRE_PREVIEW_MESSAGE.error) {
        setStatus("error");
        setErrorMessage(event.data.message || "The questionnaire preview could not continue.");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      clearTimers();
    };
  }, [identity, onOpenChange, open, previewOrigin]);

  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, "_blank", "noopener,noreferrer");
    }
  };

  const refresh = () => {
    if (!previewOrigin) return;
    clearTimers();
    appliedIdentityRef.current = QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient;
    setAppliedIdentity(QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient);
    setIdentity(QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient);
    setIdentityRequestId(0);
    identityRequestSequenceRef.current = 0;
    appliedIdentityRequestRef.current = null;
    identitySwitchStartedAtRef.current = null;
    setIdentitySwitching(false);
    setStatus("loading");
    setIsSlowLoading(false);
    setErrorMessage("");
    loadingTimeoutRef.current = window.setTimeout(() => {
      setIsSlowLoading(true);
    }, 3000);
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: QUESTIONNAIRE_PREVIEW_MESSAGE.refresh,
        version: QUESTIONNAIRE_PREVIEW_DEFAULTS.protocolVersion,
      },
      previewOrigin,
    );
    setRefreshKey((value) => value + 1);
  };

  const requestIdentity = (nextIdentity: QuestionnairePreviewIdentity) => {
    if (!previewOrigin || identitySwitching) return;
    if (nextIdentity === appliedIdentity) return;
    const requestId = ++identityRequestSequenceRef.current;
    appliedIdentityRequestRef.current = requestId;
    identitySwitchStartedAtRef.current = performance.now();
    setErrorMessage("");
    if (status !== "ready") setStatus("ready");
    setIdentity(nextIdentity);
    setIdentityRequestId(requestId);
    setIdentitySwitching(true);
  };

  useEffect(() => {
    if (
      !previewOrigin ||
      status !== "ready" ||
      appliedIdentityRef.current === identity ||
      identityRequestId === 0 ||
      appliedIdentityRequestRef.current !== identityRequestId
    ) {
      return;
    }
    if (identitySwitchTimerRef.current !== null) {
      window.clearTimeout(identitySwitchTimerRef.current);
    }
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: QUESTIONNAIRE_PREVIEW_MESSAGE.identity,
        version: QUESTIONNAIRE_PREVIEW_DEFAULTS.protocolVersion,
        identity,
        requestId: identityRequestId,
      },
      previewOrigin,
    );
    identitySwitchTimerRef.current = window.setTimeout(() => {
      if (appliedIdentityRequestRef.current !== identityRequestId) return;
      identitySwitchTimerRef.current = null;
      appliedIdentityRequestRef.current = null;
      identitySwitchStartedAtRef.current = null;
      setIdentitySwitching(false);
      setStatus("ready");
      setErrorMessage("The preview patient switch timed out. Try again or refresh the preview.");
    }, QUESTIONNAIRE_PREVIEW_DEFAULTS.identitySwitchTimeoutMs);
  }, [identity, identityRequestId, previewOrigin, status]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[calc(100dvh-24px)] w-[calc(100vw-24px)] max-w-none flex-col gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-2xl sm:max-w-none [&>button]:hidden"
        style={{
          maxHeight: QUESTIONNAIRE_PREVIEW_DEFAULTS.modalMaxHeightPx,
          maxWidth: QUESTIONNAIRE_PREVIEW_DEFAULTS.modalWidthPx,
        }}
      >
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold text-foreground">
                Patient Preview
              </DialogTitle>
              <DialogDescription className="mt-1 break-words text-xs text-muted-foreground">
                {subtitle}
              </DialogDescription>
            </div>
            <button
              type="button"
              className="rounded-md p-1 text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onOpenChange(false)}
              aria-label="Close patient preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Test as
          </span>
          <div className="flex max-w-full rounded-md border border-border bg-card p-0.5" role="group" aria-label="Preview patient type">
            <button
              type="button"
              onClick={() => requestIdentity(QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient)}
              disabled={identitySwitching}
              aria-pressed={appliedIdentity === QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient}
              className={`treatment-preview-identity flex h-7 items-center gap-1.5 whitespace-nowrap rounded px-2.5 text-[11px] font-medium transition ${
                appliedIdentity === QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient
                  ? "bg-foreground text-background"
                  : "text-text-secondary hover:bg-muted"
              }`}
            >
              <UserPlus className="h-3 w-3" />
              New patient
            </button>
            <button
              type="button"
              onClick={() => requestIdentity(QUESTIONNAIRE_PREVIEW_IDENTITY.existingPatient)}
              disabled={identitySwitching}
              aria-pressed={appliedIdentity === QUESTIONNAIRE_PREVIEW_IDENTITY.existingPatient}
              className={`treatment-preview-identity flex h-7 items-center gap-1.5 whitespace-nowrap rounded px-2.5 text-[11px] font-medium transition ${
                appliedIdentity === QUESTIONNAIRE_PREVIEW_IDENTITY.existingPatient
                  ? "bg-foreground text-background"
                  : "text-text-secondary hover:bg-muted"
              }`}
            >
              <LogIn className="h-3 w-3" />
              Existing patient
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 bg-background p-3">
          <div className="relative h-full overflow-hidden rounded-lg border border-border bg-white">
            {status === "loading" || identitySwitching ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white p-4">
                <div className="flex flex-col items-center gap-3 text-xs text-muted-foreground">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-warning" />
                  <span>
                    {identitySwitching
                      ? "Switching preview patient…"
                      : "Loading patient preview…"}
                  </span>
                  {isSlowLoading ? (
                    <div className="mt-2 flex flex-col items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-center text-xs text-amber-800">
                      <p>
                        Preview is taking longer than expected. This may indicate a browser popup or security setting blocking the application.
                      </p>
                      <p style={{ fontSize: "11px", marginTop: "8px" }}>
                        Try opening in a new tab, or check your browser popup blocker and reload.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        className="mt-2 h-8 gap-1.5 bg-amber-600 px-3 text-white hover:bg-amber-700"
                        onClick={openInNewTab}
                        disabled={!previewUrl}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open in New Tab
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
            {errorMessage ? (
              <div role="alert" className="absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <span>{errorMessage}</span>
                <span className="flex shrink-0 items-center gap-1">
                  {identity !== appliedIdentity ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-7 border-destructive/30 px-2 text-[11px] text-destructive"
                      onClick={() => requestIdentity(identity)}
                    >
                      Retry
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-7 border-destructive/30 px-2 text-[11px] text-destructive"
                    onClick={refresh}
                  >
                    Refresh
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-7 border-destructive/30 px-2 text-[11px] text-destructive"
                    onClick={openInNewTab}
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Open Tab
                  </Button>
                </span>
              </div>
            ) : null}
            {iframeUrl ? (
              <iframe
                ref={iframeRef}
                key={refreshKey}
                title="Patient questionnaire preview"
                src={iframeUrl}
                data-content-height={reportedHeight}
                data-preview-path={reportedPath}
                className={`h-full w-full border-0 bg-white transition-opacity ${
                  status === "ready" ? "opacity-100" : "opacity-0"
                }`}
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads allow-storage-access-by-user-activation allow-presentation"
              />
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={refresh} title="Refresh preview" aria-label="Refresh preview">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={openInNewTab}
              disabled={!previewUrl}
              title="Open preview in new tab"
              aria-label="Open preview in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button type="button" variant="outline" className="h-8 px-4 text-xs" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
