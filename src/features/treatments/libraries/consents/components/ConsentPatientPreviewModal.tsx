import { useEffect, useState } from "react";
import { ChevronLeft, Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConsentForm } from "@/features/treatments/types";

interface ConsentPatientPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consent?: ConsentForm;
}

export function ConsentPatientPreviewModal({ open, onOpenChange, consent }: ConsentPatientPreviewModalProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Reset the simulated answer whenever the previewed consent changes / reopens.
  useEffect(() => {
    if (open) setSelectedOptionId(null);
  }, [open, consent?.id]);

  if (!consent) return null;

  const hasText = Boolean(consent.text && consent.text.replace(/<[^>]*>/g, "").trim());
  const options = consent.options ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden bg-slate-100 p-0 sm:max-w-[680px]">
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
          <DialogTitle className="text-lg font-bold text-slate-900">Patient Preview</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Patient view of &ldquo;{consent.name}&rdquo;
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-[560px] rounded-2xl bg-white p-7 shadow-sm">
            {/* Progress bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-[45%] rounded-full bg-amber-400" />
            </div>

            {/* Brand + back */}
            <div className="mt-6 flex items-center justify-between">
              <span className="text-xl font-semibold tracking-tight text-slate-800">
                welliemd<span className="text-amber-400">.</span>
              </span>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400"
                aria-hidden="true"
              >
                <ChevronLeft className="h-4 w-4" />
              </span>
            </div>

            {/* Sample-question pill */}
            <div className="mt-6 flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500">
                <Target className="h-3 w-3" />
                Sample question from Consent: {consent.name}
              </span>
            </div>

            {/* Title */}
            <h2 className="mt-5 text-[22px] font-bold leading-snug text-slate-900">{consent.name}:</h2>

            {/* Consent body */}
            {hasText ? (
              <div
                className="prose prose-sm mt-3 max-w-none text-[13.5px] leading-relaxed text-slate-600"
                // Admin-authored consent HTML produced by the in-app rich-text editor.
                dangerouslySetInnerHTML={{ __html: consent.text as string }}
              />
            ) : (
              <p className="mt-3 text-sm italic text-slate-400">No consent text has been added yet.</p>
            )}

            {/* Answer options as patient-selectable radios */}
            <div className="mt-6 space-y-3">
              {options.length === 0 ? (
                <p className="text-sm italic text-slate-400">No answer options configured.</p>
              ) : (
                options.map((option) => {
                  const selected = selectedOptionId === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedOptionId(option.id)}
                      aria-pressed={selected}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-colors",
                        option.disqualifies
                          ? selected
                            ? "border-red-400 bg-red-50/60"
                            : "border-red-200 hover:bg-red-50/40"
                          : selected
                            ? "border-[#12517A] bg-blue-50/50"
                            : "border-slate-200 hover:bg-slate-50"
                      )}
                      data-testid={`consent-preview-option-${option.id}`}
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                          selected
                            ? option.disqualifies
                              ? "border-red-500"
                              : "border-[#12517A]"
                            : "border-slate-300"
                        )}
                        aria-hidden="true"
                      >
                        {selected && (
                          <span
                            className={cn(
                              "h-2 w-2 rounded-full",
                              option.disqualifies ? "bg-red-500" : "bg-[#12517A]"
                            )}
                          />
                        )}
                      </span>
                      <span className="text-slate-700">{option.text}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="consent-preview-close">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
