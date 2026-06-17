import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { ProgramQuestion } from "../../types";

import { QuestionEditorSidebar } from "./components/QuestionEditorSidebar";
import { StandardEditor } from "./editors/StandardEditor";
import { CheckoutEditor } from "./editors/CheckoutEditor";
import { AuthEditor } from "./editors/AuthEditor";

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
  programName = "WellieMD Initial Assessment",
}: QuestionEditorDialogProps) {
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
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
          />
        ) : activeQuestion?.kind === "auth" || activeQuestion?.kind === "personal_details" ? (
          <AuthEditor
            activeQuestion={activeQuestion}
            questions={questions}
            programName={programName}
            sidebar={sidebar}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <StandardEditor
            activeQuestion={activeQuestion}
            questions={questions}
            programName={programName}
            sidebar={sidebar}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
