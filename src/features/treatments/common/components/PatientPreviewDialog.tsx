import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PatientPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewUrl: string;
  previewTitle?: string;
  subtitle: string;
  iframeTitle: string;
}

export function PatientPreviewDialog({
  open,
  onOpenChange,
  previewUrl,
  previewTitle = "Patient Preview",
  subtitle,
  iframeTitle,
}: PatientPreviewDialogProps) {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "closePreviewDialog") {
        onOpenChange(false);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[calc(100vh-48px)] max-h-[900px] w-[660px] max-w-[calc(100vw-32px)] flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-950 shadow-2xl dark:border-slate-800 dark:bg-[#171b27] dark:text-slate-50 [&>button]:hidden">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-5 py-4 text-left dark:border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold leading-6 text-slate-950 dark:text-slate-50">
                {previewTitle}
              </DialogTitle>
              <DialogDescription className="mt-1 truncate text-xs font-medium text-slate-400 dark:text-slate-500">
                {subtitle}
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-8 shrink-0 rounded-lg border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-[#171b27] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            >
              Close
            </Button>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 bg-slate-50 p-3 dark:bg-[#0f1117]">
          <div className="h-full overflow-hidden rounded-lg border border-slate-100 bg-white dark:border-slate-800">
            <iframe
              title={iframeTitle}
              src={previewUrl}
              className="h-full w-full border-0 bg-white"
              sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
