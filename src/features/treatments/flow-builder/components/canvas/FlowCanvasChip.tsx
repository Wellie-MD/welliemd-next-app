import { CheckCircle2, FileText, GitBranch, LayoutGrid, Lock, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CustomProgramFlowItem } from "@/features/treatments/types";

export interface FlowCanvasItem {
  id: string;
  kind: string;
  title: string;
  subtitle?: string;
  isSystem?: boolean;
  isStart?: boolean;
  isEnd?: boolean;
}

interface FlowCanvasChipProps {
  item: FlowCanvasItem;
  flowItems: CustomProgramFlowItem[];
  onDragStart: (event: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onInsertItem: (rawData: string, targetIndex: number) => void;
  getTargetIndexForId: (itemId: string) => number;
  onEditSystemItem?: (item: FlowCanvasItem) => void;
}

function getChipPresentation(item: FlowCanvasItem) {
  if (item.isStart || item.isEnd) {
    return {
      className: "bg-slate-900 border-slate-900 text-white",
      typeLabel: "System",
      icon: <Play className="h-3 w-3 text-slate-400" />,
    };
  }
  if (item.isSystem) {
    return {
      className: "bg-slate-50 border-slate-200 border-dashed text-slate-700",
      typeLabel: "System",
      icon: <Lock className="h-3 w-3 text-slate-400" />,
    };
  }
  if (item.kind === "section") {
    return {
      className: "bg-sky-50 border-sky-200 text-sky-900",
      typeLabel: "Section",
      icon: <LayoutGrid className="h-3 w-3 text-sky-400" />,
    };
  }
  if (item.kind === "program") {
    return {
      className: "bg-emerald-50 border-emerald-200 text-emerald-900",
      typeLabel: "Program",
      icon: <CheckCircle2 className="h-3 w-3 text-emerald-400" />,
    };
  }
  if (item.kind === "consent") {
    return {
      className: "bg-purple-50 border-purple-200 text-purple-900",
      typeLabel: "Consent",
      icon: <FileText className="h-3 w-3 text-purple-400" />,
    };
  }
  if (item.kind === "routing_question") {
    return {
      className: "bg-orange-50 border-orange-200 text-orange-900",
      typeLabel: "Routing",
      icon: <GitBranch className="h-3 w-3 text-orange-400" />,
    };
  }
  return {
    className: "bg-white border-slate-200 text-slate-900",
    typeLabel: "Item",
    icon: <CheckCircle2 className="h-3 w-3" />,
  };
}

export function FlowCanvasChip({ item, flowItems, onDragStart, onDragEnd, onInsertItem, getTargetIndexForId, onEditSystemItem }: FlowCanvasChipProps) {
  const isDraggable = !item.isSystem && !item.isStart && !item.isEnd;
  const realIndex = flowItems.findIndex((flowItem) => flowItem.id === item.id);
  const presentation = getChipPresentation(item);

  return (
    <div
      className={cn(
        "flex min-h-[76px] w-[160px] shrink-0 flex-col justify-between gap-1.5 rounded-xl border p-3 shadow-sm transition-all duration-150",
        presentation.className,
        isDraggable && "cursor-grab select-none hover:border-slate-400 hover:shadow-md active:cursor-grabbing"
      )}
      draggable={isDraggable}
      onDragStart={(event) => {
        if (realIndex !== -1) onDragStart(event, realIndex);
        else event.preventDefault();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.stopPropagation();
        const rawData = event.dataTransfer.getData("text/plain");
        if (rawData) onInsertItem(rawData, getTargetIndexForId(item.id));
      }}
      data-testid={`flow-canvas-chip-${item.id}`}
    >
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider opacity-85">
        {presentation.icon}
        <span>{presentation.typeLabel}</span>
        {(item.id === "sys-matched" || item.kind === "routing_question") && <button type="button" className="ml-auto rounded border border-blue-200 bg-white px-1.5 py-0.5 text-[8px] text-blue-700" onClick={(event) => { event.stopPropagation(); onEditSystemItem?.(item); }}>Edit</button>}
      </div>
      <div className="line-clamp-2 text-[11.5px] font-bold leading-snug">{item.title}</div>
      <div className="truncate text-[9.5px] leading-none opacity-65">{item.subtitle}</div>
    </div>
  );
}
