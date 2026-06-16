import { Eye, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CustomProgram } from "../../types";
import { FlowItemCard } from "./FlowItemCard";

interface CustomProgramFlowBuilderProps {
  customProgram: CustomProgram;
}

export function CustomProgramFlowBuilder({ customProgram }: CustomProgramFlowBuilderProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-950">{customProgram.name}</div>
            <div className="mt-1 text-sm text-slate-500">
              welliemd.com/start/<code>{customProgram.slug}</code>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add to flow
            </Button>
            <Button size="sm">
              <Save className="mr-2 h-4 w-4" />
              Save Plan
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[320px,1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-slate-950">Items</div>
          <p className="mt-1 text-sm text-slate-500">
            The final UI must include search, All/In-flow/Unused filters, add buttons, and drag handles.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-950">Patient Flow</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Stage View</div>
            </div>
            <Button variant="outline" size="sm">Simulate a patient</Button>
          </div>
          <div className="space-y-3">
            {customProgram.flowItems.map((item) => (
              <FlowItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
