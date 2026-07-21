import { Download, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
    <div className="mb-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {scopeFilters.map((filter) => {
          const active = scopeFilter === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => onScopeFilterChange(filter.value)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              )}
              data-testid={`sections-filter-${filter.value}`}
            >
              {filter.label}
            </button>
          );
        })}

        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-1.5 rounded-md border border-transparent px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          data-testid="sections-reset-filters"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Reset Filters
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search sections by name or scope"
            className="h-9 border-slate-200 bg-white pl-9 text-sm shadow-sm"
            data-testid="sections-search-input"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-md border-slate-200 px-3 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50"
          onClick={onExport}
          data-testid="sections-export-button"
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Export
        </Button>
      </div>
    </div>
  );
}
