import { LayoutGrid, List, Plus, Users, History, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
  onCreate: () => void;
}

interface CustomProgramsHeaderActionsProps extends Pick<CustomProgramsToolbarProps, "viewMode" | "onViewModeChange" | "onCreate"> {
  onAssign: () => void;
  onViewHistory: () => void;
  assignDisabled?: boolean;
}

export function CustomProgramsHeaderActions({ viewMode, onViewModeChange, onCreate, onAssign, onViewHistory, assignDisabled }: CustomProgramsHeaderActionsProps) {
  return (
    <div className="flex  flex-wrap items-center gap-3">
      <div className="flex  items-center rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
        <button
          onClick={() => onViewModeChange("card")}
          className={cn("flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors", viewMode === "card" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900")}
          data-testid="custom-programs-card-view"
        >
          <LayoutGrid className="mr-2 h-4 w-4" />
          Cards
        </button>
        <button
          onClick={() => onViewModeChange("list")}
          className={cn("flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors", viewMode === "list" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900")}
          data-testid="custom-programs-list-view"
        >
          <List className="mr-2 h-4 w-4" />
          List
        </button>
      </div>
      <Button
        variant="outline"
        onClick={onViewHistory}
        data-testid="custom-program-assignment-history"
      >
        <History className="mr-2 h-4 w-4" />
        Assignment History
      </Button>
      <Button
        variant="outline"
        onClick={onAssign}
        disabled={assignDisabled}
        data-testid="assign-custom-program-client"
      >
        <Users className="mr-2 h-4 w-4" />
        Assign to Client
      </Button>
      <Button
        onClick={onCreate}
        data-testid="create-custom-program"
      >
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
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange("all")}
          data-testid="filter-custom-programs-all"
        >
          All {totalCount}
        </Button>
        <Button
          variant={filter === "multi" ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange("multi")}
          className="gap-1.5"
          data-testid="filter-custom-programs-multi"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#be185d]" />
          Multi-treatment routing {multiCount}
        </Button>
        <Button
          variant={filter === "single" ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange("single")}
          className="gap-1.5"
          data-testid="filter-custom-programs-single"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#15803d]" />
          Single-treatment customization {singleCount}
        </Button>
      </div>
      <div className="relative max-w-xl">
        <Input
          placeholder="Search custom forms…"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          className="pr-9"
          data-testid="search-custom-programs"
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={() => onSearchQueryChange("")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
