import { Check, Eye, LayoutGrid, List as ListIcon, Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FlowBuilderViewMode } from "@/features/treatments/flow-builder/hooks/useCustomProgramFlowBuilder";
import { BuilderHeaderToggle } from "@/features/treatments/common/components/builder/BuilderHeaderToggle";

interface FlowBuilderHeaderProps {
  name: string;
  slug: string;
  slugInput: string;
  isEditingSlug: boolean;
  viewMode: FlowBuilderViewMode;
  onSlugInputChange: (value: string) => void;
  onStartEditSlug: () => void;
  onSaveSlug: () => void;
  onCancelEditSlug: () => void;
  onViewModeChange: (mode: FlowBuilderViewMode) => void;
  onOpenDrawer?: () => void;
  onOpenPreview: () => void;
  onSave: () => void;
}

export function FlowBuilderHeader({
  name,
  slug,
  slugInput,
  isEditingSlug,
  viewMode,
  onSlugInputChange,
  onStartEditSlug,
  onSaveSlug,
  onCancelEditSlug,
  onViewModeChange,
  onOpenDrawer,
  onOpenPreview,
  onSave,
}: FlowBuilderHeaderProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shrink-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">{name}</h1>
          <div className="mt-2 flex items-center gap-3 text-sm">
            {isEditingSlug ? (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600">
                  <span className="text-slate-400">welliemd.com/start/</span>
                  <input
                    type="text"
                    className="w-32 border-b border-blue-600 bg-transparent font-semibold text-slate-900 outline-none"
                    value={slugInput}
                    onChange={(event) => onSlugInputChange(event.target.value)}
                    data-testid="custom-program-slug-input"
                  />
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:text-emerald-700" onClick={onSaveSlug} data-testid="save-custom-program-slug">
                  <Check className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600 hover:text-rose-700" onClick={onCancelEditSlug} data-testid="cancel-custom-program-slug">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600">
                  <span className="text-slate-400">welliemd.com/start/</span>
                  <span className="font-semibold text-slate-900">{slug}</span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onStartEditSlug} data-testid="edit-custom-program-slug">
                  Edit
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onOpenPreview} data-testid="open-custom-program-preview-icon">
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
          <p className="mt-3 max-w-2xl text-xs text-slate-500">
            Drag items to reorder them within a stage. New items are placed in their matching stage. Authentication and Checkout are locked in place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          <BuilderHeaderToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
          <Button variant="secondary" onClick={onOpenDrawer} data-testid="open-add-to-flow-drawer">
            <Plus className="mr-2 h-4 w-4" />
            Add to flow
          </Button>
          <Button variant="outline" onClick={onOpenPreview} data-testid="open-custom-program-preview">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={onSave} data-testid="save-custom-program-flow">
            <Save className="mr-2 h-4 w-4" />
            Save Plan
          </Button>
        </div>
      </div>
    </div>
  );
}
