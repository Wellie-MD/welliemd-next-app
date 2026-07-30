import { QuestionEditorHeader } from "@/features/treatments/question-editor/components/shell/QuestionEditorHeader";
import { CheckoutProductsSection } from "@/features/treatments/programs/checkout-question/components/CheckoutProductsSection";
import { CheckoutPatientPreview } from "@/features/treatments/programs/checkout-question/components/CheckoutPatientPreview";
import { useCheckoutQuestionForm } from "@/features/treatments/programs/checkout-question/hooks/useCheckoutQuestionForm";
import { QuestionVisibilityTab } from "@/features/treatments/question-editor/components/tabs/QuestionVisibilityTab";
import type { ProgramQuestion, ProgramCheckoutQuestion, ProgramCheckoutProduct } from "@/features/treatments/types";
import { isCheckoutQuestionRequired } from "@/features/treatments/programs/checkout-question/constants";
import { toast } from "@/components/ui/use-toast";
import { useMemo, useState } from "react";

interface CheckoutEditorProps {
  activeQuestion?: ProgramQuestion;
  questions: ProgramQuestion[];
  programName?: string;
  programTreatmentTypeKey?: string | null;
  sidebar: React.ReactNode;
  onSave: (question: ProgramQuestion) => Promise<void>;
  onClose: () => void;
  onTestFlow?: () => void;
}

export function CheckoutEditor({
  activeQuestion,
  questions,
  programName = "WellieMD Initial Assessment",
  programTreatmentTypeKey,
  sidebar,
  onSave,
  onClose,
  onTestFlow,
}: CheckoutEditorProps) {
  // Map ProgramQuestion to the shape useCheckoutQuestionForm expects
  const initialCheckoutQuestion = useMemo<ProgramCheckoutQuestion | null>(() => {
    if (!activeQuestion) return null;

    const fallbackProducts: ProgramCheckoutProduct[] = [
      {
        id: "mock-1",
        category: "Glutathione",
        regimen: "Rapid",
        doseLabel: activeQuestion.text || "Glutathione 200mg",
      }
    ];

    return {
      id: activeQuestion.id,
      text: activeQuestion.text,
      products: activeQuestion.checkoutProducts?.length ? activeQuestion.checkoutProducts : fallbackProducts,
      visibilityRules: activeQuestion.visibilityRuleGroup || { mode: "simple", rules: [] },
    };
  }, [activeQuestion]);

  const [justSaved, setJustSaved] = useState(false);
  const [incompatibleProducts, setIncompatibleProducts] = useState<string[]>([]);

  const form = useCheckoutQuestionForm({
    open: true,
    initialQuestion: initialCheckoutQuestion,
    onSave: async (data) => {
      const updatedQuestion: ProgramQuestion = {
        id: activeQuestion?.id || `q-new-${Date.now()}`,
        order: activeQuestion?.order || questions.length + 1,
        text: data.text,
        kind: "checkout",
        section: activeQuestion?.section || "Checkout",
        required: isCheckoutQuestionRequired(data.products),
        visibilityRuleGroup: data.visibilityRules,
        checkoutProducts: data.products,
        checkoutProductIds: data.products.map((product) => product.productId || product.id),
      };
      await onSave(updatedQuestion);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1200);
      // No onClose() — stay open so the admin can keep iterating; a failed
      // save throws before reaching here and useCheckoutQuestionForm surfaces
      // formError inline without closing.
    },
    onOpenChange: () => {},
  });

  const questionOrder = activeQuestion ? activeQuestion.order : questions.length + 1;
  const isEditMode = !!activeQuestion;

  // Earlier (already-answered) questions can drive per-product visibility.
  const eligibleQuestions = useMemo(
    () =>
      questions.filter(
        (question) => question.id !== activeQuestion?.id && question.order < questionOrder
      ),
    [questions, activeQuestion?.id, questionOrder]
  );

  return (
    <div className="flex flex-col h-full w-full bg-slate-50">
      <QuestionEditorHeader
        title={`Checkout · Step ${questionOrder}`}
        subtitle={programName}
        isEditMode={isEditMode}
        isSaving={form.isSaving}
        justSaved={justSaved}
        onClose={onClose}
        onSave={() => {
          if (incompatibleProducts.length > 0) {
            toast({
              title: "Fix checkout products before saving",
              description: incompatibleProducts.join(". "),
              variant: "destructive",
            });
            return;
          }
          void form.handleSaveModal();
        }}
        onTestFlow={onTestFlow}
      />

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)_380px]">
        {sidebar}

        <main className="overflow-y-auto p-6 bg-white border-r border-slate-150">
          <div className="space-y-5">
            <CheckoutProductsSection
              products={form.products}
              eligibleQuestions={eligibleQuestions}
              programTreatmentTypeKey={programTreatmentTypeKey}
              onCompatibilityChange={setIncompatibleProducts}
              onAddProduct={form.handleAddProduct}
              onRemoveProduct={form.handleRemoveProduct}
              onProductFieldChange={form.handleProductFieldChange}
              onProductPriceChange={form.handleProductPriceChange}
              onProductVisibilityChange={form.handleProductVisibilityChange}
            />
            <QuestionVisibilityTab
              visibilityRuleGroup={form.visibilityRuleGroup}
              setVisibilityRuleGroup={form.handleVisibilityRuleGroupChange}
              questions={questions}
              currentQuestionId={activeQuestion?.id || ""}
            />
            {form.formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11.5px] font-semibold text-red-700">
                {form.formError}
              </div>
            )}
          </div>
        </main>

        <CheckoutPatientPreview
          validProducts={form.validProducts}
          selectedPreviewIdx={form.selectedPreviewIdx}
          visibilityRuleGroup={form.visibilityRuleGroup}
          onSelectedPreviewChange={form.setSelectedPreviewIdx}
        />
      </div>
    </div>
  );
}
