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
  issuePreviewCapability,
  type PreviewCapability,
} from "@/features/treatments/preview/api";
import {
  buildCapabilityQuestionnairePreviewUrl,
  getQuestionnairePreviewApiBaseUrl,
} from "@/features/treatments/utils/previewUrl";
import type { PreviewContext } from "@/features/treatments/types";

interface QuestionnairePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewContext: PreviewContext;
  subtitle: string;
  iframeTitle: string;
}

interface PreviewMessage {
  type?: string;
  version?: number;
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
  iframeTitle,
}: QuestionnairePreviewDialogProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const appliedIdentityRef = useRef<QuestionnairePreviewIdentity>(
    QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient,
  );
  const [identity, setIdentity] = useState<QuestionnairePreviewIdentity>(
    QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient,
  );
  const [identitySwitching, setIdentitySwitching] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [reportedHeight, setReportedHeight] = useState<number | undefined>();
  const [reportedPath, setReportedPath] = useState<string | undefined>();
  const [capability, setCapability] = useState<PreviewCapability | null>(null);
  const previewUrl = useMemo(
    () => capability
      ? buildCapabilityQuestionnairePreviewUrl({
          capabilityToken: capability.capabilityToken,
          apiBaseUrl: previewContext.apiBaseUrl || getQuestionnairePreviewApiBaseUrl(),
          snapshotChecksum: capability.snapshotChecksum,
          snapshotId: capability.snapshotId,
        })
      : null,
    [capability, previewContext.apiBaseUrl],
  );
  const contextualUrl = useMemo(
    () => previewUrl ? withShellContext(previewUrl, identity) : null,
    [identity, previewUrl],
  );
  const iframeUrl = useMemo(
    () => previewUrl
      ? withShellContext(previewUrl, QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient)
      : null,
    [previewUrl],
  );
  const previewOrigin = useMemo(
    () => contextualUrl ? new URL(contextualUrl).origin : null,
    [contextualUrl],
  );

  useEffect(() => {
    if (!open) {
      setCapability(null);
      return;
    }
    let active = true;
    setIdentity(QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient);
    appliedIdentityRef.current = QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient;
    setIdentitySwitching(false);
    setReportedHeight(undefined);
    setReportedPath(undefined);
    setStatus("loading");
    setErrorMessage("");
    issuePreviewCapability(previewContext)
      .then((issued) => {
        if (active) setCapability(issued);
      })
      .catch((error) => {
        if (!active) return;
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
        setStatus("ready");
      } else if (
        event.data.type === QUESTIONNAIRE_PREVIEW_MESSAGE.identityReady &&
        Object.values(QUESTIONNAIRE_PREVIEW_IDENTITY).includes(
          event.data.identity as QuestionnairePreviewIdentity,
        )
      ) {
        appliedIdentityRef.current = event.data.identity as QuestionnairePreviewIdentity;
        setIdentitySwitching(false);
        if (event.data.message) {
          setStatus("error");
          setErrorMessage(event.data.message);
        }
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
    return () => window.removeEventListener("message", handleMessage);
  }, [onOpenChange, open, previewOrigin]);

  const refresh = () => {
    if (!previewOrigin) return;
    appliedIdentityRef.current = QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient;
    setIdentitySwitching(false);
    setStatus("loading");
    setErrorMessage("");
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: QUESTIONNAIRE_PREVIEW_MESSAGE.refresh,
        version: QUESTIONNAIRE_PREVIEW_DEFAULTS.protocolVersion,
      },
      previewOrigin,
    );
    setRefreshKey((value) => value + 1);
  };

  useEffect(() => {
    if (
      !previewOrigin ||
      status !== "ready" ||
      appliedIdentityRef.current === identity
    ) {
      return;
    }
    setIdentitySwitching(true);
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: QUESTIONNAIRE_PREVIEW_MESSAGE.identity,
        version: QUESTIONNAIRE_PREVIEW_DEFAULTS.protocolVersion,
        identity,
      },
      previewOrigin,
    );
  }, [identity, previewOrigin, status]);

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
              onClick={() => setIdentity(QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient)}
              disabled={identitySwitching}
              aria-pressed={identity === QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient}
              className={`treatment-preview-identity flex h-7 items-center gap-1.5 whitespace-nowrap rounded px-2.5 text-[11px] font-medium transition ${
                identity === QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <UserPlus className="h-3 w-3" />
              New patient
            </button>
            <button
              type="button"
              onClick={() => setIdentity(QUESTIONNAIRE_PREVIEW_IDENTITY.existingPatient)}
              disabled={identitySwitching}
              aria-pressed={identity === QUESTIONNAIRE_PREVIEW_IDENTITY.existingPatient}
              className={`treatment-preview-identity flex h-7 items-center gap-1.5 whitespace-nowrap rounded px-2.5 text-[11px] font-medium transition ${
                identity === QUESTIONNAIRE_PREVIEW_IDENTITY.existingPatient
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted"
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
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-3 text-xs text-muted-foreground">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-warning" />
                  {identitySwitching
                    ? "Switching preview patient…"
                    : "Loading patient preview…"}
                </div>
              </div>
            ) : null}
            {status === "error" ? (
              <div role="alert" className="absolute inset-x-3 top-3 z-10 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {errorMessage}
              </div>
            ) : null}
            {iframeUrl ? (
              <iframe
                ref={iframeRef}
                key={refreshKey}
                title={iframeTitle}
                src={iframeUrl}
                data-content-height={reportedHeight}
                data-preview-path={reportedPath}
                className={`h-full w-full border-0 bg-white transition-opacity ${
                  status === "ready" ? "opacity-100" : "opacity-0"
                }`}
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
              />
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-border px-5 py-3">
          <div className="flex items-center gap-1">
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={refresh} aria-label="Refresh preview">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8" asChild>
              <a href={contextualUrl || undefined} target="_blank" rel="noreferrer" aria-label="Open preview in new tab">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
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
