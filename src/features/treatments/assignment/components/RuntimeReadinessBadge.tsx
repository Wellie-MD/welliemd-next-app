import {
  RUNTIME_STATE,
  RUNTIME_STATE_DESCRIPTIONS,
  RUNTIME_STATE_LABELS,
} from "@/features/treatments/assignment/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function RuntimeReadinessBadge({ state }: { state?: string }) {
  if (!state) return null;
  const ready = state === RUNTIME_STATE.ready;
  const pending = state === RUNTIME_STATE.pending;
  const label = RUNTIME_STATE_LABELS[state] || state.replaceAll("_", " ");
  const description =
    RUNTIME_STATE_DESCRIPTIONS[state] ||
    "Runtime readiness state reported by the treatment assignment service.";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          aria-label={`${label}. ${description}`}
          className={`inline-flex cursor-help rounded-full border px-2 py-0.5 text-[10px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            ready
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : pending
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed">
        <p className="font-semibold">{label}</p>
        <p className="mt-1">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
