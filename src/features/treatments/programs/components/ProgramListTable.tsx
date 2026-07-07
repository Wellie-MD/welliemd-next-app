import { Link } from "react-router-dom";
import { Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Program } from "@/features/treatments/types";
import { formatProgramStage } from "@/features/treatments/utils/labels";
import { StatusPill } from "@/features/treatments/common/components";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProgramListTableProps {
  programs: Program[];
}

export function ProgramListTable({ programs }: ProgramListTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[280px] text-xs font-semibold uppercase tracking-wider text-slate-500">Name</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Type</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Treatment Type</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Visit Type</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Questions</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Checkout Qs</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {programs.map((program) => (
            <TableRow key={program.id} className="group hover:bg-slate-50/50">
              <TableCell className="font-medium">
                <Link
                  to={`/dashboard/treatments/programs/${program.id}`}
                  className="text-slate-900 hover:text-[#12517A] hover:underline"
                >
                  {program.name}
                </Link>
                <div className="text-xs text-slate-500 font-normal mt-1">
                  {program.description || "Intake questionnaire"}
                </div>
              </TableCell>
              <TableCell className="text-slate-600">{formatProgramStage(program.stage)}</TableCell>
              <TableCell className="text-slate-600">{program.treatmentTypeKey}</TableCell>
              <TableCell>
                <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700 font-medium">
                  {program.visitType}
                </code>
              </TableCell>
              <TableCell className="text-slate-600">
                {(program.questionCount || 0) + (program.checkoutQuestionCount || 0)}
              </TableCell>
              <TableCell className="text-slate-600">{program.checkoutQuestionCount}</TableCell>
              <TableCell>
                <StatusPill tone={program.status === "published" ? "green" : "yellow"}>
                  {program.status}
                </StatusPill>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#12517A]" title="Preview">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#12517A]" title="Edit">
                    <Link to={`/dashboard/treatments/programs/${program.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
