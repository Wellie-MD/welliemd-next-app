import { Link } from "react-router-dom";
import { Eye, GitBranch, Pencil, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CustomProgram } from "../../types";
import { StatusPill } from "../common";

interface CustomProgramCardProps {
  customProgram: CustomProgram;
}

export function CustomProgramCard({ customProgram }: CustomProgramCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-950">{customProgram.name}</h3>
            <StatusPill tone={customProgram.status === "published" ? "green" : "yellow"}>
              {customProgram.status}
            </StatusPill>
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-500">{customProgram.description}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-4">
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-xs uppercase text-slate-400">Programs</div>
          <div className="font-semibold">{customProgram.includedProgramIds.length}</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-xs uppercase text-slate-400">Sections</div>
          <div className="font-semibold">{customProgram.sectionIds.length}</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-xs uppercase text-slate-400">Consents</div>
          <div className="font-semibold">{customProgram.consentIds.length}</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-xs uppercase text-slate-400">Checkout options</div>
          <div className="font-semibold">{customProgram.checkoutOptions.length}</div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link to={`/dashboard/treatments/custom-programs/${customProgram.id}/builder`}>
            <GitBranch className="mr-2 h-4 w-4" />
            Open Builder
          </Link>
        </Button>
        <Button variant="outline" size="sm">
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </Button>
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button variant="outline" size="sm">
          <Users className="mr-2 h-4 w-4" />
          Assign
        </Button>
      </div>
    </div>
  );
}
