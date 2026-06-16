import { GripVertical, Lock, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CustomProgramFlowItem } from "../../types";
import { formatFlowItemKind } from "../../utils/labels";

interface FlowItemCardProps {
  item: CustomProgramFlowItem;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function FlowItemCard({
  item,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
}: FlowItemCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm group hover:border-slate-300 transition-colors">
      <div className="text-slate-300 cursor-grab hover:text-slate-500">
        <GripVertical className="h-4 w-4 shrink-0" />
      </div>
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
        <p className="mt-1 text-xs text-slate-500">{item.subtitle}</p>
      </div>

      {!item.locked && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-slate-900 disabled:opacity-30"
            disabled={isFirst}
            onClick={onMoveUp}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-slate-900 disabled:opacity-30"
            disabled={isLast}
            onClick={onMoveDown}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
