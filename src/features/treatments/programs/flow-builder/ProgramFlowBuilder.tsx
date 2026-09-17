import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { ProgramFlowCanvas } from "@/features/treatments/programs/flow-builder/components/ProgramFlowCanvas";
import { ProgramFlowSidebar } from "@/features/treatments/programs/flow-builder/components/ProgramFlowSidebar";
import { ProgramFlowConfigPanel } from "@/features/treatments/programs/flow-builder/components/ProgramFlowConfigPanel";
import { ADMIN_TREATMENT_ROUTES } from "@/features/treatments/navigation/routes";
import type { ConsentForm, Program, ProgramCheckoutQuestion, ProgramQuestion } from "@/features/treatments/types";

interface ProgramFlowBuilderProps {
  program: Program;
  questions: ProgramQuestion[];
  allConsents: ConsentForm[];
  onAddQuestion: () => void;
  onEditQuestion: (questionId: string) => void;
  onAddCheckoutQuestion: () => void;
  onEditCheckoutQuestion: (checkoutQuestion: ProgramCheckoutQuestion) => void;
  onSaveProgram: (program: Program) => void;
}

export function ProgramFlowBuilder({
  program,
  questions,
  allConsents,
  onAddQuestion,
  onEditQuestion,
  onAddCheckoutQuestion,
  onEditCheckoutQuestion,
  onSaveProgram,
}: ProgramFlowBuilderProps) {
  const navigate = useNavigate();
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingNodeType, setEditingNodeType] = useState<string | null>(null);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);

  const handleNodeDoubleClick = (nodeId: string, nodeType: string) => {
    if (nodeType === "question") {
      onEditQuestion(nodeId);
      return;
    }

    if (nodeType === "section") {
      const sectionQuestion = questions.find((q) => q.id === nodeId && q.kind === "section");
      const sectionId = sectionQuestion?.elementConfig?.sourceSectionId || sectionQuestion?.elementConfig?.sourceId;
      if (sectionId) {
        navigate(`${ADMIN_TREATMENT_ROUTES.sections}?sectionId=${sectionId}&view=list`);
      }
      return;
    }

    if (nodeType === "product") {
      const productId = nodeId.replace("product-card-", "");
      const matchingCq = program.checkoutQuestions?.find((cq) =>
        cq.products?.some((p) => p.id === productId)
      );
      if (matchingCq) {
        onEditCheckoutQuestion(matchingCq);
        return;
      }
    }

    if (nodeType === "checkout") {
      const firstCheckout = program.checkoutQuestions?.[0];
      if (firstCheckout) {
        onEditCheckoutQuestion(firstCheckout);
        return;
      }
    }

    setEditingNodeId(nodeId);
    setEditingNodeType(nodeType);
    setIsConfigPanelOpen(true);
  };

  const handleCloseConfigPanel = () => {
    setIsConfigPanelOpen(false);
    setEditingNodeId(null);
    setEditingNodeType(null);
  };

  return (
    <div className="rounded-[10px] border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex h-[calc(100vh-210px)] min-h-[560px] bg-[#f7f9fc]">
        <ProgramFlowSidebar
          questions={questions}
          onSelectNode={setFocusedNodeId}
          activeNodeId={focusedNodeId}
          program={program}
          allConsents={allConsents}
        />
        <ProgramFlowCanvas
          program={program}
          questions={questions}
          allConsents={allConsents}
          focusedNodeId={focusedNodeId}
          onNodeDoubleClick={handleNodeDoubleClick}
        />
      </div>

      <ProgramFlowConfigPanel
        open={isConfigPanelOpen}
        nodeId={editingNodeId}
        nodeType={editingNodeType}
        onClose={handleCloseConfigPanel}
        program={program}
        questions={questions}
        allConsents={allConsents}
        onSaveProgram={(updatedProgram) => {
          onSaveProgram(updatedProgram);
          toast({
            title: "Program Updated",
            description: "Program settings have been updated successfully.",
          });
        }}
        onAddCheckoutQuestion={onAddCheckoutQuestion}
        onEditCheckoutQuestion={(checkoutQuestionId) => {
          const checkoutQuestion = (program.checkoutQuestions || []).find(
            (question) => question.id === checkoutQuestionId
          );
          if (checkoutQuestion) {
            onEditCheckoutQuestion(checkoutQuestion);
          }
        }}
      />
    </div>
  );
}
