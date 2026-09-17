import { ArrowLeft, Check, Eye, LayoutGrid, List as ListIcon, Plus, Rocket, Save, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { FlowBuilderViewMode } from "@/features/treatments/flow-builder/hooks/useCustomProgramFlowBuilder";
import { BuilderHeaderToggle } from "@/features/treatments/common/components/builder/BuilderHeaderToggle";
import { ADMIN_TREATMENT_ROUTES } from "@/features/treatments/navigation/routes";

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
  onPublish: () => void;
  isPublishing?: boolean;
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
  onPublish,
  isPublishing = false,
}: FlowBuilderHeaderProps) {
  return (
    <div className="shrink-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
        <div className="flex min-w-0 w-full flex-1 items-start gap-2 sm:gap-3">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="mt-0.5 h-9 w-9 shrink-0 border-slate-200 bg-white shadow-sm hover:bg-slate-50"
          >
            <Link to={ADMIN_TREATMENT_ROUTES.customPrograms} aria-label="Back to Custom Programs">
              <ArrowLeft className="h-4 w-4 text-slate-600" />
            </Link>
          </Button>

          <div className="min-w-0 flex-1">
            <h1 className="break-words text-lg font-bold text-slate-900 sm:text-xl">{name}</h1>
            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2 text-sm sm:gap-3">
              {isEditingSlug ? (
                <div className="flex min-w-0 max-w-full flex-wrap items-center gap-1.5">
                  <div className="flex max-w-full min-w-0 flex-wrap items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600">
                    <span className="shrink-0 text-slate-400">welliemd.com/start/</span>
                    <input
                      type="text"
                      className="w-32 min-w-0 max-w-full border-b border-blue-600 bg-transparent font-semibold text-slate-900 outline-none"
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
                <div className="flex min-w-0 max-w-full flex-wrap items-center gap-1.5">
                  <div className="flex max-w-full min-w-0 flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600">
                    <span className="shrink-0 text-slate-400">welliemd.com/start/</span>
                    <span className="min-w-0 break-all font-semibold text-slate-900">{slug}</span>
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
        </div>

        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:gap-3 2xl:w-auto 2xl:flex-nowrap 2xl:justify-end">
          <div className="shrink-0">
            <BuilderHeaderToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
          </div>
          <Button size="sm" className="shrink-0 sm:h-10 sm:px-4" onClick={onOpenDrawer} data-testid="open-add-to-flow-drawer">
            <Plus className="mr-2 h-4 w-4" />
            Add to flow
          </Button>
          <Button size="sm" variant="outline" className="shrink-0 sm:h-10 sm:px-4" onClick={onOpenPreview} data-testid="open-custom-program-preview">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button size="sm" className="shrink-0 sm:h-10 sm:px-4" onClick={onSave} data-testid="save-custom-program-flow">
            <Save className="mr-2 h-4 w-4" />
            Save Plan
          </Button>
          <Button
            size="sm"
            className="shrink-0 sm:h-10 sm:px-4"
            onClick={onPublish}
            disabled={isPublishing}
            data-testid="publish-custom-program-flow"
          >
            <Rocket className="mr-2 h-4 w-4" />
            {isPublishing ? "Publishing…" : "Publish New Version"}
          </Button>
        </div>
      </div>
    </div>
  );
}
