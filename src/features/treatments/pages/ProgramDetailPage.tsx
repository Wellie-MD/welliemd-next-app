import { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { PrototypeNotice } from "../components/common";
import { ProgramDetailHeader } from "../components/programs/ProgramDetailHeader";
import { ProgramFlowCanvas } from "../components/programs/ProgramFlowCanvas";
import { ProgramQuestionList } from "../components/programs/ProgramQuestionList";
import {
  useDeleteProgramQuestion,
  useProgramQuestions,
  usePrograms,
  useReorderProgramQuestions,
  useSaveProgramQuestion,
} from "../hooks/useTreatmentLibraries";
import type { ProgramQuestion, QuestionKind } from "../types";

const defaultQuestionText: Partial<Record<QuestionKind, string>> = {
  text: "New Custom Question",
  single_choice: "New Single Choice Question",
  multiple_choice: "New Multiple Choice Question",
  personal_details: "Patient Authentication Verification",
  medical_conditions: "Medical History Section Block",
  consent: "Treatment Informational Consent Document",
  checkout: "Checkout Product Selector Options",
};

export default function ProgramDetailPage() {
  const { programId = "program-glp-intake" } = useParams();
  const { data: programs = [] } = usePrograms();
  const { data: questions = [] } = useProgramQuestions(programId);
  const program = programs.find((item) => item.id === programId) ?? programs[0];

  const { mutate: saveQuestion } = useSaveProgramQuestion(programId);
  const { mutate: deleteQuestion } = useDeleteProgramQuestion(programId);
  const { mutate: reorderQuestions } = useReorderProgramQuestions(programId);

  const [viewMode, setViewMode] = useState<"list" | "flow">("list");
  const [isReordering, setIsReordering] = useState(false);

  if (!program) {
    return <div className="p-6">Program not found.</div>;
  }

  const handleAddElement = (kind: QuestionKind) => {
    const newQuestion: ProgramQuestion = {
      id: `q-${Math.random().toString(36).slice(2, 11)}`,
      order: questions.length + 1,
      text: defaultQuestionText[kind] ?? "New Element",
      kind,
      section: kind === "checkout" ? "Checkout" : "Clinical Intake",
      required: true,
    };

    saveQuestion(newQuestion, {
      onSuccess: () => {
        toast({
          title: "Element Added",
          description: `Successfully added ${newQuestion.text} to program.`,
        });
      },
    });
  };

  const handleReorder = (ids: string[]) => {
    reorderQuestions(ids, {
      onSuccess: () => {
        toast({
          title: "Order Updated",
          description: "Elements order updated successfully.",
        });
      },
    });
  };

  const handleDeleteQuestion = (id: string) => {
    if (!confirm("Are you sure you want to delete this element from the program?")) return;

    deleteQuestion(id, {
      onSuccess: () => {
        toast({
          title: "Element Deleted",
          description: "Successfully deleted element.",
        });
      },
    });
  };

  return (
    <div className="space-y-5 p-6">
      <ProgramDetailHeader
        program={program}
        viewMode={viewMode}
        isReordering={isReordering}
        onViewModeChange={setViewMode}
        onReorderingChange={setIsReordering}
        onAddElement={handleAddElement}
      />

      <PrototypeNotice>
        Program details expose visit type, ordered questions, checkout elements, and flow preview controls.
      </PrototypeNotice>

      {viewMode === "list" ? (
        <ProgramQuestionList
          programId={program.id}
          questions={questions}
          isReordering={isReordering}
          onReorder={handleReorder}
          onDeleteQuestion={handleDeleteQuestion}
        />
      ) : (
        <ProgramFlowCanvas
          programId={program.id}
          questions={questions}
          onReorder={handleReorder}
          onDeleteQuestion={handleDeleteQuestion}
        />
      )}
    </div>
  );
}
