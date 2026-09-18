import type { CustomProgramFlowItem } from "@/features/treatments/types";
import { FlowCanvasChip, type FlowCanvasItem } from "./FlowCanvasChip";

interface TreatmentTrack {
  treatmentName: string;
  visitTypes: string[];
  items: CustomProgramFlowItem[];
}

interface FlowBuilderCanvasProps {
  flowItems: CustomProgramFlowItem[];
  preFan: FlowCanvasItem[];
  tracks: TreatmentTrack[];
  postFan: FlowCanvasItem[];
  onDragStart: (event: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onDropOnArrow: (event: React.DragEvent, afterItemId: string) => void;
  onCanvasDrop: (event: React.DragEvent) => void;
  onInsertItem: (rawData: string, targetIndex: number) => void;
  getTargetIndexForId: (itemId: string) => number;
  onEditSystemItem?: (item: FlowCanvasItem) => void;
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

function FlowChipChain({
  items,
  flowItems,
  showLeadingArrow,
  onDragStart,
  onDragEnd,
  onDropOnArrow,
  onInsertItem,
  getTargetIndexForId,
  onEditSystemItem,
}: {
  items: FlowCanvasItem[];
  flowItems: CustomProgramFlowItem[];
  showLeadingArrow?: boolean;
  onDragStart: (event: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onDropOnArrow: (event: React.DragEvent, afterItemId: string) => void;
  onInsertItem: (rawData: string, targetIndex: number) => void;
  getTargetIndexForId: (itemId: string) => number;
}) {
  return (
    <>
      {items.map((item, index) => (
        <div key={item.id} className="flex items-center gap-3">
          {(index > 0 || showLeadingArrow) && <ArrowDropTarget afterItemId={items[Math.max(index - 1, 0)]?.id || item.id} onDropOnArrow={onDropOnArrow} />}
          <FlowCanvasChip
            item={item}
            flowItems={flowItems}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onInsertItem={onInsertItem}
            getTargetIndexForId={getTargetIndexForId}
            onEditSystemItem={onEditSystemItem}
          />
        </div>
      ))}
    </>
  );
}

export function FlowBuilderCanvas({
  flowItems,
  preFan,
  tracks,
  postFan,
  onDragStart,
  onDragEnd,
  onDropOnArrow,
  onCanvasDrop,
  onInsertItem,
  getTargetIndexForId,
  onEditSystemItem,
}: FlowBuilderCanvasProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
      <div onDragOver={(event) => event.preventDefault()} onDrop={onCanvasDrop} className="flex min-w-0 flex-1 items-center justify-start overflow-auto bg-[#f8fafc] p-6">
        <div className="flex items-center gap-3 py-10 pl-4 pr-10">
          <FlowChipChain
            items={preFan}
            flowItems={flowItems}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDropOnArrow={onDropOnArrow}
            onInsertItem={onInsertItem}
            getTargetIndexForId={getTargetIndexForId}
            onEditSystemItem={onEditSystemItem}
          />

          {tracks.length > 0 && (
            <div className="flex items-center">
              <div className="relative flex h-full min-h-[40px] w-6 shrink-0 items-center justify-center">
                <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-slate-300" />
                {tracks.length > 1 && <div className="absolute bottom-[54px] right-0 top-[54px] w-[2px] bg-slate-300" />}
              </div>

              <div className="flex flex-col gap-8">
                {tracks.map((track) => (
                  <div key={`${track.treatmentName}-${track.visitTypes.join("-")}`} className="relative flex items-center gap-3">
                    <div className="h-[2px] w-4 shrink-0 bg-slate-300" />
                    <div className="absolute -top-4 left-4 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      <span>{track.treatmentName}</span>
                      {track.visitTypes.map((visitType) => (
                        <span key={visitType} className="rounded border border-slate-200 bg-slate-100 px-1.5 py-px text-[8px] font-bold normal-case text-slate-500">
                          {visitType}
                        </span>
                      ))}
                    </div>

                    <FlowChipChain
                      items={track.items}
                      flowItems={flowItems}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                      onDropOnArrow={onDropOnArrow}
                      onInsertItem={onInsertItem}
                      getTargetIndexForId={getTargetIndexForId}
                      onEditSystemItem={onEditSystemItem}
                    />

                    <div className="h-[2px] w-4 shrink-0 bg-slate-300" />
                  </div>
                ))}
              </div>

              <div className="relative flex h-full min-h-[40px] w-6 shrink-0 items-center justify-center">
                <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-slate-300" />
                {tracks.length > 1 && <div className="absolute bottom-[54px] left-0 top-[54px] w-[2px] bg-slate-300" />}
                <div className="absolute right-[-2px] top-1/2 -translate-y-1/2 border-b-[4px] border-l-[5px] border-t-[4px] border-b-transparent border-l-slate-300 border-t-transparent" />
              </div>
            </div>
          )}

          {tracks.length === 0 && preFan.length > 0 && <ArrowDropTarget afterItemId={preFan[preFan.length - 1].id} onDropOnArrow={onDropOnArrow} />}

          <FlowChipChain
            items={postFan}
            flowItems={flowItems}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDropOnArrow={onDropOnArrow}
            onInsertItem={onInsertItem}
            getTargetIndexForId={getTargetIndexForId}
            onEditSystemItem={onEditSystemItem}
          />
        </div>
      </div>
    </div>
  );
}
