import { QuestionEditorHeader } from "../components/QuestionEditorHeader";
import { CheckoutProductsSection } from "../../programs/checkout-question/CheckoutProductsSection";
import { CheckoutVisibilitySection } from "../../programs/checkout-question/CheckoutVisibilitySection";
import { CheckoutPatientPreview } from "../../programs/checkout-question/CheckoutPatientPreview";
import { useCheckoutQuestionForm } from "../../programs/checkout-question/useCheckoutQuestionForm";
import type { ProgramQuestion, ProgramCheckoutQuestion, ProgramCheckoutProduct } from "../../../types";
import { useMemo } from "react";

interface CheckoutEditorProps {
  activeQuestion?: ProgramQuestion;
  questions: ProgramQuestion[];
  programName?: string;
  sidebar: React.ReactNode;
  onSave: (question: ProgramQuestion) => void;
  onClose: () => void;
}

export function CheckoutEditor({
  activeQuestion,
  questions,
  programName = "WellieMD Initial Assessment",
  sidebar,
  onSave,
  onClose,
}: CheckoutEditorProps) {
  // Map ProgramQuestion to the shape useCheckoutQuestionForm expects
  const initialCheckoutQuestion = useMemo<ProgramCheckoutQuestion | null>(() => {
    if (!activeQuestion) return null;
    
    // In a real integration, the backend would supply full product details.
    // For now, we mock the ProgramCheckoutProduct array based on what's available.
    const mockProducts: ProgramCheckoutProduct[] = [
      {
        id: "mock-1",
        category: "Test Category",
        regimen: "Test Regimen",
        doseLabel: activeQuestion.text || "Test Dose",
      }
    ];

    return {
      id: activeQuestion.id,
      text: activeQuestion.text,
      products: mockProducts,
      visibilityRules: activeQuestion.visibilityRuleGroup || { mode: "simple", rules: [] },
    };
  }, [activeQuestion]);

  const form = useCheckoutQuestionForm({
    open: true,
    initialQuestion: initialCheckoutQuestion,
    onSave: (data) => {
      const updatedQuestion: ProgramQuestion = {
        id: activeQuestion?.id || `q-new-${Date.now()}`,
        order: activeQuestion?.order || questions.length + 1,
        text: data.text,
        kind: "checkout",
        section: activeQuestion?.section || "Checkout",
        required: true,
        visibilityRuleGroup: data.visibilityRules,
        // Passing product details up via a typed contract would happen here.
        // For the mock, we just resolve to text and visibility rules.
      };
      onSave(updatedQuestion);
      onClose();
    },
    onOpenChange: () => {},
  });

  const questionOrder = activeQuestion ? activeQuestion.order : questions.length + 1;
  const isEditMode = !!activeQuestion;

  return (
    <div className="flex flex-col h-full w-full bg-slate-50">
      <QuestionEditorHeader
        title={`Checkout · Step ${questionOrder}`}
        subtitle={programName}
        isEditMode={isEditMode}
        onClose={onClose}
        onSave={form.handleSaveModal}
      />
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_340px] overflow-hidden">
        {sidebar}
        
        <main className="overflow-y-auto p-6 bg-white border-r border-slate-150">
          <div className="space-y-5">
            <CheckoutProductsSection
              products={form.products}
              onAddProduct={form.handleAddProduct}
              onRemoveProduct={form.handleRemoveProduct}
              onProductFieldChange={form.handleProductFieldChange}
            />
            <CheckoutVisibilitySection
              visibilityMode={form.visibilityMode}
              rules={form.rules}
              screeningQuestions={questions.map((q) => ({ id: q.id, text: q.text }))}
              onVisibilityModeChange={form.setVisibilityMode}
              onAddRule={form.handleAddRule}
              onRemoveRule={form.handleRemoveRule}
              onRuleFieldChange={form.handleRuleFieldChange}
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
          rules={form.rules}
          onSelectedPreviewChange={form.setSelectedPreviewIdx}
        />
      </div>
    </div>
  );
}
