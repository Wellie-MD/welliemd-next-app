import { Link } from "react-router-dom";
import { Eye, GitBranch, Pencil, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CustomProgram } from "../../types";
import { StatusPill } from "../common";

interface CustomProgramCardProps {
  customProgram: CustomProgram;
  onEdit?: (program: CustomProgram) => void;
  onDelete?: (id: string) => void;
}

export function CustomProgramCard({ customProgram, onEdit, onDelete }: CustomProgramCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm group hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-950">{customProgram.name}</h3>
            <StatusPill tone={customProgram.status === "published" ? "green" : "yellow"}>
              {customProgram.status}
            </StatusPill>
          </div>
          <p className="mt-1 text-xs leading-6 text-slate-500">{customProgram.description}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 text-xs text-slate-600 grid-cols-4">
        <div className="rounded-lg bg-slate-50 p-2 text-center">
          <div className="text-[10px] uppercase text-slate-400">Programs</div>
          <div className="font-semibold mt-0.5">{customProgram.includedProgramIds.length}</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-2 text-center">
          <div className="text-[10px] uppercase text-slate-400">Sections</div>
          <div className="font-semibold mt-0.5">{customProgram.sectionIds.length}</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-2 text-center">
          <div className="text-[10px] uppercase text-slate-400">Consents</div>
          <div className="font-semibold mt-0.5">{customProgram.consentIds.length}</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-2 text-center">
          <div className="text-[10px] uppercase text-slate-400">Checkout</div>
          <div className="font-semibold mt-0.5">{customProgram.checkoutOptions.length}</div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2 pt-2 border-t border-slate-100">
        <Button asChild size="sm" className="bg-[#12517A] text-white hover:bg-[#12517A]/90">
          <Link to={`/dashboard/treatments/custom-programs/${customProgram.id}/builder`}>
            <GitBranch className="mr-2 h-4 w-4" />
            Builder
          </Link>
        </Button>
        {onEdit && (
          <Button variant="outline" size="sm" onClick={() => onEdit(customProgram)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
        {onDelete && (
          <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => onDelete(customProgram.id)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
