import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FILTERABLE_KIND_ORDER, formatKindLabel } from "@/features/treatments/common/utils/questionList";

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
  const [showEmpty, setShowEmpty] = useState(false);

  const presentTypes = FILTERABLE_KIND_ORDER
    .filter((kind) => (counts[kind] || 0) > 0)
    .sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
  const emptyTypes = FILTERABLE_KIND_ORDER.filter((kind) => !(counts[kind] > 0));

  const pillClass = (active: boolean) =>
    `inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm ${
      active ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
    }`;

  return (
    <div className="p-4 flex flex-wrap items-center gap-4 justify-between rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mr-2">TYPE</span>
        <button onClick={() => onSelectType("all")} className={pillClass(selectedType === "all")}>
          All {counts.all}
        </button>
        {presentTypes.map((kind) => (
          <button key={kind} onClick={() => onSelectType(kind)} className={pillClass(selectedType === kind)}>
            {formatKindLabel(kind)} {counts[kind]}
          </button>
        ))}
        {emptyTypes.length > 0 && (
          showEmpty ? (
            <>
              {emptyTypes.map((kind) => (
                <button key={kind} onClick={() => onSelectType(kind)} className={pillClass(selectedType === kind)}>
                  {formatKindLabel(kind)} 0
                </button>
              ))}
              <button
                onClick={() => setShowEmpty(false)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all bg-white text-slate-400 border border-dashed border-slate-250 hover:bg-slate-50/50"
              >
                Show fewer
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowEmpty(true)}
              title={`${emptyTypes.length} other question types are available`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all bg-white text-slate-400 border border-dashed border-slate-250 hover:bg-slate-50/50"
            >
              + {emptyTypes.length} more types
            </button>
          )
        )}
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
