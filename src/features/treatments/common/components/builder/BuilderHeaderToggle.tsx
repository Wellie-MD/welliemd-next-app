import { LayoutGrid, List as ListIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type BuilderMode = "list" | "flow";

interface BuilderHeaderToggleProps {
  viewMode: BuilderMode;
  onViewModeChange: (mode: BuilderMode) => void;
}

export function BuilderHeaderToggle({ viewMode, onViewModeChange }: BuilderHeaderToggleProps) {
  return (
    <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm h-10">
      <button
        onClick={() => onViewModeChange("list")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-3.5 py-1 text-[12px] font-bold transition-all h-8",
          viewMode === "list" ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
        )}
        data-testid="builder-list-view"
      >
        <ListIcon className="h-4 w-4" />
        List
      </button>
      <button
        onClick={() => onViewModeChange("flow")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-3.5 py-1 text-[12px] font-bold transition-all h-8",
          viewMode === "flow" ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
        )}
        data-testid="builder-flow-view"
      >
        <LayoutGrid className="h-4 w-4" />
        Flow
      </button>
    </div>
  );
}
