import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { ProgramCheckoutQuestion } from "../../types";
import { CheckoutPatientPreview } from "./checkout-question/CheckoutPatientPreview";
import { CheckoutProductsSection } from "./checkout-question/CheckoutProductsSection";
import { CheckoutVisibilitySection } from "./checkout-question/CheckoutVisibilitySection";
import { useCheckoutQuestionForm } from "./checkout-question/useCheckoutQuestionForm";

interface CheckoutQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<ProgramCheckoutQuestion, "id">) => void;
  initialQuestion?: ProgramCheckoutQuestion | null;
  programName?: string;
  screeningQuestions?: Array<{ id: string; text: string }>;
}

export function CheckoutQuestionModal({
  open,
  onOpenChange,
  onSave,
  initialQuestion,
  programName = "GLP Microdose Intake",
  screeningQuestions = [],
}: CheckoutQuestionModalProps) {
  const form = useCheckoutQuestionForm({ open, initialQuestion, onSave, onOpenChange });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-[980px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl">
        <div className="z-20 flex shrink-0 items-start justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-[16px] font-bold leading-tight text-slate-900">Add Checkout Question</h2>
            <div className="mt-1 text-[12px] text-slate-400">
              Owned by <span className="font-semibold">{programName}</span> · Plans that attach this eligibility inherit this Checkout question automatically.
            </div>
          </div>
          <button onClick={() => onOpenChange(false)} className="text-slate-400 transition-colors hover:text-slate-600" data-testid="close-checkout-question-modal">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid max-h-[72vh] flex-1 grid-cols-[1fr,340px] overflow-hidden">
          <div className="space-y-5 overflow-y-auto border-r border-slate-150 p-6">
            <CheckoutProductsSection
              products={form.products}
              onAddProduct={form.handleAddProduct}
              onRemoveProduct={form.handleRemoveProduct}
              onProductFieldChange={form.handleProductFieldChange}
            />
            <CheckoutVisibilitySection
              visibilityMode={form.visibilityMode}
              rules={form.rules}
              screeningQuestions={screeningQuestions}
              onVisibilityModeChange={form.setVisibilityMode}
              onAddRule={form.handleAddRule}
              onRemoveRule={form.handleRemoveRule}
              onRuleFieldChange={form.handleRuleFieldChange}
            />
          </div>

          <CheckoutPatientPreview
            validProducts={form.validProducts}
            selectedPreviewIdx={form.selectedPreviewIdx}
            rules={form.rules}
            onSelectedPreviewChange={form.setSelectedPreviewIdx}
          />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          {form.formError && <div className="mr-auto rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11.5px] font-semibold text-red-700">{form.formError}</div>}
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9 rounded-lg border-slate-200 px-5 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-100/80" data-testid="cancel-checkout-question">
            Cancel
          </Button>
          <Button onClick={form.handleSaveModal} className="h-9 rounded-lg bg-[#1d4ed8] px-5 text-xs font-bold text-white shadow-sm hover:bg-blue-700" data-testid="save-checkout-question">
            {initialQuestion ? "Save Changes" : "Add Checkout Question"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
