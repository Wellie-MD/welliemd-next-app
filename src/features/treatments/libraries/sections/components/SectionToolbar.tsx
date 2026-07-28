import { Download, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type SectionScopeFilter = "all" | "global" | "shared" | "treatment";

interface SectionToolbarProps {
  scopeFilter: SectionScopeFilter;
  searchQuery: string;
  onScopeFilterChange: (scope: SectionScopeFilter) => void;
  onSearchQueryChange: (query: string) => void;
  onResetFilters: () => void;
  onExport: () => void;
}

const scopeFilters: Array<{ value: SectionScopeFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "global", label: "Global" },
  { value: "shared", label: "Shared" },
  { value: "treatment", label: "Treatment Specific" },
];

export function SectionToolbar({
  scopeFilter,
  searchQuery,
  onScopeFilterChange,
  onSearchQueryChange,
  onResetFilters,
  onExport,
}: SectionToolbarProps) {
  return (
    <div className="mb-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {scopeFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={scopeFilter === filter.value ? "default" : "outline"}
            size="sm"
            onClick={() => onScopeFilterChange(filter.value)}
            data-testid={`sections-filter-${filter.value}`}
          >
            {filter.label}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          className="gap-1"
          data-testid="sections-reset-filters"
        >
          <RotateCcw className="h-3 w-3" />
          Reset Filters
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-xl">
          <Input
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search sections by name or scope"
            className="pr-9"
            data-testid="sections-search-input"
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

        <Button variant="outline" onClick={onExport} className="ml-auto gap-2" data-testid="sections-export-button">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
