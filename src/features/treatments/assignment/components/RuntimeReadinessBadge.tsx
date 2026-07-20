import {
  RUNTIME_STATE,
  RUNTIME_STATE_LABELS,
} from "@/features/treatments/assignment/constants";

export function RuntimeReadinessBadge({ state }: { state?: string }) {
  if (!state) return null;
  const ready = state === RUNTIME_STATE.ready;
  const pending = state === RUNTIME_STATE.pending;
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
        ready
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : pending
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {RUNTIME_STATE_LABELS[state] || state.replaceAll("_", " ")}
    </span>
  );
}
