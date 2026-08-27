import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { ProgramLabRequirement, ProgramQuestion, VisibilityRuleGroup } from "@/features/treatments/types";

import { QuestionEditorSidebar } from "./QuestionEditorSidebar";
import { StandardEditor } from "../editors/StandardEditor";
import { CheckoutEditor } from "../editors/CheckoutEditor";
import { AuthEditor } from "../editors/AuthEditor";
import { PatientFlowInlineSimulator } from "@/features/treatments/flow-builder/components/modals/PatientFlowInlineSimulator";

export interface QuestionEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (question: ProgramQuestion) => Promise<void>;
  initialQuestionId?: string | null;
  questions: ProgramQuestion[];
  programId?: string;
  programName?: string;
  programTreatmentTypeKey?: string | null;
  programLabRequirements?: ProgramLabRequirement[];
  onSaveLabRequirements?: (requirements: ProgramLabRequirement[], visibilityRules?: VisibilityRuleGroup) => Promise<void>;
}

export function QuestionEditorDialog({
  open,
  onOpenChange,
  onSave,
  initialQuestionId,
  questions,
  programId = "",
  programName = "WellieMD Initial Assessment",
  programTreatmentTypeKey,
  programLabRequirements = [],
  onSaveLabRequirements,
}: QuestionEditorDialogProps) {
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFlowTestOpen, setIsFlowTestOpen] = useState(false);
  const [newQuestionRevision, setNewQuestionRevision] = useState(0);

  // Sync initial question on open
  useEffect(() => {
    if (open) {
      setActiveQuestionId(initialQuestionId || null);
      setSearchQuery("");
    }
  }, [open, initialQuestionId]);

  const activeQuestion = questions.find((q) => q.id === activeQuestionId);

  const handleSelectQuestion = (questionId: string | null) => {
    setActiveQuestionId(questionId);
    if (questionId === null) {
      // Setting null is a no-op when the editor is already in new-question
      // mode, so bump the revision to force a clean draft in that case too.
      setNewQuestionRevision((revision) => revision + 1);
    }
  };

  const sidebar = (
    <QuestionEditorSidebar
      questions={questions}
      activeQuestionId={activeQuestionId}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onSelectQuestion={handleSelectQuestion}
    />
  );

  // Only provide onTestFlow when we have a programId to build the preview context from
  const handleTestFlow = programId
    ? () => setIsFlowTestOpen(true)
    : undefined;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[94vh] max-h-[880px] w-[96vw] max-w-[1440px] flex-col overflow-hidden rounded-[10px] border border-slate-200 bg-slate-50 p-0 shadow-2xl">
          <DialogTitle className="sr-only">
            Edit {activeQuestion?.text || "Program question"}
          </DialogTitle>
          {activeQuestion?.kind === "checkout" ? (
            <CheckoutEditor
              key={`${activeQuestionId || "new"}-${newQuestionRevision}`}
              activeQuestion={activeQuestion}
              questions={questions}
              programName={programName}
              programTreatmentTypeKey={programTreatmentTypeKey}
              programLabRequirements={programLabRequirements}
              onSaveLabRequirements={onSaveLabRequirements}
              initialMode={activeQuestion?.elementConfig?.checkoutMode === "lab" || activeQuestion?.elementConfig?.labCheckout === true ? "lab" : "medicine"}
              sidebar={sidebar}
              onSave={onSave}
              onClose={() => onOpenChange(false)}
              onTestFlow={handleTestFlow}
            />
          ) : activeQuestion?.kind === "patient_authentication" ? (
            <AuthEditor
              key={`${activeQuestionId || "new"}-${newQuestionRevision}`}
              activeQuestion={activeQuestion}
              questions={questions}
              programName={programName}
              sidebar={sidebar}
              onSave={onSave}
              onClose={() => onOpenChange(false)}
              onTestFlow={handleTestFlow}
            />
          ) : (
            <StandardEditor
              key={`${activeQuestionId || "new"}-${newQuestionRevision}`}
              activeQuestion={activeQuestion}
              questions={questions}
              programName={programName}
              sidebar={sidebar}
              onSave={onSave}
              onClose={() => onOpenChange(false)}
              onTestFlow={handleTestFlow}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Patient Flow inline simulator — portals above the editor Dialog */}
      {programId && (
        <PatientFlowInlineSimulator
          open={isFlowTestOpen}
          onOpenChange={setIsFlowTestOpen}
          previewContext={{ type: "program", id: programId, slug: programId }}
        />
      )}
    </>
  );
}
