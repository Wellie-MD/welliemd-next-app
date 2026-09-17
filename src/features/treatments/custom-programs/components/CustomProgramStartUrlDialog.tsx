import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface CustomProgramStartUrlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programName: string;
  url: string;
  onCopy: () => Promise<boolean> | boolean;
}

export function CustomProgramStartUrlDialog({
  open,
  onOpenChange,
  programName,
  url,
  onCopy,
}: CustomProgramStartUrlDialogProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open, url]);

  const handleCopy = async () => {
    if (await onCopy()) setCopied(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="custom-program-start-url-dialog"
        className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto rounded-xl p-4 sm:w-[calc(100vw-3rem)] sm:p-6 dark:border-slate-700 dark:bg-[#171b27]"
      >
        <DialogHeader className="pr-8 text-left">
          <DialogTitle className="text-base leading-6 dark:text-slate-50 sm:text-lg">Custom program intake URL</DialogTitle>
          <DialogDescription className="text-left text-xs leading-5 dark:text-slate-400 sm:text-sm">
            View or share the patient starting link for {programName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3" data-testid="custom-program-start-url-content">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/70">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Patient link
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <Textarea
                value={url}
                readOnly
                rows={3}
                aria-readonly="true"
                aria-label={`${programName} intake URL`}
                placeholder="Intake URL unavailable"
                onFocus={(event) => event.currentTarget.select()}
                className="min-h-20 min-w-0 flex-1 resize-none break-words border-slate-200 bg-white px-3 py-2 font-mono text-xs leading-relaxed text-slate-700 shadow-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-[#171b27] dark:text-slate-200"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleCopy()}
                disabled={!url}
                className="w-full dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:w-auto sm:shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy URL"}
              </Button>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Patients who open this link will start this custom-program intake. The URL uses the client&apos;s configured questionnaire domain.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
