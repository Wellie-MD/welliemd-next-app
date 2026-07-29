import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Grid3X3, List as ListIcon, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CommonSection, ProgramQuestion } from "@/features/treatments/types";
import { useSectionFields } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { SharedQuestionsList } from "@/features/treatments/common/components/SharedQuestionsList";
import { QuestionnairePreviewDialog } from "@/features/treatments/preview/components/QuestionnairePreviewDialog";

interface SectionFieldsViewProps {
  section: CommonSection;
  onBack: () => void;
}

export function SectionFieldsView({ section, onBack }: SectionFieldsViewProps) {
  const { data: sectionFields = [] } = useSectionFields(section.id);

  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get("view") === "flow" ? "flow" : "list";
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);

  const initialQuestions: ProgramQuestion[] = sectionFields.map((field) => {
    const configuration = field.configuration || {};
    return {
      id: field.id,
      order: field.order,
      text: field.label,
      kind: field.kind,
      section: section.name,
      required: field.required,
      choices: Array.isArray(configuration.choices) ? configuration.choices as string[] : undefined,
      dqChoices: Array.isArray(configuration.dqChoices) ? configuration.dqChoices as string[] : undefined,
      consentText: typeof configuration.consentText === "string" ? configuration.consentText : undefined,
      checkoutProductIds: Array.isArray(configuration.checkoutProductIds)
        ? configuration.checkoutProductIds as string[]
        : undefined,
      checkoutProducts: Array.isArray(configuration.checkoutProducts)
        ? configuration.checkoutProducts as ProgramQuestion["checkoutProducts"]
        : undefined,
      visibilityRuleGroup:
        configuration.visibilityRuleGroup as ProgramQuestion["visibilityRuleGroup"],
      includeInQa: typeof configuration.includeInQa === "boolean" ? configuration.includeInQa : undefined,
      hiddenFromPatient:
        typeof configuration.hiddenFromPatient === "boolean" ? configuration.hiddenFromPatient : undefined,
      prefillFromPrevious:
        typeof configuration.prefillFromPrevious === "boolean" ? configuration.prefillFromPrevious : undefined,
      elementConfig: configuration,
    };
  });

  const setViewMode = (mode: "list" | "flow") => {
    setSearchParams({ sectionId: section.id, view: mode }, { replace: true });
  };

  const headerExtraActions = (
    <div className="flex items-center gap-2">
      <div className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-slate-50/80 p-0.5 shadow-sm">
        <button
          onClick={() => setViewMode("list")}
          className={`flex h-full items-center gap-1.5 rounded px-3 text-[11px] font-medium transition-all ${
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
          className={`flex h-full items-center gap-1.5 rounded px-3 text-[11px] font-medium transition-all ${
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
        size="sm"
        className="text-[11px] font-bold bg-[#0f766e] hover:bg-[#0d655e] text-white shadow-sm"
      >
        <Play className="h-4 w-4 mr-2 fill-white" />
        Preview
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
        onOpenPreview={() => setIsSimulateOpen(true)}
      />

      <QuestionnairePreviewDialog
        open={isSimulateOpen}
        onOpenChange={setIsSimulateOpen}
        previewContext={{ type: "section", id: section.id, slug: section.id }}
        subtitle={`Preview of reusable section "${section.name}"`}
      />
    </>
  );
}
