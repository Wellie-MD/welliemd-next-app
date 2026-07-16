import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const US_STATES = [
  { abbr: "AL", name: "Alabama" },
  { abbr: "AK", name: "Alaska" },
  { abbr: "AZ", name: "Arizona" },
  { abbr: "AR", name: "Arkansas" },
  { abbr: "CA", name: "California" },
  { abbr: "CO", name: "Colorado" },
  { abbr: "CT", name: "Connecticut" },
  { abbr: "DE", name: "Delaware" },
  { abbr: "FL", name: "Florida" },
  { abbr: "GA", name: "Georgia" },
  { abbr: "HI", name: "Hawaii" },
  { abbr: "ID", name: "Idaho" },
  { abbr: "IL", name: "Illinois" },
  { abbr: "IN", name: "Indiana" },
  { abbr: "IA", name: "Iowa" },
  { abbr: "KS", name: "Kansas" },
  { abbr: "KY", name: "Kentucky" },
  { abbr: "LA", name: "Louisiana" },
  { abbr: "ME", name: "Maine" },
  { abbr: "MD", name: "Maryland" },
  { abbr: "MA", name: "Massachusetts" },
  { abbr: "MI", name: "Michigan" },
  { abbr: "MN", name: "Minnesota" },
  { abbr: "MS", name: "Mississippi" },
  { abbr: "MO", name: "Missouri" },
  { abbr: "MT", name: "Montana" },
  { abbr: "NE", name: "Nebraska" },
  { abbr: "NV", name: "Nevada" },
  { abbr: "NH", name: "New Hampshire" },
  { abbr: "NJ", name: "New Jersey" },
  { abbr: "NM", name: "New Mexico" },
  { abbr: "NY", name: "New York" },
  { abbr: "NC", name: "North Carolina" },
  { abbr: "ND", name: "North Dakota" },
  { abbr: "OH", name: "Ohio" },
  { abbr: "OK", name: "Oklahoma" },
  { abbr: "OR", name: "Oregon" },
  { abbr: "PA", name: "Pennsylvania" },
  { abbr: "RI", name: "Rhode Island" },
  { abbr: "SC", name: "South Carolina" },
  { abbr: "SD", name: "South Dakota" },
  { abbr: "TN", name: "Tennessee" },
  { abbr: "TX", name: "Texas" },
  { abbr: "UT", name: "Utah" },
  { abbr: "VT", name: "Vermont" },
  { abbr: "VA", name: "Virginia" },
  { abbr: "WA", name: "Washington" },
  { abbr: "WV", name: "West Virginia" },
  { abbr: "WI", name: "Wisconsin" },
  { abbr: "WY", name: "Wyoming" },
  { abbr: "DC", name: "District of Columbia" },
  { abbr: "PR", name: "Puerto Rico" },
];

const TOTAL_STATES = US_STATES.length;

interface ServiceStatesSelectorProps {
  value: string[];
  onChange: (states: string[]) => void;
  label?: string;
  description?: string;
  className?: string;
}

export function ServiceStatesSelector({
  value,
  onChange,
  label = "Service States",
  description = "States where this program is offered to patients. Leave empty to offer in all states.",
  className,
}: ServiceStatesSelectorProps) {
  const selectedCount = value.length;

  const toggleState = (abbr: string) => {
    if (value.includes(abbr)) {
      onChange(value.filter((s) => s !== abbr));
    } else {
      onChange([...value, abbr]);
    }
  };

  const selectAll = () => onChange(US_STATES.map((s) => s.abbr));
  const clearAll = () => onChange([]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("space-y-3", className)}>
        {/* Header with actions */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <label className="text-xs font-bold text-slate-800">{label}</label>
            <p className="text-[10px] text-slate-400 leading-normal mt-1">
              {description}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selectAll}
              className="h-8 px-3 text-xs font-semibold"
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-8 px-3 text-xs font-semibold"
            >
              Clear All
            </Button>
          </div>
        </div>

        {/* Status banner */}
        {selectedCount === 0 ? (
          <div className="flex items-start gap-2.5 px-3.5 py-2.5 bg-amber-50 border border-amber-200/80 rounded-lg text-amber-900 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="font-medium">
              No states selected —{" "}
              <span className="font-bold text-amber-950">
                this program will be offered in ALL states.
              </span>
            </p>
          </div>
        ) : selectedCount === TOTAL_STATES ? (
          <div className="flex items-start gap-2.5 px-3.5 py-2.5 bg-emerald-50 border border-emerald-200/80 rounded-lg text-emerald-900 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="font-medium">
              All {TOTAL_STATES} regions selected —{" "}
              <span className="font-bold text-emerald-950">
                this program will be offered nationwide.
              </span>
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 px-3.5 py-2.5 bg-indigo-50 border border-indigo-200/80 rounded-lg text-indigo-900 text-xs">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="font-medium">
              <span className="font-bold text-indigo-950">
                {selectedCount} state{selectedCount > 1 ? "s" : ""} selected
              </span>{" "}
              — program will be restricted to selected service areas.
            </p>
          </div>
        )}

        {/* State grid */}
        <div className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-lg">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-11 gap-2">
            {US_STATES.map((state) => {
              const isSelected = value.includes(state.abbr);
              return (
                <Tooltip key={state.abbr}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => toggleState(state.abbr)}
                      className={cn(
                        "h-9 flex items-center justify-center text-xs font-semibold rounded-md border transition-all cursor-pointer select-none",
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                      )}
                    >
                      {state.abbr}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {state.name}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Footer count */}
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>
            Click any state block to toggle selection. Hover to see full state
            name.
          </span>
          <span className="font-medium text-slate-500">
            {selectedCount} active of {TOTAL_STATES}
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}
