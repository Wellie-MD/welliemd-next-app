import { ArrowDownAZ, Check, Clock, Filter, LayoutGrid, List as ListIcon, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { TreatmentType } from "@/features/treatments/types";

export type ProgramsViewMode = "cards" | "list";
export type ProgramTabFilter = "all" | "intake" | "follow_up" | "missing_follow_up";
export type ProgramStatusFilter = "all" | "draft" | "published";

interface ProgramsFiltersProps {
  activeTab: ProgramTabFilter;
  searchQuery: string;
  sortBy: "alpha" | "recent";
  selectedStatus: ProgramStatusFilter;
  selectedTreatment: string;
  treatmentTypes: TreatmentType[];
  viewMode: ProgramsViewMode;
  onActiveTabChange: (value: ProgramTabFilter) => void;
  onSearchChange: (value: string) => void;
  onSortChange: (value: "alpha" | "recent") => void;
  onStatusChange: (value: ProgramStatusFilter) => void;
  onTreatmentChange: (value: string) => void;
  onViewModeChange: (value: ProgramsViewMode) => void;
}

const tabs: Array<[ProgramTabFilter, string]> = [
  ["all", "All Programs"],
  ["intake", "Intake Programs"],
  ["follow_up", "Follow-up Programs"],
  ["missing_follow_up", "Missing Follow-up"],
];

export function ProgramsFilters(props: ProgramsFiltersProps) {
  const activeFilterCount = Number(props.selectedStatus !== "all") + Number(props.selectedTreatment !== "all");
  return (
    <>
      <div className="flex bg-slate-100/70 p-1 rounded-xl self-start mb-4 border border-slate-100">
        {tabs.map(([value, label]) => (
          <button key={value} onClick={() => props.onActiveTabChange(value)} className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${props.activeTab === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input placeholder="Search programs..." value={props.searchQuery} onChange={(event) => props.onSearchChange(event.target.value)} className="pl-9 w-[260px] h-9 text-xs bg-white border-slate-200 rounded-lg shadow-sm" />
          </div>
          <Button variant="outline" onClick={() => props.onSortChange("alpha")} className={`h-9 px-3 text-xs font-semibold rounded-lg shadow-sm ${props.sortBy === "alpha" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
            <ArrowDownAZ className="mr-1.5 h-4 w-4" />Sort A&rarr;Z
          </Button>
          <Button variant="outline" onClick={() => props.onSortChange("recent")} className={`h-9 px-3 text-xs font-semibold rounded-lg shadow-sm ${props.sortBy === "recent" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
            <Clock className="mr-1.5 h-4 w-4" />Recently updated
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className={`h-9 px-3 text-xs font-semibold rounded-lg shadow-sm ${activeFilterCount ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                <Filter className="mr-1.5 h-4 w-4" />Filters
                {activeFilterCount > 0 && <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">{activeFilterCount}</Badge>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-3">
              <FilterOptions label="Status" options={[["all", "All Statuses"], ["published", "Published"], ["draft", "Draft"]]} selected={props.selectedStatus} onSelect={(value) => props.onStatusChange(value as ProgramStatusFilter)} />
              <div className="h-px bg-slate-100 my-2" />
              <FilterOptions label="Treatment Type" options={[["all", "All Treatment Types"], ...props.treatmentTypes.map((type) => [type.key, type.name] as [string, string])]} selected={props.selectedTreatment} onSelect={props.onTreatmentChange} scrollable />
              {activeFilterCount > 0 && <button onClick={() => { props.onStatusChange("all"); props.onTreatmentChange("all"); }} className="mt-3 w-full text-right text-[10px] font-semibold text-blue-600 hover:underline">Reset Filters</button>}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => props.onViewModeChange(props.viewMode === "cards" ? "list" : "cards")} className="h-9 px-3 text-xs font-semibold bg-white text-slate-600 border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm" data-testid="programs-view-toggle" aria-pressed={props.viewMode === "list"}>
            {props.viewMode === "cards" ? <><ListIcon className="mr-1.5 h-4 w-4" />List view</> : <><LayoutGrid className="mr-1.5 h-4 w-4" />Card view</>}
          </Button>
        </div>
      </div>
    </>
  );
}

function FilterOptions({ label, options, selected, onSelect, scrollable = false }: { label: string; options: Array<[string, string]>; selected: string; onSelect: (value: string) => void; scrollable?: boolean }) {
  return <div><div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1.5 px-1">{label}</div><div className={`space-y-0.5 ${scrollable ? "max-h-48 overflow-y-auto" : ""}`}>{options.map(([value, optionLabel]) => <button key={value} onClick={() => onSelect(value)} className={`w-full text-left px-3 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${selected === value ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-50"}`}><span>{optionLabel}</span>{selected === value && <Check className="h-3.5 w-3.5 text-blue-600" />}</button>)}</div></div>;
}
