import { CheckCircle2, Lock } from "lucide-react";
import type { CustomProgramFlowItem } from "@/features/treatments/types";
import { FlowItemCard } from "../cards/FlowItemCard";

interface FlowBuilderListViewProps {
  flowItems: CustomProgramFlowItem[];
  onDeleteItem: (index: number) => void;
  onMoveItem: (index: number, direction: "up" | "down") => void;
  onDragStart: (event: React.DragEvent, index: number) => void;
  onDragOver: (event: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onDrop: (event: React.DragEvent, targetIndex: number) => void;
}

export function FlowBuilderListView({
  flowItems,
  onDeleteItem,
  onMoveItem,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: FlowBuilderListViewProps) {
  return (
    <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />
          <div className="text-sm font-semibold uppercase tracking-wider text-slate-500">Patient flow</div>
          <div className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">{flowItems.length} items</div>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="space-y-3">
          {flowItems.map((item, index) => (
            <FlowItemCard
              key={item.id}
              item={item}
              onDelete={() => onDeleteItem(index)}
              onMoveUp={() => onMoveItem(index, "up")}
              onMoveDown={() => onMoveItem(index, "down")}
              isFirst={index === 0 || flowItems[index - 1]?.locked}
              isLast={index === flowItems.length - 1 || flowItems[index + 1]?.locked}
              draggable={!item.locked}
              onDragStart={(event) => onDragStart(event, index)}
              onDragOver={(event) => onDragOver(event, index)}
              onDragEnd={onDragEnd}
              onDrop={(event) => onDrop(event, index)}
            />
          ))}
        </div>

        {!flowItems.some((item) => item.kind === "checkout") && (
          <>
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <div className="text-sm font-semibold uppercase tracking-wider text-slate-500">End of flow</div>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 opacity-80 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Checkout</h3>
                  <div className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    <Lock className="h-3 w-3" /> Locked
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Patient confirms routed product, selects subscription length, completes payment. System exit point — can't be reordered.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
