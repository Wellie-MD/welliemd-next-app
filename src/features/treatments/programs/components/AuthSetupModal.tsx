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

export function AuthSetupModal({ open, onOpenChange }: AuthSetupModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <LockKeyhole className="h-5 w-5" />
            <DialogTitle className="text-base font-bold text-slate-900">
              Personal Details · Locked first step
            </DialogTitle>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            This required questionnaire step collects name, email, US phone number, and the Terms, Privacy Policy, and Telehealth consent before account creation or login.
          </p>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-relaxed text-blue-800">
            New patients create an account from this step. Existing patients use the standard login route. Email verification, SMS OTP, and photo-ID toggles are not part of the intake boundary.
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
          <Button onClick={() => onOpenChange(false)} className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white">Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
