import { Download, RotateCcw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ConsentScopeFilter = "all" | "global" | "treatment";

interface ConsentsToolbarProps {
  scopeFilter: ConsentScopeFilter;
  onScopeFilterChange: (filter: ConsentScopeFilter) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onReset: () => void;
  onExport: () => void;
  resultCount: number;
}

const TABS: Array<{ value: ConsentScopeFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "global", label: "Global" },
  { value: "treatment", label: "Treatment Specific" },
];

export function ConsentsToolbar({
  scopeFilter,
  onScopeFilterChange,
  searchQuery,
  onSearchChange,
  onReset,
  onExport,
  resultCount,
}: ConsentsToolbarProps) {
  const isFiltered = scopeFilter !== "all" || searchQuery.trim().length > 0;

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onScopeFilterChange(tab.value)}
            aria-pressed={scopeFilter === tab.value}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
              scopeFilter === tab.value
                ? "bg-slate-950 text-white"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
            data-testid={`consents-filter-${tab.value}`}
          >
            {tab.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onReset}
          disabled={!isFiltered}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="consents-reset-filters"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Filters
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search consents by name or scope"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Search consents"
            data-testid="consents-search"
          />
        </div>
        <button
          type="button"
          onClick={onExport}
          disabled={resultCount === 0}
          className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="consents-export"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      </div>
    </div>
  );
}
