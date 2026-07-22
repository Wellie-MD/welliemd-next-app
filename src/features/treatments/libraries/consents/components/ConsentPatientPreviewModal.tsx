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
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden bg-[#fafafa] p-0 sm:max-w-[640px]">
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
          <DialogTitle className="text-lg font-bold text-slate-900">Patient Preview</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Patient view of &ldquo;{consent.name}&rdquo;
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {/* .preview-screen */}
          <div className="flex min-h-[420px] flex-col items-center rounded-[10px] border border-[#eef0f3] bg-white px-7 pb-10 pt-8">
            {/* .preview-progress */}
            <div className="mb-7 h-[5px] w-full max-w-[440px] overflow-hidden rounded-full bg-[#f0f0f0]">
              <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#fbbf24] to-[#fde68a]" />
            </div>

            {/* .preview-header-row */}
            <div className="mb-9 flex w-full max-w-[440px] items-center justify-between">
              <span className="flex items-baseline gap-0.5 font-serif text-[22px] font-normal tracking-[-0.5px] text-[#1a1a1a]">
                welliemd
                <sup className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#666]">®</sup>
              </span>
              {/* .preview-back-btn — disabled (this is always the only/first page) */}
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[1.5px] border-blue-600 bg-white text-blue-600 opacity-40"
                aria-hidden="true"
              >
                <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
            </div>

            {/* .preview-meta-pill */}
            <span className="mb-[18px] inline-flex items-center gap-1.5 rounded-full bg-[#f5f6f8] px-[11px] py-[5px] text-[11px] font-medium text-[#8a95a3]">
              <Target className="h-[11px] w-[11px]" />
              Sample question from Consent: {consent.name}
            </span>

            {/* .preview-question */}
            <h2 className="mb-5 w-full max-w-[440px] text-left text-[19px] font-semibold leading-[1.35] text-[#0f0f0f]">
              {consent.name}:
            </h2>

            {/* .preview-consent-text */}
            {hasText ? (
              <div
                className="mb-6 w-full max-w-[440px] text-left text-[13.5px] leading-[1.65] text-[#374151] [&_p]:mb-2.5 [&_p:last-child]:mb-0"
                // Admin-authored consent HTML produced by the in-app rich-text editor.
                dangerouslySetInnerHTML={{ __html: consent.text as string }}
              />
            ) : (
              <p className="mb-6 w-full max-w-[440px] text-left text-sm italic text-slate-400">
                No consent text has been added yet.
              </p>
            )}

            {/* .preview-choice-list */}
            <div className="flex w-full max-w-[440px] flex-col gap-2.5">
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
                        "flex select-none items-center gap-3 rounded-lg border text-left text-sm text-[#1a1a1a] transition-all",
                        selected ? "border-2 border-black bg-[#f4f4f5] px-[15px] py-[13px]" : "px-4 py-3.5",
                        !selected && option.disqualifies && "border-[#fca5a5] bg-white hover:border-[#fca5a5]",
                        !selected && !option.disqualifies && "border-[#d4d4d4] bg-white hover:border-[#999] hover:bg-[#fafafa]",
                        selected && option.disqualifies && "border-[#ef4444] bg-[#fef2f2]"
                      )}
                      data-testid={`consent-preview-option-${option.id}`}
                    >
                      <span
                        className={cn(
                          "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#999] bg-white",
                          selected && "border-[5px] border-black bg-black shadow-[inset_0_0_0_3px_white]"
                        )}
                        aria-hidden="true"
                      />
                      <span>{option.text}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* .preview-continue — decorative, matches the patient-facing button; not wired to an action here */}
            <button
              type="button"
              disabled
              className="mt-9 cursor-default rounded-full bg-[#0f0f0f] px-14 py-3.5 text-[13.5px] font-semibold tracking-[0.02em] text-white"
            >
              Continue
            </button>
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
