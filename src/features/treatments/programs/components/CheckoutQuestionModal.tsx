import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { ProgramCheckoutQuestion, ProgramLabRequirement, ProgramQuestion, VisibilityRuleGroup } from "@/features/treatments/types";
import { CheckoutPatientPreview } from "@/features/treatments/programs/checkout-question/components/CheckoutPatientPreview";
import { CheckoutProductsSection } from "@/features/treatments/programs/checkout-question/components/CheckoutProductsSection";
import { useCheckoutQuestionForm } from "@/features/treatments/programs/checkout-question/hooks/useCheckoutQuestionForm";
import { QuestionVisibilityTab } from "@/features/treatments/question-editor/components/tabs/QuestionVisibilityTab";
import { CheckoutLabsSection } from "@/features/treatments/programs/checkout-question/components/CheckoutLabsSection";
import { CheckoutOfferTypeSection, type CheckoutOfferMode } from "@/features/treatments/programs/checkout-question/components/CheckoutOfferTypeSection";
import type { LabPanel } from "@/api/labs";
import { filterVisibilitySourceQuestions } from "@/components/questionnaires/visibilitySourceFilter";
import { useEffect, useState } from "react";

type CheckoutVisibilityQuestion = Pick<ProgramQuestion, "id" | "text"> & Partial<ProgramQuestion>;

interface CheckoutQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<ProgramCheckoutQuestion, "id">) => Promise<void>;
  initialQuestion?: ProgramCheckoutQuestion | null;
  programName?: string;
  programTreatmentTypeKey?: string | null;
  screeningQuestions?: CheckoutVisibilityQuestion[];
  programLabRequirements?: ProgramLabRequirement[];
  onSaveLabRequirements?: (requirements: ProgramLabRequirement[], visibilityRules?: VisibilityRuleGroup) => Promise<void>;
  initialMode?: CheckoutOfferMode;
}

export function CheckoutQuestionModal({
  open,
  onOpenChange,
  onSave,
  initialQuestion,
  programName = "GLP Microdose Intake",
  programTreatmentTypeKey,
  screeningQuestions = [],
  programLabRequirements = [],
  onSaveLabRequirements,
  initialMode = "medicine",
}: CheckoutQuestionModalProps) {
  const form = useCheckoutQuestionForm({ open, initialQuestion, onSave, onOpenChange });
  const [incompatibleProducts, setIncompatibleProducts] = useState<string[]>([]);
  const [labRequirements, setLabRequirements] = useState<ProgramLabRequirement[]>(programLabRequirements);
  const [mode, setMode] = useState<CheckoutOfferMode>(initialMode);
  const [labPanels, setLabPanels] = useState<LabPanel[]>([]);

  useEffect(() => {
    if (open) {
      setLabRequirements(programLabRequirements);
      setMode(initialMode);
    }
  }, [open, programLabRequirements, initialMode]);
  const visibilityQuestions: ProgramQuestion[] = screeningQuestions.map((question, index) => ({
    id: question.id,
    order: question.order ?? index + 1,
    text: question.text,
    kind: question.kind ?? "text",
    section: question.section ?? "Screening",
    required: question.required ?? false,
    choices: question.choices,
    dqChoices: question.dqChoices,
    consentText: question.consentText,
    checkoutProductIds: question.checkoutProductIds,
    checkoutProducts: question.checkoutProducts,
    visibilityRule: question.visibilityRule,
    visibilityRuleGroup: question.visibilityRuleGroup,
    includeInQa: question.includeInQa,
    hiddenFromPatient: question.hiddenFromPatient,
    prefillFromPrevious: question.prefillFromPrevious,
    elementConfig: question.elementConfig,
  }));
  const visibilitySourceQuestions = filterVisibilitySourceQuestions(visibilityQuestions);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(760px,calc(100vh-2rem))] max-h-[calc(100vh-2rem)] max-w-[980px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl">
        <div className="z-20 flex shrink-0 items-start justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <DialogTitle className="text-[16px] font-bold leading-tight text-slate-900">
              {initialQuestion ? "Edit Checkout Question" : "Add Checkout Question"}
            </DialogTitle>
            <div className="mt-1 text-[12px] text-slate-400">
              Owned by <span className="font-semibold">{programName}</span> · Plans that attach this eligibility inherit this Checkout question automatically.
            </div>
          </div>
          <button disabled={form.isSaving} onClick={() => onOpenChange(false)} className="text-slate-400 transition-colors hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50" data-testid="close-checkout-question-modal">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[1fr,340px] overflow-hidden">
          <div className="min-h-0 space-y-5 overflow-y-auto border-r border-slate-150 p-6">
            <CheckoutOfferTypeSection mode={mode} onChange={setMode} disabled={form.isSaving} />
            {mode === "medicine" ? (
              <CheckoutProductsSection
                products={form.products}
                eligibleQuestions={visibilitySourceQuestions}
                programTreatmentTypeKey={programTreatmentTypeKey}
                onAddProduct={form.handleAddProduct}
                onRemoveProduct={form.handleRemoveProduct}
                onProductFieldChange={form.handleProductFieldChange}
                onProductPriceChange={form.handleProductPriceChange}
                onProductVisibilityChange={form.handleProductVisibilityChange}
                onCompatibilityChange={setIncompatibleProducts}
              />
            ) : onSaveLabRequirements ? (
              <CheckoutLabsSection
                requirements={labRequirements}
                onChange={setLabRequirements}
                onPanelsLoaded={setLabPanels}
                disabled={form.isSaving}
              />
            ) : null}
            {mode === "medicine" && onSaveLabRequirements && (
              <p className="-mt-2 text-[11px] text-slate-400">Required Junction labs are configured as a separate Lab checkout step.</p>
            )}
            <QuestionVisibilityTab
              visibilityRuleGroup={form.visibilityRuleGroup}
              setVisibilityRuleGroup={form.handleVisibilityRuleGroupChange}
              questions={visibilityQuestions}
              currentQuestionId=""
              subjectLabel={mode === "lab" ? "lab checkout question" : "checkout question"}
            />
          </div>

          <CheckoutPatientPreview
            validProducts={form.validProducts}
            selectedPreviewIdx={form.selectedPreviewIdx}
            visibilityRuleGroup={form.visibilityRuleGroup}
            onSelectedPreviewChange={form.setSelectedPreviewIdx}
            mode={mode}
            labRequirements={labRequirements}
            labPanels={labPanels}
          />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          {form.formError && <div className="mr-auto rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11.5px] font-semibold text-red-700">{form.formError}</div>}
          <Button variant="outline" disabled={form.isSaving} onClick={() => onOpenChange(false)} className="h-9 rounded-lg border-slate-200 px-5 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-100/80" data-testid="cancel-checkout-question">
            Cancel
          </Button>
          <Button
            disabled={form.isSaving || (mode === "medicine" && incompatibleProducts.length > 0)}
            onClick={async () => {
              if (mode === "lab") {
                if (!onSaveLabRequirements) return;
                await form.handleSaveLab((visibilityRules) => onSaveLabRequirements(labRequirements, visibilityRules));
                return;
              }
              await form.handleSaveModal();
            }}
            className="h-9 rounded-lg bg-[#1d4ed8] px-5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
            data-testid="save-checkout-question"
          >
            {form.isSaving ? "Saving…" : mode === "lab" ? "Save Lab Checkout" : initialQuestion ? "Save Changes" : "Add Checkout Question"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
