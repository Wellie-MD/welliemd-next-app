import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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
      <DialogContent className="max-w-xl dark:border-slate-700 dark:bg-[#171b27]">
        <DialogHeader>
          <DialogTitle className="dark:text-slate-50">Custom program intake URL</DialogTitle>
          <DialogDescription className="dark:text-slate-400">
            View or share the patient starting link for {programName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              value={url}
              readOnly
              aria-label={`${programName} intake URL`}
              className="min-w-0 font-mono text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleCopy()}
              disabled={!url}
              className="shrink-0 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
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
