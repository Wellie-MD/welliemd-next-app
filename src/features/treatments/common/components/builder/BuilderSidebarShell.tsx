import { ReactNode } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BuilderSidebarShellProps {
  title?: string;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: { value: string; label: string }[];
  currentFilter?: string;
  onFilterChange?: (filter: string) => void;
  itemCount: number;
  onCreateNew?: () => void;
  createNewText?: string;
  children: ReactNode;
}

export function BuilderSidebarShell({
  title = "Items",
  search,
  onSearchChange,
  searchPlaceholder = "Search by name or type",
  filters = [],
  currentFilter,
  onFilterChange,
  itemCount,
  onCreateNew,
  createNewText = "Create new",
  children,
}: BuilderSidebarShellProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm h-full max-h-full">
      <div className="border-b border-slate-100 p-4 shrink-0">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs outline-none transition-colors focus:border-[#12517A] focus:bg-white"
            data-testid="builder-sidebar-search"
          />
        </div>

        {filters.length > 0 && onFilterChange && currentFilter && (
          <div className="mt-3 flex gap-1.5 flex-wrap">
            {filters.map((filterOption) => (
              <button
                key={filterOption.value}
                onClick={() => onFilterChange(filterOption.value)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  currentFilter === filterOption.value
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                )}
                data-testid={`builder-filter-${filterOption.value.replace("_", "-")}`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto bg-slate-50/50 p-2.5 min-h-0">
        {children}
        {itemCount === 0 && <div className="py-8 text-center text-xs italic text-slate-400">No items matched search criteria.</div>}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-white p-3">
        <span className="text-[11px] font-semibold text-slate-500">{itemCount} items</span>
        {onCreateNew && (
          <Button variant="outline" size="sm" className="h-7 border-slate-200 text-xs text-[#12517A] hover:bg-slate-50" onClick={onCreateNew} data-testid="builder-create-new">
            <Plus className="mr-1.5 h-3 w-3" />
            {createNewText}
          </Button>
        )}
      </div>
    </div>
  );
}
