import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LockKeyhole } from "lucide-react";
import type { ProgramAuthConfig } from "@/features/treatments/types";

interface AuthSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: ProgramAuthConfig) => void;
  initialConfig?: ProgramAuthConfig;
}

const DEFAULT_AUTH_CONFIG: ProgramAuthConfig = {
  email: true,
  phone: false,
  identity: false,
  account: true,
  enabled: true,
};

export function AuthSetupModal({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: AuthSetupModalProps) {
  const save = () => {
    onSave({
      ...DEFAULT_AUTH_CONFIG,
      ...(initialConfig || {}),
      enabled: true,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <LockKeyhole className="h-5 w-5" />
            <DialogTitle className="text-base font-bold text-slate-900">
              Patient Authentication · Locked first step
            </DialogTitle>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Patients enter their email first. Existing patients then sign in;
            new patients continue to account creation.
          </p>
        </DialogHeader>

        <div className="py-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-relaxed text-blue-800">
            New-patient account creation collects name, phone, date of birth,
            sex assigned at birth, and the required legal acknowledgements.
            Existing patients reuse their saved profile and only complete
            fields that are missing. Do not add duplicate DOB or sex questions
            to the clinical flow.
            </div>
        </div>

        <DialogFooter className="border-t border-slate-100 pt-4 flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs font-semibold border-slate-200"
          >
            Cancel
          </Button>
          <Button
            onClick={save}
            className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
          >
            {initialConfig?.enabled
              ? "Save Patient Authentication"
              : "Add Patient Authentication"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
