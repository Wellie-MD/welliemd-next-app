import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FlowBuilderSidebarFilter, FlowLibraryItem } from "../../../hooks/useCustomProgramFlowBuilder";

interface FlowBuilderSidebarProps {
  items: FlowLibraryItem[];
  filter: FlowBuilderSidebarFilter;
  search: string;
  onFilterChange: (filter: FlowBuilderSidebarFilter) => void;
  onSearchChange: (value: string) => void;
  onToggleItem: (item: FlowLibraryItem) => void;
  onDragStart: (event: React.DragEvent, item: FlowLibraryItem) => void;
  isItemInFlow: (item: FlowLibraryItem) => boolean;
  onOpenDrawer?: () => void;
}

const FILTERS: FlowBuilderSidebarFilter[] = ["all", "in_flow", "unused"];

function getFilterLabel(filter: FlowBuilderSidebarFilter) {
  if (filter === "in_flow") return "In flow";
  if (filter === "unused") return "Unused";
  return "All";
}

function getKindClassName(kind: FlowLibraryItem["kind"]) {
  if (kind === "section") return "bg-sky-50 border-sky-100 text-sky-700";
  if (kind === "program") return "bg-emerald-50 border-emerald-100 text-emerald-700";
  return "bg-purple-50 border-purple-100 text-purple-700";
}

export function FlowBuilderSidebar({
  items,
  filter,
  search,
  onFilterChange,
  onSearchChange,
  onToggleItem,
  onDragStart,
  isItemInFlow,
  onOpenDrawer,
}: FlowBuilderSidebarProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <h2 className="text-sm font-bold text-slate-900">Items</h2>
        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or type"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs outline-none transition-colors focus:border-[#12517A] focus:bg-white"
            data-testid="flow-builder-sidebar-search"
          />
        </div>

        <div className="mt-3 flex gap-1.5">
          {FILTERS.map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => onFilterChange(filterOption)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                filter === filterOption
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
              )}
              data-testid={`flow-builder-filter-${filterOption.replace("_", "-")}`}
            >
              {getFilterLabel(filterOption)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto bg-slate-50/50 p-2.5">
        {items.map((item) => {
          const checked = isItemInFlow(item);
          return (
            <button
              key={`${item.kind}-${item.id}`}
              type="button"
              onClick={() => onToggleItem(item)}
              draggable
              onDragStart={(event) => onDragStart(event, item)}
              className="flex w-full cursor-grab items-center justify-between rounded-lg border border-slate-100 bg-white p-2 text-left transition-all duration-150 hover:border-slate-200 hover:bg-slate-50/80 hover:shadow-sm active:cursor-grabbing"
              data-testid={`toggle-flow-item-${item.kind}-${item.id}`}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="h-3.5 w-3.5 rounded border-slate-300 text-[#12517A] focus:ring-[#12517A]"
                  aria-label={`${checked ? "Remove" : "Add"} ${item.name}`}
                />
                <span className="truncate text-[11.5px] font-semibold text-slate-700">{item.name}</span>
              </span>

              <span className={cn("rounded border px-1.5 py-0.5 text-[8.5px] font-bold", getKindClassName(item.kind))}>
                {item.kind.toUpperCase()}
              </span>
            </button>
          );
        })}
        {items.length === 0 && <div className="py-8 text-center text-xs italic text-slate-400">No items matched search criteria.</div>}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-white p-3">
        <span className="text-[11px] font-semibold text-slate-500">{items.length} items</span>
        <Button variant="outline" size="sm" className="h-7 border-slate-200 text-xs text-[#12517A] hover:bg-slate-50" onClick={onOpenDrawer} data-testid="create-flow-library-item">
          <Plus className="mr-1.5 h-3 w-3" />
          Create new
        </Button>
      </div>
    </div>
  );
}
