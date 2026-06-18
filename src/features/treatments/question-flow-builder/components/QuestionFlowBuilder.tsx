import { BuilderHeaderToggle } from "@/features/treatments/common/components/builder/BuilderHeaderToggle";
import { QuestionTypePalette } from "./QuestionTypePalette";
import { QuestionFlowCanvas } from "./QuestionFlowCanvas";
import { useQuestionFlowBuilder, type QuestionFlowViewMode } from "../hooks/useQuestionFlowBuilder";
import type { QuestionFlowAdapter } from "../types";
import { QuestionFlowHeader } from "./QuestionFlowHeader";

interface QuestionFlowBuilderProps {
  adapter: QuestionFlowAdapter;
  entityType: "program" | "section";
  title: string;
  subtitle: string;
  viewMode: QuestionFlowViewMode;
  onViewModeChange: (mode: QuestionFlowViewMode) => void;
  onAddElementClick: () => void;
  onAddItemRequest: (kind: string, text: string) => void;
  onOpenPreview: () => void;
}

export function QuestionFlowBuilder({
  adapter,
  entityType,
  title,
  subtitle,
  viewMode,
  onViewModeChange,
  onAddElementClick,
  onAddItemRequest,
  onOpenPreview,
}: QuestionFlowBuilderProps) {
  const {
    items,
    isSaving,
    handleSave,
    handleDragStart,
    handleDragEnd,
    handleDropOnArrow,
    handleCanvasDrop,
    handleAddItem,
    handleDeleteItem,
  } = useQuestionFlowBuilder(adapter);

  return (
    <div className="flex h-full min-h-[calc(100vh-160px)] flex-col gap-4">
      <QuestionFlowHeader
        entityType={entityType}
        title={title}
        subtitle={subtitle}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        onAddElementClick={onAddElementClick}
        onAddItemRequest={onAddItemRequest}
        onOpenPreview={onOpenPreview}
        onSave={handleSave}
      />
      <div className="flex flex-1 gap-4 overflow-hidden -mt-6">
        <div className="w-72 shrink-0 h-full">
          <QuestionTypePalette
            entityType={entityType}
            onAddItem={(kind, text) => {
              if (entityType === "program") {
                onAddItemRequest(kind, text);
              } else {
                handleAddItem(kind as any, text);
              }
            }}
          />
        </div>
        <div className="flex-1 h-full min-w-0">
          <QuestionFlowCanvas
            items={items}
            onOpenPreview={onOpenPreview}
            onSave={handleSave}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDropOnArrow={handleDropOnArrow}
            onCanvasDrop={handleCanvasDrop}
            onDeleteItem={handleDeleteItem}
          />
        </div>
      </div>
    </div>
  );
}
