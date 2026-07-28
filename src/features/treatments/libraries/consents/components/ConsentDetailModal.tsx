import { Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ConsentForm } from "@/features/treatments/types";

interface ConsentDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consent?: ConsentForm;
  onEdit: (id: string) => void;
}

export function ConsentDetailModal({ open, onOpenChange, consent, onEdit }: ConsentDetailModalProps) {
  if (!consent) return null;

  const isGlobal = consent.scope === "global";
  const hasText = Boolean(consent.text && consent.text.replace(/<[^>]*>/g, "").trim());
  const subtitle = isGlobal
    ? "Universal consent · appears on every visit"
    : "Treatment-specific consent · only appears when matching treatment is selected";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden bg-slate-50 p-0 sm:max-w-[640px]">
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-white px-6 py-5">
          <DialogTitle className="text-xl font-bold text-slate-900">{consent.name}</DialogTitle>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto bg-white p-6">
          <div className="flex flex-wrap items-center gap-2">
            {isGlobal ? (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                <span className="h-2 w-2 rounded-full border border-indigo-400" />
                Universal — Every Visit
              </span>
            ) : (
              <>
                <span className="rounded-md border border-pink-200 bg-pink-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-pink-700">
                  Treatment-Specific
                </span>
                {consent.visitTypeKeys.map((key) => (
                  <code key={key} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700">
                    {key}
                  </code>
                ))}
              </>
            )}
          </div>

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Consent Text · Patient View
            </p>
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              {hasText ? (
                <div
                  className="prose prose-sm max-w-none text-sm leading-relaxed text-slate-700"
                  // Admin-authored consent HTML produced by the in-app rich-text editor.
                  dangerouslySetInnerHTML={{ __html: consent.text as string }}
                />
              ) : (
                <p className="text-sm italic text-slate-400">No consent text has been added yet.</p>
              )}
            </div>
          </div>

          {consent.options && consent.options.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Answer Options</p>
              <div className="space-y-2">
                {consent.options.map((option) => (
                  <div
                    key={option.id}
                    className={
                      option.disqualifies
                        ? "flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2.5"
                        : "flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5"
                    }
                  >
                    <span className="flex items-center gap-2 text-sm text-slate-700">
                      {option.disqualifies ? (
                        <X className="h-4 w-4 text-red-500" />
                      ) : (
                        <Check className="h-4 w-4 text-emerald-600" />
                      )}
                      &ldquo;{option.text}&rdquo;
                    </span>
                    <span
                      className={
                        option.disqualifies
                          ? "text-[10px] font-bold uppercase tracking-wide text-red-600"
                          : "text-[10px] font-bold uppercase tracking-wide text-emerald-700"
                      }
                    >
                      {option.disqualifies ? "Disqualifying" : "Continue"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => {
              onOpenChange(false);
              onEdit(consent.id);
            }}
          >
            Edit Consent
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
