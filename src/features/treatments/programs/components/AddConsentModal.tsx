import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useConsents } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";

interface AddConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddConsent: (consentId: string) => void;
  attachedConsentIds: string[];
  visitType?: string;
}

const CONSENT_DESCRIPTIONS: Record<string, { tag: string; desc: string }> = {
  "consent-glp": {
    tag: "WEIGHTLOSS, GLPMICRODOSING",
    desc: "By proceeding with GLP-1 therapy (e.g., semaglutide, tirzepatide), you acknowledge:..."
  },
  "consent-trt": {
    tag: "TRT",
    desc: "Testosterone Replacement Therapy (TRT) is a serious medical treatment with potential risks. By proceeding you acknowledge:..."
  },
  "consent-hrt": {
    tag: "MENOPAUSE",
    desc: "Hormone Replacement Therapy involves estrogen and/or progesterone supplementation. By proceeding you acknowledge:..."
  },
  "consent-ed": {
    tag: "ED",
    desc: "By proceeding with PDE5 inhibitor therapy (sildenafil, tadalafil, etc.) you acknowledge:..."
  },
  "consent-peptide": {
    tag: "ANTIAGING",
    desc: "Peptide therapies (sermorelin, NAD+, etc.) are administered under medical supervision. By proceeding you acknowledge:..."
  }
};

export function AddConsentModal({ open, onOpenChange, onAddConsent, attachedConsentIds, visitType }: AddConsentModalProps) {
  const { data: allConsents = [] } = useConsents();
  const normalizedVisitType = String(visitType || "").trim().toLowerCase();
  const compatibleConsents = allConsents.filter((consent) =>
    consent.scope === "global"
    || (consent.visitTypeKeys || []).some((key) => String(key).trim().toLowerCase() === normalizedVisitType)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[640px] p-0 flex flex-col overflow-hidden bg-white border border-slate-200 shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-5 flex items-start justify-between z-20">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900 leading-tight">Add Consent</h2>
            <div className="text-[12px] text-slate-400 mt-1.5 leading-relaxed">
              Explicitly attach a compatible Universal or Treatment-specific consent to this Program.
            </div>
          </div>
          <button onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable list body */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[50vh] space-y-3.5 bg-slate-50/30">
          {compatibleConsents.map((consent) => {
            const meta = CONSENT_DESCRIPTIONS[consent.id] || { tag: "GENERAL", desc: "Treatment-specific consent form requirements." };
            const isAlreadyAttached = attachedConsentIds.includes(consent.id);

            return (
              <div
                key={consent.id}
                className="flex items-center justify-between gap-4 p-4 border border-slate-200/80 rounded-xl bg-white shadow-sm"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-bold text-slate-900">{consent.name}</span>
                    <span className="bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded text-[9.5px] uppercase tracking-wide">
                      {consent.scope === "global" ? "UNIVERSAL" : meta.tag}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-400 leading-normal line-clamp-2">
                    {meta.desc}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <Button
                    onClick={() => {
                      onAddConsent(consent.id);
                      onOpenChange(false);
                    }}
                    disabled={isAlreadyAttached}
                    className={`h-8 px-4 text-xs font-bold rounded-lg shadow-sm transition-all ${
                      isAlreadyAttached
                        ? "bg-slate-100 text-slate-400 hover:bg-slate-100"
                        : "bg-[#1d4ed8] hover:bg-blue-700 text-white"
                    }`}
                  >
                    {isAlreadyAttached ? "Attached" : "Add"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 px-5 text-xs font-bold text-slate-600 bg-slate-100/60 border-slate-200 hover:bg-slate-200/60 rounded-lg shadow-sm"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
