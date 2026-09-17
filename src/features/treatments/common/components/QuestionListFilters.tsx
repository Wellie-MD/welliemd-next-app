import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  PROGRAM_AUTHORING_COPY,
  PROGRAM_QUESTION_KIND_LABELS,
  PROGRAM_QUESTION_KIND_ORDER,
} from "@/features/treatments/programs/programAuthoringConstants";

interface QuestionListFiltersProps {
  counts: Record<string, number>;
  selectedType: string;
  searchQuery: string;
  onSelectType: (type: string) => void;
  onSearchChange: (query: string) => void;
}

export function QuestionListFilters({
  counts,
  selectedType,
  searchQuery,
  onSelectType,
  onSearchChange,
}: QuestionListFiltersProps) {
  const [showEmptyTypes, setShowEmptyTypes] = useState(false);
  const { presentTypes, emptyTypes } = useMemo(() => {
    const present = PROGRAM_QUESTION_KIND_ORDER
      .filter((kind) => (counts[kind] || 0) > 0)
      .sort((left, right) => (counts[right] || 0) - (counts[left] || 0));
    return {
      presentTypes: present,
      emptyTypes: PROGRAM_QUESTION_KIND_ORDER.filter((kind) => (counts[kind] || 0) === 0),
    };
  }, [counts]);
  const visibleTypes = showEmptyTypes ? [...presentTypes, ...emptyTypes] : presentTypes;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-[10px] border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
      <span className="mr-1 shrink-0 text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-400">TYPE</span>
      <button
        onClick={() => onSelectType("all")}
        className={`inline-flex h-7 items-center gap-1.5 rounded-md border px-3 text-[11px] font-semibold transition-colors ${selectedType === "all" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
      >
        All <span className={`rounded-full px-1.5 text-[10px] ${selectedType === "all" ? "bg-white/20" : "bg-slate-200/70"}`}>{counts.all || 0}</span>
      </button>
      <span className="mx-1 h-5 w-px bg-slate-200" />
      {visibleTypes.map((kind) => (
        <button
          key={kind}
          onClick={() => onSelectType(selectedType === kind ? "all" : kind)}
          className={`inline-flex h-7 items-center gap-1.5 rounded-md border px-3 text-[11px] font-semibold transition-colors ${selectedType === kind ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/50"}`}
        >
          {PROGRAM_QUESTION_KIND_LABELS[kind]}
          <span className={`rounded-full px-1.5 text-[10px] ${selectedType === kind ? "bg-white/20" : "bg-slate-100"}`}>{counts[kind] || 0}</span>
        </button>
      ))}
      {emptyTypes.length > 0 && (
        <button
          onClick={() => setShowEmptyTypes((current) => !current)}
          className="inline-flex h-7 items-center rounded-md border border-dashed border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-400 transition-colors hover:border-blue-300 hover:text-blue-600"
        >
          {showEmptyTypes ? "Show fewer" : `+ ${emptyTypes.length} more types`}
        </button>
      )}
      <div className="relative w-full shrink-0 sm:w-[300px]">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
        <Input
          placeholder={PROGRAM_AUTHORING_COPY.searchPlaceholder}
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-8 w-full rounded-md border-slate-200 bg-white pl-9 pr-8 text-[12px] shadow-none"
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            onClick={() => onSearchChange("")}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
