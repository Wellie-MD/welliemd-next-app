import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CommonSection } from "@/features/treatments/types";

interface SectionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section?: CommonSection | null;
  onEdit: (section: CommonSection) => void;
}

export function SectionDetailsDialog({
  open,
  onOpenChange,
  section,
  onEdit, // not used in simulator
}: SectionDetailsDialogProps) {
  if (!section) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-slate-900 text-white p-6 rounded-2xl shadow-2xl flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[9px] font-bold uppercase text-slate-400">Simulation</span>
          <button onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="text-sm">
          Welcome to the simulator! Here you can test the patient flow for the section: <strong>{section.name}</strong>.
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs bg-slate-800 text-white border-slate-700"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

