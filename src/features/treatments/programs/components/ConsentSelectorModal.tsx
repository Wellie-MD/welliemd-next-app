import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useConsents } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { FileText, Loader2, Sparkles } from "lucide-react";
import type { ConsentForm } from "@/features/treatments/types";

interface ConsentSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (consent: ConsentForm) => void;
}

export function ConsentSelectorModal({ open, onOpenChange, onSelect }: ConsentSelectorModalProps) {
  const { data: consents = [], isLoading } = useConsents();
  const [selectedConsentId, setSelectedConsentId] = useState<string>("");

  const handleSelect = () => {
    const selected = consents.find((c) => c.id === selectedConsentId);
    if (selected) {
      onSelect(selected);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <FileText className="h-5 w-5" />
            <DialogTitle className="text-base font-bold text-slate-900">
              Attach Legal Consent
            </DialogTitle>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Select a legal consent agreement that the patient must acknowledge, e.g. a Telehealth Consent or HIPAA disclosure.
          </p>
        </DialogHeader>

        <div className="py-4 min-h-[160px] flex flex-col justify-center">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : consents.length === 0 ? (
            <div className="text-center text-xs text-slate-400 italic">No consent forms available.</div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {consents.map((consent) => (
                <div
                  key={consent.id}
                  onClick={() => setSelectedConsentId(consent.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedConsentId === consent.id
                      ? "border-purple-500 bg-purple-50/50 shadow-sm"
                      : "border-slate-100 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-800">{consent.name}</span>
                    <span className="text-[10px] text-slate-400">
                      Scope: <span className="capitalize font-semibold text-slate-500">{consent.scope}</span>
                    </span>
                  </div>
                  {consent.scope === "global" && (
                    <span className="flex items-center gap-1 rounded bg-purple-100 px-2 py-0.5 text-[9px] font-bold text-purple-800">
                      <Sparkles className="h-2.5 w-2.5" />
                      Global
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
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
            onClick={handleSelect}
            disabled={!selectedConsentId}
            className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
          >
            Attach Consent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
