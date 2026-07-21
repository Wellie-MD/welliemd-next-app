import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Program, ProgramQuestion } from "@/features/treatments/types";
import { SharedQuestionsList } from "@/features/treatments/common/components/SharedQuestionsList";
import { useConsents } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { PatientFlowTestModal } from "@/features/treatments/flow-builder/components/modals/PatientFlowTestModal";
import { ProgramLabsSection } from "./ProgramLabsSection";

interface ProgramQuestionsListProps {
  program: Program;
  initialQuestions: ProgramQuestion[];
}

export function ProgramQuestionsList({ program, initialQuestions }: ProgramQuestionsListProps) {
  const navigate = useNavigate();
  const { data: allConsents = [] } = useConsents();

  const handleBack = () => {
    navigate("/dashboard/treatments/programs");
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get("view") === "flow" ? "flow" : "list";
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);

  const setViewMode = (mode: "list" | "flow") => {
    setSearchParams({ view: mode }, { replace: true });
  };

  const headerExtraActions = (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => setIsSimulateOpen(true)}
        variant="outline"
        className="h-9 px-4 text-[13px] font-semibold text-slate-600 border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm"
      >
        <Eye className="h-4 w-4 mr-2" />
        Preview
      </Button>
      {viewMode === "list" && (
        <Button
          onClick={() => setViewMode("flow")}
          variant="outline"
          className="h-9 px-4 text-[13px] font-semibold text-slate-600 border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm"
        >
          <Grid3X3 className="h-4 w-4 mr-2" />
          Flow Builder
        </Button>
      )}
      {viewMode === "flow" && (
        <Button
          onClick={() => setViewMode("list")}
          variant="outline"
          className="h-9 px-4 text-[13px] font-semibold text-slate-600 border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm"
        >
          <List className="h-4 w-4 mr-2" />
          Questions
        </Button>
      )}
    </div>
  );

  return (
    <>
      <SharedQuestionsList
        entityId={program.id}
        entityName={program.name}
        entityType="program"
        initialQuestions={initialQuestions}
        headerTitle={program.name}
        headerSubtitle="Manage questions for this template"
        onBack={handleBack}
        headerExtraActions={headerExtraActions}
        authConfig={program.authConfig}
        viewMode={viewMode as "list" | "flow"}
        onViewModeChange={setViewMode}
        onOpenPreview={() => setIsSimulateOpen(true)}
        program={program}
        allConsents={allConsents}
      />
      {viewMode === "list" && <ProgramLabsSection program={program} />}

      <PatientFlowTestModal
        open={isSimulateOpen}
        onOpenChange={setIsSimulateOpen}
        previewContext={{
          type: "program",
          id: program.id,
          slug: program.slug,
          visitType: program.visitType,
          templateId: program.sourceQuestionnaireTemplateId,
        }}
      />
    </>
  );
}
