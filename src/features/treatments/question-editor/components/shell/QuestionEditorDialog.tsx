import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { ProgramQuestion } from "@/features/treatments/types";

import { QuestionEditorSidebar } from "./QuestionEditorSidebar";
import { StandardEditor } from "../editors/StandardEditor";
import { CheckoutEditor } from "../editors/CheckoutEditor";
import { AuthEditor } from "../editors/AuthEditor";
import { PatientFlowInlineSimulator } from "@/features/treatments/flow-builder/components/modals/PatientFlowInlineSimulator";

export interface QuestionEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (question: ProgramQuestion) => void;
  initialQuestionId?: string | null;
  questions: ProgramQuestion[];
  programId?: string;
  programName?: string;
}

export function QuestionEditorDialog({
  open,
  onOpenChange,
  onSave,
  initialQuestionId,
  questions,
  programId = "",
  programName = "WellieMD Initial Assessment",
}: QuestionEditorDialogProps) {
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFlowTestOpen, setIsFlowTestOpen] = useState(false);

  // Sync initial question on open
  useEffect(() => {
    if (open) {
      setActiveQuestionId(initialQuestionId || null);
      setSearchQuery("");
    }
  }, [open, initialQuestionId]);

  const activeQuestion = questions.find((q) => q.id === activeQuestionId);

  const sidebar = (
    <QuestionEditorSidebar
      questions={questions}
      activeQuestionId={activeQuestionId}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onSelectQuestion={setActiveQuestionId}
    />
  );

  // Only provide onTestFlow when we have a programId to build the preview context from
  const handleTestFlow = programId
    ? () => setIsFlowTestOpen(true)
    : undefined;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[98vw] w-[1500px] h-[95vh] p-0 flex flex-col overflow-hidden bg-slate-50 border border-slate-200 shadow-2xl">
          {activeQuestion?.kind === "checkout" ? (
            <CheckoutEditor
              activeQuestion={activeQuestion}
              questions={questions}
              programName={programName}
              sidebar={sidebar}
              onSave={onSave}
              onClose={() => onOpenChange(false)}
              onTestFlow={handleTestFlow}
            />
          ) : activeQuestion?.kind === "auth" || activeQuestion?.kind === "personal_details" ? (
            <AuthEditor
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
