import { ReactNode } from "react";
import { Check, Plus, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BuilderCanvasShellProps {
  title: string;
  badge?: string;
  onOpenPreview?: () => void;
  previewText?: string;
  onOpenDrawer?: () => void;
  addText?: string;
  onSave?: () => void;
  saveText?: string;
  children: ReactNode;
  onCanvasDrop?: (event: React.DragEvent) => void;
}

export function BuilderCanvasShell({
  title,
  badge,
  onOpenPreview,
  previewText = "Simulate",
  onOpenDrawer,
  addText = "Add item",
  onSave,
  saveText = "Save",
  children,
  onCanvasDrop,
}: BuilderCanvasShellProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm h-full">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {badge && (
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
              {badge}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {onOpenPreview && (
            <Button variant="outline" size="sm" className="h-8 border-[#0f766e] bg-[#0f766e] text-xs text-white hover:border-[#0f766e] hover:bg-[#0f766e]/90" onClick={onOpenPreview} data-testid="builder-canvas-preview">
              <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
              {previewText}
            </Button>
          )}
          {onOpenDrawer && (
            <Button variant="outline" size="sm" className="h-8 text-xs text-slate-700" onClick={onOpenDrawer} data-testid="builder-canvas-add">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {addText}
            </Button>
          )}
          {onSave && (
            <Button size="sm" className="h-8 bg-[#12517A] text-xs text-white hover:bg-[#12517A]/90" onClick={onSave} data-testid="builder-canvas-save">
              <Check className="mr-1.5 h-3.5 w-3.5" />
              {saveText}
            </Button>
          )}
        </div>
      </div>

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={onCanvasDrop}
        className="flex min-w-0 flex-1 items-center justify-start overflow-auto bg-[#f8fafc] p-6"
      >
        <div className="flex items-center gap-3 py-10 pl-4 pr-10">
          {children}
        </div>
      </div>
    </div>
  );
}
