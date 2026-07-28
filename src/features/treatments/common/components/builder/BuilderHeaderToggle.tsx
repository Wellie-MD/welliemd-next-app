import { GitBranch, List as ListIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type BuilderMode = "card" | "list" | "flow";

export interface BuilderHeaderToggleOption<TMode extends string = BuilderMode> {
  value: TMode;
  label: string;
  icon: LucideIcon;
  testId?: string;
}

interface BuilderHeaderToggleProps<TMode extends string = BuilderMode> {
  viewMode: TMode;
  onViewModeChange: (mode: TMode) => void;
  options?: BuilderHeaderToggleOption<TMode>[];
}

const defaultOptions: BuilderHeaderToggleOption<"list" | "flow">[] = [
  {
    value: "list",
    label: "List",
    icon: ListIcon,
    testId: "builder-list-view",
  },
  {
    value: "flow",
    label: "Flow",
    icon: GitBranch,
    testId: "builder-flow-view",
  },
];

export function BuilderHeaderToggle<TMode extends string = "list" | "flow">({
  viewMode,
  onViewModeChange,
  options,
}: BuilderHeaderToggleProps<TMode>) {
  const toggleOptions = options ?? (defaultOptions as BuilderHeaderToggleOption<TMode>[]);

  return (
    <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-[#151924] dark:shadow-none">
      {toggleOptions.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            onClick={() => onViewModeChange(option.value)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-md px-3.5 py-1 text-[12px] font-bold transition-all",
              viewMode === option.value ? "bg-slate-100 text-slate-900 shadow-sm dark:bg-blue-600/10 dark:text-blue-300 dark:shadow-none" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            )}
            data-testid={option.testId}
          >
            <Icon className="h-4 w-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
