import { GripVertical, Lock } from "lucide-react";
import type { CustomProgramFlowItem } from "../../types";
import { formatFlowItemKind } from "../../utils/labels";

interface FlowItemCardProps {
  item: CustomProgramFlowItem;
}

export function FlowItemCard({ item }: FlowItemCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <GripVertical className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-950">{item.title}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {formatFlowItemKind(item.kind)}
          </span>
          {item.locked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-2 py-0.5 text-[11px] font-semibold text-white">
              <Lock className="h-3 w-3" />
              Locked
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-slate-500">{item.subtitle}</p>
      </div>
    </div>
  );
}
