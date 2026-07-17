import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QuestionFlowItem } from "../types";

interface QuestionFlowCardProps {
  item: QuestionFlowItem;
  index: number;
  onDragStart: (event: React.DragEvent, index: number) => void;
  onDragEnd: (event: React.DragEvent) => void;
  onDelete: (id: string) => void;
}

export function QuestionFlowCard({ item, index, onDragStart, onDragEnd, onDelete }: QuestionFlowCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragEnd={onDragEnd}
      className="group relative flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-[#12517A] hover:shadow-md cursor-grab active:cursor-grabbing w-full max-w-2xl"
      data-testid={`question-card-${item.id}`}
    >
      <div className="flex h-full items-center text-slate-300 group-hover:text-[#12517A]">
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="flex flex-1 flex-col justify-center min-w-0">
        <div className="flex items-center gap-2">
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {item.kind.replace("_", " ")}
          </span>
          {item.required && (
            <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 uppercase tracking-wider">
              Required
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-sm font-semibold text-slate-900">{item.text || "Untitled Question"}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600" onClick={() => onDelete(item.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
