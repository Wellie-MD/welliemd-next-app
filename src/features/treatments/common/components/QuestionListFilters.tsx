import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-medium uppercase tracking-wider text-gray-500">Type</span>
        <Button variant={selectedType === "all" ? "default" : "outline"} size="sm" onClick={() => onSelectType("all")}>
          All {counts.all}
        </Button>
        {presentTypes.map((kind) => (
          <Button
            key={kind}
            variant={selectedType === kind ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectType(kind)}
          >
            {formatKindLabel(kind)} {counts[kind]}
          </Button>
        ))}
        {emptyTypes.length > 0 && (
          showEmpty ? (
            <>
              {emptyTypes.map((kind) => (
                <Button
                  key={kind}
                  variant={selectedType === kind ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSelectType(kind)}
                >
                  {formatKindLabel(kind)} 0
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={() => setShowEmpty(false)}>
                Show fewer
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmpty(true)}
              title={`${emptyTypes.length} other question types are available`}
            >
              + {emptyTypes.length} more types
            </Button>
          )
        )}
      </div>
      <div className="relative max-w-xl">
        <Input
          placeholder="Search questions, answers, or mapped field"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pr-9"
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={() => onSearchChange("")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
