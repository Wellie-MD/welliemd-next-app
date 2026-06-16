import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConsentForm, Program, CommonSection } from "../../types";

interface AddToFlowDrawerStubProps {
  programs: Program[];
  sections: CommonSection[];
  consents: ConsentForm[];
}

export function AddToFlowDrawerStub({ programs, sections, consents }: AddToFlowDrawerStubProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
      <div className="text-sm font-semibold text-slate-950">Add to flow drawer contract</div>
      <p className="mt-1 text-sm text-slate-500">
        Implement as a right-side drawer with tabs: Section Fields, Custom Question, Programs, Consent, Checkout.
      </p>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <DrawerColumn title="Programs" count={programs.length} items={programs.map((program) => program.name)} />
        <DrawerColumn title="Sections" count={sections.length} items={sections.map((section) => section.name)} />
        <DrawerColumn title="Consents" count={consents.length} items={consents.map((consent) => consent.name)} />
      </div>
      <Button className="mt-4" size="sm">
        <Plus className="mr-2 h-4 w-4" />
        Add Checkout Item
      </Button>
    </div>
  );
}

function DrawerColumn({ title, count, items }: { title: string; count: number; items: string[] }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span>{title}</span>
        <span>{count}</span>
      </div>
      <div className="space-y-2">
        {items.slice(0, 4).map((item) => (
          <div key={item} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
