import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSections } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { LayoutTemplate, Loader2, Sparkles } from "lucide-react";
import type { CommonSection } from "@/features/treatments/types";

interface SectionSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (section: CommonSection) => void;
}

export function SectionSelectorModal({ open, onOpenChange, onSelect }: SectionSelectorModalProps) {
  const { data: sections = [], isLoading } = useSections();
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");

  const handleSelect = () => {
    const selected = sections.find((s) => s.id === selectedSectionId);
    if (selected) {
      onSelect(selected);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <LayoutTemplate className="h-5 w-5" />
            <DialogTitle className="text-base font-bold text-slate-900">
              Attach Common Section
            </DialogTitle>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Choose a pre-defined, reusable Common Section to insert. Common Sections contain pre-configured clinical fields (like Demographic Baseline or Medical History) and automatically keep their data updated across different programs.
          </p>
        </DialogHeader>

        <div className="py-4 min-h-[160px] flex flex-col justify-center">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center text-xs text-slate-400 italic">No common sections available.</div>
          ) : (
            <div className="space-y-2">
              {sections.map((section) => (
                <div
                  key={section.id}
                  onClick={() => setSelectedSectionId(section.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedSectionId === section.id
                      ? "border-blue-500 bg-blue-50/50 shadow-sm"
                      : "border-slate-100 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-800">{section.name}</span>
                    <span className="text-[10px] text-slate-400">
                      Scope: <span className="capitalize font-semibold text-slate-500">{section.scope}</span> · {section.fieldCount} fields
                    </span>
                  </div>
                  {section.scope === "global" && (
                    <span className="flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-800">
                      <Sparkles className="h-2.5 w-2.5" />
                      Global
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-slate-100 pt-4 flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs font-semibold border-slate-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!selectedSectionId}
            className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            Attach Section
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
