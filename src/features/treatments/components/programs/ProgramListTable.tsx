import { Link } from "react-router-dom";
import { Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Program } from "../../types";
import { formatProgramStage } from "../../utils/labels";
import { StatusPill } from "../common";

interface ProgramListTableProps {
  programs: Program[];
}

export function ProgramListTable({ programs }: ProgramListTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Treatment Type</th>
            <th className="px-4 py-3">Visit Type</th>
            <th className="px-4 py-3">Questions</th>
            <th className="px-4 py-3">Checkout Qs</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {programs.map((program) => (
            <tr key={program.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-950">
                <Link to={`/dashboard/treatments/programs/${program.id}`}>{program.name}</Link>
              </td>
              <td className="px-4 py-3">{formatProgramStage(program.stage)}</td>
              <td className="px-4 py-3">{program.treatmentTypeKey}</td>
              <td className="px-4 py-3">
                <code className="rounded bg-slate-100 px-2 py-1 text-xs">{program.visitType}</code>
              </td>
              <td className="px-4 py-3">{program.questionCount}</td>
              <td className="px-4 py-3">{program.checkoutQuestionCount}</td>
              <td className="px-4 py-3">
                <StatusPill tone={program.status === "published" ? "green" : "yellow"}>
                  {program.status}
                </StatusPill>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/dashboard/treatments/programs/${program.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
