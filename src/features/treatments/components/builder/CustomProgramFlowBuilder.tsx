import { useState } from "react";
import { Eye, Plus, Save, List as ListIcon, LayoutGrid, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CustomProgram, CustomProgramFlowItem } from "../../types";
import { FlowItemCard } from "./FlowItemCard";
import { PatientFlowTestModal } from "./PatientFlowTestModal";
import { usePrograms, useSections, useConsents } from "../../hooks/useTreatmentLibraries";

interface CustomProgramFlowBuilderProps {
  customProgram: CustomProgram;
  onOpenDrawer?: () => void;
  onSave?: (updated: CustomProgram) => void;
  onUpdateFlow?: (updatedItems: CustomProgramFlowItem[]) => void;
}

export function CustomProgramFlowBuilder({
  customProgram,
  onOpenDrawer,
  onSave,
  onUpdateFlow,
}: CustomProgramFlowBuilderProps) {
  const [viewMode, setViewMode] = useState<"list" | "flow">("list");
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // Fetch lists for Flow view sidebar
  const { data: programs = [] } = usePrograms();
  const { data: sections = [] } = useSections();
  const { data: consents = [] } = useConsents();

  const handleMoveItem = (index: number, direction: "up" | "down") => {
    if (!onUpdateFlow) return;
    const items = [...customProgram.flowItems];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    // Swap
    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;

    onUpdateFlow(items);
  };

  const handleDeleteItem = (index: number) => {
    if (!onUpdateFlow) return;
    const items = [...customProgram.flowItems];
    items.splice(index, 1);
    onUpdateFlow(items);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(customProgram);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shrink-0">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">{customProgram.name}</h1>
            </div>
            <div className="mt-2 flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1 text-slate-600 border border-slate-200">
                <span className="text-slate-400">welliemd.com/start/</span>
                <span className="font-semibold text-slate-900">{customProgram.slug}</span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs">Edit</Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsTestModalOpen(true)}>
                <Eye className="h-3.5 w-3.5"/>
              </Button>
            </div>
            <p className="mt-3 text-xs text-slate-500 max-w-2xl">
              Drag any item to reorder. Add new items anywhere from the side panel. Authentication and Checkout are locked in place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:justify-end">
            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "list" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <ListIcon className="mr-2 h-4 w-4" />
                List
              </button>
              <button
                onClick={() => setViewMode("flow")}
                className={`flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "flow" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Flow
              </button>
            </div>
            <Button
              variant="secondary"
              className="bg-[#12517A] text-white hover:bg-[#12517A]/90"
              onClick={onOpenDrawer}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add to flow
            </Button>
            <Button variant="outline" onClick={() => setIsTestModalOpen(true)}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button onClick={handleSave} className="bg-[#12517A] text-white hover:bg-[#12517A]/90">
              <Save className="mr-2 h-4 w-4" />
              Save Plan
            </Button>
          </div>
        </div>
      </div>

      <PatientFlowTestModal open={isTestModalOpen} onOpenChange={setIsTestModalOpen} />

      {viewMode === "list" && (
        <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-6 overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-200"></div>
              <div className="text-sm font-semibold uppercase tracking-wider text-slate-500">Patient flow</div>
              <div className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                {customProgram.flowItems.length} items
              </div>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            <div className="space-y-3">
              {customProgram.flowItems.map((item, index) => (
                <FlowItemCard
                  key={item.id}
                  item={item}
                  onDelete={() => handleDeleteItem(index)}
                  onMoveUp={() => handleMoveItem(index, "up")}
                  onMoveDown={() => handleMoveItem(index, "down")}
                  isFirst={index === 0 || customProgram.flowItems[index - 1]?.locked}
                  isLast={index === customProgram.flowItems.length - 1 || customProgram.flowItems[index + 1]?.locked}
                />
              ))}
            </div>

            {!customProgram.flowItems.some((item) => item.kind === "checkout") && (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-slate-200"></div>
                  <div className="text-sm font-semibold uppercase tracking-wider text-slate-500">End of flow</div>
                  <div className="flex-1 h-px bg-slate-200"></div>
                </div>

                <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm opacity-80">
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
      )}

      {viewMode === "flow" && (
        <div className="flex-1 grid grid-cols-[300px_1fr] gap-4 min-h-[500px] overflow-hidden">
          {/* Left Sidebar: Available Modules */}
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 text-sm">Flow Modules</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Programs</span>
                <div className="space-y-1.5">
                  {programs.map((p) => (
                    <div key={p.id} className="p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-xs font-semibold text-slate-700">
                      {p.name}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Sections</span>
                <div className="space-y-1.5">
                  {sections.map((s) => (
                    <div key={s.id} className="p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-xs font-semibold text-slate-700">
                      {s.name}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Consents</span>
                <div className="space-y-1.5">
                  {consents.map((c) => (
                    <div key={c.id} className="p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-xs font-semibold text-slate-700">
                      {c.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <span className="text-xs font-medium text-slate-600">
                {programs.length + sections.length + consents.length} total items
              </span>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onOpenDrawer}>Add more</Button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 shadow-sm overflow-hidden">
             <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-3">
                   <h2 className="font-semibold text-slate-900 text-sm">Patient Flow Canvas</h2>
                   <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-600">Visual</span>
                </div>
                <div className="flex gap-2">
                   <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setIsTestModalOpen(true)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Simulate flow
                   </Button>
                   <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onOpenDrawer}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add item
                   </Button>
                </div>
             </div>
             <div className="flex-1 p-6 overflow-auto">
                <div className="flex justify-center mt-10">
                   <div className="text-center text-slate-400 border border-dashed border-slate-300 rounded-xl p-10 bg-white w-full max-w-2xl">
                      <div className="font-semibold text-slate-700 text-sm mb-3">Intake Sequence Canvas</div>
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <div className="p-3 border rounded bg-white text-xs font-bold">Authentication</div>
                        <div className="text-slate-400">→</div>
                        {customProgram.flowItems.filter(item => !item.locked).map(item => (
                          <div key={item.id} className="flex items-center gap-2">
                            <div className="p-3 border rounded bg-white text-xs font-semibold">{item.title}</div>
                            <div className="text-slate-400">→</div>
                          </div>
                        ))}
                        <div className="p-3 border rounded bg-white text-xs font-bold">Checkout</div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
