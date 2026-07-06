import { LayoutGrid, List, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BuilderHeaderToggle } from "@/features/treatments/common/components/builder/BuilderHeaderToggle";
import type { BuilderHeaderToggleOption } from "@/features/treatments/common/components/builder/BuilderHeaderToggle";
import type { CustomProgramsFilter, CustomProgramsViewMode } from "@/features/treatments/custom-programs/hooks/useCustomProgramsPage";

interface CustomProgramsToolbarProps {
  viewMode: CustomProgramsViewMode;
  filter: CustomProgramsFilter;
  searchQuery: string;
  totalCount: number;
  multiCount: number;
  singleCount: number;
  onViewModeChange: (mode: CustomProgramsViewMode) => void;
  onFilterChange: (filter: CustomProgramsFilter) => void;
  onSearchQueryChange: (value: string) => void;
}

function filterButtonClassName(active: boolean) {
  return cn(
    "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
    active
      ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-600/10 dark:text-blue-300"
      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-transparent dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200"
  );
}

function countClassName(active: boolean) {
  return cn(
    "rounded-full px-1.5 py-0.5 font-mono text-[10px]",
    active ? "bg-white text-blue-700 dark:bg-slate-900 dark:text-blue-300" : "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400"
  );
}

const customProgramsViewOptions: BuilderHeaderToggleOption<CustomProgramsViewMode>[] = [
  {
    value: "card",
    label: "Cards",
    icon: LayoutGrid,
    testId: "custom-programs-card-view",
  },
  {
    value: "list",
    label: "List",
    icon: List,
    testId: "custom-programs-list-view",
  },
];

export function CustomProgramsToolbar({
  viewMode,
  filter,
  searchQuery,
  totalCount,
  multiCount,
  singleCount,
  onViewModeChange,
  onFilterChange,
  onSearchQueryChange,
}: CustomProgramsToolbarProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-[#171b27] dark:shadow-none lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => onFilterChange("all")} className={filterButtonClassName(filter === "all")} data-testid="filter-custom-programs-all">
          All <span className={countClassName(filter === "all")}>{totalCount}</span>
        </button>
        <button onClick={() => onFilterChange("multi")} className={filterButtonClassName(filter === "multi")} data-testid="filter-custom-programs-multi">
          <span className="h-1.5 w-1.5 rounded-full bg-[#be185d]" />
          Multi-treatment routing <span className={countClassName(filter === "multi")}>{multiCount}</span>
        </button>
        <button onClick={() => onFilterChange("single")} className={filterButtonClassName(filter === "single")} data-testid="filter-custom-programs-single">
          <span className="h-1.5 w-1.5 rounded-full bg-[#15803d]" />
          Single-treatment customization <span className={countClassName(filter === "single")}>{singleCount}</span>
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="rounded-lg pl-9 text-xs dark:border-slate-700 dark:bg-[#0f1117] dark:text-slate-200 dark:placeholder:text-slate-500" placeholder="Search custom programs…" value={searchQuery} onChange={(event) => onSearchQueryChange(event.target.value)} data-testid="search-custom-programs" />
        </div>
        <BuilderHeaderToggle
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          options={customProgramsViewOptions}
        />
      </div>
    </div>
  );
}
