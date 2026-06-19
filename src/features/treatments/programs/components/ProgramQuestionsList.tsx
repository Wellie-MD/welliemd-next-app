import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Grid3X3, List as ListIcon, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Program, ProgramQuestion } from "@/features/treatments/types";
import { SharedQuestionsList } from "@/features/treatments/common/components/SharedQuestionsList";
import { PatientFlowTestModal } from "@/features/treatments/flow-builder/components/modals/PatientFlowTestModal";

interface ProgramQuestionsListProps {
  program: Program;
  initialQuestions: ProgramQuestion[];
}

export function ProgramQuestionsList({ program, initialQuestions }: ProgramQuestionsListProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(`/dashboard/treatments/programs/${program.slug}`);
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get("view") === "flow" ? "flow" : "list";
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);

  const setViewMode = (mode: "list" | "flow") => {
    setSearchParams({ view: mode }, { replace: true });
  };

  const headerExtraActions = (
    <div className="flex items-center gap-2">
      <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-1 shadow-sm h-10 mr-2">
        <button
          onClick={() => setViewMode("list")}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-1 text-[12px] font-bold transition-all h-8 ${
            viewMode === "list"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
        >
          <ListIcon className="h-3.5 w-3.5" />
          List
        </button>
        <button
          onClick={() => setViewMode("flow")}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-1 text-[12px] font-bold transition-all h-8 ${
            viewMode === "flow"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
        >
          <Grid3X3 className="h-3.5 w-3.5" />
          Flow
        </button>
      </div>
      <Button
        onClick={() => setIsSimulateOpen(true)}
        className="h-10 text-[13px] font-bold bg-[#0f766e] hover:bg-[#0d655e] text-white px-5 rounded-lg shadow-sm"
      >
        <Play className="h-4 w-4 mr-2 fill-white" />
        Simulate
      </Button>
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
      />

      <PatientFlowTestModal
        open={isSimulateOpen}
        onOpenChange={setIsSimulateOpen}
        previewContext={{ type: "program", id: program.id, slug: program.slug }}
      />
    </>
  );
}
