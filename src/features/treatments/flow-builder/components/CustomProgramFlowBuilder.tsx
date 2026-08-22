import { useMemo, useState } from "react";
import type { CommonSection, ConsentForm, CustomProgram, CustomProgramFlowItem, EffectiveCustomProgramContent, Program, ProgramQuestion } from "@/features/treatments/types";
import { useCustomProgramFlowBuilder } from "@/features/treatments/flow-builder/hooks/useCustomProgramFlowBuilder";
import { useSectionFieldsMap } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { buildMatchingSources } from "@/features/treatments/flow-builder/utils/programMatchingRules";
import { getQuestionnairePreviewApiBaseUrl } from "@/features/treatments/utils/previewUrl";
import { PatientFlowTestModal } from "./modals/PatientFlowTestModal";
import { FlowBuilderCanvas } from "./canvas/FlowBuilderCanvas";
import { FlowBuilderHeader } from "./canvas/FlowBuilderHeader";
import { FlowBuilderListView } from "./canvas/FlowBuilderListView";
import { FlowBuilderSidebar } from "./canvas/FlowBuilderSidebar";
import { ProgramMatchingRuleEditor } from "./modals/ProgramMatchingRuleEditor";
import { QuestionEditorDialog } from "@/features/treatments/question-editor/components/shell/QuestionEditorDialog";

interface CustomProgramFlowBuilderProps {
  customProgram: CustomProgram;
  onOpenDrawer?: () => void;
  onSave?: (updated: CustomProgram) => void;
  onPublish: () => void;
  isPublishing?: boolean;
  onUpdateFlow?: (updatedItems: CustomProgramFlowItem[]) => void;
  programs: Program[];
  sections: CommonSection[];
  consents: ConsentForm[];
  effectiveContent: EffectiveCustomProgramContent;
  onSaveMatching: (
    rules: CustomProgram["programMatchingRules"],
  ) => Promise<void>;
}

export function CustomProgramFlowBuilder({ customProgram, onOpenDrawer, onSave, onPublish, isPublishing, onUpdateFlow, programs, sections, consents, effectiveContent, onSaveMatching }: CustomProgramFlowBuilderProps) {
  const builder = useCustomProgramFlowBuilder({ customProgram, onSave, onUpdateFlow });
  const [matchingProgramId, setMatchingProgramId] = useState<string | null>(null);

  // Inputs a Stage 2 matching rule may legally reference. Section fields must
  // be loaded for every Section placed in the flow, otherwise a valid rule
  // would render as "input no longer available".
  const flowSectionIds = useMemo(
    () => customProgram.flowItems
      .filter((item) => item.kind === "section" || item.kind === "section_field")
      .map((item) => String(item.sourceId || "")),
    [customProgram.flowItems],
  );
  const sectionFields = useSectionFieldsMap(flowSectionIds);
  const matchingSources = useMemo(
    () => buildMatchingSources({
      flowItems: customProgram.flowItems,
      sections,
      sectionFields,
      effectiveSections: effectiveContent.stages.stage1.sections,
    }),
    [customProgram.flowItems, sections, sectionFields, effectiveContent.stages.stage1.sections],
  );
  const [editingQuestion, setEditingQuestion] = useState<CustomProgramFlowItem | null>(null);
  const editorQuestion: ProgramQuestion | null = editingQuestion ? {
    id: editingQuestion.sourceId || editingQuestion.id,
    order: customProgram.flowItems.findIndex((item) => item.id === editingQuestion.id) + 1,
    text: editingQuestion.title,
    kind: (editingQuestion.questionKind || "text") as ProgramQuestion["kind"],
    section: "Program Matching",
    required: editingQuestion.required ?? true,
    choices: editingQuestion.choices || editingQuestion.answerOptions || [],
    visibilityRuleGroup: editingQuestion.visibilityRules as ProgramQuestion["visibilityRuleGroup"],
    includeInQa: editingQuestion.includeInQa,
    hiddenFromPatient: editingQuestion.hiddenFromPatient,
    prefillFromPrevious: editingQuestion.prefillFromPrevious,
    lockClientChanges: editingQuestion.lockClientChanges,
  } : null;

  return (
    <div className="flex flex-col space-y-4">
      <FlowBuilderHeader
        name={customProgram.name}
        slug={customProgram.slug}
        slugInput={builder.slugInput}
        isEditingSlug={builder.isEditingSlug}
        viewMode={builder.viewMode}
        onSlugInputChange={builder.setSlugInput}
        onStartEditSlug={builder.handleStartEditSlug}
        onSaveSlug={builder.handleSaveSlug}
        onCancelEditSlug={builder.handleCancelEditSlug}
        onViewModeChange={builder.setViewMode}
        onOpenDrawer={onOpenDrawer}
        onOpenPreview={() => builder.setIsTestModalOpen(true)}
        onSave={builder.handleSave}
        onPublish={onPublish}
        isPublishing={isPublishing}
      />

      <PatientFlowTestModal
        open={builder.isTestModalOpen}
        onOpenChange={builder.setIsTestModalOpen}
        previewContext={{
          type: "custom_program",
          id: customProgram.id,
          slug: customProgram.slug,
          name: customProgram.name,
          apiBaseUrl: getQuestionnairePreviewApiBaseUrl(),
        }}
      />
      <ProgramMatchingRuleEditor
        open={Boolean(matchingProgramId)}
        onOpenChange={(open) => { if (!open) setMatchingProgramId(null); }}
        customProgram={customProgram}
        programId={matchingProgramId}
        programs={programs}
        sources={matchingSources}
        onSave={onSaveMatching}
        onOpenPreview={() => builder.setIsTestModalOpen(true)}
      />
      <QuestionEditorDialog
        open={Boolean(editingQuestion)}
        onOpenChange={(open) => { if (!open) setEditingQuestion(null); }}
        questions={editorQuestion ? [editorQuestion] : []}
        initialQuestionId={editorQuestion?.id || null}
        onSave={(question) => {
          if (!editingQuestion || !onUpdateFlow) return;
          onUpdateFlow(customProgram.flowItems.map((item) => item.id === editingQuestion.id ? {
            ...item,
            title: question.text,
            subtitle: `Matching input (${question.kind})`,
            sourceId: question.id,
            questionKind: question.kind,
            choices: question.choices || [],
            answerOptions: question.choices || [],
            required: question.required,
            visibilityRules: question.visibilityRuleGroup,
            includeInQa: question.includeInQa,
            hiddenFromPatient: question.hiddenFromPatient,
            prefillFromPrevious: question.prefillFromPrevious,
            lockClientChanges: question.lockClientChanges,
          } : item));
          setEditingQuestion(null);
        }}
      />

      {builder.viewMode === "list" && (
        <FlowBuilderListView
          customProgram={customProgram}
          programs={programs}
          sections={sections}
          consents={consents}
          effectiveContent={effectiveContent}
          onUpdateFlow={onUpdateFlow}
          onEditQuestion={setEditingQuestion}
          onOpenPreview={() => builder.setIsTestModalOpen(true)}
          onConfigureMatching={(programId) => setMatchingProgramId(programId)}
        />
      )}

      {builder.viewMode === "flow" && (
        <div className="grid h-[calc(100vh-260px)] min-h-[500px] grid-cols-[280px_1fr] gap-4 overflow-hidden">
          <FlowBuilderSidebar
            items={builder.filteredLibraryItems}
            filter={builder.sidebarFilter}
            search={builder.sidebarSearch}
            onFilterChange={builder.setSidebarFilter}
            onSearchChange={builder.setSidebarSearch}
            onToggleItem={builder.handleToggleItemInFlow}
            onDragStart={builder.handleSidebarDragStart}
            isItemInFlow={builder.isItemInFlow}
            onOpenDrawer={onOpenDrawer}
          />
          <FlowBuilderCanvas
            flowItems={customProgram.flowItems}
            preFan={builder.preFan}
            tracks={builder.tracks}
            postFan={builder.postFan}
            onDragStart={builder.handleDragStart}
            onDragEnd={builder.handleDragEnd}
            onDropOnArrow={builder.handleDropOnArrow}
            onCanvasDrop={builder.handleCanvasContainerDrop}
            onInsertItem={builder.handleInsertItem}
            getTargetIndexForId={builder.getTargetIndexForId}
            onEditSystemItem={(item) => { if (item.kind === "routing_question") setEditingQuestion(customProgram.flowItems.find((flowItem) => flowItem.id === item.id) || null); }}
          />
        </div>
      )}
    </div>
  );
}
