import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Grid3X3, List as ListIcon, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CommonSection } from "@/features/treatments/types";
import { useProgramQuestions } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { SharedQuestionsList } from "@/features/treatments/common/components/SharedQuestionsList";
import { sectionQuestionFlowAdapter } from "@/features/treatments/question-flow-builder/utils/questionFlowAdapters";
import { QuestionFlowBuilder } from "@/features/treatments/question-flow-builder/components/QuestionFlowBuilder";
import { PatientFlowTestModal } from "@/features/treatments/flow-builder/components/modals/PatientFlowTestModal";

interface SectionFieldsViewProps {
  section: CommonSection;
  onBack: () => void;
}

export function SectionFieldsView({ section, onBack }: SectionFieldsViewProps) {
  const { data: initialQuestions = [] } = useProgramQuestions(section.id);

  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get("view") === "flow" ? "flow" : "list";
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);

  const setViewMode = (mode: "list" | "flow") => {
    setSearchParams({ sectionId: section.id, view: mode }, { replace: true });
  };

  const [adapter, setAdapter] = useState<any>(null);
  useEffect(() => {
    sectionQuestionFlowAdapter(section.id, section.name).then(setAdapter);
  }, [section.id, section.name]);

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
        entityId={section.id}
        entityName={section.name}
        entityType="section"
        initialQuestions={initialQuestions}
        headerTitle={section.name}
        headerSubtitle="Manage questions for this template"
        onBack={onBack}
        headerExtraActions={headerExtraActions}
        viewMode={viewMode as "list" | "flow"}
        onViewModeChange={setViewMode}
        flowAdapter={adapter}
        onOpenPreview={() => setIsSimulateOpen(true)}
      />

      <PatientFlowTestModal
        open={isSimulateOpen}
        onOpenChange={setIsSimulateOpen}
        previewContext={{ type: "section", id: section.id, slug: section.id }}
      />
    </>
  );
}

