import { LayoutGrid, List, Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CustomProgramsFilter, CustomProgramsViewMode } from "../../hooks/useCustomProgramsPage";

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
  onCreate: () => void;
}

function filterButtonClassName(active: boolean) {
  return cn(
    "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
    active ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
  );
}

function countClassName(active: boolean) {
  return cn("rounded-full px-1.5 py-0.5 font-mono text-[10px]", active ? "bg-white text-blue-700" : "bg-slate-100 text-slate-600");
}

export function CustomProgramsHeaderActions({ viewMode, onViewModeChange, onCreate }: Pick<CustomProgramsToolbarProps, "viewMode" | "onViewModeChange" | "onCreate">) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        <button
          onClick={() => onViewModeChange("card")}
          className={cn("flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors", viewMode === "card" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900")}
          data-testid="custom-programs-card-view"
        >
          <LayoutGrid className="mr-2 h-4 w-4" />
          Cards
        </button>
        <button
          onClick={() => onViewModeChange("list")}
          className={cn("flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors", viewMode === "list" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900")}
          data-testid="custom-programs-list-view"
        >
          <List className="mr-2 h-4 w-4" />
          List
        </button>
      </div>
      <Button variant="outline" data-testid="assign-custom-program-client">
        <Users className="mr-2 h-4 w-4" />
        Assign to Client
      </Button>
      <Button onClick={onCreate} className="bg-[#12517A] text-white hover:bg-[#12517A]/90" data-testid="create-custom-program">
        <Plus className="mr-2 h-4 w-4" />
        Create Custom Program
      </Button>
    </div>
  );
}

export function CustomProgramsToolbar({
  filter,
  searchQuery,
  totalCount,
  multiCount,
  singleCount,
  onFilterChange,
  onSearchQueryChange,
}: CustomProgramsToolbarProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
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
      <div className="relative w-full lg:w-80">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input className="rounded-lg pl-9 text-xs" placeholder="Search custom forms…" value={searchQuery} onChange={(event) => onSearchQueryChange(event.target.value)} data-testid="search-custom-programs" />
      </div>
    </div>
  );
}
