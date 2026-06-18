import { BuilderCanvasShell } from "@/features/treatments/common/components/builder/BuilderCanvasShell";
import type { QuestionFlowItem } from "../types";
import { QuestionFlowChip } from "./QuestionFlowChip";

interface QuestionFlowCanvasProps {
  items: QuestionFlowItem[];
  onOpenPreview: () => void;
  onSave: () => void;
  onDragStart: (event: React.DragEvent, index: number) => void;
  onDragEnd: (event: React.DragEvent) => void;
  onDropOnArrow: (event: React.DragEvent, afterItemId: string) => void;
  onCanvasDrop: (event: React.DragEvent) => void;
  onDeleteItem: (id: string) => void;
}

function ArrowDropTarget({ afterItemId, onDropOnArrow }: { afterItemId: string; onDropOnArrow: (event: React.DragEvent, afterItemId: string) => void }) {
  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => onDropOnArrow(event, afterItemId)}
      className="relative h-[2px] w-6 shrink-0 cursor-pointer bg-slate-300 transition-all after:absolute after:right-[-2px] after:top-[-3px] after:border-b-[4px] after:border-l-[5px] after:border-t-[4px] after:border-b-transparent after:border-l-slate-300 after:border-t-transparent hover:h-[4px] hover:bg-blue-500"
      title="Drop here to insert"
      data-testid={`flow-arrow-drop-${afterItemId}`}
    />
  );
}



export function QuestionFlowCanvas({
  items,
  onOpenPreview,
  onSave,
  onDragStart,
  onDragEnd,
  onDropOnArrow,
  onCanvasDrop,
  onDeleteItem,
}: QuestionFlowCanvasProps) {
  return (
    <BuilderCanvasShell
      title="Question Sequence"
      badge="Flow View"
      onOpenPreview={onOpenPreview}
      previewText="Simulate a patient"
      onSave={onSave}
      onCanvasDrop={onCanvasDrop}
    >
      {items.map((item, index) => (
        <div key={item.id} className="flex items-center gap-3">
          {index > 0 && <ArrowDropTarget afterItemId={items[index - 1].id} onDropOnArrow={onDropOnArrow} />}
          <QuestionFlowChip
            item={item}
            index={index}
            onDragStart={onDragStart as any}
            onDragEnd={onDragEnd as any}
            onDelete={() => onDeleteItem(item.id)}
          />
        </div>
      ))}
      {items.length > 0 && (
        <div className="flex items-center gap-3">
          <ArrowDropTarget afterItemId={items[items.length - 1].id} onDropOnArrow={onDropOnArrow} />
        </div>
      )}
      {items.length === 0 && (
        <div className="flex flex-1 min-w-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-12 text-center bg-white/50">
          <div className="mb-4 rounded-full bg-slate-100 p-3">
            <span className="text-2xl">📝</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900">No questions yet</h3>
          <p className="mt-1 text-xs text-slate-500">Drag a question type from the sidebar to start building.</p>
        </div>
      )}
    </BuilderCanvasShell>
  );
}
