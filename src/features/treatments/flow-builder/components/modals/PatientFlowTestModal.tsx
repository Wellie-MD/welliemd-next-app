import { useMemo, useState } from "react";
import { ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildQuestionnairePreviewUrl,
} from "@/features/treatments/utils/previewUrl";
import type { PreviewContext } from "@/features/treatments/types";

interface PatientFlowTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewContext: PreviewContext;
}

export function PatientFlowTestModal({
  open,
  onOpenChange,
  previewContext,
}: PatientFlowTestModalProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const previewUrl = useMemo(
    () => buildQuestionnairePreviewUrl(previewContext),
    [previewContext]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[88vh] w-[95vw] max-w-[1280px] flex-col gap-0 overflow-hidden bg-slate-50 p-0">
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                Real Questionnaire Preview
              </DialogTitle>
              <p className="mt-1 text-sm text-slate-500">
                Opens the questionnaire runtime with preview parameters. Backend side-effect blocking is still pending.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => setRefreshKey((value) => value + 1)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" asChild>
                <a href={previewUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in new tab
                </a>
              </Button>
              <Button onClick={() => onOpenChange(false)} className="bg-[#12517A] text-white hover:bg-[#12517A]/90">
                Close
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-900">
          <div className="flex gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <span className="font-semibold">Preview contract ready:</span>{" "}
              this URL includes <code>preview=true</code>, <code>source=admin</code>, and{" "}
              <code>disable_side_effects=true</code>. Final no-patient/no-order/no-payment enforcement must be completed in backend.
            </div>
          </div>
        </div>

        <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Preview URL
          </div>
          <div className="mt-1 break-all rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
            {previewUrl}
          </div>
        </div>

        <div className="min-h-0 flex-1 bg-slate-100">
          <iframe
            key={refreshKey}
            title={`Questionnaire preview`}
            src={previewUrl}
            className="h-full w-full border-0 bg-white"
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
