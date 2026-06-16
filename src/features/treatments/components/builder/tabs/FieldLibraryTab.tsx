import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { CommonSection } from "../../../types";

interface FieldLibraryTabProps {
  sections: CommonSection[];
  onAddItem: (item: {
    kind: "section";
    title: string;
    subtitle: string;
  }) => void;
}

export function FieldLibraryTab({ sections, onAddItem }: FieldLibraryTabProps) {
  return (
    <div className="space-y-3 mt-4">
      {sections.map((section) => (
        <div
          key={section.id}
          onClick={() =>
            onAddItem({
              kind: "section",
              title: section.name,
              subtitle: "Common section fields.",
            })
          }
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-[#12517A] cursor-pointer flex justify-between items-center transition-colors group"
        >
          <div>
            <div className="font-semibold text-slate-900 group-hover:text-[#12517A]">{section.name}</div>
            <div className="text-xs text-slate-500 mt-1">{section.fieldCount} fields mapped</div>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 text-slate-400 group-hover:text-[#12517A]">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
