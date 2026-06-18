import { Eye, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BuilderHeaderToggle } from "@/features/treatments/common/components/builder/BuilderHeaderToggle";
import { AddElementDropdown } from "@/features/treatments/common/components/AddElementDropdown";
import type { QuestionFlowViewMode } from "../hooks/useQuestionFlowBuilder";

interface QuestionFlowHeaderProps {
  entityType: "program" | "section";
  title: string;
  subtitle: string;
  viewMode: QuestionFlowViewMode;
  onViewModeChange: (mode: QuestionFlowViewMode) => void;
  onAddElementClick: () => void;
  onAddItemRequest: (kind: string, text: string) => void;
  onOpenPreview: () => void;
  onSave: () => void;
}

export function QuestionFlowHeader({
  entityType,
  title,
  subtitle,
  viewMode,
  onViewModeChange,
  onAddElementClick,
  onAddItemRequest,
  onOpenPreview,
  onSave,
}: QuestionFlowHeaderProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shrink-0 mb-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          <div className="mt-2 flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600">
              <span className="font-semibold text-slate-900">{subtitle}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onOpenPreview} data-testid="open-flow-preview-icon">
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="mt-3 max-w-2xl text-xs text-slate-500">
            Drag any item to reorder. Add new items anywhere from the side panel or Add menu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          <BuilderHeaderToggle viewMode={viewMode} onViewModeChange={onViewModeChange as any} />
          {entityType === "program" ? (
            <AddElementDropdown
              onAddQuestion={() => onAddItemRequest("question", "")}
              onAddAuth={() => onAddItemRequest("auth", "")}
              onAddSection={() => onAddItemRequest("section", "")}
              onAddConsent={() => onAddItemRequest("consent", "")}
              onAddCheckout={() => onAddItemRequest("checkout", "")}
            />
          ) : (
            <Button variant="secondary" className="bg-[#12517A] text-white hover:bg-[#12517A]/90" onClick={onAddElementClick} data-testid="open-add-to-flow-menu">
              <Plus className="mr-2 h-4 w-4" />
              Add Field
            </Button>
          )}
          <Button variant="outline" onClick={onOpenPreview} data-testid="open-flow-preview">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={onSave} className="bg-[#12517A] text-white hover:bg-[#12517A]/90" data-testid="save-flow-plan">
            <Save className="mr-2 h-4 w-4" />
            Save Plan
          </Button>
        </div>
      </div>
    </div>
  );
}
