import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
      <DialogContent className="w-[calc(100%-2rem)] max-w-xl p-4 sm:p-6 dark:border-slate-700 dark:bg-[#171b27]">
        <DialogHeader>
          <DialogTitle className="dark:text-slate-50">Custom program intake URL</DialogTitle>
          <DialogDescription className="dark:text-slate-400">
            View or share the patient starting link for {programName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div
              role="textbox"
              aria-readonly="true"
              aria-label={`${programName} intake URL`}
              tabIndex={0}
              className="min-w-0 flex-1 select-text break-all rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs leading-relaxed text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {url || "Intake URL unavailable"}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleCopy()}
              disabled={!url}
              className="w-full shrink-0 sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy URL"}
            </Button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Patients who open this link will start this custom-program intake. The URL uses the client&apos;s configured questionnaire domain.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
