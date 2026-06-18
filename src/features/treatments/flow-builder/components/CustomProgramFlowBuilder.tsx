import type { CustomProgram, CustomProgramFlowItem } from "@/features/treatments/types";
import { useCustomProgramFlowBuilder } from "@/features/treatments/flow-builder/hooks/useCustomProgramFlowBuilder";
import { PatientFlowTestModal } from "./modals/PatientFlowTestModal";
import { FlowBuilderCanvas } from "./canvas/FlowBuilderCanvas";
import { FlowBuilderHeader } from "./canvas/FlowBuilderHeader";
import { FlowBuilderListView } from "./canvas/FlowBuilderListView";
import { FlowBuilderSidebar } from "./canvas/FlowBuilderSidebar";

interface CustomProgramFlowBuilderProps {
  customProgram: CustomProgram;
  onOpenDrawer?: () => void;
  onSave?: (updated: CustomProgram) => void;
  onUpdateFlow?: (updatedItems: CustomProgramFlowItem[]) => void;
}

export function CustomProgramFlowBuilder({ customProgram, onOpenDrawer, onSave, onUpdateFlow }: CustomProgramFlowBuilderProps) {
  const builder = useCustomProgramFlowBuilder({ customProgram, onSave, onUpdateFlow });

  return (
    <div className="flex h-full flex-col space-y-4">
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
      />

      <PatientFlowTestModal
        open={builder.isTestModalOpen}
        onOpenChange={builder.setIsTestModalOpen}
        previewContext={{ type: "custom_program", id: customProgram.id, slug: customProgram.slug }}
      />

      {builder.viewMode === "list" && (
        <FlowBuilderListView
          flowItems={customProgram.flowItems}
          onDeleteItem={builder.handleDeleteItem}
          onMoveItem={builder.handleMoveItem}
          onDragStart={builder.handleDragStart}
          onDragOver={builder.handleDragOver}
          onDragEnd={builder.handleDragEnd}
          onDrop={builder.handleDrop}
        />
      )}

      {builder.viewMode === "flow" && (
        <div className="grid min-h-[500px] flex-1 grid-cols-[280px_1fr] gap-4 overflow-hidden">
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
            onOpenPreview={() => builder.setIsTestModalOpen(true)}
            onOpenDrawer={onOpenDrawer}
            onSave={builder.handleSave}
            onDragStart={builder.handleDragStart}
            onDragEnd={builder.handleDragEnd}
            onDropOnArrow={builder.handleDropOnArrow}
            onCanvasDrop={builder.handleCanvasContainerDrop}
            onInsertItem={builder.handleInsertItem}
            getTargetIndexForId={builder.getTargetIndexForId}
          />
        </div>
      )}
    </div>
  );
}
