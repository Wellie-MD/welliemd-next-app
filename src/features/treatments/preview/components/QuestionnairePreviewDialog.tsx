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

interface QuestionnairePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewUrl: string;
  subtitle: string;
  iframeTitle: string;
}

interface PreviewMessage {
  type?: string;
  version?: number;
  message?: string;
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
  previewUrl,
  subtitle,
  iframeTitle,
}: QuestionnairePreviewDialogProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [identity, setIdentity] = useState<QuestionnairePreviewIdentity>(
    QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient,
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const contextualUrl = useMemo(
    () => withShellContext(previewUrl, identity),
    [identity, previewUrl],
  );
  const previewOrigin = useMemo(() => new URL(contextualUrl).origin, [contextualUrl]);

  useEffect(() => {
    if (!open) return;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(600px,calc(100dvh-32px))] w-[min(512px,calc(100vw-32px))] max-w-none flex-col gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-2xl [&>button]:hidden">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold text-foreground">
                Patient Preview
              </DialogTitle>
              <DialogDescription className="mt-1 truncate text-xs text-muted-foreground">
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

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Test as
          </span>
          <div className="flex rounded-md border border-border bg-card p-0.5" role="group" aria-label="Preview patient type">
            <button
              type="button"
              onClick={() => setIdentity(QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient)}
              aria-pressed={identity === QUESTIONNAIRE_PREVIEW_IDENTITY.newPatient}
              className={`flex h-7 items-center gap-1.5 rounded px-2.5 text-[11px] font-medium transition ${
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
              aria-pressed={identity === QUESTIONNAIRE_PREVIEW_IDENTITY.existingPatient}
              className={`flex h-7 items-center gap-1.5 rounded px-2.5 text-[11px] font-medium transition ${
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
            {status === "loading" ? (
              <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-muted">
                <div className="h-full w-1/3 animate-pulse bg-warning" />
              </div>
            ) : null}
            {status === "error" ? (
              <div role="alert" className="absolute inset-x-3 top-3 z-10 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {errorMessage}
              </div>
            ) : null}
            <iframe
              ref={iframeRef}
              key={`${refreshKey}-${identity}`}
              title={iframeTitle}
              src={contextualUrl}
              className="h-full w-full border-0 bg-white"
              sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-border px-5 py-3">
          <div className="flex items-center gap-1">
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={refresh} aria-label="Refresh preview">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8" asChild>
              <a href={contextualUrl} target="_blank" rel="noreferrer" aria-label="Open preview in new tab">
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
