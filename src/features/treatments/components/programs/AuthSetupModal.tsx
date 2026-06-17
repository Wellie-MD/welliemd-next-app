import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ShieldAlert } from "lucide-react";
import type { ProgramAuthConfig } from "../../types";

interface AuthSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: ProgramAuthConfig) => void;
  initialConfig?: ProgramAuthConfig;
}

export function AuthSetupModal({ open, onOpenChange, onSave, initialConfig }: AuthSetupModalProps) {
  const [email, setEmail] = useState(true);
  const [phone, setPhone] = useState(false);
  const [identity, setIdentity] = useState(false);
  const [account, setAccount] = useState(true);

  useEffect(() => {
    if (open && initialConfig) {
      setEmail(!!initialConfig.email);
      setPhone(!!initialConfig.phone);
      setIdentity(!!initialConfig.identity);
      setAccount(!!initialConfig.account);
    }
  }, [open, initialConfig]);

  const handleSave = () => {
    onSave({ email, phone, identity, account });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <ShieldAlert className="h-5 w-5" />
            <DialogTitle className="text-base font-bold text-slate-900">
              Patient Authentication Requirements
            </DialogTitle>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Configure the authentication steps a patient must complete before they can access the screening questions or complete checkout.
          </p>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-slate-800">Email Verification</label>
              <p className="text-[10px] text-slate-400">Send a verification email to authenticate the patient.</p>
            </div>
            <Switch checked={email} onCheckedChange={setEmail} />
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <div>
              <label className="text-xs font-bold text-slate-800">SMS Verification</label>
              <p className="text-[10px] text-slate-400">Require an SMS text code to verify the patient's phone number.</p>
            </div>
            <Switch checked={phone} onCheckedChange={setPhone} />
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <div>
              <label className="text-xs font-bold text-slate-800">Photo Identity Match (ID.me / Persona)</label>
              <p className="text-[10px] text-slate-400">Require government-issued photo ID upload and facial matching.</p>
            </div>
            <Switch checked={identity} onCheckedChange={setIdentity} />
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <div>
              <label className="text-xs font-bold text-slate-800">Account Creation</label>
              <p className="text-[10px] text-slate-400">Force the patient to choose a password and register an account.</p>
            </div>
            <Switch checked={account} onCheckedChange={setAccount} />
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
            onClick={handleSave}
            className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
