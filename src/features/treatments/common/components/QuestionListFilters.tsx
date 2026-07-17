import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type Counts = Record<"all" | "single" | "checkout" | "multiple" | "consent" | "number" | "date", number>;

interface QuestionListFiltersProps {
  counts: Counts;
  selectedType: string;
  searchQuery: string;
  onSelectType: (type: string) => void;
  onSearchChange: (query: string) => void;
}

const filters = [
  ["all", "All", "all"],
  ["single", "single", "single"],
  ["checkout", "Checkout", "checkout"],
  ["multiple_choice", "multiple", "multiple"],
  ["consent", "consent", "consent"],
  ["number", "number", "number"],
  ["date", "date", "date"],
] as const;

export function QuestionListFilters({
  counts,
  selectedType,
  searchQuery,
  onSelectType,
  onSearchChange,
}: QuestionListFiltersProps) {
  return (
    <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-4 justify-between bg-white">
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mr-2">TYPE</span>
        {filters.map(([value, label, countKey]) => (
          <button
            key={value}
            onClick={() => onSelectType(value)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm ${
              selectedType === value
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {label} {counts[countKey]}
          </button>
        ))}
        <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all bg-white text-slate-400 border border-dashed border-slate-250 hover:bg-slate-50/50">
          + 23 more types
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search questions, answers, or mapped field"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-9 w-[320px] h-9 text-[13px] bg-white border-slate-200 rounded-lg shadow-sm"
        />
      </div>
    </div>
  );
}
